import importlib.util
import asyncio
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('telegram_files', Path(__file__).with_name('telegram-files.py'))
files = importlib.util.module_from_spec(spec)
spec.loader.exec_module(files)


class ArtifactFilesTest(unittest.TestCase):
    def test_verification_reads_existing_documents_without_sending(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'Client.conf'
            path.write_bytes(b'original')
            item = {'path': str(path), 'name': path.name, 'size': 8, 'sha256': files.digest(path)}
            message = SimpleNamespace(id=14, file=SimpleNamespace(name=path.name, size=8))

            class Client:
                def __init__(self, *args, **kwargs): pass
                async def connect(self): pass
                async def sign_in(self, **kwargs): pass
                async def get_me(self): return SimpleNamespace(bot=True, id=88)
                async def get_entity(self, name): return object()
                async def get_messages(self, channel, ids): return [message]
                async def send_file(self, *args, **kwargs): raise AssertionError('Verification must never send')
                async def download_media(self, message, file):
                    Path(file).write_bytes(b'original')
                    return file
                async def is_user_authorized(self): return True
                async def log_out(self): pass
                async def disconnect(self): pass

            modules = {'telethon': SimpleNamespace(TelegramClient=Client, utils=SimpleNamespace(get_peer_id=lambda channel: -1003974315707)),
                       'telethon.sessions': SimpleNamespace(MemorySession=lambda: None)}
            credentials = {'TELEGRAM_API_ID': '123', 'TELEGRAM_API_HASH': 'a' * 32, 'TELEGRAM_BOT_TOKEN': '88:fake'}
            with patch.dict('sys.modules', modules), patch.dict(os.environ, credentials):
                result = asyncio.run(files.upload({'files': [item], 'verify_only': True, 'verify_download': True, 'first_message_id': 14}))
            self.assertEqual(result['message_id'], 14)
            self.assertTrue(result['files'][0]['download_verified'])

    def test_rejects_changed_file_duplicate_name_and_incorrect_size(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'product.apk'
            path.write_bytes(b'original product')
            item = {'path': str(path), 'name': path.name, 'size': path.stat().st_size, 'sha256': files.digest(path)}
            files.validate_files([item])
            with self.assertRaises(ValueError):
                files.validate_files([item, item])
            with self.assertRaises(ValueError):
                files.validate_files([{**item, 'size': 1}])
            path.write_bytes(b'changed! product')
            with self.assertRaises(ValueError):
                files.validate_files([item])

    def test_original_files_preserve_names_and_pinned_bytes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / 'repository'
            root.mkdir()

            def git(*arguments):
                return subprocess.check_output(['git', '-C', str(root), *arguments], stderr=subprocess.DEVNULL).decode().strip()

            git('init', '-q')
            for name, content in {
                'rulesets/source/release-batch-contract.json': json.dumps({'staticOutputs': ['Client/config.conf', 'rulesets/generated/internal.json']}),
                'Client/config.conf': 'verified output\n', 'Client/README.md': 'Instructions\n',
                'README.md': 'Project\n', 'CHANGELOG.md': '## v1\n- Changed\n', 'private.txt': 'excluded',
            }.items():
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content, encoding='utf-8')
            git('add', '.')
            git('-c', 'user.name=Artifact test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture')
            sha = git('rev-parse', 'HEAD')
            (root / 'Client/config.conf').write_text('uncommitted changes', encoding='utf-8')
            first = files.prepare_files(root, sha, Path(directory) / 'first')[0]
            second = files.prepare_files(root, sha, Path(directory) / 'second')[0]
            self.assertEqual(first['sha256'], second['sha256'])
            self.assertEqual(first['name'], 'config.conf')
            self.assertEqual(Path(first['path']).read_bytes(), b'verified output\n')
            self.assertEqual(list((Path(directory) / 'first').rglob('*.*')), [Path(first['path'])])
            files.validate_files([first])
            with self.assertRaises(ValueError):
                files.prepare_files(root, 'main', Path(directory) / 'invalid')


if __name__ == '__main__':
    unittest.main()

import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('telegram_files', Path(__file__).with_name('telegram-files.py'))
files = importlib.util.module_from_spec(spec)
spec.loader.exec_module(files)


class ArtifactFilesTest(unittest.TestCase):
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

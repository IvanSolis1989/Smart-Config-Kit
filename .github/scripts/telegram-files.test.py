import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
import zipfile

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

    def test_bundle_reads_pinned_blobs_and_is_reproducible(self):
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
            first = files.bundle(root, sha, Path(directory) / 'first')[0]
            second = files.bundle(root, sha, Path(directory) / 'second')[0]
            self.assertEqual(first['sha256'], second['sha256'])
            with zipfile.ZipFile(first['path']) as package:
                self.assertEqual(package.read('Smart-Config-Kit/Client/config.conf'), b'verified output\n')
                self.assertNotIn('Smart-Config-Kit/private.txt', package.namelist())
                manifest = json.loads(package.read('Smart-Config-Kit/BUILD_SOURCE.json'))
                self.assertEqual(manifest['source'], sha)
                self.assertEqual(len(manifest['files']), 4)
            files.validate_files([first])
            with self.assertRaises(ValueError):
                files.bundle(root, 'main', Path(directory) / 'invalid')


if __name__ == '__main__':
    unittest.main()

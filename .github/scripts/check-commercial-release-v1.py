import hashlib
import importlib.util
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

spec = importlib.util.spec_from_file_location('verify_release', Path(__file__).with_name('verify-commercial-release-v1.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
SHA = 'a' * 40

def fixture(extra=None):
    files = {name: b'synthetic public file' for name in module.REQUIRED}
    notice = b'synthetic license'
    files['vendor/licenses/test.txt'] = notice
    files['vendor/third-party-manifest.json'] = json.dumps({'packages': [{'licenseFiles': [{'path': 'vendor/licenses/test.txt', 'bytes': len(notice), 'sha256': hashlib.sha256(notice).hexdigest()}]}]}).encode()
    files.update(extra or {})
    manifest = {'sourceCommit': SHA, 'billingEnabled': False, 'deployed': False, 'files': [{'path': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()} for name, data in files.items()]}
    files['release-manifest.json'] = json.dumps(manifest).encode()
    return files

class ReleaseTests(unittest.TestCase):
    def check(self, files, expected=SHA, fails=False, duplicate=False):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory) / 'fixture.zip'
            with zipfile.ZipFile(p, 'w') as archive:
                for name, data in files.items():
                    archive.writestr(name, data)
                if duplicate:
                    archive.writestr('index.html', b'duplicate')
            if fails:
                with self.assertRaises(ValueError): module.verify(p, expected)
            else:
                self.assertEqual(module.verify(p, expected), len(files))
    def test_valid(self): self.check(fixture())
    def test_tamper(self):
        files = fixture(); files['index.html'] = b'changed'; self.check(files, fails=True)
    def test_stale(self): self.check(fixture(), expected='b'*40, fails=True)
    def test_missing(self):
        files = fixture(); del files['help.html']; self.check(files, fails=True)
    def test_extra(self):
        files = fixture(); files['extra.js'] = b'unlisted'; self.check(files, fails=True)
    def test_traversal(self): self.check(fixture({'../private.sql': b'private'}), fails=True)
    def test_duplicate(self): self.check(fixture(), fails=True, duplicate=True)

if __name__ == '__main__':
    unittest.main()

"""Check a prepared release ZIP without extracting or executing its contents."""
import argparse
import hashlib
import json
import re
import stat
import zipfile
from pathlib import PurePosixPath

REQUIRED = {'index.html', 'sw.js', 'manifest.webmanifest', 'start.html', 'plans.html', 'billing-return.html','billing-sandbox.html','assets/billing-sandbox-client-v1.js','assets/billing-sandbox-page-v1.js', 'assets/billing-client-v1.js', 'assets/billing-page-v1.js', 'assets/billing-config-v1.js', 'assets/billing-app-v1.js', 'assets/billing-v1.css', 'help.html', 'terms.html', 'privacy.html', 'feedback.html', 'contact.html', 'cloud/public-config-v342.js', '_headers', 'THIRD_PARTY_NOTICES.txt', 'vendor/third-party-manifest.json'}

def require(condition, message):
    if not condition:
        raise ValueError(message)

def verify(filename, expected_commit):
    require(bool(re.fullmatch(r'[0-9a-f]{40}', expected_commit)), 'expected commit must be a full SHA')
    with zipfile.ZipFile(filename) as archive:
        entries = archive.infolist()
        names = [entry.filename for entry in entries]
        require(len(names) == len(set(names)), 'duplicate ZIP entry')
        require(len(names) <= 1000, 'dashboard upload file limit')
        require(sum(entry.file_size for entry in entries) <= 100 * 1024 * 1024, 'release exceeds inspection size limit')
        for entry in entries:
            p = PurePosixPath(entry.filename)
            require(not entry.is_dir() and not p.is_absolute() and '..' not in p.parts and '\\' not in entry.filename and str(p) == entry.filename, 'invalid ZIP path')
            require(not stat.S_ISLNK(entry.external_attr >> 16), 'ZIP symlink')
            require(entry.file_size <= 25 * 1024 * 1024, 'dashboard per-file limit')
            require(p.parts[0] not in {'.git', '.github', 'supabase', 'docs', 'node_modules'}, 'source-only directory')
            require(p.suffix.lower() not in {'.sql', '.ts', '.pdf', '.zip', '.env', '.csv'} and not p.name.startswith('.env'), 'non-public file')
        require(REQUIRED <= set(names), 'required public file missing')
        manifest = json.loads(archive.read('release-manifest.json'))
        require(manifest['sourceCommit'] == expected_commit, 'source commit mismatch')
        require(manifest['billingEnabled'] is False and manifest['deployed'] is False, 'expected preparation package')
        records = manifest['files']
        require(len(records) == len({item['path'] for item in records}), 'duplicate manifest path')
        require({item['path'] for item in records} == set(names) - {'release-manifest.json'}, 'ZIP and manifest differ')
        for item in records:
            data = archive.read(item['path'])
            require(len(data) == item['bytes'] and hashlib.sha256(data).hexdigest() == item['sha256'], 'file hash mismatch: ' + item['path'])
        third_party = json.loads(archive.read('vendor/third-party-manifest.json'))
        for package in third_party['packages']:
            require(bool(package['licenseFiles']), 'package license missing')
            for notice in package['licenseFiles']:
                require(notice['path'] in names, 'license notice missing')
                data = archive.read(notice['path'])
                require(len(data) == notice['bytes'] and hashlib.sha256(data).hexdigest() == notice['sha256'], 'license notice modified')
            if package.get('bundlePath'):
                require(hashlib.sha256(archive.read(package['bundlePath'])).hexdigest() == package['bundleSha256'], 'vendored bundle modified')
        return len(names)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('zipfile')
    parser.add_argument('--expected-commit', required=True)
    args = parser.parse_args()
    try:
        count = verify(args.zipfile, args.expected_commit)
    except (ValueError, KeyError, TypeError, zipfile.BadZipFile) as error:
        raise SystemExit('FAIL release package: ' + str(error))
    print(f'PASS release ZIP: {count} files; commit, complete hashes and software notices verified')
    print('New-host CORS/Auth, learner-data restore and commercial content rights still require separate verification.')


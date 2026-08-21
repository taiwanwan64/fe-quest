from pathlib import Path
import json,os,re,shutil,subprocess,tarfile,tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'fixed-mobile-header-(v(\d+))',branch)
    req(m is not None,'fixed mobile header branch must match fixed-mobile-header-vNNN')
    version=m.group(1); number=int(m.group(2))
    return version,f'v{number-1}'


def archive_main(dest):
    dest=Path(dest)
    if dest.exists(): shutil.rmtree(dest)
    dest.mkdir()
    with tempfile.TemporaryDirectory() as td:
        tar_path=Path(td)/'main.tar'
        subprocess.run(['git','archive','--format=tar','origin/main','-o',str(tar_path)],check=True)
        with tarfile.open(tar_path,'r') as tf: tf.extractall(dest)


version,previous=context()
req((version,previous)==('v337','v336'),'v337 over v336 expected')
archive_main('_reference')
archive_main('_parent_reference')

for rel in ['app/fixed-mobile-header-overrides-v337.txt','index.html','manifest.webmanifest','sw.js']:
    src=Path(rel); dst=Path('_reference')/rel
    req(src.exists(),'candidate file missing '+rel)
    dst.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(src,dst)

idx=(Path('_reference')/'index.html').read_text()
req('<title>FE QUEST PWA v337</title>' in idx and "const APP_VERSION = 'v337';" in idx,'v337 index shell missing')
req('{% include_relative app/fixed-mobile-header-overrides-v337.txt %}' in idx,'v337 override include missing')
manifest=json.loads((Path('_reference')/'manifest.webmanifest').read_text())
req(manifest.get('name')=='FE QUEST v337','v337 manifest shell missing')
print('FEQUEST_V337_FIXED_MOBILE_HEADER_REFERENCE_READY')

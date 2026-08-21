from pathlib import Path
import json,os,re,shutil,subprocess,tarfile,tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'sticky-header-centered-cta-(v(\d+))',branch)
    req(m is not None,'sticky header branch must match sticky-header-centered-cta-vNNN')
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
req((version,previous)==('v336','v335'),'v336 over v335 expected')
archive_main('_reference')
archive_main('_parent_reference')

for rel in ['app/sticky-header-centered-cta-overrides-v336.txt','index.html','manifest.webmanifest','sw.js']:
    src=Path(rel); dst=Path('_reference')/rel
    req(src.exists(),'candidate file missing '+rel)
    dst.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(src,dst)

idx=(Path('_reference')/'index.html').read_text()
req('<title>FE QUEST PWA v336</title>' in idx and "const APP_VERSION = 'v336';" in idx,'v336 index shell missing')
req('{% include_relative app/sticky-header-centered-cta-overrides-v336.txt %}' in idx,'v336 override include missing')
manifest=json.loads((Path('_reference')/'manifest.webmanifest').read_text())
req(manifest.get('name')=='FE QUEST v336','v336 manifest shell missing')
print('FEQUEST_V336_STICKY_HEADER_REFERENCE_READY')

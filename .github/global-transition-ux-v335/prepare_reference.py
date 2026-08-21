from pathlib import Path
import os,re,shutil,subprocess,tarfile,tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'global-scroll-and-centered-cta-(v(\d+))',branch)
    req(m is not None,'global transition UX branch must match global-scroll-and-centered-cta-vNNN')
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
req((version,previous)==('v335','v334'),'v335 over v334 expected')
archive_main('_reference')
archive_main('_parent_reference')

for rel in ['app/global-transition-ux-overrides-v335.txt','index.html','manifest.webmanifest','sw.js']:
    src=Path(rel); dst=Path('_reference')/rel
    req(src.exists(),'candidate file missing '+rel)
    dst.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(src,dst)

idx=(Path('_reference')/'index.html').read_text()
req('<title>FE QUEST PWA v335</title>' in idx and "const APP_VERSION = 'v335';" in idx,'reference index not v335')
req('{% include_relative app/global-transition-ux-overrides-v335.txt %}' in idx,'v335 override not wired into reference')
print('FEQUEST_V335_GLOBAL_TRANSITION_REFERENCE_READY')

from pathlib import Path
import os,re,shutil,subprocess,tarfile,tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'learning-data-reset-(v(\d+))',branch)
    req(m is not None,'learning-data reset branch must match learning-data-reset-vNNN')
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
req((version,previous)==('v332','v331'),'v332 reset context expected')
archive_main('_reference')
archive_main('_parent_reference')

# Independently approved target: untouched main plus only the learner-facing reset override and release shell.
for rel in ['app/learning-data-reset-overrides-v332.txt','index.html','manifest.webmanifest','sw.js']:
    src=Path(rel); dst=Path('_reference')/rel
    req(src.exists(),'candidate file missing '+rel)
    dst.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(src,dst)

idx=(Path('_reference')/'index.html').read_text()
req(f'<title>FE QUEST PWA {version}</title>' in idx and f"const APP_VERSION = '{version}';" in idx,'reference index not materialized')
print(f'FEQUEST_V332_RESET_REFERENCE_READY version={version} previous={previous} parent='+subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip())

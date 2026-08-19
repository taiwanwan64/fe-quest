from pathlib import Path
import os,re,shutil,subprocess,tarfile,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-a-mock-category-order-diversity-repair-(v(\d+))',b)
    req(m is not None,'bad v306 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def archive_main(dest):
    dest=Path(dest)
    if dest.exists(): shutil.rmtree(dest)
    dest.mkdir()
    with tempfile.TemporaryDirectory() as td:
        tp=Path(td)/'main.tar'
        subprocess.run(['git','archive','--format=tar','origin/main','-o',str(tp)],check=True)
        with tarfile.open(tp,'r') as tf: tf.extractall(dest)

version,previous=context()
req((version,previous)==('v306','v305'),'v306 context expected')
archive_main('_reference')
archive_main('_parent_reference')
# Build the independently approved target from untouched main plus only the intended behavior assembly.
for rel in ['app/subject-a-mock-selection-diversity-overrides-v306.txt','index.html','manifest.webmanifest','sw.js']:
    src=Path(rel); dst=Path('_reference')/rel
    req(src.exists(),'candidate file missing '+rel)
    dst.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(src,dst)
idx=(Path('_reference')/'index.html').read_text()
req(f'<title>FE QUEST PWA {version}</title>' in idx and f"const APP_VERSION = '{version}';" in idx,'reference index not materialized')
print(f'FEQUEST_V306_REFERENCE_READY version={version} previous={previous} parent='+subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip())

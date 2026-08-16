from pathlib import Path
import json, os, re, shutil, subprocess, tarfile, tempfile


def req(v,m):
    if not v: raise AssertionError(m)

def context():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'(v(\d+))-content-staging',branch)
    req(m is not None,'content release branch must match vNNN-content-staging')
    version=m.group(1); number=int(m.group(2)); return branch,version,number,f'v{number-1}'

def archive_main(dest):
    if dest.exists(): shutil.rmtree(dest)
    dest.mkdir()
    with tempfile.TemporaryDirectory() as td:
        tp=Path(td)/'main.tar'
        subprocess.run(['git','archive','--format=tar','origin/main','-o',str(tp)],check=True)
        with tarfile.open(tp,'r') as tf: tf.extractall(dest)

branch,version,number,previous=context()
manifest_path=Path(f'_release/content-change-{version}.json')
req(manifest_path.exists(),'content change manifest missing')
manifest=json.loads(manifest_path.read_text())
req(manifest.get('schema_version')==1,'manifest schema')
req(manifest.get('release')==version and manifest.get('previous_release')==previous,'manifest release context')
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(manifest.get('parent_main_sha')==parent,'manifest parent main mismatch')

reference=Path('_reference')
parent_ref=Path('_parent_reference')
archive_main(reference)
archive_main(parent_ref)

# Overlay only explicitly approved learner/assembly files from the materialized candidate.
for rel in manifest.get('content_files',[]):
    src=Path(rel); dst=reference/rel
    req(src.exists(),'approved content file missing '+rel)
    dst.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(src,dst)
for rel in manifest.get('assembly_files',[]):
    src=Path(rel); dst=reference/rel
    req(src.exists(),'approved assembly file missing '+rel)
    dst.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(src,dst)

# index.html is already materialized to the target version by the stable shell materializer.
idx=reference/'index.html'
req(f'<title>FE QUEST PWA {version}</title>' in idx.read_text(),'reference target index missing')

# Independently materialize manifest/SW from untouched parent main.
mp=reference/'manifest.webmanifest'; m=json.loads(mp.read_text())
req(m.get('name')==f'FE QUEST {previous}','reference previous manifest mismatch')
m['name']=f'FE QUEST {version}'
m['description']=f'基本情報技術者試験向けPWA。{version}。科目A710問・current contract 71・browser UI 23・CI 84/84・legacy 293 residual 0を維持し、安定化したrelease architectureと検証工程で提供する。'
mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')

sw=reference/'sw.js'; w=sw.read_text()
req(f"const APP_VERSION = '{previous}';" in w and f"fe-quest-{previous}-1" in w,'reference previous SW mismatch')
w=w.replace(f"const APP_VERSION = '{previous}';",f"const APP_VERSION = '{version}';",1)
w=w.replace(f"const CACHE_NAME = 'fe-quest-{previous}-1';",f"const CACHE_NAME = 'fe-quest-{version}-1';",1)
sw.write_text(w)

print(f'FEQUEST_CONTENT_REFERENCE_READY version={version} previous={previous} approved-ids={len(manifest.get("allowed_question_ids",[]))} parent={parent}')

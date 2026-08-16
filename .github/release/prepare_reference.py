from pathlib import Path
import json, os, re, shutil, subprocess, tarfile, tempfile


def req(v,m):
    if not v: raise AssertionError(m)

def release_context():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'(v(\d+))-staging',branch)
    req(m is not None,'release branch must match vNNN-staging')
    version=m.group(1); number=int(m.group(2)); return version,number,f'v{number-1}'

version,number,previous=release_context()
root=Path('_reference')
if root.exists(): shutil.rmtree(root)
root.mkdir()

with tempfile.TemporaryDirectory() as td:
    tar_path=Path(td)/'main.tar'
    subprocess.run(['git','archive','--format=tar','origin/main','-o',str(tar_path)],check=True)
    with tarfile.open(tar_path,'r') as tf: tf.extractall(root)

idx=root/'index.html'; t=idx.read_text()
req(f'<title>FE QUEST PWA {previous}</title>' in t,'reference previous title missing')
req(f"const APP_VERSION = '{previous}';" in t,'reference previous APP_VERSION missing')
t=t.replace(f'<title>FE QUEST PWA {previous}</title>',f'<title>FE QUEST PWA {version}</title>',1)
t=t.replace(f"const APP_VERSION = '{previous}';",f"const APP_VERSION = '{version}';",1)
idx.write_text(t)

mp=root/'manifest.webmanifest'; m=json.loads(mp.read_text())
req(m.get('name')==f'FE QUEST {previous}','reference previous manifest mismatch')
m['name']=f'FE QUEST {version}'
m['description']=f'基本情報技術者試験向けPWA。{version}。科目A710問・current contract 71・browser UI 23・CI 84/84・legacy 293 residual 0を維持し、安定化したrelease architectureと検証工程で提供する。'
mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')

sw=root/'sw.js'; w=sw.read_text()
req(f"const APP_VERSION = '{previous}';" in w and f"fe-quest-{previous}-1" in w,'reference previous SW mismatch')
w=w.replace(f"const APP_VERSION = '{previous}';",f"const APP_VERSION = '{version}';",1)
w=w.replace(f"const CACHE_NAME = 'fe-quest-{previous}-1';",f"const CACHE_NAME = 'fe-quest-{version}-1';",1)
sw.write_text(w)

print(f'FEQUEST_RELEASE_REFERENCE_READY version={version} previous={previous} source=origin/main explicit-three-file=1')

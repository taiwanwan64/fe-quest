from pathlib import Path
import shutil, hashlib

SRC=Path('.')
DST=Path('_v173_reference_src')
ARCHIVE=Path('_regression/archive/learning-base/base-v131.html')
RESTORED=Path('app/base-v131.html')
EXPECTED_BYTES=3041328
EXPECTED_SHA='1222c7ac30b6a227f0b5bfd4d7b5a4c380a18d47d55171cfaaeaa3c09dbfbd5a'

def req(v,m):
    if not v: raise AssertionError(m)
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
req(ARCHIVE.exists() and len(ARCHIVE.read_bytes())==EXPECTED_BYTES and sha(ARCHIVE)==EXPECTED_SHA,'archive identity')
req(not RESTORED.exists(),'candidate unexpectedly retains app/base-v131.html')
if DST.exists(): shutil.rmtree(DST)
ignore=shutil.ignore_patterns('.git','_site','_site_reference','_v173_reference_src','FE_QUEST_PWA_v173.zip')
shutil.copytree(SRC,DST,ignore=ignore)
out=DST/RESTORED
out.parent.mkdir(parents=True,exist_ok=True)
shutil.copyfile(DST/ARCHIVE,out)
req(len(out.read_bytes())==EXPECTED_BYTES and sha(out)==EXPECTED_SHA,'reference restore identity')
print('FEQUEST_V173_REFERENCE_PREPARED archived-base->app-base-v131 reference-bytes=%d' % EXPECTED_BYTES)

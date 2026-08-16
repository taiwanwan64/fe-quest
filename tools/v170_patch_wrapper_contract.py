from pathlib import Path
import hashlib, json

def sha_file(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def ident(p):
    p=Path(p); return {'path':p.as_posix(),'utf8_bytes':len(p.read_bytes()),'sha256':sha_file(p)}
def req(v,m):
    if not v: raise AssertionError(m)

p=Path('app/runtime-diagnostic-wrapper.txt')
s=p.read_text()
s=s.replace("s.archiveBoundaryFixture==='_regression/production-source-archive-boundary-v169.fixture.json'","s.archiveBoundaryFixture==='_regression/production-source-archive-boundary-v170.fixture.json'")
s=s.replace('s.archivedSourceCount===51','s.archivedSourceCount===52')
req("s.archiveBoundaryFixture==='_regression/production-source-archive-boundary-v170.fixture.json'" in s,'semantic boundary fixture assertion')
req('s.archivedSourceCount===52' in s,'semantic boundary archive count assertion')
req('retiredAdapters.length===10' in s and 'a.retiredAdapters===10' in s,'retired adapter count assertions')
req("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v170.fixture.json'" in s and 'archivedSourceCount:52' in s,'runtime spec metadata')
p.write_text(s)

fxp=Path('_regression/production-source-archive-boundary-v170.fixture.json')
fx=json.loads(fxp.read_text())
fx['stable_wrapper']=ident(p)
fxp.write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')
print('FEQUEST_V170_WRAPPER_CONTRACT_ALIGNED archive=52 retired-adapters=10')

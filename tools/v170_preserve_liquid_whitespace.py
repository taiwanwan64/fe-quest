from pathlib import Path
import hashlib, json

def sha_file(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def ident(p,**extra):
    p=Path(p); d={'path':p.as_posix(),'utf8_bytes':len(p.read_bytes()),'sha256':sha_file(p)}; d.update(extra); return d

def req(v,m):
    if not v: raise AssertionError(m)

p=Path('index.html'); s=p.read_text()
cap='{% capture learningPatches %}{% include_relative app/learning-patches-v170.txt %}{% endcapture %}'
sem='{% capture semanticRuntime %}'
needle=cap+'\n'+sem
target=cap+('\n'*13)+sem
if needle in s:
    s=s.replace(needle,target,1)
    p.write_text(s)
else:
    req(target in s,'v170 liquid whitespace preservation marker missing')

comp_path=Path('_regression/production-learning-compaction-v170.fixture.json')
comp=json.loads(comp_path.read_text())
comp['assembler']['preserved_noop_newlines_from_13_to_1_capture_compaction']=12
comp['assembler']['generated_output_whitespace_policy']='preserve-expanded-assembler-byte-output'
comp_path.write_text(json.dumps(comp,ensure_ascii=False,indent=2)+'\n')

fx_path=Path('_regression/production-source-archive-boundary-v170.fixture.json')
fx=json.loads(fx_path.read_text())
fx['assembler']=ident(p)
fx['compaction_fixture']=ident(comp_path)
fx_path.write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')
print('FEQUEST_V170_LIQUID_WHITESPACE_PRESERVED noop-newlines=12')

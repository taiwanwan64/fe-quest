from pathlib import Path
import shutil

def req(v,m):
    if not v: raise AssertionError(m)

dst=Path('_v171_reference_src')
if dst.exists(): shutil.rmtree(dst)
dst.mkdir()
for name in ['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']:
    p=Path(name)
    if p.exists(): shutil.copy2(p,dst/name)
shutil.copytree('app',dst/'app')
arch=Path('_regression/archive/learning-patches/learning-patches-v170.txt')
req(arch.exists(),'archived v170 learning bundle missing')
(dst/'app'/'learning-patches-v170.txt').write_bytes(arch.read_bytes())
idx=(dst/'index.html').read_text()
old='{% include_relative app/learning-patches.txt %}'
new='{% include_relative app/learning-patches-v170.txt %}'
req(old in idx,'stable include missing in reference source')
idx=idx.replace(old,new,1)
(dst/'index.html').write_text(idx)
print('FEQUEST_V171_REFERENCE_PREPARED stable->versioned-learning-boundary')

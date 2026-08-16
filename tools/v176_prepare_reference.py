from pathlib import Path
import shutil

SRC=Path('.')
DST=Path('_v176_reference_src')
VERSIONED="""// ===== FE QUEST v176 release adapter =====\n(() => {\n  function runV176SelfCheck(){return feqRunSelfCheck('v176','runV176SelfCheck');}\n  globalThis.runV176SelfCheck=runV176SelfCheck;\n})();\n"""

def req(v,m):
    if not v: raise AssertionError(m)

if DST.exists(): shutil.rmtree(DST)
ignore=shutil.ignore_patterns('.git','_site','_site_reference','_v176_reference_src','FE_QUEST_PWA_v176.zip')
shutil.copytree(SRC,DST,ignore=ignore)
idx=DST/'index.html'; t=idx.read_text()
old='{% capture stableReleaseAdapter %}{% include_relative app/runtime-release-adapter.txt %}{% endcapture %}'
new='{% capture v176block %}{% include_relative app/v176-block-00.txt %}{% endcapture %}'
req(old in t,'stable adapter capture missing in candidate index')
t=t.replace(old,new,1)
t=t.replace("applyV143LateFixes();window.FEQUEST_SELF_CHECK=globalThis['runV'+APP_VERSION.slice(1)+'SelfCheck']();",'applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV176SelfCheck();',1)
t=t.replace('{{ stableReleaseAdapter }}','{{ v176block }}',1)
idx.write_text(t)
vp=DST/'app/v176-block-00.txt'; req(not vp.exists(),'reference v176 adapter unexpectedly exists'); vp.write_text(VERSIONED)
req('app/v176-block-00.txt' in idx.read_text() and 'runV176SelfCheck();' in idx.read_text(),'reference assembler patch')
print('FEQUEST_V176_REFERENCE_PREPARED mode=counterfactual-versioned-v176-adapter')

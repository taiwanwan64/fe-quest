from pathlib import Path
import shutil, subprocess, re

PARENT_MAIN='32cc7c00e607a9f274fca7b7b4f226590d8c626e'
SRC=Path('.')
DST=Path('_v174_reference_src')


def req(v,m):
    if not v: raise AssertionError(m)

if DST.exists(): shutil.rmtree(DST)
ignore=shutil.ignore_patterns('.git','_site','_site_reference','_v174_reference_src','FE_QUEST_PWA_v174.zip')
shutil.copytree(SRC,DST,ignore=ignore)

# Reconstruct the counterfactual v174 implementation in which the old v173 wrapper
# would have been edited directly again. The candidate instead reads a separate
# release metadata module. Runtime values should be identical.
parent=subprocess.check_output(['git','show',f'{PARENT_MAIN}:app/runtime-diagnostic-wrapper.txt']).decode()
w=parent
repls=[
("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v173.fixture.json'","archiveBoundaryFixture:'_regression/production-source-archive-boundary-v174.fixture.json'"),
('archivedSourceCount:55','archivedSourceCount:56'),
("'runV171SelfCheck','runV172SelfCheck'])","'runV171SelfCheck','runV172SelfCheck','runV173SelfCheck'])"),
('retiredAdapters.length===13&&new Set(retiredAdapters).size===13','retiredAdapters.length===14&&new Set(retiredAdapters).size===14'),
('a.retiredAdapters===13&&','a.retiredAdapters===14&&'),
("s.archiveBoundaryFixture==='_regression/production-source-archive-boundary-v173.fixture.json'","s.archiveBoundaryFixture==='_regression/production-source-archive-boundary-v174.fixture.json'"),
('s.archivedSourceCount===55','s.archivedSourceCount===56')
]
for old,new in repls:
    req(old in w,'reference parent wrapper anchor missing: '+old)
    w=w.replace(old,new,1)
req("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v174.fixture.json'" in w,'reference fixture')
req('archivedSourceCount:56' in w and "'runV173SelfCheck'" in w,'reference release metadata')
req('retiredAdapters.length===14&&new Set(retiredAdapters).size===14' in w and 'a.retiredAdapters===14' in w,'reference adapter counts')
(DST/'app/runtime-diagnostic-wrapper.txt').write_text(w)

# Keep the exact same assembler shape/whitespace but make the candidate-only metadata
# include empty so the old inline wrapper supplies the same runtime values.
(DST/'app/runtime-release-diagnostic-spec.txt').write_text('')

print('FEQUEST_V174_REFERENCE_PREPARED mode=old-inline-metadata-wrapper retired-adapters=14 diagnostic-archive=56')

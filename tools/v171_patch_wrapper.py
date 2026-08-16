from pathlib import Path
# Align all release-boundary assertions after adding runV170SelfCheck to the retired adapter boundary.
p=Path('app/runtime-diagnostic-wrapper.txt')
s=p.read_text()
s=s.replace('new Set(retiredAdapters).size===10','new Set(retiredAdapters).size===11')
s=s.replace("s.archiveBoundaryFixture==='_regression/production-source-archive-boundary-v170.fixture.json'","s.archiveBoundaryFixture==='_regression/production-source-archive-boundary-v171.fixture.json'")
s=s.replace('s.archivedSourceCount===52','s.archivedSourceCount===53')
for marker in ['new Set(retiredAdapters).size===11',"s.archiveBoundaryFixture==='_regression/production-source-archive-boundary-v171.fixture.json'",'s.archivedSourceCount===53']:
    if marker not in s:
        raise AssertionError('v171 wrapper assertion not aligned: '+marker)
p.write_text(s)
print('FEQUEST_V171_WRAPPER_CONTRACT_ALIGNED retired-adapters=11 archive=53')

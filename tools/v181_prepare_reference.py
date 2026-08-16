from pathlib import Path
import shutil

ref=Path('_reference')
if ref.exists(): shutil.rmtree(ref)
shutil.copytree('.',ref,ignore=shutil.ignore_patterns('.git','_site','_site_reference','_reference'))
reference="""// ===== FE QUEST literal-version v181 reference diagnostic metadata =====
(() => {
  const releaseVersion='v181';
  const releaseNumber=Number(releaseVersion.slice(1));
  if(!Number.isInteger(releaseNumber)||releaseNumber<160) throw new Error('FE QUEST release version invalid');
  const retiredReleaseAdapters=Object.freeze(Array.from({length:releaseNumber-160},(_,i)=>`runV${160+i}SelfCheck`));
  globalThis.FEQ_RELEASE_DIAGNOSTIC_SPEC=Object.freeze({
    modulePath:'app/runtime-release-diagnostic-spec.txt',
    policy:'single-release-specific-diagnostic-metadata-module',
    releaseVersion,
    currentReleaseAdapter:`runV${releaseNumber}SelfCheck`,
    archiveBoundaryFixture:'_regression/diagnostic-archive-inventory.fixture.json',
    archivedSourceCount:58,
    retiredReleaseAdapterCount:retiredReleaseAdapters.length,
    retiredReleaseAdapters
  });
})();
"""
(ref/'app/runtime-release-diagnostic-spec.txt').write_text(reference)
print('FEQUEST_V181_REFERENCE_PREPARED version-source=literal-v181 retired-adapters=21')

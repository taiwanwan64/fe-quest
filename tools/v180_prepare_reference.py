from pathlib import Path
import shutil

ref=Path('_reference')
if ref.exists(): shutil.rmtree(ref)
shutil.copytree('.',ref,ignore=shutil.ignore_patterns('.git','_site','_site_reference','_reference'))
retired=','.join(repr(f'runV{v}SelfCheck') for v in range(160,180))
explicit=f"""// ===== FE QUEST explicit-array v180 reference metadata =====
globalThis.FEQ_RELEASE_DIAGNOSTIC_SPEC=Object.freeze({{
  modulePath:'app/runtime-release-diagnostic-spec.txt',
  policy:'single-release-specific-diagnostic-metadata-module',
  releaseVersion:'v180',
  currentReleaseAdapter:'runV180SelfCheck',
  archiveBoundaryFixture:'_regression/diagnostic-archive-inventory.fixture.json',
  archivedSourceCount:58,
  retiredReleaseAdapterCount:20,
  retiredReleaseAdapters:Object.freeze([{retired}])
}});
"""
(ref/'app/runtime-release-diagnostic-spec.txt').write_text(explicit)
print('FEQUEST_V180_REFERENCE_PREPARED explicit-retired-adapters=20')

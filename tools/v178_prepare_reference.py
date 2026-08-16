from pathlib import Path
import json, shutil

ref=Path('_reference')
if ref.exists(): shutil.rmtree(ref)
shutil.copytree('.',ref,ignore=shutil.ignore_patterns('.git','_site','_site_reference','_reference'))
inv=json.loads((ref/'_regression/diagnostic-archive-inventory.fixture.json').read_text())
full={
  'name':'production-source-archive-boundary-v178',
  'version':'v178',
  'archive_root':inv['archive_root'],
  'archived_source_count':inv['archived_source_count'],
  'production_app_archival_residual_count':inv['production_app_archival_residual_count'],
  'archive_entries':inv['archive_entries']
}
(ref/'_regression/production-source-archive-boundary-v178.fixture.json').write_text(json.dumps(full,ensure_ascii=False,indent=2)+'\n')
print('FEQUEST_V178_REFERENCE_PREPARED full-boundary-entries=%d' % len(full['archive_entries']))

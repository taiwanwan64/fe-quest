from pathlib import Path
import json, shutil, hashlib

STABLE='_regression/diagnostic-archive-inventory.fixture.json'
COMPACT='_regression/production-source-archive-boundary-v179.fixture.json'
ref=Path('_reference')
if ref.exists(): shutil.rmtree(ref)
shutil.copytree('.',ref,ignore=shutil.ignore_patterns('.git','_site','_site_reference','_reference'))
invp=ref/STABLE
inv=json.loads(invp.read_text())
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
compact={
  'name':'production-source-archive-boundary-v179',
  'version':'v179',
  'scope':'counterfactual-compact-release-boundary-reference-to-stable-diagnostic-inventory',
  'policy':'reference-only-for-direct-stable-inventory-equivalence',
  'stable_inventory_path':STABLE,
  'stable_inventory_utf8_bytes':len(invp.read_bytes()),
  'stable_inventory_sha256':sha(invp),
  'archived_source_count':58,
  'production_app_archival_residual_count':0,
  'embedded_archive_entry_count':0,
  'diagnostic_archive_growth':0
}
(ref/COMPACT).write_text(json.dumps(compact,ensure_ascii=False,indent=2)+'\n')
spec=ref/'app/runtime-release-diagnostic-spec.txt'
s=spec.read_text()
old="archiveBoundaryFixture:'_regression/diagnostic-archive-inventory.fixture.json'"
new="archiveBoundaryFixture:'_regression/production-source-archive-boundary-v179.fixture.json'"
if old not in s: raise AssertionError('candidate direct inventory token missing')
spec.write_text(s.replace(old,new,1))
print('FEQUEST_V179_REFERENCE_PREPARED compact-boundary-created=1 stable-inventory-entries=%d' % len(inv['archive_entries']))

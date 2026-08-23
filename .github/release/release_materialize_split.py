from pathlib import Path
import json,subprocess
from split_release_common import release_context,materialize_tree,ident,req,sha_bytes

branch,version,number,previous=release_context()
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
result=materialize_tree('.',version,previous)
p=result['files']

# The split source baseline must come from current main; feature staging branches may
# add other files, but the previous release assets themselves must be byte-identical.
for rel in [f'app/base-shell-{previous}.html',f'assets/app-{previous}.css',f'assets/app-{previous}.js',f'assets/asset-manifest-{previous}.json']:
    q=Path(rel);req(q.exists(),'previous split source missing '+rel)
    main=subprocess.check_output(['git','show',parent+':'+rel])
    req(q.read_bytes()==main,'previous split source drift from main '+rel)

fixture=Path(f'_regression/release-tooling-cadence-{version}.fixture.json')
audit=Path(f'audits/RELEASE_TOOLING_CADENCE_AUDIT_{version}.txt')
fx={
  'name':f'release-tooling-cadence-{version}',
  'version':version,
  'scope':'validate-versionless-split-release-tooling-against-mechanical-reference',
  'branch':branch,'parent_main_sha':parent,'previous_version':previous,
  'outer_shell':{
    'strategy':'versioned-split-static-assets',
    'files':['index.html','manifest.webmanifest','sw.js',f'app/base-shell-{version}.html',f'assets/app-{version}.css',f'assets/app-{version}.js',f'assets/asset-manifest-{version}.json']
  },
  'previous_split_identity':{
    'shell':ident(f'app/base-shell-{previous}.html'),
    'css':ident(f'assets/app-{previous}.css'),
    'js':ident(f'assets/app-{previous}.js'),
    'asset_manifest':ident(f'assets/asset-manifest-{previous}.json')
  },
  'target_split_identity':{
    'shell':ident(f'app/base-shell-{version}.html'),
    'css':ident(f'assets/app-{version}.css'),
    'js':ident(f'assets/app-{version}.js'),
    'asset_manifest':ident(f'assets/asset-manifest-{version}.json')
  },
  'validation':{'status':'pending'},
  'already_materialized':result['already_materialized']
}
fixture.parent.mkdir(exist_ok=True);fixture.write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')
audit.parent.mkdir(exist_ok=True);audit.write_text(f'''FE QUEST {version} — Split Release Tooling Cadence Audit\n===========================================================\n\nTarget\n------\nBranch: {branch}\nVersion: {version}\nPrevious: {previous}\nParent main: {parent}\n\nCandidate\n---------\nVersionless split tooling derives the target from vNNN-staging.\nThe v341+ distribution remains a small root include + versioned base shell + external CSS/classic JS + asset manifest.\nPrevious release split assets are byte-identical to origin/main before materialization.\nCSS is copied byte-exact; application JS advances APP_VERSION while preserving the Safari native date sizing correction introduced in v342.\nThe cloud runtime introduced in v342 is inherited by later releases until deliberately superseded.\nService Worker cache names and versioned app asset paths advance while cloud runtime precache entries remain exactly once.\n\nValidation status\n-----------------\npending real Jekyll candidate/reference + external-JS runtime validation\n''')
print(f'FEQUEST_SPLIT_RELEASE_SOURCE_MATERIALIZED version={version} previous={previous} already={int(result["already_materialized"])}')

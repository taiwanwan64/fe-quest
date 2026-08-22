from pathlib import Path
import json, shutil, sys, tempfile, zipfile

sys.path.insert(0,str(Path('.github/release').resolve()))
from package_release import package_release, collect_release_files
from split_release_common import V342_CLOUD_RUNTIME_ASSETS, materialize_tree


def req(ok,msg):
    if not ok: raise AssertionError(msg)

def record(cases,name,ok):
    cases.append({'name':name,'pass':bool(ok)});req(ok,name)

def build_site(root):
    for rel in ['index.html','manifest.webmanifest','sw.js','privacy.html','icon-192.png','icon-512.png','apple-touch-icon.png']:
        shutil.copy2(rel,root/rel)
    for directory in ['app','assets','cloud','vendor']:
        shutil.copytree(directory,root/directory)
    result=materialize_tree(root,'v342','v341')
    p=result['files']
    site=root/'_site';site.mkdir()
    (site/'index.html').write_text(p['shell'].read_text())
    for rel in ['manifest.webmanifest','sw.js','privacy.html','icon-192.png','icon-512.png','apple-touch-icon.png']:
        shutil.copy2(root/rel,site/rel)
    shutil.copytree(root/'assets',site/'assets')
    shutil.copytree(root/'cloud',site/'cloud')
    shutil.copytree(root/'vendor',site/'vendor')
    return site

cases=[]
with tempfile.TemporaryDirectory() as td:
    root=Path(td)/'repo';root.mkdir()
    site=build_site(root)
    out1=root/'FE_QUEST_PWA_v342_a.zip'
    out2=root/'FE_QUEST_PWA_v342_b.zip'
    one=package_release(site,'v342','split',out1)
    two=package_release(site,'v342','split',out2)
    members=one['files']
    expected_cloud=[x[2:] for x in V342_CLOUD_RUNTIME_ASSETS]

    record(cases,'standalone v342 ZIP is created and non-empty',out1.exists() and one['bytes']>100000)
    record(cases,'standalone package contains core PWA files',all(x in members for x in ['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']))
    record(cases,'standalone package contains privacy policy','privacy.html' in members)
    record(cases,'standalone package contains split application assets',all(x in members for x in ['assets/app-v342.css','assets/app-v342.js','assets/asset-manifest-v342.json']))
    record(cases,'standalone package contains every fixed cloud runtime asset',all(x in members for x in expected_cloud) and len([x for x in expected_cloud if x in members])==15)
    record(cases,'standalone package contains pinned local Supabase SDK','vendor/supabase/supabase-2.112.3.js' in members)
    record(cases,'standalone package excludes source and CI-only files',all(x not in members for x in ['app/base-shell-v342.html','.github/release/release_validate_split.py','_regression/release-tooling-cadence-v342.fixture.json']))
    record(cases,'standalone ZIP creation is deterministic',one['sha256']==two['sha256'] and one['files']==two['files'])
    with zipfile.ZipFile(out1) as zf:
        record(cases,'ZIP member bytes exactly equal built-site bytes',all(zf.read(x)==(site/x).read_bytes() for x in members))

    tampered=site/expected_cloud[-1]
    original=tampered.read_bytes();tampered.write_bytes(original+b'\n//tamper')
    rejected=False
    try:collect_release_files(site,'v342','split')
    except AssertionError:rejected=True
    record(cases,'packager rejects a cloud asset whose bytes differ from manifest identity',rejected)
    tampered.write_bytes(original)

    missing=site/expected_cloud[0]
    saved=missing.read_bytes();missing.unlink()
    rejected=False
    try:collect_release_files(site,'v342','split')
    except AssertionError:rejected=True
    record(cases,'packager rejects a missing cloud precache asset',rejected)
    missing.parent.mkdir(parents=True,exist_ok=True);missing.write_bytes(saved)

    inline=root/'inline';inline.mkdir()
    for rel in ['index.html','manifest.webmanifest','sw.js','privacy.html','icon-192.png','icon-512.png','apple-touch-icon.png']:
        shutil.copy2(site/rel,inline/rel)
    inline_files=collect_release_files(inline,'v341','inline')
    record(cases,'inline packaging contract remains compatible',set(inline_files)==set(['index.html','manifest.webmanifest','sw.js','privacy.html','icon-192.png','icon-512.png','apple-touch-icon.png']))

req(len(cases)==12,'expected 12 standalone package cases')
report='''# FE QUEST v342 — Standalone release package\n\nResult: **PASS — 12 / 12 STANDALONE-PACKAGE CASES PASS**\n\n- the release ZIP is now assembled from the built site and versioned asset manifest rather than a short hardcoded core-file list\n- v342 includes core PWA files, split app CSS/JS, the asset manifest, `privacy.html`, all 15 same-origin cloud runtime assets, and the pinned Supabase browser SDK\n- cloud files are hash/size checked against the release asset manifest before packaging\n- missing or modified cloud assets fail packaging instead of producing a partially broken standalone release\n- source-only app shells, CI tooling, and regression evidence are not placed in the learner ZIP\n- ZIP member bytes are checked against the built site and deterministic ZIP generation is verified\n- the legacy inline packaging contract remains supported\n'''
Path('audits/V342_STANDALONE_PACKAGE.md').write_text(report)
Path('_regression/release-package-v342.fixture.json').write_text(json.dumps({
    'name':'release-package-v342','result':'PASS','caseCount':12,
    'validatedCases':[x['name'] for x in cases],
    'cloudAssetCount':15,
    'privacyIncluded':True,
    'pinnedSdk':'vendor/supabase/supabase-2.112.3.js'
},ensure_ascii=False,indent=2)+'\n')
print(report)

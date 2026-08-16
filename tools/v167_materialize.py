from pathlib import Path
import hashlib, json, re, shutil

ROOT=Path('.')
APP=ROOT/'app'
REG=ROOT/'_regression'
ARCH=REG/'archive'/'diagnostics'

def req(v,m):
    if not v:
        raise AssertionError(m)

def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_file(p): return sha_bytes(Path(p).read_bytes())
def info(path):
    p=Path(path); b=p.read_bytes()
    return {'path':str(p).replace('\\','/'),'utf8_bytes':len(b),'sha256':sha_bytes(b)}

# v166 must be the exact parent state this materializer understands.
src=Path('index.html').read_text()
if 'FE QUEST PWA v167' in src and (REG/'production-patch-chain-v167.fixture.json').exists() and (REG/'production-source-archive-boundary-v167.fixture.json').exists():
    print('FEQUEST_V167_SOURCE_ALREADY_MATERIALIZED')
    raise SystemExit(0)
req('FE QUEST PWA v166' in src and "const APP_VERSION = 'v166';" in src and 'runV166SelfCheck();' in src,'expected v166 assembler')
prev=json.loads((REG/'production-source-archive-boundary-v166.fixture.json').read_text())
req(prev['version']=='v166' and prev['archived_source_count']==48 and len(prev['archive_entries'])==48,'v166 archive fixture')

# Archive the now-retired v166 release adapter.
old_adapter=APP/'v166-block-00.txt'
req(old_adapter.exists(),'v166 adapter source missing')
ARCH.mkdir(parents=True,exist_ok=True)
arch_adapter=ARCH/'v166-block-00.txt'
req(not arch_adapter.exists(),'v166 adapter already archived')
adapter_bytes=old_adapter.read_bytes()
arch_adapter.write_bytes(adapter_bytes)
old_adapter.unlink()
arch_entry={
    'name':'v166-block-00.txt',
    'old_path':'app/v166-block-00.txt',
    'archive_path':'_regression/archive/diagnostics/v166-block-00.txt',
    'utf8_bytes':len(adapter_bytes),
    'sha256':sha_bytes(adapter_bytes)
}

# Promote stable wrapper metadata to the v167 archive boundary.
wp=APP/'runtime-diagnostic-wrapper.txt'
w=wp.read_text()
repls=[
 ("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v166.fixture.json'",
  "archiveBoundaryFixture:'_regression/production-source-archive-boundary-v167.fixture.json'"),
 ("archivedSourceCount:48","archivedSourceCount:49"),
 ("retiredReleaseAdapters:Object.freeze(['runV160SelfCheck','runV161SelfCheck','runV162SelfCheck','runV163SelfCheck','runV164SelfCheck','runV165SelfCheck'])",
  "retiredReleaseAdapters:Object.freeze(['runV160SelfCheck','runV161SelfCheck','runV162SelfCheck','runV163SelfCheck','runV164SelfCheck','runV165SelfCheck','runV166SelfCheck'])"),
 ("retiredAdapters.length===6&&new Set(retiredAdapters).size===6",
  "retiredAdapters.length===7&&new Set(retiredAdapters).size===7"),
 ("a.retiredAdapters===6&&a.presentStableWrapper===6",
  "a.retiredAdapters===7&&a.presentStableWrapper===6"),
 ("s.archiveBoundaryFixture==='_regression/production-source-archive-boundary-v166.fixture.json'",
  "s.archiveBoundaryFixture==='_regression/production-source-archive-boundary-v167.fixture.json'"),
 ("s.archivedSourceCount===48","s.archivedSourceCount===49"),
]
for a,b in repls:
    req(w.count(a)==1,f'wrapper replacement cardinality {a}')
    w=w.replace(a,b)
wp.write_text(w)

# Create the v167 release adapter.
new_adapter=APP/'v167-block-00.txt'
req(not new_adapter.exists(),'v167 adapter already exists')
new_adapter.write_text("""// ===== FE QUEST v167 release adapter =====
(() => {
  function runV167SelfCheck(){return feqRunSelfCheck('v167','runV167SelfCheck');}
  globalThis.runV167SelfCheck=runV167SelfCheck;
})();
""")

# Update the assembler from v166 to v167 without changing the learning patch chain.
src=src.replace("{% capture v166block %}{% include_relative app/v166-block-00.txt %}{% endcapture %}",
                "{% capture v167block %}{% include_relative app/v167-block-00.txt %}{% endcapture %}")
src=src.replace('<title>FE QUEST PWA v166</title>','<title>FE QUEST PWA v167</title>')
src=src.replace("const APP_VERSION = 'v166';","const APP_VERSION = 'v167';")
src=src.replace("applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV166SelfCheck();",
                "applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV167SelfCheck();")
src=src.replace("{{ diagnosticWrapper }}{{ v166block }}const CORE_A_TOPIC_TOTAL_QUESTION_COUNTS",
                "{{ diagnosticWrapper }}{{ v167block }}const CORE_A_TOPIC_TOTAL_QUESTION_COUNTS")
req('v166block' not in src and 'app/v166-block-00.txt' not in src,'retired adapter still in assembler')
req(src.count('{% include_relative app/v167-block-00.txt %}')==1,'v167 adapter include')
Path('index.html').write_text(src)

# Manifest and service worker parity.
mp=Path('manifest.webmanifest')
m=json.loads(mp.read_text())
m['name']='FE QUEST v167'
m['description']='基本情報技術者試験向けPWA。v167ではbase-v131に対してproductionで順番に適用されているv132〜v144の47個の学習機能パッチを宣言的なsource inventoryとして固定し、各blockのハッシュ・バイト数・宣言シンボル・assembly順を回帰検証可能にした。学習UI・問題文・選択肢・正答・Profile Schema・現行semantic runtimeは変更せず、current-contract 71、科目A710問、browser UI 23、critical curriculum 56、remaining release sentinel 28、CI coverage 84/84、legacy 293 residual 0を維持。'
mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')

swp=Path('sw.js')
sw=swp.read_text()
req(sw.count("const APP_VERSION = 'v166';")==1 and sw.count("fe-quest-v166-1")==1,'v166 sw identity')
sw=sw.replace("const APP_VERSION = 'v166';","const APP_VERSION = 'v167';").replace("fe-quest-v166-1","fe-quest-v167-1")
swp.write_text(sw)

# Declarative inventory of the still-active v132-v144 learning patch chain.
expected_counts={132:8,133:6,134:7,135:1,136:8,137:1,138:9,139:2,140:1,141:1,142:1,143:1,144:1}
index_text=Path('index.html').read_text()
blocks=[]
ordered_paths=[]
all_functions=set(); all_lexical=set(); all_classes=set(); all_exports=set(); all_assignment_targets=set()
for version,count in expected_counts.items():
    expected=[APP/f'v{version}-block-{i:02d}.txt' for i in range(count)]
    actual=sorted(APP.glob(f'v{version}-block-*.txt'))
    req([p.name for p in actual]==[p.name for p in expected],f'patch block inventory v{version}')
    for p in expected:
        text=p.read_text(); b=p.read_bytes()
        include=f'{{% include_relative app/{p.name} %}}'
        req(index_text.count(include)==1,f'assembler include cardinality {p.name}')
        functions=sorted(set(re.findall(r'\bfunction\s+([A-Za-z_$][\w$]*)\s*\(',text)))
        lexical=sorted(set(re.findall(r'\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\b',text)))
        classes=sorted(set(re.findall(r'\bclass\s+([A-Za-z_$][\w$]*)\b',text)))
        exports=sorted(set(re.findall(r'\b(?:window|globalThis)\.([A-Za-z_$][\w$]*)\s*=',text)))
        assigns=sorted(set(re.findall(r'(?:^|[;}\n])\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*=',text)))
        flags={
            'dom_write':bool(re.search(r'\.(?:innerHTML|textContent|innerText|className|style)\s*=',text)),
            'event_listener':'.addEventListener(' in text,
            'storage_access':bool(re.search(r'\b(?:localStorage|sessionStorage)\b',text)),
            'question_bank_reference':'QUESTION_BANK' in text,
            'profile_schema_reference':'PROFILE_SCHEMA' in text or 'profileSchema' in text,
            'late_fix_reference':bool(re.search(r'\bapplyV\d+LateFixes\b',text)),
        }
        row={
            'version':f'v{version}',
            'block':p.name,
            'path':f'app/{p.name}',
            'utf8_bytes':len(b),
            'sha256':sha_bytes(b),
            'function_declarations':functions,
            'lexical_declarations':lexical,
            'class_declarations':classes,
            'global_exports':exports,
            'assignment_targets':assigns,
            'source_flags':flags,
        }
        blocks.append(row); ordered_paths.append(row['path'])
        all_functions.update(functions); all_lexical.update(lexical); all_classes.update(classes); all_exports.update(exports); all_assignment_targets.update(assigns)

# Exact assembler order must match the declarative patch chain.
positions=[index_text.index(f'{{% include_relative {p} %}}') for p in ordered_paths]
req(positions==sorted(positions),'patch assembly order')
all_patch_includes=re.findall(r'\{%\s*include_relative\s+(app/v(?:13[2-9]|14[0-4])-block-\d\d\.txt)\s*%\}',index_text)
req(all_patch_includes==ordered_paths,'assembler patch-chain exact coverage')
concat=b''.join(Path(p).read_bytes() for p in ordered_paths)

patch_fixture={
    'name':'production-patch-chain-v167',
    'version':'v167',
    'scope':'active-learning-patch-chain-v132-v144',
    'policy':'inventory-only-no-consolidation',
    'base':info('app/base-v131.html'),
    'patch_range':{
        'first_version':'v132','last_version':'v144',
        'version_count':len(expected_counts),'block_count':len(blocks),
        'expected_block_counts':{f'v{k}':v for k,v in expected_counts.items()},
        'concat_utf8_bytes':len(concat),'concat_sha256':sha_bytes(concat),
    },
    'assembler':{
        **info('index.html'),
        'patch_include_count':len(all_patch_includes),
        'assembly_order':ordered_paths,
    },
    'declaration_summary':{
        'function_declarations_unique':len(all_functions),
        'lexical_declarations_unique':len(all_lexical),
        'class_declarations_unique':len(all_classes),
        'global_exports_unique':len(all_exports),
        'assignment_targets_unique':len(all_assignment_targets),
        'functions':sorted(all_functions),
        'global_exports':sorted(all_exports),
    },
    'blocks':blocks,
}
(REG/'production-patch-chain-v167.fixture.json').write_text(json.dumps(patch_fixture,ensure_ascii=False,indent=2)+'\n')

# v167 archive fixture extends the immutable v166 archive by exactly one retired adapter.
entries=list(prev['archive_entries'])+[arch_entry]
archive_fixture={
    'name':'production-source-archive-boundary-v167',
    'version':'v167',
    'archive_root':'_regression/archive/diagnostics',
    'archived_source_count':49,
    'production_app_archival_residual_count':0,
    'archive_entries':entries,
    'active_runtime':info('app/runtime-semantic-diagnostics.txt'),
    'stable_wrapper':info('app/runtime-diagnostic-wrapper.txt'),
    'release_adapter':{**info('app/v167-block-00.txt'),'allowed_global':'runV167SelfCheck'},
    'assembler':info('index.html'),
    'manifest':info('manifest.webmanifest'),
    'service_worker':info('sw.js'),
    'patch_chain_fixture':info('_regression/production-patch-chain-v167.fixture.json'),
    'policy':'historical-diagnostics-build-excluded-regression-archive'
}
(REG/'production-source-archive-boundary-v167.fixture.json').write_text(json.dumps(archive_fixture,ensure_ascii=False,indent=2)+'\n')

print(f"FEQUEST_V167_SOURCE_MATERIALIZED patches={len(blocks)} patch-bytes={len(concat)} archive=49 app-residual=0 runtime={Path('app/runtime-semantic-diagnostics.txt').stat().st_size}")

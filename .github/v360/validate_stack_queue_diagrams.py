from pathlib import Path
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parents[2]
checks = []


def check(name, condition):
    checks.append(name)
    assert condition, name


def read(path):
    return (ROOT / path).read_text()


def sha(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


source_path = 'app/stack-queue-diagrams-v360.js'
style_path = 'app/stack-queue-diagrams-v360.css'
source, style = read(source_path).strip(), read(style_path).strip()
js = read('assets/app-v360.js')
manifest = json.loads(read('assets/asset-manifest-v360.json'))
shell = read('app/base-shell-v360.html')

check('production index selects v360', 'app/base-shell-v360.html' in read('index.html'))
check('shell only changes version', shell == read('app/base-shell-v359.html').replace('v359', 'v360').replace('V359', 'V360'))
check('CSS is previous plus reviewed source', read('assets/app-v360.css') == read('assets/app-v359.css').rstrip() + '\n\n' + style + '\n')
check('CSS marker is unique', read('assets/app-v360.css').count('v360: stack queue state and operation diagrams') == 1)

expected = read('assets/app-v359.js').replace("const APP_VERSION = 'v359';", "const APP_VERSION = 'v360';", 1)
anchor = 'function coreTopicArticleView(id){'
expected = expected.replace(anchor, source + '\n\n' + anchor, 1)
mount = '      ${coreTopicCriticalPathDiagramViewV359(id)}'
expected = expected.replace(mount, mount + '\n      ${coreTopicStackQueueDiagramViewV360(id)}', 1)
start, end = expected.index('function dataStructureView(stack,queue){'), expected.index('function sqlView(filtered){')
expected = expected[:start] + 'function dataStructureView(stack,queue){\n  return stackQueueCardsV360(stack,queue);\n}\n' + expected[end:]
start, end = expected.index("  if(type==='stackqueue'){"), expected.index("  if(type==='sql'){")
expected = expected[:start] + "  if(type==='stackqueue'){\n    renderStackQueueExperienceV360(stage);\n  }\n\n" + expected[end:]
expected = expected.replace("render:()=>dataStructureView(['A','B'],['B','C'])", 'render:()=>stackQueueAfterRemovalViewV360()', 1)
check('runtime diff is limited to version and stack queue presentation/controller', js == expected)
check('core renderer and mount are unique', js.count('function coreTopicStackQueueDiagramViewV360(id)') == 1 and js.count('${coreTopicStackQueueDiagramViewV360(id)}') == 1)
check('legacy shared renderer is wired once', js.count('return stackQueueCardsV360(stack,queue);') == 1)
check('legacy controller is wired once', js.count('    renderStackQueueExperienceV360(stage);') == 1)
check('no persistence or network added', all(token not in source for token in ('localStorage', 'sessionStorage', 'indexedDB', 'fetch(', 'saveProfile', 'profile.')))
check('legacy gate still needs both successful removals', "lessonInteractiveDone=dsSeen.has('stack')&&dsSeen.has('queue');" in source and "if(event.operation==='pop') dsSeen.add('stack');" in source and "if(event.operation==='dequeue') dsSeen.add('queue');" in source)
check('demo reset does not erase operation completion', 'dsSeen.clear' not in source and 'dsSeen=new' not in source)
check('empty/full operations guarded', '(adding&&before.length>=6)||(!adding&&!before.length)' in source)
check('dynamic controls remain mounted', source.count('stage.innerHTML=') == 1 and "demo.querySelector('.sq-board-v360').innerHTML=" in source)
check('status is accessible', 'role="status" aria-live="polite" aria-atomic="true"' in source)
check('keyboard focus remains usable at limits', "document.activeElement===button" in source and 'focus({preventScroll:true})' in source)
check('figure has accessible caption', 'aria-labelledby="sqCaptionV360"' in source and 'id="sqCaptionV360"' in source)
check('visual abstraction and display limit are explicit', '実際のメモリ配置を表すものではありません' in source and 'スタック・キュー自体が6個までという意味ではありません' in source)
check('comparison stays two columns at narrow widths', 'grid-template-columns:repeat(2,minmax(0,1fr))' in style and '@media(max-width:390px)' in style)
check('profile schema stays v5', js.count('const PROFILE_SCHEMA_VERSION = 5;') == 1)
check('710 questions unchanged', 'QUESTION_BANK.length===710' in js)
check('cloud loader unchanged', shell.count('<script src="./cloud/activation-loader-v342.js"></script>') == 1)
check('manifest versions current', manifest['version'] == 'v360' and manifest['previousVersion'] == 'v359')
diagram = manifest['stackQueueDiagrams']
check('manifest scope and boundaries', diagram['scope'] == ['core_03_01', 'stackqueue'] and all(diagram[k] is False for k in ('profileSchemaChange', 'questionBankChange', 'curriculumTextChange', 'cloudRuntimeChange', 'coreInteractionRequired')))
check('renderer source hash', diagram['jsSourceSha256'] == sha(source_path))
check('stylesheet source hash', diagram['cssSourceSha256'] == sha(style_path))
assets = {a['path']: a for a in manifest['assets']}
for path in ('assets/app-v360.js', 'assets/app-v360.css'):
    check('asset hash ' + path, assets[path]['sha256'] == sha(path))
check('shell hash', manifest['shell']['sha256'] == sha('app/base-shell-v360.html'))
check('SW version and precache', all(token in read('sw.js') for token in ("const APP_VERSION = 'v360';", 'fe-quest-v360-1', './assets/app-v360.js', './assets/app-v360.css', './assets/asset-manifest-v360.json')))
check('web manifest name', json.loads(read('manifest.webmanifest'))['name'] == 'FE QUEST v360')
syntax = subprocess.run(['node', '--check', str(ROOT / 'assets/app-v360.js')], capture_output=True, text=True)
check('runtime JS syntax', syntax.returncode == 0)
model = subprocess.run(['node', str(ROOT / '.github/v360/test_stack_queue_model.cjs')], capture_output=True, text=True)
check('actual reducer and renderer unit tests', model.returncode == 0)
print(model.stdout)
print(f'PASS — V360 STACK QUEUE STATIC CONTRACT {len(checks)}/{len(checks)}')
for name in checks:
    print('PASS ' + name)

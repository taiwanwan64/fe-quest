from pathlib import Path
import re, json, gzip, base64

ROOT = Path('.')
idx = ROOT / 'index.html'
s = idx.read_text()

b64 = ''.join((ROOT / f'tools/v127_part{i}.txt').read_text().strip() for i in range(1, 5))
ov_json = gzip.decompress(base64.b64decode(b64)).decode()
ov = json.loads(ov_json)
assert len(ov) == 33, f'expected 33 bridge overrides, got {len(ov)}'

anchors = [
    'core_01_04','core_01_06','core_02_01','core_02_02','core_02_04','core_02_05',
    'core_03_01','core_03_02','core_03_03','core_03_05','core_04_02','core_04_03',
    'core_04_05','core_05_03','core_05_04','core_06_01','core_06_03','core_06_05',
    'core_07_02','core_08_03','core_09_03','core_09_04','core_09_06','core_10_01',
    'core_10_04','core_10_06','core_10_08','core_11_01','core_11_02','core_11_03',
    'core_11_05','core_11_06','core_12_03','core_12_04','core_12_05','core_13_01',
    'core_14_06','core_15_04','core_15_06','core_16_02','core_16_04','core_17_02',
    'core_18_02','core_18_04','core_18_06','core_19_02','core_19_04','core_20_02',
    'core_20_03','core_20_06','core_21_04'
]
assert len(anchors) == 51

js_template = r'''
// ===== v127: reference-aligned lesson -> practice bridge =====
// The attached textbook inserts "出る順！過去問＆完全解説" at these section boundaries.
// They are used only as practice anchors; no textbook question text is copied.
const CORE_A_REFERENCE_PRACTICE_ANCHORS=new Set(__ANCHORS__);
const CORE_A_REFERENCE_BRIDGE_OVERRIDES=__OV__;
for(const q of CORE_A_LINKED_QUESTIONS){
  const patch=CORE_A_REFERENCE_BRIDGE_OVERRIDES[q.id];
  if(!patch)continue;
  Object.assign(q,patch,{angle:'scenario',referenceBridgeAudit:'v127',applicationAudit:'v127-reference-bridge',applicationDemand:'状況適用'});
  delete q.distractorTopicIds;
  delete q.distractorMode;
}
function orderCoreTopicPracticeQuestions(pool){
  const difficultyRank={基礎:0,標準:1,実戦:2};
  const angleRank={knowledge:0,application:1,scenario:2,discrimination:3,calculation:4,interpretation:4,trace:4,comparison:5};
  return [...pool].sort((a,b)=>
    (difficultyRank[a.difficulty]??9)-(difficultyRank[b.difficulty]??9) ||
    (angleRank[a.angle]??5)-(angleRank[b.angle]??5) ||
    String(a.id).localeCompare(String(b.id),'ja')
  );
}
'''
js = js_template.replace('__ANCHORS__', json.dumps(anchors, ensure_ascii=False, separators=(',', ':')))
js = js.replace('__OV__', json.dumps(ov, ensure_ascii=False, separators=(',', ':')))

marker = 'QUESTION_BANK.push(...CORE_A_LINKED_QUESTIONS);'
if 'const CORE_A_REFERENCE_PRACTICE_ANCHORS=' not in s:
    if marker not in s:
        raise SystemExit('linked push marker missing')
    s = s.replace(marker, js + '\n' + marker, 1)

old = """    const pool=QUESTION_BANK.filter(q=>q.coreTopicId===id&&isCoreTopicImmediatePracticeQuestion(q));
    const levels=['基礎','標準','実戦'];
    quizItems=levels.flatMap(level=>shuffled(pool.filter(q=>q.difficulty===level)));
    quizItems.push(...shuffled(pool.filter(q=>!levels.includes(q.difficulty))));"""
new = """    const pool=QUESTION_BANK.filter(q=>q.coreTopicId===id&&isCoreTopicImmediatePracticeQuestion(q));
    // v127: after a lesson, questions progress from foundation -> concrete application -> harder evidence.
    // Random ordering made the bridge inconsistent and could surface a generic discrimination item before an applied check.
    quizItems=orderCoreTopicPracticeQuestions(pool);"""
if old in s:
    s = s.replace(old, new, 1)
elif 'quizItems=orderCoreTopicPracticeQuestions(pool);' not in s:
    raise SystemExit('core topic ordering block missing')

s = re.sub(r'<title>FE QUEST PWA v\d+</title>', '<title>FE QUEST PWA v127</title>', s, count=1)
s = re.sub(r"const APP_VERSION = 'v\d+';", "const APP_VERSION = 'v127';", s, count=1)
s = re.sub(
    r"assert\(PROFILE_SCHEMA_VERSION===5&&APP_VERSION==='v\d+','v\d+ version/schema contract drift'\);",
    "assert(PROFILE_SCHEMA_VERSION===5&&APP_VERSION==='v127','v127 version/schema contract drift');",
    s,
    count=1,
)

checks = """
    assert(CORE_A_REFERENCE_PRACTICE_ANCHORS.size===51,'v127 reference practice anchors must remain 51');
    assert(Object.keys(CORE_A_REFERENCE_BRIDGE_OVERRIDES).length===33,'v127 reference bridge override count drift');
    assert(Object.keys(CORE_A_REFERENCE_BRIDGE_OVERRIDES).every(qid=>{const q=QUESTION_BANK.find(x=>x.id===qid);return q&&q.referenceBridgeAudit==='v127'&&q.cognitiveLevel==='適用';}),'v127 bridge questions must be applied and preserve cognitive totals');
    assert([...CORE_A_REFERENCE_PRACTICE_ANCHORS].every(id=>QUESTION_BANK.filter(q=>q.coreTopicId===id&&isCoreTopicImmediatePracticeQuestion(q)).length>=3),'v127 reference anchors need immediate topic practice');
    assert([...CORE_A_REFERENCE_PRACTICE_ANCHORS].every(id=>QUESTION_BANK.some(q=>q.coreTopicId===id&&isCoreTopicImmediatePracticeQuestion(q)&&['application','scenario','calculation','interpretation','trace'].includes(q.angle))),'v127 reference anchors need a concrete applied question');"""
if 'v127 reference practice anchors must remain 51' not in s:
    needle = "    assert(typeof renderPlanFocus==='function'"
    pos = s.find(needle)
    if pos < 0:
        raise SystemExit('self-check insertion point missing')
    s = s[:pos] + checks + '\n' + s[pos:]

idx.write_text(s)

mp = ROOT / 'manifest.webmanifest'
mm = json.loads(mp.read_text())
mm['name'] = 'FE QUEST v127'
mm['description'] = '基本情報技術者試験向けPWA。v127では添付参考書の「出る順！過去問＆完全解説」の配置を練習アンカーとして、科目Aの教材→問題接続を横断監査。接続が弱かった33テーマの抽象的な確認問題を具体的な状況・計算・判断問題へ差し替え、710問・正答位置・認知レベル総数は維持。'
mp.write_text(json.dumps(mm, ensure_ascii=False, indent=2) + '\n')

swp = ROOT / 'sw.js'
w = swp.read_text()
w = re.sub(r"const APP_VERSION = 'v\d+';", "const APP_VERSION = 'v127';", w, count=1)
w = re.sub(r"const CACHE_NAME = 'fe-quest-v\d+-\d+';", "const CACHE_NAME = 'fe-quest-v127-1';", w, count=1)
swp.write_text(w)

assert '<title>FE QUEST PWA v127</title>' in s
assert "const APP_VERSION = 'v127';" in s
assert 'CORE_A_REFERENCE_BRIDGE_OVERRIDES' in s
assert 'quizItems=orderCoreTopicPracticeQuestions(pool);' in s
assert mm['name'] == 'FE QUEST v127'
assert "const APP_VERSION = 'v127';" in w and 'fe-quest-v127-1' in w
print('APPLY_V127_OK')

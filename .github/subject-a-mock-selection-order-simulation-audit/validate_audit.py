from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip();m=re.fullmatch(r'subject-a-mock-selection-order-simulation-audit-(v(\d+))',b);req(m,'bad v305 branch');return m.group(1),f'v{int(m.group(2))-1}'
def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))
def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function seeded(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function chapterOf(q){const s=String(q?.coreTopicId||'');const m=s.match(/(?:^|_)(\d{1,2})(?:_|$)/);return m?Number(m[1]):null;}
function shuffleCopy(xs){return shuffled([...xs]);}
function sameCounts(actual,expected,keys){return keys.every(k=>Number(actual?.[k]||0)===Number(expected?.[k]||0));}
function buildVariant(mode,variant){
 const bp=MOCK_BLUEPRINTS[mode]||MOCK_BLUEPRINTS.full,quotas=mockCategoryQuotas(bp.count),difficultyByCat=allocateMockDifficultyByCategory(quotas,bp),conceptCounts={},cognitiveCounts={'想起':0,'適用':0,'判断':0},cognitiveTarget=bp.cognitive||{'想起':0,'適用':bp.count,'判断':0},out=[];
 const catOrder=(variant==='randomCategories'||variant==='randomBoth')?shuffleCopy(MOCK_CATEGORIES):[...MOCK_CATEGORIES];
 const levelOrder=(variant==='randomLevels'||variant==='randomBoth')?shuffleCopy(MOCK_DIFFICULTY_LEVELS):[...MOCK_DIFFICULTY_LEVELS];
 catOrder.forEach(cat=>{const cap=mode==='half'?1:2;levelOrder.forEach(level=>{const n=difficultyByCat[cat][level]||0,pool=QUESTION_BANK.filter(q=>q.cat===cat&&q.difficulty===level);out.push(...pickMockPool(pool,n,conceptCounts,cap,cognitiveCounts,cognitiveTarget,level));});});
 const unique=[],seenIds=new Set();for(const q of out){if(!seenIds.has(q.id)){unique.push(q);seenIds.add(q.id);}}
 if(unique.length<bp.count)unique.push(...QUESTION_BANK.filter(q=>!seenIds.has(q.id)).sort(mockCandidateSort).slice(0,bp.count-unique.length));
 return {picked:shuffleCopy(unique.slice(0,bp.count)),catOrder,levelOrder,bp,difficultyByCat};
}
function summarize(mode,variant,runs,seedBase){
 const bp=MOCK_BLUEPRINTS[mode]||MOCK_BLUEPRINTS.full,exposure={},invalid=[],chapterCounts=[],maxChapterCounts=[];let strat=0,blueprintMismatch=0;
 for(let i=0;i<runs;i++){
   Math.random=seeded(seedBase+i*7919);const built=buildVariant(mode,variant),xs=built.picked,ids=xs.map(q=>String(q.id||''));
   if(xs.length!==bp.count||new Set(ids).size!==ids.length)invalid.push({i,count:xs.length,unique:new Set(ids).size});
   const cats=Object.fromEntries(MOCK_CATEGORIES.map(c=>[c,xs.filter(q=>q.cat===c).length]));const expectedCats=mockCategoryQuotas(bp.count);
   const dif=Object.fromEntries(MOCK_DIFFICULTY_LEVELS.map(d=>[d,xs.filter(q=>q.difficulty===d).length]));const cog=Object.fromEntries(MOCK_COGNITIVE_LEVELS.map(c=>[c,xs.filter(q=>q.cognitiveLevel===c).length]));
   if(!sameCounts(cats,expectedCats,MOCK_CATEGORIES)||!sameCounts(dif,bp.difficulty,MOCK_DIFFICULTY_LEVELS)||!sameCounts(cog,bp.cognitive,MOCK_COGNITIVE_LEVELS))blueprintMismatch++;
   const chapters={};for(const q of xs){const ch=chapterOf(q);if(ch!=null)chapters[ch]=(chapters[ch]||0)+1;const id=String(q.id||'');exposure[id]=(exposure[id]||0)+1;if(id==='strat-16')strat++;}
   chapterCounts.push(Object.keys(chapters).length);maxChapterCounts.push(Math.max(0,...Object.values(chapters)));
 }
 const allEligible=QUESTION_BANK.filter(q=>MOCK_CATEGORIES.includes(q.cat)&&MOCK_DIFFICULTY_LEVELS.includes(q.difficulty)).map(q=>String(q.id||''));const rates=allEligible.map(id=>100*(exposure[id]||0)/runs).sort((a,b)=>a-b),selected=Object.entries(exposure).map(([id,n])=>({id,n,pct:Math.round(n/runs*1000)/10})).sort((a,b)=>b.n-a.n||a.id.localeCompare(b.id));const stat=arr=>{const s=[...arr].sort((a,b)=>a-b);return {min:s[0],median:s[Math.floor(s.length/2)],max:s[s.length-1]};};
 return {mode,variant,runs,blueprintMismatch,invalidSessionCount:invalid.length,strat16Pct:Math.round(strat/runs*1000)/10,eligibleQuestions:allEligible.length,neverSelected:rates.filter(x=>x===0).length,exposurePct:{min:Math.round(rates[0]*10)/10,p50:Math.round(rates[Math.floor(rates.length*.5)]*10)/10,p90:Math.round(rates[Math.floor(rates.length*.9)]*10)/10,p95:Math.round(rates[Math.floor(rates.length*.95)]*10)/10,max:Math.round(rates[rates.length-1]*10)/10},topExposure:selected.slice(0,15),chaptersRepresented:stat(chapterCounts),maxChapterCount:stat(maxChapterCounts)};
}
const originalRandom=Math.random;const variants=['fixed','randomCategories','randomLevels','randomBoth'],summary={};for(const mode of ['full','half']){summary[mode]={};for(let vi=0;vi<variants.length;vi++)summary[mode][variants[vi]]=summarize(mode,variants[vi],800,(mode==='full'?3050001:3060001)+vi*100000);}
let fixedCloneMismatch=0;for(let i=0;i<120;i++){const seed=3070001+i*7919;Math.random=seeded(seed);const a=buildVariant('full','fixed').picked.map(x=>String(x.id||'')).sort();Math.random=seeded(seed);const b=buildMockQuestions('full').map(x=>String(x.id||'')).sort();if(a.join('|')!==b.join('|'))fixedCloneMismatch++;}Math.random=originalRandom;
const out={v:APP_VERSION,summary,fixedCloneMismatch,blueprints:MOCK_BLUEPRINTS,categories:MOCK_CATEGORIES,difficulties:MOCK_DIFFICULTY_LEVELS,cognitive:MOCK_COGNITIVE_LEVELS,bankSignature:QUESTION_BANK.map(q=>[q.id,q.cat,q.difficulty,q.cognitiveLevel,q.coreTopicId]),sem:validateSubjectBSemantics()};console.log('__V305__'+Buffer.from(JSON.stringify(out)).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V305__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))
version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v305','v304'),'expects v304')
v304p=Path('_regression/subject-a-cognitive-rubric-calibration-v304.fixture.json');req(v304p.exists(),'v304 fixture missing');v304=json.loads(v304p.read_text());req(v304.get('result')=='PASS — COGNITIVE RUBRIC CALIBRATED','v304 result');req(v304['summary']['counts']['directNumericStandardJudgment']>=10,'v304 calibration drift')
expected={'.github/subject-a-mock-selection-order-simulation-audit/validate_audit.py','.github/workflows/subject-a-mock-selection-order-simulation-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v305' and par['v']=='v304','versions');req(cand['bankSignature']==par['bankSignature'],'bank drift');req(cand['blueprints']==par['blueprints'],'blueprint drift');req(cand['summary']==par['summary'],'simulation behavior drift');req(cand['fixedCloneMismatch']==0 and par['fixedCloneMismatch']==0,'fixed reconstruction mismatch');req(cand['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
for mode in ['full','half']:
  for variant,row in cand['summary'][mode].items():req(row['blueprintMismatch']==0 and row['invalidSessionCount']==0,f'{mode}/{variant} breaks blueprint: '+json.dumps(row,ensure_ascii=False))
base=cand['summary']['full']['fixed'];alternatives={k:v for k,v in cand['summary']['full'].items() if k!='fixed'}
ranked=sorted(alternatives.items(),key=lambda kv:(kv[1]['exposurePct']['max'],kv[1]['neverSelected'],kv[1]['strat16Pct']))
best_name,best=ranked[0]
summary={'referenceDecision':'v304 keeps cognitive metadata; test traversal-order diversity instead','simulations':cand['summary'],'bestFullAlternative':{'variant':best_name,'maxExposurePct':best['exposurePct']['max'],'neverSelected':best['neverSelected'],'strat16Pct':best['strat16Pct'],'baselineMaxExposurePct':base['exposurePct']['max'],'baselineNeverSelected':base['neverSelected'],'baselineStrat16Pct':base['strat16Pct']},'fixedCloneMismatch':cand['fixedCloneMismatch'],'interpretation':'Traversal order is eligible for production repair only if it preserves every full/half category, difficulty and cognitive blueprint, removes the fixed strat-16 exposure, and does not merely replace it with another near-100% item.'}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — SELECTION-ORDER ALTERNATIVES SIMULATED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-mock-selection-order-simulation-v305.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v305 — Subject A Mock Selection-Order Simulation Audit
=================================================================

Result
------
PASS — SELECTION-ORDER ALTERNATIVES SIMULATED
Previous release: v304
Source main: {parent}
Learner-facing change in v305: none

Why this path
-------------
v304 calibrated the existing cognitive taxonomy and showed that direct numeric standard questions are commonly and intentionally labeled 判断／文脈比較. Therefore strat-16 should not be retagged simply to remove repetition. v305 tests whether the repetition is an artifact of the fixed category/difficulty traversal order used by the greedy cognitive-balancing selector.

Method
------
Clone the production buildMockQuestions composition logic without changing the app. Simulate 800 full and 800 half sessions for each of four traversal strategies: fixed (production order), randomized category order, randomized difficulty order, and randomized category + difficulty order. Each candidate must preserve exact category, difficulty and cognitive blueprints and contain no duplicate IDs. Exposure distribution, strat-16 frequency and chapter breadth are then compared. A 120-seed reconstruction also proves the fixed clone selects the same full-mock sets as production.

Summary
-------
{json.dumps(summary,ensure_ascii=False,indent=2)}

Regression
----------
No learner-facing content changed.
QUESTION_BANK and MOCK_BLUEPRINTS are equivalent to v304.
All four simulated strategies preserve exact full/half category, difficulty and cognitive counts and no duplicate IDs.
Fixed-order clone matches production full-mock selection sets for all 120 probe seeds.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
If one randomized traversal strategy materially lowers both maximum per-question exposure and strat-16 exposure while preserving all blueprints and without creating a new near-fixed item, use only that traversal change in the next release. Otherwise reject order randomization and design a more explicit global cognitive-slot reservation algorithm.
''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_MOCK_SELECTION_ORDER_SIMULATION_v305.txt').write_text(audit);print(audit)

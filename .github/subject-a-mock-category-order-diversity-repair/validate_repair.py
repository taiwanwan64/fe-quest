from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-a-mock-category-order-diversity-repair-(v(\d+))',b); req(m,'bad v306 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text()
    return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path); stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function seeded(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function sameCounts(actual,expected,keys){return keys.every(k=>Number(actual?.[k]||0)===Number(expected?.[k]||0));}
function expectedDifficulty(bp){return {'基礎':Number(bp.basic||0),'標準':Number(bp.standard||0),'実戦':Number(bp.practical||0)};}
function summarize(mode,runs,seedBase){
 const bp=MOCK_BLUEPRINTS[mode]||MOCK_BLUEPRINTS.full,expectedCats=mockCategoryQuotas(bp.count),exposure={};let invalid=0,blueprintMismatch=0,strat=0;
 for(let i=0;i<runs;i++){
  Math.random=seeded(seedBase+i*7919);const xs=buildMockQuestions(mode),ids=xs.map(q=>String(q.id||''));
  if(xs.length!==bp.count||new Set(ids).size!==ids.length)invalid++;
  const cats=Object.fromEntries(MOCK_CATEGORIES.map(c=>[c,xs.filter(q=>q.cat===c).length]));
  const dif=Object.fromEntries(MOCK_DIFFICULTY_LEVELS.map(d=>[d,xs.filter(q=>q.difficulty===d).length]));
  const cog=Object.fromEntries(MOCK_COGNITIVE_LEVELS.map(c=>[c,xs.filter(q=>q.cognitiveLevel===c).length]));
  if(!sameCounts(cats,expectedCats,MOCK_CATEGORIES)||!sameCounts(dif,expectedDifficulty(bp),MOCK_DIFFICULTY_LEVELS)||!sameCounts(cog,bp.cognitive,MOCK_COGNITIVE_LEVELS))blueprintMismatch++;
  for(const q of xs){const id=String(q.id||'');exposure[id]=(exposure[id]||0)+1;if(id==='strat-16')strat++;}
 }
 const eligible=QUESTION_BANK.filter(q=>MOCK_CATEGORIES.includes(q.cat)&&MOCK_DIFFICULTY_LEVELS.includes(q.difficulty)).map(q=>String(q.id||''));
 const rates=eligible.map(id=>100*(exposure[id]||0)/runs).sort((a,b)=>a-b);
 const top=Object.entries(exposure).map(([id,n])=>({id,n,pct:Math.round(n/runs*1000)/10})).sort((a,b)=>b.n-a.n||a.id.localeCompare(b.id)).slice(0,12);
 return {mode,runs,invalidSessionCount:invalid,blueprintMismatch,strat16Pct:Math.round(strat/runs*1000)/10,neverSelected:rates.filter(x=>x===0).length,exposurePct:{min:Math.round(rates[0]*10)/10,p50:Math.round(rates[Math.floor(rates.length*.5)]*10)/10,p90:Math.round(rates[Math.floor(rates.length*.9)]*10)/10,p95:Math.round(rates[Math.floor(rates.length*.95)]*10)/10,max:Math.round(rates[rates.length-1]*10)/10},topExposure:top};
}
const originalRandom=Math.random;const summary={full:summarize('full',500,3061001),half:summarize('half',500,3069001)};Math.random=originalRandom;
const out={v:APP_VERSION,summary,spec:globalThis.SUBJECT_A_MOCK_SELECTION_DIVERSITY_V306_SPEC||null,fn:String(buildMockQuestions),blueprints:MOCK_BLUEPRINTS,bankSignature:QUESTION_BANK.map(q=>[q.id,q.cat,q.difficulty,q.cognitiveLevel,q.coreTopicId,q.q,q.options,q.a]),sem:validateSubjectBSemantics()};
console.log('__V306__'+Buffer.from(JSON.stringify(out)).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:])
        m=re.search(r'__V306__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v306','v305'),'expects v306 over v305')
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
v305p=Path('_regression/subject-a-mock-selection-order-simulation-v305.fixture.json');req(v305p.exists(),'v305 fixture missing')
v305=json.loads(v305p.read_text());req(v305.get('result')=='PASS — SELECTION-ORDER ALTERNATIVES SIMULATED','v305 fixture result')

source_allowed={'app/subject-a-mock-selection-diversity-overrides-v306.txt','index.html','.github/subject-a-mock-category-order-diversity-repair/prepare_reference.py','.github/subject-a-mock-category-order-diversity-repair/validate_repair.py','.github/workflows/subject-a-mock-category-order-diversity-repair.yml'}
generated_allowed={'manifest.webmanifest','sw.js','_regression/subject-a-mock-category-order-diversity-repair-v306.fixture.json','audits/SUBJECT_A_MOCK_CATEGORY_ORDER_DIVERSITY_REPAIR_v306.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(source_allowed<=changed,'missing intended source files '+repr(sorted(source_allowed-changed)))
req(changed<=source_allowed|generated_allowed,'unexpected repair drift '+repr(sorted(changed-(source_allowed|generated_allowed))))

cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
req(cand['v']=='v306' and par['v']=='v305','runtime versions')
req(cand['bankSignature']==par['bankSignature'],'question bank/content drift')
req(cand['blueprints']==par['blueprints'],'mock blueprint drift')
req(cand['sem'].get('ok') is True and par['sem'].get('ok') is True,'Subject B semantics')
spec=cand['spec'] or {};req(spec.get('policy')=='randomize-category-traversal-only','repair policy marker')
for key in ['categoryQuotaChanged','difficultyQuotaChanged','cognitiveTargetChanged','difficultyTraversalChanged','conceptCapChanged','noveltyOrderChanged','questionContentChanged','profileSchemaMigrationRequired','remoteTelemetry']:req(spec.get(key) is False,'unexpected policy change '+key)
fn_compact=re.sub(r'\s+','',cand['fn']);par_compact=re.sub(r'\s+','',par['fn'])
req('categoryOrder=shuffled([...MOCK_CATEGORIES])' in fn_compact,'candidate does not randomize category traversal')
req('MOCK_DIFFICULTY_LEVELS.forEach' in cand['fn'],'difficulty traversal contract missing')
req('categoryOrder=shuffled([...MOCK_CATEGORIES])' not in par_compact,'parent unexpectedly already randomized')

for mode in ['full','half']:
    c,p=cand['summary'][mode],par['summary'][mode]
    req(c['invalidSessionCount']==0 and c['blueprintMismatch']==0,mode+' candidate blueprint/structure failure '+json.dumps(c,ensure_ascii=False))
    req(p['invalidSessionCount']==0 and p['blueprintMismatch']==0,mode+' parent blueprint/structure failure')
    req(p['strat16Pct']>=99.0,mode+' parent no longer reproduces fixed strat-16 exposure')
    req(c['strat16Pct']<=25.0,mode+' strat-16 exposure not repaired '+str(c['strat16Pct']))
    req(c['exposurePct']['max']<=60.0,mode+' new near-fixed question created '+str(c['exposurePct']['max']))
    req(c['neverSelected']<p['neverSelected'],mode+' selection coverage did not improve')

files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/reference six-file mismatch')
summary={'sourceDecision':'v305 showed fixed category traversal is the dominant cause; apply the narrower category-only change','parent':par['summary'],'candidate':cand['summary'],'fullStrat16ReductionPctPoints':round(par['summary']['full']['strat16Pct']-cand['summary']['full']['strat16Pct'],1),'halfStrat16ReductionPctPoints':round(par['summary']['half']['strat16Pct']-cand['summary']['half']['strat16Pct'],1),'preserved':['60/30 counts','category quotas','difficulty quotas','cognitive targets','concept caps','novelty ordering','question content','profile schema','Subject B semantics']}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — CATEGORY-ORDER DIVERSITY REPAIR VALIDATED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-mock-category-order-diversity-repair-v306.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v306 — Subject A Mock Category-Order Diversity Repair\n=================================================================\n\nResult\n------\nPASS — CATEGORY-ORDER DIVERSITY REPAIR VALIDATED\nPrevious release: v305\nSource main: {parent}\nLearner-facing change: Subject A mock category traversal is randomized before the existing greedy selector runs.\n\nWhy this repair\n---------------\nv305 proved that the fixed category traversal order—not the cognitive label itself—caused strat-16 to appear in every full and half mock. v306 applies only the smaller category-order change and leaves difficulty traversal fixed.\n\n500-session runtime comparison\n------------------------------\n{json.dumps(summary,ensure_ascii=False,indent=2)}\n\nRegression\n----------\nQUESTION_BANK content and answer keys: unchanged.\nMOCK_BLUEPRINTS: unchanged.\nCategory, difficulty and cognitive counts: exact in every simulated full/half session.\nDuplicate question IDs: none.\nNo new question exceeds 60% exposure in either mode.\nSubject B semantic diagnostics: OK.\nCandidate/approved-reference six-file byte equality: yes.\n\nDecision\n--------\nKeep the v306 category-only traversal repair. Do not also randomize difficulty traversal: the narrower change removes the pathological fixed slot while preserving every mock blueprint.\n'''
Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_MOCK_CATEGORY_ORDER_DIVERSITY_REPAIR_v306.txt').write_text(audit);print(audit)

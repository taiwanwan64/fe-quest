from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile,collections

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip();m=re.fullmatch(r'subject-a-mock-selection-detail-audit-(v(\d+))',b);req(m,'bad v302 branch');return m.group(1),f'v{int(m.group(2))-1}'
def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))
def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function seeded(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function safeSource(name){try{return typeof globalThis[name]==='function'?String(globalThis[name]):null;}catch(_){return null;}}
function row(q){return {id:String(q?.id||''),cat:String(q?.cat||''),difficulty:String(q?.difficulty||''),cognitive:String(q?.cognitiveLevel||''),coreTopicId:String(q?.coreTopicId||''),concept:String(q?.concept||''),conceptKey:String(q?.conceptKey||''),topic:String(q?.topic||''),angle:String(q?.angle||''),q:String(q?.q||''),keys:Object.keys(q||{}).sort(),seen:mockSeen(q),lastSeen:mockLastSeen(q)};}
function traceSelection(mode){
 const bp=MOCK_BLUEPRINTS[mode]||MOCK_BLUEPRINTS.full,quotas=mockCategoryQuotas(bp.count),difficultyByCat=allocateMockDifficultyByCategory(quotas,bp),conceptCounts={},cognitiveCounts={'想起':0,'適用':0,'判断':0},cognitiveTarget=bp.cognitive||{'想起':0,'適用':bp.count,'判断':0},out=[],calls=[];
 MOCK_CATEGORIES.forEach(cat=>{const cap=mode==='half'?1:2;MOCK_DIFFICULTY_LEVELS.forEach(level=>{const n=difficultyByCat[cat][level]||0,pool=QUESTION_BANK.filter(q=>q.cat===cat&&q.difficulty===level);const before={...cognitiveCounts};const selected=pickMockPool(pool,n,conceptCounts,cap,cognitiveCounts,cognitiveTarget,level);calls.push({cat,level,n,cap,poolCount:pool.length,beforeCognitive:before,afterCognitive:{...cognitiveCounts},selected:selected.map(x=>String(x.id||''))});out.push(...selected);});});
 const unique=[],seenIds=new Set();for(const q of out){if(!seenIds.has(q.id)){unique.push(q);seenIds.add(q.id);}}
 if(unique.length<bp.count)unique.push(...QUESTION_BANK.filter(q=>!seenIds.has(q.id)).sort(mockCandidateSort).slice(0,bp.count-unique.length));
 return {ids:unique.slice(0,bp.count).map(q=>String(q.id||'')),calls,quotas,difficultyByCat,cognitiveTarget,finalCognitive:{...cognitiveCounts}};
}
const target=QUESTION_BANK.find(q=>q.id==='strat-16');if(!target)throw new Error('strat-16 missing');const targetRow=row(target);const targetPool=QUESTION_BANK.filter(q=>q.cat===target.cat&&q.difficulty===target.difficulty).map(row);
const originalRandom=Math.random,traces=[];for(let i=0;i<120;i++){const seed=3020001+i*7919;Math.random=seeded(seed);const tr=traceSelection('full');Math.random=seeded(seed);const actual=buildMockQuestions('full').map(x=>String(x.id||''));const same=[...tr.ids].sort().join('|')===[...actual].sort().join('|');const call=tr.calls.find(c=>c.selected.includes('strat-16'));traces.push({seed,sameSet:same,targetSelected:actual.includes('strat-16'),targetTraceCall:call||null});}Math.random=originalRandom;
const out={v:APP_VERSION,target:targetRow,targetPool,traces,blueprints:MOCK_BLUEPRINTS,categories:MOCK_CATEGORIES,difficulties:MOCK_DIFFICULTY_LEVELS,sources:{pickMockPool:String(pickMockPool),buildMockQuestions:String(buildMockQuestions),mockCandidateSort:String(mockCandidateSort),mockSeen:String(mockSeen),mockLastSeen:String(mockLastSeen),mockCognitivePreference:safeSource('mockCognitivePreference'),cognitiveWeight:safeSource('cognitiveWeight'),allocateMockDifficultyByCategory:String(allocateMockDifficultyByCategory),mockCategoryQuotas:String(mockCategoryQuotas)},sem:validateSubjectBSemantics()};console.log('__V302__'+Buffer.from(JSON.stringify(out)).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V302__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))
version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v302','v301'),'expects v301')
v301p=Path('_regression/subject-a-mock-session-simulation-v301.fixture.json');req(v301p.exists(),'v301 fixture missing');v301=json.loads(v301p.read_text());req(v301.get('result')=='PASS — MOCK SESSION DISTRIBUTION CAPTURED','v301 result');req(v301['summary']['full']['topNonCoreSelections'][0]['id']=='strat-16' and v301['summary']['full']['topNonCoreSelections'][0]['sessionPct']==100.0,'v301 target finding drift')
expected={'.github/subject-a-mock-selection-detail-audit/validate_audit.py','.github/workflows/subject-a-mock-selection-detail-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v302' and par['v']=='v301','versions');req(cand['target']==par['target'] and cand['targetPool']==par['targetPool'],'bank drift');req(cand['blueprints']==par['blueprints'],'blueprint drift');req(cand['traces']==par['traces'],'selection behavior drift');req(cand['sem'].get('ok') is True,'semantic');req(all(x['sameSet'] for x in cand['traces']),'trace reconstruction mismatch')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
target=cand['target'];pool=cand['targetPool'];traces=cand['traces'];selected=sum(x['targetSelected'] for x in traces);calls=[x['targetTraceCall'] for x in traces if x['targetTraceCall']];call_sig=collections.Counter((c['cat'],c['level'],c['n'],c['poolCount'],tuple(sorted(c['beforeCognitive'].items())),tuple(sorted(c['afterCognitive'].items()))) for c in calls)
cog=collections.Counter(r['cognitive'] for r in pool);core=collections.Counter(bool(r['coreTopicId']) for r in pool);seen=collections.Counter(str(r['seen']) for r in pool);last=collections.Counter(str(r['lastSeen']) for r in pool)
source_findings=[];ps=cand['sources']['pickMockPool'];
for term in ['mockCandidateSort','mockCognitivePreference','cognitiveWeight','conceptCounts','cognitiveCounts','cognitiveTarget']:
    if term in ps:source_findings.append(term)
summary={'v301Finding':{'fullTarget':'strat-16','fullSessionPct':100.0,'eligibleNeverSelected':v301['summary']['full']['eligibleQuestionExposurePer600SessionsPct']['neverSelected']},'target':target,'sameCategoryDifficultyPool':{'count':len(pool),'cognitiveCounts':dict(cog),'coreVsNonCore':{'core':core[True],'nonCore':core[False]},'freshSeenValues':dict(seen),'freshLastSeenValues':dict(last),'rows':pool},'traceProbe':{'runs':len(traces),'targetSelectedRuns':selected,'targetSelectedPct':round(selected/len(traces)*100,1),'targetCallSignatures':[{'signature':str(k),'runs':n} for k,n in call_sig.most_common(12)],'examples':traces[:6]},'selectionSourceTerms':source_findings,'sources':cand['sources']}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — MOCK SELECTION DETAIL CAPTURED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-mock-selection-detail-v302.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v302 — Subject A Mock Selection Detail Audit
=======================================================

Result
------
PASS — MOCK SELECTION DETAIL CAPTURED
Previous release: v301
Source main: {parent}
Learner-facing change in v302: none

Purpose
-------
v301 found a concrete fresh-state imbalance: strat-16 appeared in every one of 600 full mocks while 119 otherwise eligible QUESTION_BANK items were never selected. v302 traces the real selection layer, reconstructs buildMockQuestions call-by-call with pickMockPool, and inspects the exact category/difficulty pool around strat-16 before any repair is attempted.

Summary
-------
{json.dumps(summary,ensure_ascii=False,indent=2)}

Regression
----------
No learner-facing content changed.
Target question, peer pool, blueprints and 120 deterministic reconstructed/actual full-mock selections are equivalent to v301.
Every reconstructed selection set matches the production buildMockQuestions set under the same seed.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
Use the captured pickMockPool source and target-call state to identify the smallest cause of deterministic over-selection. If the target is being forced by cognitive/concept balancing rather than true scarcity, repair that selection rule without changing question content, category quotas, difficulty quotas or cognitive targets. If the pool is genuinely scarce for the required role, prefer adding/retagging only well-supported original content after a separate content review.
''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_MOCK_SELECTION_DETAIL_v302.txt').write_text(audit);print(audit)

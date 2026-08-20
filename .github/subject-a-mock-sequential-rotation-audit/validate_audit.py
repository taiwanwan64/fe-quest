from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip();m=re.fullmatch(r'subject-a-mock-sequential-rotation-audit-(v(\d+))',b);req(m,'bad v308 branch');return m.group(1),f'v{int(m.group(2))-1}'
def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))
def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function seeded(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function sourceId(q){return String(q?.sourceId||q?.id||'');}
function stamp(i){const d=new Date(Date.UTC(2026,0,1+i));return d.toISOString().slice(0,10);}
function complete(xs,i){const day=stamp(i);for(const q of xs){const id=sourceId(q);const st=profile.mockQuestionStats[id]||(profile.mockQuestionStats[id]={seen:0,correct:0,lastSeen:null});st.seen=(st.seen||0)+1;st.lastSeen=day;}}
function overlap(a,b){if(!a||!b)return 0;const s=new Set(a);return b.filter(x=>s.has(x)).length;}
function stats(a){const s=[...a].sort((x,y)=>x-y);const mean=s.reduce((x,y)=>x+y,0)/(s.length||1);const variance=s.reduce((x,y)=>x+(y-mean)*(y-mean),0)/(s.length||1);return {min:s[0]||0,median:s[Math.floor(s.length/2)]||0,max:s[s.length-1]||0,mean:Math.round(mean*100)/100,cv:mean?Math.round(Math.sqrt(variance)/mean*1000)/1000:0};}
function runSequential(mode,runs,seedBase){
 profile.mockQuestionStats={};const eligible=QUESTION_BANK.filter(q=>MOCK_CATEGORIES.includes(q.cat)&&MOCK_DIFFICULTY_LEVELS.includes(q.difficulty)).map(q=>String(q.id));const exposure={};const overlaps=[];let prev=null;const coverage=[];
 for(let i=0;i<runs;i++){Math.random=seeded(seedBase+i*7919);const xs=buildMockQuestions(mode),ids=xs.map(sourceId);if(prev)overlaps.push(overlap(prev,ids));for(const id of ids)exposure[id]=(exposure[id]||0)+1;complete(xs,i);prev=ids;coverage.push(Object.keys(exposure).length);}
 const counts=eligible.map(id=>exposure[id]||0);const threshold=p=>{const need=Math.ceil(eligible.length*p);const at=coverage.findIndex(x=>x>=need);return at<0?null:at+1;};
 return {mode,runs,eligible:eligible.length,distinctSelected:Object.keys(exposure).length,neverSelected:eligible.filter(id=>!exposure[id]).length,coveragePct:Math.round(Object.keys(exposure).length/eligible.length*1000)/10,sessionsTo90Pct:threshold(.90),sessionsTo95Pct:threshold(.95),sessionsTo100Pct:threshold(1),adjacentOverlap:stats(overlaps),exposure:stats(counts),top:Object.entries(exposure).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([id,n])=>({id,n}))};
}
function runFresh(mode,runs,seedBase){let prev=null;const overlaps=[];const exposure={};for(let i=0;i<runs;i++){profile.mockQuestionStats={};Math.random=seeded(seedBase+i*7919);const ids=buildMockQuestions(mode).map(sourceId);if(prev)overlaps.push(overlap(prev,ids));for(const id of ids)exposure[id]=(exposure[id]||0)+1;prev=ids;}return {mode,runs,adjacentOverlap:stats(overlaps),distinctSelected:Object.keys(exposure).length,top:Object.entries(exposure).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([id,n])=>({id,n}))};}
const originalRandom=Math.random;const result={full:{fresh:runFresh('full',200,3080001),sequential:runSequential('full',80,3180001)},half:{fresh:runFresh('half',200,3280001),sequential:runSequential('half',120,3380001)}};Math.random=originalRandom;
const out={v:APP_VERSION,result,finishMock:String(finishMock),mockSeen:String(mockSeen),mockLastSeen:String(mockLastSeen),mockCandidateSort:String(mockCandidateSort),builder:String(buildMockQuestions),blueprints:MOCK_BLUEPRINTS,bankSignature:QUESTION_BANK.map(q=>[q.id,q.cat,q.difficulty,q.cognitiveLevel,q.coreTopicId]),sem:validateSubjectBSemantics()};console.log('__V308__'+Buffer.from(JSON.stringify(out)).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V308__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))
version,previous=context();req((version,previous)==('v308','v307'),'expects v308')
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();v307=Path('_regression/subject-a-mock-history-lifecycle-v307.fixture.json');req(v307.exists(),'v307 fixture missing');req(json.loads(v307.read_text()).get('result')=='PASS — MOCK HISTORY LIFECYCLE DISCOVERED','v307 result')
expected={'.github/subject-a-mock-sequential-rotation-audit/validate_audit.py','.github/workflows/subject-a-mock-sequential-rotation-audit.yml'};generated={'index.html','manifest.webmanifest','sw.js','_regression/subject-a-mock-sequential-rotation-v308.fixture.json','audits/SUBJECT_A_MOCK_SEQUENTIAL_ROTATION_v308.txt'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v308' and par['v']=='v307','versions');
for k in ['finishMock','mockSeen','mockLastSeen','mockCandidateSort','builder','blueprints','bankSignature','result']:req(cand[k]==par[k],k+' audit-only drift')
req(cand['sem'].get('ok') is True,'semantic');req('profile.mockQuestionStats' in cand['finishMock'] and 'ms.seen=(ms.seen||0)+1' in cand['finishMock'] and 'ms.lastSeen=localDateISO(0)' in cand['finishMock'],'finish lifecycle drift');req('profile.mockQuestionStats' in cand['mockSeen'] and 'profile.mockQuestionStats' in cand['mockLastSeen'],'reader lifecycle drift')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
res=cand['result'];findings=[]
for mode in ['full','half']:
    f,s=res[mode]['fresh'],res[mode]['sequential'];
    if s['adjacentOverlap']['mean']>=f['adjacentOverlap']['mean']*.75:findings.append(mode+': sequential overlap reduction is modest')
    if s['coveragePct']<95:findings.append(mode+': sequential coverage remains below 95%')
    if s['exposure']['cv']>0.35:findings.append(mode+': sequential exposure remains uneven')
summary={'method':'Build production mocks repeatedly; after each sequential session mirror the exact v307 finishMock mockQuestionStats seen/lastSeen write. Compare with fresh-profile sessions using deterministic seeds.','results':res,'findings':findings,'decision':'repair-needed' if findings else 'keep-current-v306-rotation'}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — SEQUENTIAL MOCK ROTATION CHARACTERIZED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-mock-sequential-rotation-v308.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v308 — Subject A Mock Sequential Rotation Audit\n=========================================================\n\nResult\n------\nPASS — SEQUENTIAL MOCK ROTATION CHARACTERIZED\nPrevious release: v307\nSource main: {parent}\nLearner-facing change: none\n\nMethod\n------\n{summary['method']}\n\nSummary\n-------\n{json.dumps(summary,ensure_ascii=False,indent=2)}\n\nRegression\n----------\nQUESTION_BANK and MOCK_BLUEPRINTS unchanged.\nProduction selection/history functions unchanged from v307.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\n{('The production history lifecycle already provides strong enough rotation; do not add a second repetition policy.' if not findings else 'The measured lifecycle still has a meaningful rotation weakness. Use these findings to design the smallest v309 repair rather than adding a broad new dashboard or policy layer.')}\n''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_MOCK_SEQUENTIAL_ROTATION_v308.txt').write_text(audit);print(audit)

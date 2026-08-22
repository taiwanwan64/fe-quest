from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile,hashlib

V='v339'; P='v338'
def req(x,m):
    if not x: raise AssertionError(m)

def ctx():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'runtime-safety-override-cleanup-(v(\d+))',b); req(m,'bad branch '+b)
    v=m.group(1); p=f'v{int(m.group(2))-1}'; req((v,p)==(V,P),'expects v339/v338'); return b

def scripts(p):
    h=Path(p).read_text(); return '\n'.join(x for x in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if x.strip() and not x.lstrip().startswith('{'))

def run(p,strict=False):
    js=scripts(p)
    if strict:
        pat=r"function assert\(ok,msg\)\{if\(ok\)return true;.*?return false;\}"
        rep="function assert(ok,msg){if(!ok)throw new Error(msg||'FE QUEST CI contract failed');return true;}"
        js,n=re.subn(pat,rep,js,count=1,flags=re.S); req(n==1,'guard strictify')
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function safe(fn){try{return {ok:true,value:fn()};}catch(e){return {ok:false,error:String(e&&e.stack||e)};}}
function hash(v){return require('crypto').createHash('sha256').update(JSON.stringify(v)).digest('hex');}
const core={
 plan:safe(()=>buildTodayTasks().map(t=>({type:t.type||null,minutes:t.minutes||0,bmode:t.bmode||null,bid:t.bid||null,lessonId:t.lessonId||null}))),
 phases:safe(()=>[14,7,3,1,0].map(d=>({d,p:examStudyPhase(d)}))),
 alloc:safe(()=>({a45:taskAllocation(45),a60:taskAllocation(60),a90:taskAllocation(90)})),
 q:safe(()=>hash(QUESTION_BANK)),
 b:safe(()=>hash([B_EXERCISES,SECURITY_SCENARIOS,B_EXAM_ALGO_ITEMS,B_COMPOUND_SETS])),
 schema:safe(()=>({p:Object.keys(profile||{}).sort(),s:Object.keys(profile?.settings||{}).sort(),q:QUESTION_BANK.length})),
 sem:safe(()=>validateSubjectBSemantics())
};
const smoke=safe(()=>{const a={correct:0,blank:0,details:[]};renderBFinalResult(a,7);renderBFinalResult(a,0);return true;});
const hook=safe(()=>{if(typeof subjectBFinalEarnedForRenderV219!=='function')return null;const a={};return [subjectBFinalEarnedForRenderV219(a,13),subjectBFinalEarnedForRenderV219(a,0)];});
console.log('__V339__'+Buffer.from(JSON.stringify({v:APP_VERSION,core,smoke,hook,guard:String(assert),contracts:globalThis.FEQUEST_RUNTIME_CONTRACTS||{count:0},pipe:globalThis.SUBJECT_B_FINAL_RESULT_PIPELINE_V339_SPEC||null})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        f=Path(td)/'x.js'; f.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(f)],capture_output=True,text=True); req(z.returncode==0,('strict ' if strict else '')+'runtime '+z.stderr[-12000:])
        m=re.search(r'__V339__([A-Za-z0-9+/=]+)',z.stdout); req(m,'marker'); return json.loads(base64.b64decode(m.group(1)))

def show(ref,p): return subprocess.check_output(['git','show',f'{ref}:{p}'],text=True)
def includes(t): return re.findall(r'{%\s*include_relative\s+([^\s%]+)\s*%}',t)
def chain(index,reader):
    out=[]
    for p in includes(index):
        if not p.startswith('app/'): continue
        n=Path(p).name.lower()
        if not any(x in n for x in ('override','pipeline','patch')): continue
        try: t=reader(p)
        except: continue
        out += [p]*len(re.findall(r'\brenderBFinalResult\s*=\s*function\s*\(',t))
    return out

def assert_rows(js):
    rows=[]
    for line in js.splitlines():
        if re.search(r'\bfunction\s+assert\s*\(',line): continue
        if re.search(r'\bassert\s*\(',line): rows.append(line.strip())
    return rows

ctx(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
expected={'.github/runtime-safety-override-cleanup/validate_v339.py','.github/workflows/runtime-safety-override-cleanup-v339.yml','index.html','app/subject-b-final-xp-overrides-v219.txt','app/subject-b-review-reason-route-overrides-v243.txt','app/subject-b-security-review-reason-label-overrides-v245.txt','app/subject-b-final-result-pipeline-v339.txt'}
allowed=expected|{'manifest.webmanifest','sw.js','FE_QUEST_DEVELOPMENT_PLAN.md','_regression/runtime-safety-override-cleanup-v339.fixture.json','audits/RUNTIME_SAFETY_OVERRIDE_CLEANUP_v339.md'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines()); req(expected<=changed,'missing source'); req(changed<=allowed,'source drift '+repr(sorted(changed-allowed)))

c=run('_site/index.html'); p=run('_site_parent/index.html'); s=run('_site/index.html',True)
req((c['v'],p['v'],s['v'])==(V,P,V),'versions')
for k in ('plan','phases','alloc','q','b','schema'): req(c['core'][k]==p['core'][k],'behavior drift '+k)
req(c['core']['schema']['value']['q']==710,'710 questions')
req(c['core']['sem']['ok'] and c['core']['sem']['value'].get('ok') is True,'semantic')
req(c['smoke']['ok'] and p['smoke']['ok'],'final smoke')
req(c['hook']['ok'] and c['hook']['value']==[13,13],'v219 hook')
req(c['pipe'] and c['pipe'].get('replacesRenderWrappers')==['v219','v243','v245'],'pipeline spec')
req((c.get('contracts') or {}).get('count',0)==0,'runtime contract failures')
req('throw new Error' not in c['guard'] and 'throw new Error' in s['guard'],'hard assert split')

idx=Path('index.html').read_text(); par=show('origin/main','index.html')
cc=chain(idx,lambda x:Path(x).read_text()); pc=chain(par,lambda x:show('origin/main',x))
req(len(pc)==5 and len(cc)==3,'wrapper depth '+repr((pc,cc)))
req(cc==['app/subject-b-final-remediation-overrides-v217.txt','app/subject-b-wrong-answer-feedback-overrides-v230.txt','app/subject-b-final-result-pipeline-v339.txt'],'wrapper chain '+repr(cc))
asserts=assert_rows(scripts('_site/index.html')); parent_asserts=assert_rows(scripts('_site_parent/index.html'))
req(len(asserts)==len(parent_asserts)==54,'assert contract rows '+repr((len(parent_asserts),len(asserts))))
learning=Path('app/learning-patches.txt').read_text(); req(all(re.search(rf'\bv{n}\b',learning,re.I) for n in range(134,141)),'v134-v140 blocks')
standalone=[x.name for x in Path('app').iterdir() if x.is_file() and re.search(r'v(?:13[4-9]|140)',x.name,re.I)]; req(not standalone,'standalone v134-v140 '+repr(standalone))
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']; req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')

summary={'runtimeHardAssertStopPaths':0,'runtimeContractRows':54,'ciStrictReplayPassed':True,'wrapperDepthBefore':5,'wrapperDepthAfter':3,'wrapperChainAfter':cc,'questionCount':710,'contentHashesUnchanged':True,'adaptiveContractUnchanged':True,'schemaChanged':False,'subjectBSemanticOK':True,'v134ToV140StandaloneFiles':0}
fx={'version':V,'previous':P,'parentMainSha':parent,'result':'PASS — RUNTIME HARD-ASSERT STOP PATHS REMOVED; FINAL-RESULT WRAPPER DEPTH 5→3','summary':summary,'pipelineSpec':c['pipe']}
Path('_regression').mkdir(exist_ok=True); Path('_regression/runtime-safety-override-cleanup-v339.fixture.json').write_text(json.dumps(fx,ensure_ascii=True,indent=2)+'\n')
report=f'''# FE QUEST v339 — runtime safety + override cleanup phase 1\n\nResult: **{fx['result']}**\n\n- production hard-assert停止経路: **0**（54 contract rowは非破壊diagnostic化）\n- CI strict replay: **PASS**（同じ54 contract rowをthrow型で検証）\n- `renderBFinalResult` wrapper深度: **5 → 3**\n- v219 / v243 / v245: 個別wrapperから明示hookへ移行\n- v217 / v230: 実行順維持のためinner wrapperとして残置\n- 科目A 710問・QUESTION_BANK hash: **不変**\n- 科目B content hash / semantic diagnostics: **不変 / OK**\n- 適応学習主要contract・profile schema: **不変**\n- v134〜v140: standalone fileは0件で、既に `learning-patches.txt` に集約済み。405KB moduleの再配置はこの安全化フェーズでは行わない。\n\nPipeline順: v219 XP表示保持 → v217 recovery → v230 choice-specific feedback → v243 review route → v245 security reason labels。\n\n次はSource of Truthをv340へ更新し、初回体験・日常UX完成度向上へ進む。\n'''
Path('audits').mkdir(exist_ok=True); Path('audits/RUNTIME_SAFETY_OVERRIDE_CLEANUP_v339.md').write_text(report); print(report)

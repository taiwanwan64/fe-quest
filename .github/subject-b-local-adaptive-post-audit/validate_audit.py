from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-local-adaptive-post-audit-(v(\d+))',branch)
    req(m is not None,'bad v258 audit branch')
    version=m.group(1); return version,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function hashJson(v){return hashText(2166136261>>>0,JSON.stringify(v))>>>0;}
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function finalSig(){let h=2166136261>>>0;for(let i=0;i<2000;i++){profile.bFinalStats={};Math.random=seedRand((0x258000+i)>>>0);const rows=buildBFinal();h=hashText(h,JSON.stringify(rows.map(x=>[x.kind,x.sourceId,x.q,x.options,x.a])));}return h>>>0;}
function ev(layer,n,correct,ms=5000,prefix='x'){
 const out=[];for(let i=0;i<n;i++)out.push({layer,sourceId:`${prefix}${i}`,level:i%2?'標準':'応用',ok:i<correct,elapsedMs:ms+i*10,at:`2026-08-19T01:${String(i%60).padStart(2,'0')}:00.000Z`});return out;
}
function setEvents(rows){profile.subjectBPerformanceV254={schema:1,events:rows};}
function base(){return {stage:4,mode:'final',id:null,title:'BASE',icon:'📝',kicker:'BASE',desc:'base'};}
function adaptiveCase(layer){
 const rows=[];
 for(const l of ['compound','miniMock','securityMock']) rows.push(...ev(l,8,l===layer?4:7,5000,l));
 setEvents(rows);const b=base();const r=subjectBLocalAdaptiveRecommendationV257(b,{finalRuns:2});return {same:r===b,mode:r.mode,local:!!r.localEvidence,rate:r.localEvidenceRate,count:r.localEvidenceCount};
}
function policyProbe(){
 setEvents(ev('miniMock',7,0,5000,'sparse'));let b=base(),r=subjectBLocalAdaptiveRecommendationV257(b,{finalRuns:2});const sparse=r===b;
 setEvents([...ev('compound',8,4,5000,'tc'),...ev('miniMock',8,4,7000,'tm')]);b=base();r=subjectBLocalAdaptiveRecommendationV257(b,{finalRuns:2});const tied=r===b;
 setEvents([...ev('compound',8,7,5000,'c'),...ev('miniMock',8,7,7000,'m'),...ev('securityMock',8,7,6000,'s')]);b=base();r=subjectBLocalAdaptiveRecommendationV257(b,{finalRuns:2});const strong=r===b;
 return {sparse,tied,strong,compound:adaptiveCase('compound'),miniMock:adaptiveCase('miniMock'),securityMock:adaptiveCase('securityMock'),taper:[0,3,4,null].map(x=>subjectBLocalAdaptiveTaperAllowedV257(x))};
}
function src(fn){return typeof fn==='function'?String(fn):'';}
const launch=src(launchSubjectBRecommendation);
const flow={
 hub:{local:src(subjectBHubRecommendation).includes('subjectBLocalAdaptiveRecommendationV257'),taper:src(subjectBHubRecommendation).includes('finalAllowed'),prior:src(subjectBHubRecommendation).includes('__subjectBHubRecommendationBeforeV257')},
 practice:{hub:src(renderPracticeNextCard).includes('subjectBHubRecommendation'),launch:src(renderPracticeNextCard).includes('launchSubjectBRecommendation')},
 finalReadiness:{hub:src(renderBFinalReadiness).includes('subjectBHubRecommendation'),launch:src(renderBFinalReadiness).includes('launchSubjectBRecommendation'),taper:src(renderBFinalReadiness).includes('taper')||src(renderBFinalReadiness).includes('days<=3')},
 securityNext:{hub:src(renderSecurityNextCard).includes('subjectBHubRecommendation'),launch:src(renderSecurityNextCard).includes('launchSubjectBRecommendation')},
 traceNext:{hub:src(renderTraceNextCard).includes('subjectBHubRecommendation'),launch:src(renderTraceNextCard).includes('launchSubjectBRecommendation')},
 continueFlow:{launch:src(continueSubjectBFlow).includes('launchSubjectBRecommendation')},
 launchModes:{compound:launch.includes("'compound'")||launch.includes('"compound"'),miniMock:launch.includes("'miniMock'")||launch.includes('"miniMock"'),securityMock:launch.includes("'securityMock'")||launch.includes('"securityMock"'),final:launch.includes("'final'")||launch.includes('"final"')},
 sourceHashes:{hub:hashText(2166136261,src(subjectBHubRecommendation)),practice:hashText(2166136261,src(renderPracticeNextCard)),finalReadiness:hashText(2166136261,src(renderBFinalReadiness)),securityNext:hashText(2166136261,src(renderSecurityNextCard)),traceNext:hashText(2166136261,src(renderTraceNextCard)),continueFlow:hashText(2166136261,src(continueSubjectBFlow)),launch:hashText(2166136261,launch)}
};
console.log('__V258__'+Buffer.from(JSON.stringify({
 v:APP_VERSION,spec:SUBJECT_B_LOCAL_ADAPTIVE_RECOMMENDATION_V257_SPEC,policy:policyProbe(),flow,
 banks:{q:hashJson(QUESTION_BANK),ex:hashJson(B_EXERCISES),compound:hashJson(B_COMPOUND_SETS),sec:hashJson(SECURITY_SCENARIOS),algo:hashJson(B_EXAM_ALGO_ITEMS)},qcount:QUESTION_BANK.length,sig:finalSig(),contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-9000:])
        m=re.search(r'__V258__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=context(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v258','v257'),'v258 expects v257 parent')
source=Path('audits/SUBJECT_B_LOCAL_ADAPTIVE_RECOMMENDATION_v257.txt');req(source.exists(),'v257 adaptive evidence missing')
st=source.read_text();req('PASS — NO FINDINGS' in st and 'taper preservation' in st and 'accuracy-first selection' in st,'v257 evidence drift')
expected={'.github/subject-b-local-adaptive-post-audit/validate_audit.py','.github/workflows/subject-b-local-adaptive-post-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'v258 audit-only source drift: '+repr(sorted(changed^expected)))

cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
req(cand['v']=='v258' and par['v']=='v257','runtime versions')
req(cand['spec']==par['spec'],'v257 adaptive spec drift in audit-only release')
req(cand['policy']==par['policy'],'adaptive policy behavior drift')
req(cand['flow']==par['flow'],'render/launch flow drift')
req(cand['banks']==par['banks'] and cand['qcount']==par['qcount']==710,'question/practice bank drift')
req(cand['sig']==par['sig'],'2000-seed final selection/order/options drift')
req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')

p=cand['policy'];req(p['sparse'] and p['tied'] and p['strong'],'conservative fallback drift')
for mode in ['compound','miniMock','securityMock']:
    x=p[mode];req(not x['same'] and x['mode']==mode and x['local'] and x['rate']==50 and x['count']==8,'adaptive mode contract failed: '+mode)
req(p['taper']==[False,False,True,True],'taper helper drift')
f=cand['flow'];
req(all(f['hub'].values()),'hub wrapper/taper/prior path missing')
for name in ['practice','finalReadiness','securityNext','traceNext']:
    req(f[name]['hub'] and f[name]['launch'],'render path disconnected: '+name)
req(f['finalReadiness']['taper'],'final readiness taper signal missing')
req(f['continueFlow']['launch'],'continue flow no longer launches guided recommendation')
req(all(f['launchModes'].values()),'launch dispatcher does not cover every v257 recommendation mode')

files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/mechanical reference mismatch')
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — NO FINDINGS','adaptivePolicy':p,'flowContract':f,'bankHashes':cand['banks'],'finalSignatureMatch':True,'contract':cand['contract'],'semanticOK':True,'candidateReferenceSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-local-adaptive-post-audit-v258.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v258 — Subject B Local Adaptive Recommendation Post-Audit
====================================================================

Result
------
PASS — NO FINDINGS
Previous release: v257
Source main: {parent}
Learner-facing change in v258: none

End-to-end recommendation path
------------------------------
The v257 learner-local policy remains attached to the single existing subjectBHubRecommendation path. The practice-next card and final-readiness card both consume that recommendation and route their action through launchSubjectBRecommendation. Completed security and trace flows also return to the same hub recommendation and launcher. continueSubjectBFlow remains connected to the same launcher.

Launch compatibility
--------------------
All three locally selectable short-practice modes — compound, miniMock, and securityMock — remain recognized by launchSubjectBRecommendation. The existing final route is also present. This confirms that a recommendation selected from learner-local evidence maps into an established start path rather than a display-only or dead-end state.

Conservative cases
------------------
Seven samples: existing recommendation preserved.
Tied weakest eligible layers: existing recommendation preserved.
All eligible layers above the weak threshold: existing recommendation preserved.
A uniquely weak layer at 4/8 first answers selects the matching compound, miniMock, or securityMock route.
Exam taper helper: adaptation is disabled at 0 and 3 days remaining and enabled again at 4 days or when no exam date is set.

Regression
----------
The complete recommendation/render/launch source contract is byte-behavior equivalent to v257 aside from the release shell version.
Question / TRACE / compound / security / final-algorithm banks: unchanged from v257.
2000 deterministic final sessions: selection/order/options unchanged.
Final contract: 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
Close the learner-local adaptive-recommendation sequence. v254-v257 now provide bounded local evidence, persistence/timing safety, conservative minimum-evidence gates, tie and taper fallbacks, and a verified end-to-end route through the existing Subject B recommendation UI and launcher. Do not add another learner-facing dashboard for these metrics. The next Subject B work should return to content/learning-quality priorities or a broader real-device UX audit rather than increasing adaptive-policy complexity.
'''
Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_LOCAL_ADAPTIVE_POST_AUDIT_v258.txt').write_text(audit);print(audit)

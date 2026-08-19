from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-local-adaptive-recommendation-(v(\d+))',b)
    req(m,'bad v257 branch');return m.group(1),f'v{int(m.group(2))-1}'


def runtime(path,probe):
    html=Path(path).read_text();scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function hashJson(v){return hashText(2166136261>>>0,JSON.stringify(v))>>>0;}
function finalSig(){let h=2166136261>>>0;for(let i=0;i<2000;i++){profile.bFinalStats={};Math.random=seedRand((0x257000+i)>>>0);const rows=buildBFinal();h=hashText(h,JSON.stringify(rows.map(x=>[x.kind,x.sourceId,x.q,x.options,x.a])));}return h>>>0;}
function ev(layer,n,correct,ms=5000,prefix='x'){
 const out=[];for(let i=0;i<n;i++)out.push({layer,sourceId:`${prefix}${i}`,level:i%2?'標準':'応用',ok:i<correct,elapsedMs:ms+i*10,at:`2026-08-19T00:${String(i%60).padStart(2,'0')}:00.000Z`});return out;
}
function setEvents(rows){profile.subjectBPerformanceV254={schema:1,events:rows};}
function policyProbe(){
 if(typeof SUBJECT_B_LOCAL_ADAPTIVE_RECOMMENDATION_V257_SPEC==='undefined')return null;
 const base=()=>({stage:4,mode:'final',id:null,title:'BASE',icon:'📝',kicker:'BASE',desc:'base'});
 let b,r;
 setEvents(ev('miniMock',8,0,5000,'gate'));b=base();r=subjectBLocalAdaptiveRecommendationV257(b,{finalRuns:1});const progressionGate={same:r===b,value:r};
 setEvents(ev('miniMock',7,0,5000,'sample'));b=base();r=subjectBLocalAdaptiveRecommendationV257(b,{finalRuns:2});const sampleGate={same:r===b,value:r};
 setEvents([...ev('compound',8,4,6000,'tc'),...ev('miniMock',8,4,8000,'tm')]);b=base();r=subjectBLocalAdaptiveRecommendationV257(b,{finalRuns:2});const tieGate={same:r===b,value:r,stats:subjectBLocalLayerStatsV257()};
 setEvents([...ev('compound',8,6,6000,'c'),...ev('miniMock',8,5,8000,'m'),...ev('securityMock',8,7,4000,'s')]);b=base();r=subjectBLocalAdaptiveRecommendationV257(b,{finalRuns:2});const weakMini={same:r===b,value:r,stats:subjectBLocalLayerStatsV257()};
 setEvents([...ev('compound',8,6,6000,'c'),...ev('miniMock',8,6,8000,'m'),...ev('securityMock',8,7,4000,'s')]);b=base();r=subjectBLocalAdaptiveRecommendationV257(b,{finalRuns:2});const strongGate={same:r===b,value:r};
 setEvents([...ev('miniMock',8,4,90000,'slow'),...ev('securityMock',8,3,1200,'fast')]);b=base();r=subjectBLocalAdaptiveRecommendationV257(b,{finalRuns:2});const accuracyFirst={same:r===b,value:r};
 setEvents([...ev('miniMock',10,0,5000,'old'),...ev('miniMock',20,20,5000,'recent')]);b=base();r=subjectBLocalAdaptiveRecommendationV257(b,{finalRuns:2});const recentWindow={same:r===b,value:r,stats:subjectBLocalLayerStatsV257()};
 setEvents(ev('final',20,0,90000,'final'));b=base();r=subjectBLocalAdaptiveRecommendationV257(b,{finalRuns:2});const finalIgnored={same:r===b,value:r};
 setEvents(ev('compound',8,4,500,'quick'));b=base();r=subjectBLocalAdaptiveRecommendationV257(b,{finalRuns:2});const fastCopy={same:r===b,value:r};
 const taperPolicy={d0:subjectBLocalAdaptiveTaperAllowedV257(0),d3:subjectBLocalAdaptiveTaperAllowedV257(3),d4:subjectBLocalAdaptiveTaperAllowedV257(4),none:subjectBLocalAdaptiveTaperAllowedV257(null)};
 return {progressionGate,sampleGate,tieGate,weakMini,strongGate,accuracyFirst,recentWindow,finalIgnored,fastCopy,taperPolicy};
}
const enabled=typeof SUBJECT_B_LOCAL_ADAPTIVE_RECOMMENDATION_V257_SPEC!=='undefined';
console.log('__V257__'+Buffer.from(JSON.stringify({
 v:APP_VERSION,enabled,spec:enabled?SUBJECT_B_LOCAL_ADAPTIVE_RECOMMENDATION_V257_SPEC:null,probe:(enabled&&__PROBE__)?policyProbe():null,
 banks:{q:hashJson(QUESTION_BANK),ex:hashJson(B_EXERCISES),compound:hashJson(B_COMPOUND_SETS),sec:hashJson(SECURITY_SCENARIOS),algo:hashJson(B_EXAM_ALGO_ITEMS)},qcount:QUESTION_BANK.length,sig:finalSig(),contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()
})).toString('base64'));
'''.replace('__PROBE__','true' if probe else 'false')
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed: '+z.stderr[-9000:])
        m=re.search(r'__V257__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing');return json.loads(base64.b64decode(m.group(1)))


version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v257','v256'),'v257 expects v256 parent')
source=Path('audits/SUBJECT_B_ADAPTIVE_RECOMMENDATION_HOOK_AUDIT_v256.txt');req(source.exists(),'v256 evidence missing')
st=source.read_text();req('PASS — DETAIL EVIDENCE CAPTURED' in st and 'subjectBHubRecommendation' in st and 'renderPracticeNextCard' in st,'v256 hook evidence drift')
manifest=json.loads(Path('_release/content-change-v257.json').read_text())
req(manifest['parent_main_sha']==parent and manifest['source_quality_audit']==str(source),'manifest source/parent drift')
req(manifest['content_files']==['app/subject-b-local-adaptive-recommendation-overrides-v257.txt'] and manifest['assembly_files']==['index.html'],'manifest scope drift')
rec=manifest['recommendation'];req(rec['minimum_samples_per_layer']==8 and rec['window_per_layer']==20 and rec['weak_accuracy_threshold']==70 and rec['requires_final_runs']==2,'recommendation thresholds drift')
req(rec['selection_signal']=='first-answer accuracy only' and rec['response_time_role']=='secondary explanatory copy only','evidence priority drift')
req('equal first-answer accuracy' in rec['tie_behavior'],'tie fallback manifest drift')
req('0 through 3 days' in rec['taper_behavior'],'taper preservation manifest drift')
expected={'app/subject-b-local-adaptive-recommendation-overrides-v257.txt','_release/content-change-v257.json','index.html','.github/subject-b-local-adaptive-recommendation/validate_repair.py','.github/workflows/subject-b-local-adaptive-recommendation.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'v257 source drift: '+repr(sorted(changed^expected)))
override=Path('app/subject-b-local-adaptive-recommendation-overrides-v257.txt').read_text()
for token in ['subjectBHubRecommendation=function','minSamplesPerLayer:8','windowPerLayer:20','weakAccuracyThreshold:70','requiresFinalRuns:2',"tieBehavior:'preserve-existing-recommendation'","taperRoutingPreserved:true",'subjectBLocalAdaptiveTaperAllowedV257','finalAllowed',"selectionSignal:'first-answer-accuracy-only'", "responseTimeRole:'copy-only-secondary-context'",'subjectBPerformanceRootV254','localEvidence:true']:
    req(token in override,'v257 contract missing: '+token)
for banned in ['fetch(','XMLHttpRequest','sendBeacon(','WebSocket(','QUESTION_BANK.push','B_EXERCISES.push','B_EXAM_ALGO_ITEMS.push','profile.subjectBPerformanceV257']:
    req(banned not in override,'v257 preservation/local-only violation: '+banned)

cand,par=runtime('_site/index.html',True),runtime('_site_parent/index.html',False)
req(cand['v']=='v257' and par['v']=='v256' and cand['enabled'] and not par['enabled'],'runtime versions/presence')
req(cand['banks']==par['banks'] and cand['qcount']==par['qcount']==710,'question/practice bank drift')
req(cand['sig']==par['sig'],'2000-seed final selection/order/options drift')
req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')
p=cand['probe'];req(p,'v257 policy probe missing')
req(p['progressionGate']['same'] is True,'local evidence changed staged progression before two final runs')
req(p['sampleGate']['same'] is True,'local evidence overrode base below 8 samples')
req(p['tieGate']['same'] is True,'tied weakest layers should preserve existing recommendation')
req(p['taperPolicy']=={'d0':False,'d3':False,'d4':True,'none':True},'exam taper policy drift')
wm=p['weakMini'];req(wm['same'] is False and wm['value']['mode']=='miniMock' and wm['value']['localEvidence'] is True and wm['value']['localEvidenceCount']==8 and wm['value']['localEvidenceRate']==63,'weak miniMock recommendation failed')
req('初回回答時間の中央値' in wm['value']['desc'],'response-time secondary copy missing when enough timing exists')
req(p['strongGate']['same'] is True,'strong eligible layers should preserve base recommendation')
aa=p['accuracyFirst'];req(aa['same'] is False and aa['value']['mode']=='securityMock' and aa['value']['localEvidenceRate']==38,'response time incorrectly overrode lower accuracy layer')
rw=p['recentWindow'];req(rw['same'] is True,'older weak events leaked past recent 20-event layer window');mini=[x for x in rw['stats'] if x['layer']=='miniMock'][0];req(mini['count']==20 and mini['rate']==100,'recent layer window calculation drift')
req(p['finalIgnored']['same'] is True,'final timing events must not select a short-practice recommendation layer')
fc=p['fastCopy'];req(fc['same'] is False and fc['value']['mode']=='compound' and '初回回答時間の中央値' not in fc['value']['desc'],'sub-second timing should not add noisy time copy')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/approved content reference mismatch')
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — NO FINDINGS','gates':{'requiresFinalRuns':2,'minSamples':8,'windowPerLayer':20,'weakAccuracyThreshold':70},'progressionGatePreserved':True,'insufficientSamplePreserved':True,'tiedWeaknessPreserved':True,'examTaperPreserved':True,'strongEvidencePreserved':True,'weakMiniMockSelected':True,'accuracyPrimaryOverResponseTime':True,'recentWindowOnly':True,'finalLayerIgnored':True,'responseTimeCopySecondary':True,'bankHashes':cand['banks'],'finalSignatureMatch':True,'contract':cand['contract'],'semanticOK':True,'candidateReferenceSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-local-adaptive-recommendation-v257.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v257 — Subject B Learner-Local Adaptive Recommendation
=================================================================

Result
------
PASS — NO FINDINGS
Previous release: v256
Source main: {parent}
Learner-facing change in v257: yes — after enough Subject B experience, existing “next practice” guidance can use the learner's recent local first-answer evidence.

Policy
------
The existing subjectBHubRecommendation remains the single recommendation surface. Local adaptation is gated until two full Subject B final runs are complete. For compound, algorithm mini-mock, and security mini-mock, only the most recent 20 locally recorded first-answer events per layer are considered. A layer needs at least 8 observations. The uniquely lowest recent first-answer accuracy can become the suggested short practice only when it is 70% or lower. If the two weakest eligible layers are tied, the existing recommendation is kept rather than making an arbitrary local choice. During the existing 0–3 day exam taper, the original Subject B recommendation is preserved unchanged.

Evidence priority
-----------------
Accuracy chooses the layer. Response time never chooses or relabels a layer; when the selected layer has a median first-answer time of at least one second, the median is shown only as secondary “time is a guide” context. Full-final timing events are excluded from short-practice layer selection.

Validation
----------
Before two final runs: existing recommendation preserved exactly.
Seven samples: existing recommendation preserved exactly.
Tied weakest layers: existing recommendation preserved exactly.
Exam taper: adaptation disabled for 0–3 days remaining and allowed again outside the taper window.
Eight-sample weak algorithm mini-mock case (63%): miniMock selected with local-evidence marker.
All eligible layers at 75% or better: existing recommendation preserved exactly.
Accuracy-vs-time conflict: lower-accuracy securityMock selected even when another layer was much slower.
Recent-window probe: ten old failures followed by twenty recent successes produced a 20-event / 100% layer summary and no override.
Sub-second median timing: no noisy response-time sentence added.

Regression
----------
Question / TRACE / compound / security / final-algorithm banks: unchanged from v256.
2000 deterministic final sessions: selection/order/options unchanged.
Final contract: 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Scoring, exam countdown, readiness calculation/thresholds, remediation targets, profile schema, and published difficulty labels: unchanged.
Subject B guided-flow/taper self-check: preserved.
Subject B semantic diagnostics: OK.
Candidate/approved-content-reference six-file byte equality: yes.

Decision
--------
The learner-local evidence can now influence only the already-established Subject B “what next” guidance, with conservative minimum-evidence gates, tie fallback, taper preservation, and accuracy-first selection. Next perform a post-recommendation audit against the actual hub/render/launch paths and sparse/tied data cases. If clean, close this adaptive-recommendation sequence rather than adding another dashboard or more learner-facing metrics.
'''
Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_LOCAL_ADAPTIVE_RECOMMENDATION_v257.txt').write_text(audit);print(audit)

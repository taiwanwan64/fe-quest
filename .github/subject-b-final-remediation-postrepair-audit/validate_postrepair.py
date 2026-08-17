from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-final-remediation-postrepair-audit-(v(\d+))',branch)
    req(m,'bad Subject B final remediation post-repair audit branch')
    version=m.group(1)
    return version,f'v{int(m.group(2))-1}'


def runtime(path, do_interaction):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function selectionSignature(n){
  let h=2166136261>>>0;
  for(let i=0;i<n;i++){
    profile.bFinalStats={};
    Math.random=seedRand((0x218000+i)>>>0);
    const a=buildBFinal();
    h=hashText(h,a.map(x=>`${x.kind}:${x.sourceId}`).join('|'));
  }
  return h>>>0;
}
function remediationCoverage(){
  Math.random=seedRand(0x218100);
  const ex=new Set(B_EXERCISES.map(x=>x.id));
  const secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam);
  const sec=SECURITY_SCENARIOS.map(makeFinalSecurity);
  const algoBad=algo.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).map(x=>x.sourceId);
  const secBad=sec.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).map(x=>x.sourceId);
  return {algorithm:algo.length,security:sec.length,algoBad,secBad};
}
function makeAttempt(correct,blank,seed){
  profile.bFinalStats={};
  Math.random=seedRand(seed>>>0);
  const items=buildBFinal();
  const details=items.map((x,i)=>{
    const ok=i<correct;
    const isBlank=!ok&&i>=B_FINAL_COUNT-blank;
    return {
      sourceId:x.sourceId,kind:x.kind,format:bFinalFormatOf(x),
      domain:x.kind==='security'?(x.concept||'情報セキュリティ'):(x.domain||'擬似言語'),
      title:x.title,q:x.q,selected:isBlank?null:(ok?x.correctText:x.options[(x.a+1)%4]),
      correct:x.correctText,ok,explain:x.explain,studyMode:x.studyMode
    };
  });
  profile.bFinalMistakeStats={};
  details.filter(d=>!d.ok).forEach(d=>{
    const key=bFinalMistakeKey(d);
    profile.bFinalMistakeStats[key]={count:1,last:'2026-08-17',lastReason:null,reasons:{}};
  });
  return {date:'2026-08-17',total:B_FINAL_COUNT,correct,blank,points:correct*50,rate:Math.round(correct/B_FINAL_COUNT*100),seconds:600,timeUp:false,algoCorrect:Math.min(correct,B_FINAL_ALGO_COUNT),secCorrect:Math.max(0,correct-B_FINAL_ALGO_COUNT),details};
}
function makeNode(id=''){
  return {
    id,textContent:'',innerHTML:'',className:'',hidden:false,open:false,value:'',dataset:{},attrs:{},listeners:{},style:{},
    classList:{add(){},remove(){},toggle(){return false},contains(){return false}},
    setAttribute(k,v){this.attrs[k]=String(v);},getAttribute(k){return this.attrs[k]??null;},
    addEventListener(t,fn){this.listeners[t]=fn;},focus(){this.focused=true;},scrollIntoView(){this.scrolled=true;}
  };
}
function interactionProbe(){
  const state={button:null,insertions:0,beforeForward:false,focusCount:0,scrollCount:0};
  const nodes=new Map();
  const forward=makeNode('bFinalBackMenu');forward.className='primary';
  const detail=makeNode('');detail.open=true;
  const firstWrong=makeNode('firstWrong');
  firstWrong.focus=()=>{firstWrong.focused=true;state.focusCount++;};
  firstWrong.scrollIntoView=()=>{firstWrong.scrolled=true;state.scrollCount++;};
  const actions=makeNode('actions');
  actions.firstChild=forward;
  actions.insertBefore=(node,before)=>{state.button=node;state.insertions++;state.beforeForward=before===forward;};
  const result=makeNode('bFinalResult');
  result.querySelector=(sel)=>{
    if(sel==='.bmock-result-actions')return actions;
    if(sel==='details.result-detail-fold')return detail;
    if(sel==='.bfinal-review-item.wrong')return firstWrong;
    return null;
  };
  const reasonBtn=makeNode('reason');
  const studyBtn=makeNode('study');
  const getNode=(id)=>{
    if(id==='bFinalResult')return result;
    if(id==='bFinalBackMenu')return forward;
    if(id==='bFinalRecoveryV217')return state.button;
    if(!nodes.has(id))nodes.set(id,makeNode(id));
    return nodes.get(id);
  };
  // Replace the proxy DOM from runtime_stub so querySelectorAll can return concrete
  // review controls and the real production onclick callbacks can be exercised.
  globalThis.document={
    getElementById:getNode,
    createElement:()=>makeNode('dynamic'),
    querySelectorAll:(sel)=>sel==='[data-bfreason]'?[reasonBtn]:sel==='[data-bfinalstudy]'?[studyBtn]:[],
    querySelector:()=>null,
    body:makeNode('body'),documentElement:makeNode('html'),activeElement:null,
    addEventListener(){},removeEventListener(){}
  };
  globalThis.requestAnimationFrame=(fn)=>{fn();return 1;};

  function prepareButtons(a){
    const d=a.details.find(x=>!x.ok);
    if(!d){reasonBtn.dataset={};studyBtn.dataset={};return null;}
    const key=bFinalMistakeKey(d);
    reasonBtn.dataset={bfkey:key,bfreason:'トレースミス'};
    studyBtn.dataset={bfinalstudy:d.studyMode,bfinalsource:d.sourceId,bfinaldomain:d.domain||''};
    return {detail:d,key};
  }
  function snapshot(){
    return {
      hidden:state.button?.hidden,label:state.button?.textContent,open:detail.open,
      aria:state.button?.attrs?.['aria-expanded']||null,controls:state.button?.attrs?.['aria-controls']||null,
      insertions:state.insertions,beforeForward:state.beforeForward,
      message:getNode('bFinalResultMessage').textContent
    };
  }

  const mixed=makeAttempt(17,1,0x218201);const first=prepareButtons(mixed);
  detail.open=true;renderBFinalResult(mixed,137);
  const mixedInitial=snapshot();
  state.button?.listeners?.click?.();
  const afterRecovery={...snapshot(),focused:firstWrong.focused===true,scrolled:firstWrong.scrolled===true,tabindex:firstWrong.attrs.tabindex||null};
  const beforeReasonMessage=getNode('bFinalResultMessage').textContent;
  reasonBtn.onclick?.();
  const afterReason={...snapshot(),lastReason:profile.bFinalMistakeStats[first.key]?.lastReason||null,messageBefore:beforeReasonMessage,messageAfter:getNode('bFinalResultMessage').textContent};

  const wrongOnly=makeAttempt(19,0,0x218202);prepareButtons(wrongOnly);renderBFinalResult(wrongOnly,50);const wrongOnlyState=snapshot();
  const blankOnly=makeAttempt(19,1,0x218203);prepareButtons(blankOnly);renderBFinalResult(blankOnly,50);const blankOnlyState=snapshot();
  const perfect=makeAttempt(20,0,0x218204);prepareButtons(perfect);renderBFinalResult(perfect,240);const perfectState=snapshot();

  return {mixedInitial,afterRecovery,afterReason,wrongOnly:wrongOnlyState,blankOnly:blankOnlyState,perfect:perfectState,focusCount:state.focusCount,scrollCount:state.scrollCount};
}
const interaction=%INTERACTION%?interactionProbe():null;
console.log('__V218__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,
  counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,
  pool:B_EXAM_ALGO_ITEMS.length,high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
  orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,
  repairSpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,
  sem:validateSubjectBSemantics(),selectionSig:selectionSignature(1000),coverage:remediationCoverage(),interaction
})).toString('base64'));
'''.replace('%INTERACTION%','true' if do_interaction else 'false')
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-5000:])
        m=re.search(r'__V218__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return html,json.loads(base64.b64decode(m.group(1)))


version,previous=ctx();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v218' and previous=='v217','v218 post-repair audit expects v217 parent')
source=Path('audits/SUBJECT_B_FINAL_REMEDIATION_REPAIR_v217.txt');req(source.exists(),'v217 remediation repair evidence missing')
st=source.read_text();req('PASS — v216 MEDIUM FINDING RESOLVED' in st and 'High: 0' in st and 'Medium: 0' in st and 'Low: 0' in st,'v217 repair evidence drift')

expected={'.github/subject-b-final-remediation-postrepair-audit/validate_postrepair.py','.github/workflows/subject-b-final-remediation-postrepair-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(changed==expected,'v218 audit-only source drift: '+repr(sorted(changed^expected)))

repair_path=Path('app/subject-b-final-remediation-overrides-v217.txt')
req(repair_path.read_bytes()==subprocess.check_output(['git','show',parent+':app/subject-b-final-remediation-overrides-v217.txt']),'v217 remediation repair source drift')

html,cand=runtime('_site/index.html',True);parent_html,par=runtime('_site_parent/index.html',False)
req(cand['v']==version and par['v']==previous,'runtime versions')
req(cand['counts']==par['counts']==[20,16,4],'final counts drift');req(cand['seconds']==par['seconds']==6000,'time limit drift')
req(cand['pool']==par['pool']==43,'algorithm pool drift');req(cand['high']==par['high'] and len(cand['high'])==15,'high-trace inventory drift');req(cand['floor']==par['floor']==4,'high-trace floor drift')
req(cand['orderSpec']==par['orderSpec'],'v214 order spec drift');req(cand['repairSpec']==par['repairSpec'],'v217 remediation spec drift')
req(cand['selectionSig']==par['selectionSig'],'1000-seed final selection/order signature drift')
req(cand['sem'].get('ok') is True,'Subject B semantic validation failed')

spec=cand['repairSpec'] or {}
req(spec.get('policy')=='surface-final-wrong-answer-recovery-entry','v217 policy missing')
req(spec.get('sourceAudit')=='v216-final_wrong_answer_recovery_visibility','v217 source finding link drift')
req(spec.get('keepsForwardActionPrimary') is True and spec.get('keepsFullReviewCollapsible') is True and spec.get('recoveryEntryOnlyWhenNeeded') is True and spec.get('blankAnswersIncluded') is True,'v217 repair scope drift')

cov=cand['coverage'];req(cov['algorithm']==43 and not cov['algoBad'],'algorithm remediation coverage drift: '+repr(cov['algoBad'][:3]));req(cov['security']==15 and not cov['secBad'],'security remediation coverage drift: '+repr(cov['secBad'][:3]))

for token in [
 'id="bFinalBackMenu">次の科目Bへ →</button>',
 "document.getElementById('bFinalBackMenu')?.addEventListener('click',continueSubjectBFlow)",
 '詳しい結果・全20問レビューを見る','data-bfreason=','data-bfinalstudy=',
 '誤答を復習する','誤答・未回答を復習する','id=\'bFinalRecoveryV217\'',
 "btn.className='secondary'"
]: req(token in html,'post-repair integration token missing: '+token)
req('<details class="result-detail-fold" open' not in html,'full final review unexpectedly open in static markup')

p=cand['interaction'];req(p is not None,'v218 interaction probe missing')
mi=p['mixedInitial'];req(mi['hidden'] is False and mi['label']=='誤答・未回答を復習する（3問）','mixed-attempt recovery entry label/visibility');req(mi['open'] is False and mi['aria']=='false','new mixed attempt should start collapsed');req(mi['controls']=='bFinalReviewDetailV217','recovery aria-controls drift');req(mi['insertions']==1 and mi['beforeForward'] is True,'recovery placement or duplication drift')
ar=p['afterRecovery'];req(ar['open'] is True and ar['aria']=='true' and ar['focused'] is True and ar['scrolled'] is True and ar['tabindex']=='-1','recovery click focus/open behavior drift')
rr=p['afterReason'];req(rr['open'] is True and rr['aria']=='true' and rr['insertions']==1,'reason rerender should preserve open state without duplicate entry');req(rr['lastReason']=='トレースミス','reason classification persistence failed')
wo=p['wrongOnly'];req(wo['hidden'] is False and wo['label']=='誤答を復習する（1問）' and wo['open'] is False,'wrong-only recovery state drift')
bo=p['blankOnly'];req(bo['hidden'] is False and bo['label']=='誤答・未回答を復習する（1問）' and bo['open'] is False,'blank-only recovery state drift')
pf=p['perfect'];req(pf['hidden'] is True and pf['open'] is False and pf['aria']=='false' and pf['insertions']==1,'perfect-attempt recovery state drift')
req(p['focusCount']==1 and p['scrollCount']==1,'recovery focus/scroll should occur exactly once in probe')

req('renderBFinalResult(a,0);' in html,'reason-chip rerender contract changed; reassess XP finding')
req('+137 XP' in rr['messageBefore'],'probe did not establish non-zero earned XP message: '+repr(rr['messageBefore']))
req('+0 XP' in rr['messageAfter'],'expected visible XP rerender defect not reproduced: '+repr(rr['messageAfter']))

files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/reference six-file mismatch')

low={
 'id':'final_recovery_xp_message_rerender','severity':'Low',
 'observation':'After the learner selects a wrong-answer diagnosis reason, the existing reason-chip callback rerenders renderBFinalResult(a,0). The result message therefore changes from the already-earned XP amount to +0 XP even though the attempt score and persisted XP award are not undone.',
 'learner_risk':'This is display-only, but it can make the newly promoted recovery interaction look as if the learner lost the XP they just earned and weakens trust in the result screen.',
 'recommended_repair':'Preserve the original earned-XP display value across same-attempt result rerenders. Keep reason persistence, review-open state, scoring and profile XP logic unchanged.'
}
fixture={
 'name':f'subject-b-final-remediation-postrepair-audit-{version}','version':version,'previous_version':previous,'parent_main_sha':parent,'learner_facing_change':False,
 'scope':'post-v217 wrong-answer recovery entry interaction, reason persistence, visibility states and result-message stability',
 'runtime_preservation':{'final_counts':cand['counts'],'time_limit_seconds':cand['seconds'],'algorithm_pool':cand['pool'],'high_trace_count':len(cand['high']),'high_trace_floor':cand['floor'],'v214_order_spec_unchanged':True,'v217_repair_spec_unchanged':True,'selection_signature_1000_seeds_unchanged':True,'semantic_validator_ok':True},
 'remediation_coverage':cov,'interaction_probe':p,'candidate_reference_six_file_equal':True,
 'findings':{'high':[],'medium':[],'low':[low]},'status':'passed-with-low-finding'
}
Path(f'_regression/subject-b-final-remediation-postrepair-audit-{version}.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
Path(f'audits/SUBJECT_B_FINAL_REMEDIATION_POSTREPAIR_AUDIT_{version}.txt').write_text(f'''FE QUEST {version} — Subject B Final-Practice Remediation Post-Repair Audit
================================================================================

Result
------
PASS — LOW FINDING RECORDED
Previous: {previous}
Source main: {parent}
Learner-facing change in {version}: none

Scope
-----
Audit the v217 result-screen recovery entry as an end-to-end learner interaction after the targeted visibility repair. This is an FE QUEST UX/integration audit, not an assertion about an official IPA review-flow requirement.

Recovery-entry interaction
--------------------------
Mixed attempt (17 correct / 1 blank): visible 「誤答・未回答を復習する（3問）」 entry, inserted once before the primary continuation action.
Wrong-only attempt (19 correct): visible 「誤答を復習する（1問）」 entry.
Blank-only attempt (19 correct / 1 blank): visible 「誤答・未回答を復習する（1問）」 entry.
Perfect 20/20 attempt: recovery entry hidden.
Each new attempt starts with the full 20-question review collapsed.

Recovery click / diagnosis proof
--------------------------------
Recovery click opens the detailed review, sets aria-expanded=true, focuses the first item needing review and scrolls to it.
Selecting 「トレースミス」 persists the reason in bFinalMistakeStats.
The same-attempt rerender keeps the detailed review open, preserves aria-expanded=true and does not duplicate the recovery entry.
The existing 「次の科目Bへ →」 binding remains connected to continueSubjectBFlow.

Preserved remediation / exam contracts
---------------------------------------
Algorithm remediation targets valid: {cov['algorithm']} / {cov['algorithm']}.
Security remediation targets valid: {cov['security']} / {cov['security']}.
1000 deterministic final-session seeds produced the same selection/order signature as v217.
100 minutes / 20 questions; algorithm 16 + security 4; v214 order policy; algorithm pool 43; high-trace inventory 15 / floor 4 are unchanged.
Subject B semantic validation: OK.
Candidate/reference generated six release files byte-identical: yes.

Finding
-------
Low — final_recovery_xp_message_rerender
The promoted recovery path exposes a small pre-existing display defect: after a diagnosis reason is selected, the reason-chip callback rerenders the result with earned=0. In the interaction probe, the visible result message changed from a non-zero earned-XP value to 「+0 XP」. The attempt result and stored XP are not rolled back; this is a message-consistency problem rather than a scoring/data problem.

Recommended repair
------------------
In v219, preserve the original earned-XP display value when the same final-practice attempt is rerendered after reason selection. Do not alter the score, persisted XP, reason-history data, remediation targets, or the v217 recovery-entry behavior.

Findings summary
----------------
High: 0
Medium: 0
Low: 1 — final_recovery_xp_message_rerender

Decision
--------
Publish {version} as audit-only. The v217 visibility repair is functionally successful. Use v219 for the narrow display-consistency repair, followed by a short post-repair check before moving to the next Subject B learning-quality frontier.
''')
print(f'FEQUEST_SUBJECT_B_FINAL_REMEDIATION_POSTREPAIR_AUDIT version={version} algo={cov["algorithm"]} security={cov["security"]} low=1 status=passed')

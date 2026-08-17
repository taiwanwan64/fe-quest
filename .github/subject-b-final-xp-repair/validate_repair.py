from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-final-xp-repair-(v(\d+))',branch)
    req(m,'bad Subject B final XP repair branch')
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
    profile.bFinalStats={};Math.random=seedRand((0x219000+i)>>>0);
    const a=buildBFinal();h=hashText(h,a.map(x=>`${x.kind}:${x.sourceId}`).join('|'));
  }
  return h>>>0;
}
function remediationCoverage(){
  Math.random=seedRand(0x219100);
  const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),sec=SECURITY_SCENARIOS.map(makeFinalSecurity);
  const algoBad=algo.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).map(x=>x.sourceId);
  const secBad=sec.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).map(x=>x.sourceId);
  return {algorithm:algo.length,security:sec.length,algoBad,secBad};
}
function makeAttempt(correct,blank,seed){
  profile.bFinalStats={};Math.random=seedRand(seed>>>0);const items=buildBFinal();
  const details=items.map((x,i)=>{const ok=i<correct;const isBlank=!ok&&i>=B_FINAL_COUNT-blank;return {sourceId:x.sourceId,kind:x.kind,format:bFinalFormatOf(x),domain:x.kind==='security'?(x.concept||'情報セキュリティ'):(x.domain||'擬似言語'),title:x.title,q:x.q,selected:isBlank?null:(ok?x.correctText:x.options[(x.a+1)%4]),correct:x.correctText,ok,explain:x.explain,studyMode:x.studyMode};});
  profile.bFinalMistakeStats={};details.filter(d=>!d.ok).forEach(d=>{const key=bFinalMistakeKey(d);profile.bFinalMistakeStats[key]={count:1,last:'2026-08-17',lastReason:null,reasons:{}};});
  return {date:'2026-08-17',total:B_FINAL_COUNT,correct,blank,points:correct*50,rate:Math.round(correct/B_FINAL_COUNT*100),seconds:600,timeUp:false,algoCorrect:Math.min(correct,B_FINAL_ALGO_COUNT),secCorrect:Math.max(0,correct-B_FINAL_ALGO_COUNT),details};
}
function makeNode(id=''){
  return {id,textContent:'',innerHTML:'',className:'',hidden:false,open:false,value:'',dataset:{},attrs:{},listeners:{},style:{},
    classList:{add(){},remove(){},toggle(){return false},contains(){return false}},
    setAttribute(k,v){this.attrs[k]=String(v);},getAttribute(k){return this.attrs[k]??null;},
    addEventListener(t,fn){this.listeners[t]=fn;},focus(){this.focused=true;},scrollIntoView(){this.scrolled=true;}};
}
function interactionProbe(){
  const state={button:null,insertions:0};
  const nodes=new Map();
  const forward=makeNode('bFinalBackMenu');forward.className='primary';
  const detail=makeNode('');detail.open=true;
  const firstWrong=makeNode('firstWrong');
  const actions=makeNode('actions');actions.firstChild=forward;actions.insertBefore=(node,before)=>{state.button=node;state.insertions++;};
  const result=makeNode('bFinalResult');result.querySelector=(sel)=>sel==='.bmock-result-actions'?actions:sel==='details.result-detail-fold'?detail:sel==='.bfinal-review-item.wrong'?firstWrong:null;
  const reasonBtn=makeNode('reason');
  const getNode=(id)=>{if(id==='bFinalResult')return result;if(id==='bFinalBackMenu')return forward;if(id==='bFinalRecoveryV217')return state.button;if(!nodes.has(id))nodes.set(id,makeNode(id));return nodes.get(id);};
  document.getElementById=getNode;document.createElement=()=>makeNode('dynamic');document.querySelectorAll=(sel)=>sel==='[data-bfreason]'?[reasonBtn]:[];globalThis.requestAnimationFrame=(fn)=>{fn();return 1;};
  saveProfile=()=>true;
  function prepareReason(a){const d=a.details.find(x=>!x.ok);if(!d){reasonBtn.dataset={};return null;}const key=bFinalMistakeKey(d);reasonBtn.dataset={bfkey:key,bfreason:'トレースミス'};return {d,key};}
  function snap(){return {message:getNode('bFinalResultMessage').textContent,open:detail.open,aria:state.button?.attrs?.['aria-expanded']||null,insertions:state.insertions};}

  const mixed=makeAttempt(17,1,0x219201);const first=prepareReason(mixed);renderBFinalResult(mixed,137);state.button?.listeners?.click?.();const beforeReason=snap();reasonBtn.onclick?.();const afterReason={...snap(),lastReason:profile.bFinalMistakeStats[first.key]?.lastReason||null};
  const sameExplicitBefore=getNode('bFinalResultMessage').textContent;renderBFinalResult(mixed,0);const sameExplicitAfter=getNode('bFinalResultMessage').textContent;
  const next=makeAttempt(19,0,0x219202);prepareReason(next);renderBFinalResult(next,50);const nextState=snap();
  const zero=makeAttempt(19,0,0x219203);prepareReason(zero);renderBFinalResult(zero,0);const zeroState=snap();
  const perfect=makeAttempt(20,0,0x219204);renderBFinalResult(perfect,240);const perfectState=snap();
  return {beforeReason,afterReason,sameExplicitBefore,sameExplicitAfter,next:nextState,zero:zeroState,perfect:perfectState};
}
const interaction=%INTERACTION%?interactionProbe():null;
console.log('__V219__'+Buffer.from(JSON.stringify({v:APP_VERSION,counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,pool:B_EXAM_ALGO_ITEMS.length,high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,recoverySpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,xpSpec:globalThis.SUBJECT_B_FINAL_XP_V219_SPEC||null,sem:validateSubjectBSemantics(),selectionSig:selectionSignature(500),coverage:remediationCoverage(),interaction})).toString('base64'));
'''.replace('%INTERACTION%','true' if do_interaction else 'false')
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-5000:])
        m=re.search(r'__V219__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return html,json.loads(base64.b64decode(m.group(1)))


version,previous=ctx();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v219' and previous=='v218','v219 repair expects v218 parent')
manifest_path=Path(f'_release/content-change-{version}.json');req(manifest_path.exists(),'v219 content manifest missing')
mf=json.loads(manifest_path.read_text());req(mf.get('schema_version')==1,'manifest schema');req(mf.get('release')==version and mf.get('previous_release')==previous,'manifest release context');req(mf.get('parent_main_sha')==parent,'manifest parent mismatch');req(mf.get('change_type')=='subject-b-final-xp-message-repair','manifest change type');req(mf.get('source_priority_tier')=='low' and mf.get('quality_audit_marker')=='final_recovery_xp_message_rerender','manifest audit link');req(mf.get('allowed_question_ids')==[],'v219 must not change question content')
source=Path(mf.get('source_quality_audit',''));req(source.exists(),'v218 post-repair audit missing');st=source.read_text();req('Low — final_recovery_xp_message_rerender' in st and 'Low: 1 — final_recovery_xp_message_rerender' in st and 'In v219' in st,'v218 source finding evidence drift')

tooling={'.github/subject-b-final-xp-repair/validate_repair.py','.github/workflows/subject-b-final-xp-repair.yml'}
expected=set(mf.get('content_files',[]))|set(mf.get('assembly_files',[]))|{manifest_path.as_posix()}|tooling
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'v219 repair source drift: '+repr(sorted(changed^expected)))

override=Path('app/subject-b-final-xp-overrides-v219.txt').read_text()
for token in ['preserve-final-earned-xp-message-on-same-attempt-rerender','v218-final_recovery_xp_message_rerender','__bFinalEarnedDisplayV219=new WeakMap()','__renderBFinalResultBeforeV219=renderBFinalResult','displayOnly:true']:
    req(token in override,'v219 override token missing: '+token)
for forbidden in ['buildBFinal=function','finishBFinal=function','bFinalRemediationTarget=function','profile.xp=']:
    req(forbidden not in override,'v219 scope expanded into '+forbidden)
assembler=Path('index.html').read_text();req('subject-b-final-xp-overrides-v219.txt' in assembler and '{{ subjectBFinalRemediationV217 }}{{ subjectBFinalXpV219 }}function validateSubjectBSemantics(){' in assembler,'v219 production assembly missing or wrong order')
req(Path('.github/content-release/prepare_reference.py').read_bytes()==subprocess.check_output(['git','show',parent+':.github/content-release/prepare_reference.py']),'content reference tooling drift')

html,cand=runtime('_site/index.html',True);parent_html,par=runtime('_site_parent/index.html',True)
req(cand['v']==version and par['v']==previous,'runtime versions');req(cand['counts']==par['counts']==[20,16,4],'final counts drift');req(cand['seconds']==par['seconds']==6000,'time limit drift');req(cand['pool']==par['pool']==43,'algorithm pool drift');req(cand['high']==par['high'] and len(cand['high'])==15,'high-trace inventory drift');req(cand['floor']==par['floor']==4,'high-trace floor drift');req(cand['orderSpec']==par['orderSpec'],'v214 order spec drift');req(cand['recoverySpec']==par['recoverySpec'],'v217 recovery spec drift');req(cand['selectionSig']==par['selectionSig'],'500-seed final selection/order signature drift');req(cand['sem'].get('ok') is True,'Subject B semantic validation failed')
req(par['xpSpec'] is None,'v219 XP repair unexpectedly present in parent')
spec=cand['xpSpec'] or {};req(spec.get('policy')=='preserve-final-earned-xp-message-on-same-attempt-rerender','v219 policy');req(spec.get('sourceAudit')=='v218-final_recovery_xp_message_rerender','v218 finding link');req(spec.get('scoringChanged') is False and spec.get('persistedXpChanged') is False and spec.get('reasonHistoryChanged') is False and spec.get('remediationTargetsChanged') is False and spec.get('recoveryEntryChanged') is False and spec.get('displayOnly') is True,'v219 repair scope spec')

cov=cand['coverage'];req(cov['algorithm']==43 and not cov['algoBad'],'algorithm remediation coverage drift: '+repr(cov['algoBad'][:3]));req(cov['security']==15 and not cov['secBad'],'security remediation coverage drift: '+repr(cov['secBad'][:3]))

# Parent reproduces the audited display defect; candidate fixes only the message continuity.
pp=par['interaction'];cp=cand['interaction'];req(pp and cp,'interaction probe missing')
req('+137 XP' in pp['beforeReason']['message'] and '+0 XP' in pp['afterReason']['message'],'v218 parent no longer reproduces audited XP display defect')
req('+137 XP' in cp['beforeReason']['message'] and '+137 XP' in cp['afterReason']['message'],'v219 reason rerender did not preserve earned XP message')
req(cp['afterReason']['lastReason']=='トレースミス','reason classification persistence drift')
req(cp['afterReason']['open'] is True and cp['afterReason']['aria']=='true' and cp['afterReason']['insertions']==1,'v217 recovery disclosure state drift after reason rerender')
req('+137 XP' in cp['sameExplicitBefore'] and '+137 XP' in cp['sameExplicitAfter'],'same-attempt explicit zero rerender lost earned XP message')
req('+50 XP' in cp['next']['message'],'new attempt did not use its own earned XP');req('+0 XP' in cp['zero']['message'],'zero-earned attempt inherited stale XP');req('+240 XP' in cp['perfect']['message'],'perfect new attempt XP display drift')
req('renderBFinalResult(a,0);' in html,'existing reason callback changed unexpectedly; v219 should intercept display rerender without changing reason logic')

files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/reference six-file mismatch')

fixture={'name':f'subject-b-final-xp-repair-{version}','version':version,'previous_version':previous,'parent_main_sha':parent,'learner_facing_change':True,'resolved_finding':'final_recovery_xp_message_rerender','repair_spec':spec,'interaction':{'parent_before_reason':pp['beforeReason'],'parent_after_reason':pp['afterReason'],'candidate_before_reason':cp['beforeReason'],'candidate_after_reason':cp['afterReason'],'same_attempt_explicit_zero':cp['sameExplicitAfter'],'new_attempt':cp['next'],'zero_earned_attempt':cp['zero'],'perfect_attempt':cp['perfect']},'runtime_preservation':{'final_counts':cand['counts'],'time_limit_seconds':cand['seconds'],'algorithm_pool':cand['pool'],'high_trace_count':len(cand['high']),'high_trace_floor':cand['floor'],'v214_order_spec_unchanged':True,'v217_recovery_spec_unchanged':True,'selection_signature_500_seeds_unchanged':True,'semantic_validator_ok':True},'remediation_coverage':cov,'candidate_reference_six_file_equal':True,'findings':{'high':[],'medium':[],'low':[]},'status':'passed-resolved-low'}
Path(f'_regression/subject-b-final-xp-repair-{version}.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
Path(f'audits/SUBJECT_B_FINAL_XP_REPAIR_{version}.txt').write_text(f'''FE QUEST {version} — Subject B Final-Practice XP Message Consistency Repair
================================================================================

Result
------
PASS — v218 LOW FINDING RESOLVED
Previous: {previous}
Source main: {parent}
Learner-facing change in {version}: yes
Resolved finding: final_recovery_xp_message_rerender

Repair
------
The earned-XP value first shown for a final-practice attempt is now retained for later rerenders of that same attempt, including rerenders triggered by choosing an error reason.
The repair is display-only. It does not add XP again and does not modify scoring, persisted XP, reason-history data, remediation targets, or the v217 recovery entry.

Interaction proof
-----------------
Parent v218: the probe reproduced the audited message change from +137 XP to +0 XP after selecting 「トレースミス」.
Candidate v219: the same interaction remained +137 XP before and after reason selection.
The selected reason still persisted as 「トレースミス」.
The detailed review remained open with aria-expanded=true and the recovery entry was still inserted only once.
A new attempt with 50 earned XP displayed +50 XP rather than inheriting +137 XP.
A zero-earned new attempt displayed +0 XP.
A perfect new attempt with 240 earned XP displayed +240 XP.

Preserved remediation / exam contracts
---------------------------------------
Algorithm remediation targets valid: {cov['algorithm']} / {cov['algorithm']}.
Security remediation targets valid: {cov['security']} / {cov['security']}.
500 deterministic final-session seeds produced the same selection/order signature as v218.
100 minutes / 20 questions; algorithm 16 + security 4; v214 order policy; v217 recovery-entry policy; algorithm pool 43; high-trace inventory 15 / floor 4 are unchanged.
Subject B semantic validation: OK.
Candidate/reference generated six release files byte-identical: yes.

Findings summary
----------------
High: 0
Medium: 0
Low: 0

Decision
--------
Accept the narrow XP-message consistency repair. Use the next release for a short post-repair check, then move beyond this result-screen path unless that check finds a new learner-impacting issue.
''')
print('FEQUEST_SUBJECT_B_FINAL_XP_REPAIR_OK',json.dumps({'version':version,'resolved':'final_recovery_xp_message_rerender','candidate_after_reason':cp['afterReason']['message'],'parent_after_reason':pp['afterReason']['message'],'selectionSig':cand['selectionSig']},ensure_ascii=False))

from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-final-remediation-repair-(v(\d+))',branch)
    req(m,'bad Subject B final remediation repair branch')
    v=m.group(1)
    return v,f'v{int(m.group(2))-1}'


def runtime(path, do_interaction):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function selectionSignature(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x217000+i)>>>0);const a=buildBFinal();h=hashText(h,a.map(x=>`${x.kind}:${x.sourceId}`).join('|'));}return h>>>0;}
function remediationCoverage(){
  Math.random=seedRand(0x217100);
  const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),sec=SECURITY_SCENARIOS.map(makeFinalSecurity);
  const algoBad=algo.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).map(x=>x.sourceId);
  const secBad=sec.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).map(x=>x.sourceId);
  return {algorithm:algo.length,security:sec.length,algoBad,secBad};
}
function makeAttempt(correct,blank){
  profile.bFinalStats={};Math.random=seedRand(0x217200+correct+blank);const items=buildBFinal();
  const details=items.map((x,i)=>{const ok=i<correct;const isBlank=!ok&&i>=B_FINAL_COUNT-blank;return {sourceId:x.sourceId,kind:x.kind,format:bFinalFormatOf(x),domain:x.kind==='security'?(x.concept||'情報セキュリティ'):(x.domain||'擬似言語'),title:x.title,q:x.q,selected:isBlank?null:(ok?x.correctText:x.options[(x.a+1)%4]),correct:x.correctText,ok,explain:x.explain,studyMode:x.studyMode};});
  return {date:'2026-08-17',total:B_FINAL_COUNT,correct,blank,points:correct*50,rate:Math.round(correct/B_FINAL_COUNT*100),seconds:600,algoCorrect:Math.min(correct,B_FINAL_ALGO_COUNT),secCorrect:Math.max(0,correct-B_FINAL_ALGO_COUNT),details};
}
function interactionProbe(){
  if(!globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC)return null;
  const state={button:null,insertions:0,beforeForward:false};
  const forward={id:'bFinalBackMenu'};
  const detail={id:'',open:true};
  const firstWrong={focused:false,scrolled:false,attrs:{},setAttribute(k,v){this.attrs[k]=String(v);},focus(){this.focused=true;},scrollIntoView(){this.scrolled=true;}};
  const actions={firstChild:null,insertBefore(node,before){state.button=node;state.insertions++;state.beforeForward=before===forward;}};
  const result={querySelector(sel){if(sel==='.bmock-result-actions')return actions;if(sel==='details.result-detail-fold')return detail;if(sel==='.bfinal-review-item.wrong')return firstWrong;return null;}};
  function makeButton(){return {type:'',id:'',className:'',hidden:false,textContent:'',attrs:{},clickHandler:null,setAttribute(k,v){this.attrs[k]=String(v);},addEventListener(t,fn){if(t==='click')this.clickHandler=fn;}};}
  document.getElementById=(id)=>{if(id==='bFinalResult')return result;if(id==='bFinalBackMenu')return forward;if(id==='bFinalRecoveryV217')return state.button;return dummy();};
  document.createElement=()=>makeButton();document.querySelectorAll=()=>[];globalThis.requestAnimationFrame=(fn)=>{fn();return 1;};

  const imperfect=makeAttempt(18,1);detail.open=true;renderBFinalResult(imperfect,0);
  const initial={hidden:state.button?.hidden,label:state.button?.textContent,closed:detail.open===false,aria:state.button?.attrs?.['aria-expanded'],controls:state.button?.attrs?.['aria-controls'],insertions:state.insertions,beforeForward:state.beforeForward};
  state.button?.clickHandler?.();
  const clicked={open:detail.open,aria:state.button?.attrs?.['aria-expanded'],focused:firstWrong.focused,scrolled:firstWrong.scrolled};
  renderBFinalResult(imperfect,0);
  const sameAttempt={open:detail.open,aria:state.button?.attrs?.['aria-expanded'],insertions:state.insertions};
  const perfect=makeAttempt(20,0);renderBFinalResult(perfect,0);
  const perfectState={hidden:state.button?.hidden,closed:detail.open===false,label:state.button?.textContent,aria:state.button?.attrs?.['aria-expanded'],insertions:state.insertions};
  return {initial,clicked,sameAttempt,perfect:perfectState};
}
const interaction=%INTERACTION%?interactionProbe():null;
console.log('__V217__'+Buffer.from(JSON.stringify({v:APP_VERSION,counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],pool:B_EXAM_ALGO_ITEMS.length,high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,repairSpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,sem:validateSubjectBSemantics(),selectionSig:selectionSignature(500),coverage:remediationCoverage(),interaction})).toString('base64'));
'''.replace('%INTERACTION%','true' if do_interaction else 'false')
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-5000:])
        m=re.search(r'__V217__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return html,json.loads(base64.b64decode(m.group(1)))


version,previous=ctx();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v217' and previous=='v216','v217 repair expects v216 parent')
manifest_path=Path(f'_release/content-change-{version}.json');req(manifest_path.exists(),'v217 content manifest missing')
mf=json.loads(manifest_path.read_text());req(mf.get('schema_version')==1,'manifest schema');req(mf.get('release')==version and mf.get('previous_release')==previous,'manifest release context');req(mf.get('parent_main_sha')==parent,'manifest parent mismatch');req(mf.get('change_type')=='subject-b-final-remediation-visibility-repair','manifest change type');req(mf.get('source_priority_tier')=='medium' and mf.get('quality_audit_marker')=='final_wrong_answer_recovery_visibility','manifest audit link');req(mf.get('allowed_question_ids')==[],'v217 must not change question content')
source=Path(mf.get('source_quality_audit',''));req(source.exists(),'v216 remediation audit missing')
st=source.read_text();req('final_wrong_answer_recovery_visibility' in st and 'Medium: 1' in st and 'Use v217' in st,'v216 source finding evidence drift')

tooling={
 '.github/subject-b-final-remediation-repair/validate_repair.py',
 '.github/workflows/subject-b-final-remediation-repair.yml'
}
expected=set(mf.get('content_files',[]))|set(mf.get('assembly_files',[]))|{manifest_path.as_posix()}|tooling
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(changed==expected,'v217 repair source drift: '+repr(sorted(changed^expected)))

override=Path('app/subject-b-final-remediation-overrides-v217.txt').read_text()
for token in ['surface-final-wrong-answer-recovery-entry','v216-final_wrong_answer_recovery_visibility','bFinalRecoveryV217','誤答を復習する','誤答・未回答を復習する','__renderBFinalResultBeforeV217=renderBFinalResult']:
    req(token in override,'v217 override token missing: '+token)
for forbidden in ['buildBFinal=function','finishBFinal=function','bFinalRemediationTarget=function']:
    req(forbidden not in override,'v217 scope expanded into '+forbidden)
assembler=Path('index.html').read_text();req('subject-b-final-remediation-overrides-v217.txt' in assembler and '{{ subjectBFinalRemediationV217 }}function validateSubjectBSemantics(){' in assembler,'v217 production assembly missing')
req(Path('.github/content-release/prepare_reference.py').read_bytes()==subprocess.check_output(['git','show',parent+':.github/content-release/prepare_reference.py']),'content reference tooling drift')

html,cand=runtime('_site/index.html',True);parent_html,par=runtime('_site_parent/index.html',False)
req(cand['v']==version and par['v']==previous,'runtime versions')
req(cand['counts']==par['counts']==[20,16,4],'final counts drift');req(cand['pool']==par['pool']==43,'algorithm pool drift');req(cand['high']==par['high'] and len(cand['high'])==15,'high-trace inventory drift');req(cand['floor']==par['floor']==4,'high-trace floor drift');req(cand['orderSpec']==par['orderSpec'],'v214 order spec drift');req(cand['selectionSig']==par['selectionSig'],'500-seed final selection/order signature drift');req(cand['sem'].get('ok') is True,'Subject B semantic validation failed')
req(par['repairSpec'] is None,'v217 repair unexpectedly present in parent')
spec=cand['repairSpec'] or {};req(spec.get('policy')=='surface-final-wrong-answer-recovery-entry','v217 policy');req(spec.get('sourceAudit')=='v216-final_wrong_answer_recovery_visibility','v216 finding link');req(spec.get('keepsForwardActionPrimary') is True and spec.get('keepsFullReviewCollapsible') is True and spec.get('recoveryEntryOnlyWhenNeeded') is True and spec.get('blankAnswersIncluded') is True,'v217 scope spec')

cov=cand['coverage'];req(cov['algorithm']==43 and not cov['algoBad'],'algorithm remediation coverage drift: '+repr(cov['algoBad'][:3]));req(cov['security']==15 and not cov['secBad'],'security remediation coverage drift: '+repr(cov['secBad'][:3]))

# Existing result hierarchy remains: primary forward action plus a closed-by-default detailed review.
result_markup=re.search(r'<div class="bmock-result-actions">.*?<details class="result-detail-fold">.*?</details>',html,re.S);req(result_markup,'final result action/review markup missing')
seg=result_markup.group(0);req('id="bFinalBackMenu">次の科目Bへ →</button>' in seg,'primary continuation action drift');req('<details class="result-detail-fold">' in seg and '<details class="result-detail-fold" open' not in seg,'full review no longer collapsible by default')

p=cand['interaction'];req(p is not None,'v217 interaction probe missing')
i=p['initial'];req(i['hidden'] is False and i['label']=='誤答・未回答を復習する（2問）','imperfect-attempt recovery entry visibility/label');req(i['closed'] is True and i['aria']=='false','new attempt should keep full review collapsed');req(i['controls']=='bFinalReviewDetailV217','recovery aria-controls');req(i['insertions']==1 and i['beforeForward'] is True,'recovery entry placement/duplication')
c=p['clicked'];req(c['open'] is True and c['aria']=='true' and c['focused'] is True and c['scrolled'] is True,'recovery click should open and move to first wrong item')
s=p['sameAttempt'];req(s['open'] is True and s['aria']=='true' and s['insertions']==1,'same-attempt rerender should preserve disclosure and avoid duplicate entry')
f=p['perfect'];req(f['hidden'] is True and f['closed'] is True and f['aria']=='false' and f['insertions']==1,'perfect-attempt recovery entry should be hidden and review collapsed')

files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/reference six-file mismatch')

fixture={
 'name':f'subject-b-final-remediation-repair-{version}','version':version,'previous_version':previous,'parent_main_sha':parent,'learner_facing_change':True,
 'resolved_finding':'final_wrong_answer_recovery_visibility',
 'repair':{'policy':spec,'imperfect_attempt_entry':i,'click_behavior':c,'same_attempt_rerender':s,'perfect_attempt':f},
 'runtime_preservation':{'final_counts':cand['counts'],'algorithm_pool':cand['pool'],'high_trace_count':len(cand['high']),'high_trace_floor':cand['floor'],'v214_order_spec_unchanged':True,'selection_signature_500_seeds_unchanged':True,'semantic_validator_ok':True},
 'remediation_coverage':cov,'candidate_reference_six_file_equal':True,'findings':{'high':[],'medium':[],'low':[]},'status':'passed-resolved-medium'
}
Path(f'_regression/subject-b-final-remediation-repair-{version}.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
Path(f'audits/SUBJECT_B_FINAL_REMEDIATION_REPAIR_{version}.txt').write_text(f'''FE QUEST {version} — Subject B Final-Practice Remediation Visibility Repair
============================================================================

Result
------
PASS — v216 MEDIUM FINDING RESOLVED
Previous: {previous}
Source main: {parent}
Learner-facing change in {version}: yes
Resolved finding: final_wrong_answer_recovery_visibility

Repair
------
When a final-practice attempt has wrong or blank answers, a concise secondary recovery entry is surfaced beside the result actions before the existing primary 「次の科目Bへ →」 action.
For an attempt with 18 correct and 1 blank, the visible label was 「誤答・未回答を復習する（2問）」.
For a perfect 20/20 attempt, the recovery entry remained hidden.
The existing forward action stays primary; the full 20-question review remains collapsible and closed at the start of each new attempt.

Interaction proof
-----------------
Recovery entry inserted once: yes.
Inserted before the forward action: yes.
New imperfect attempt keeps full review collapsed: yes.
Recovery click opens the review: yes.
Recovery click focuses and scrolls to the first item needing review: yes.
Same-attempt rerender preserves the open review and ARIA expanded state: yes.
New perfect attempt hides the recovery entry and collapses the review: yes.

Preserved remediation machinery
-------------------------------
Algorithm remediation targets valid: {cov['algorithm']} / {cov['algorithm']}.
Security remediation targets valid: {cov['security']} / {cov['security']}.
No changes were made to final-question selection, scoring, timing, persistence, per-question remediation targeting, or the v214 algorithm-then-security ordering policy.
500 matched deterministic final-session seeds produced the same selection/order signature as v216.

Preserved contracts
-------------------
100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4.
Subject B semantic validation: OK.
Candidate/reference generated six release files byte-identical: yes.

Findings summary
----------------
High: 0
Medium: 0
Low: 0

Decision
--------
Accept the targeted recovery-entry repair. Use the next release for a post-repair interaction audit rather than expanding this repair scope further.
''')
print(f'FEQUEST_SUBJECT_B_FINAL_REMEDIATION_REPAIR version={version} resolved=final_wrong_answer_recovery_visibility algo={cov["algorithm"]} security={cov["security"]} status=passed')

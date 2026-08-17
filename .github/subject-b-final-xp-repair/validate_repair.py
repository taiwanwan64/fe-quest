from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-final-xp-repair-(v(\d+))',branch)
    req(m,'bad Subject B final XP repair branch')
    return m.group(1),f'v{int(m.group(2))-1}'


def runtime(path, interaction):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function selectionSignature(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x219000+i)>>>0);const a=buildBFinal();h=hashText(h,a.map(x=>`${x.kind}:${x.sourceId}`).join('|'));}return h>>>0;}
function remediationCoverage(){
  const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),sec=SECURITY_SCENARIOS.map(makeFinalSecurity);
  return {algorithm:algo.length,security:sec.length,
    algoBad:algo.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).map(x=>x.sourceId),
    secBad:sec.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).map(x=>x.sourceId)};
}
function makeAttempt(correct,blank,seed){
  profile.bFinalStats={};Math.random=seedRand(seed>>>0);const items=buildBFinal();
  const details=items.map((x,i)=>{const ok=i<correct,isBlank=!ok&&i>=B_FINAL_COUNT-blank;return {sourceId:x.sourceId,kind:x.kind,format:bFinalFormatOf(x),domain:x.kind==='security'?(x.concept||'情報セキュリティ'):(x.domain||'擬似言語'),title:x.title,q:x.q,selected:isBlank?null:(ok?x.correctText:x.options[(x.a+1)%4]),correct:x.correctText,ok,explain:x.explain,studyMode:x.studyMode};});
  return {date:'2026-08-17',total:B_FINAL_COUNT,correct,blank,points:correct*50,rate:Math.round(correct/B_FINAL_COUNT*100),seconds:600,timeUp:false,algoCorrect:Math.min(correct,B_FINAL_ALGO_COUNT),secCorrect:Math.max(0,correct-B_FINAL_ALGO_COUNT),details};
}
function node(id=''){return {id,textContent:'',innerHTML:'',className:'',hidden:false,open:false,dataset:{},attrs:{},listeners:{},style:{},classList:{add(){},remove(){},toggle(){return false},contains(){return false}},setAttribute(k,v){this.attrs[k]=String(v);},getAttribute(k){return this.attrs[k]??null;},addEventListener(t,fn){this.listeners[t]=fn;},focus(){},scrollIntoView(){}};}
function interactionProbe(){
  const state={button:null,insertions:0},nodes=new Map();
  const forward=node('bFinalBackMenu'),detail=node(''),firstWrong=node('firstWrong'),actions=node('actions'),result=node('bFinalResult');forward.className='primary';detail.open=true;actions.firstChild=forward;actions.insertBefore=(n,b)=>{state.button=n;state.insertions++;};
  result.querySelector=(s)=>s==='.bmock-result-actions'?actions:s==='details.result-detail-fold'?detail:s==='.bfinal-review-item.wrong'?firstWrong:null;
  document.getElementById=(id)=>{if(id==='bFinalResult')return result;if(id==='bFinalBackMenu')return forward;if(id==='bFinalRecoveryV217')return state.button;if(!nodes.has(id))nodes.set(id,node(id));return nodes.get(id);};
  document.createElement=()=>node('dynamic');document.querySelectorAll=()=>[];globalThis.requestAnimationFrame=(fn)=>{fn();return 1;};
  const snap=()=>({message:document.getElementById('bFinalResultMessage').textContent,open:detail.open,aria:state.button?.attrs?.['aria-expanded']||null,insertions:state.insertions});
  const a=makeAttempt(17,1,0x219201);renderBFinalResult(a,137);state.button?.listeners?.click?.();const before=snap();renderBFinalResult(a,0);const after=snap();
  const next=makeAttempt(19,0,0x219202);renderBFinalResult(next,50);const nextState=snap();
  const zero=makeAttempt(19,0,0x219203);renderBFinalResult(zero,0);const zeroState=snap();
  const perfect=makeAttempt(20,0,0x219204);renderBFinalResult(perfect,240);const perfectState=snap();
  return {before,after,next:nextState,zero:zeroState,perfect:perfectState};
}
const probe=%INTERACTION%?interactionProbe():null;
console.log('__V219__'+Buffer.from(JSON.stringify({v:APP_VERSION,counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,pool:B_EXAM_ALGO_ITEMS.length,high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,recoverySpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,xpSpec:globalThis.SUBJECT_B_FINAL_XP_V219_SPEC||null,sem:validateSubjectBSemantics(),selectionSig:selectionSignature(500),coverage:remediationCoverage(),probe})).toString('base64'));
'''.replace('%INTERACTION%','true' if interaction else 'false')
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-5000:])
        m=re.search(r'__V219__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return html,json.loads(base64.b64decode(m.group(1)))


version,previous=ctx();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v219' and previous=='v218','v219 repair expects v218 parent')
manifest_path=Path('_release/content-change-v219.json');mf=json.loads(manifest_path.read_text())
req(mf.get('release')==version and mf.get('previous_release')==previous and mf.get('parent_main_sha')==parent,'manifest context drift')
req(mf.get('change_type')=='subject-b-final-xp-message-repair' and mf.get('source_priority_tier')=='low' and mf.get('quality_audit_marker')=='final_recovery_xp_message_rerender','manifest repair scope drift')
req(mf.get('allowed_question_ids')==[],'v219 must not change question content')
source=Path(mf['source_quality_audit']);st=source.read_text();req('Low — final_recovery_xp_message_rerender' in st and 'Low: 1 — final_recovery_xp_message_rerender' in st and 'In v219' in st,'v218 source finding evidence drift')

tooling={'.github/subject-b-final-xp-repair/validate_repair.py','.github/workflows/subject-b-final-xp-repair.yml'}
expected=set(mf.get('content_files',[]))|set(mf.get('assembly_files',[]))|{manifest_path.as_posix()}|tooling
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'v219 source drift: '+repr(sorted(changed^expected)))

override=Path('app/subject-b-final-xp-overrides-v219.txt').read_text()
for token in ['preserve-final-earned-xp-message-on-same-attempt-rerender','v218-final_recovery_xp_message_rerender','__bFinalEarnedDisplayV219=new WeakMap()','__renderBFinalResultBeforeV219=renderBFinalResult','displayOnly:true']:
    req(token in override,'v219 override token missing: '+token)
for forbidden in ['buildBFinal=function','finishBFinal=function','bFinalRemediationTarget=function','profile.xp=']:
    req(forbidden not in override,'v219 scope expanded into '+forbidden)
assembler=Path('index.html').read_text();req('subject-b-final-xp-overrides-v219.txt' in assembler and '{{ subjectBFinalRemediationV217 }}{{ subjectBFinalXpV219 }}function validateSubjectBSemantics(){' in assembler,'v219 assembly/order drift')
req(Path('.github/content-release/prepare_reference.py').read_bytes()==subprocess.check_output(['git','show',parent+':.github/content-release/prepare_reference.py']),'content reference tooling drift')

html,cand=runtime('_site/index.html',True);_,par=runtime('_site_parent/index.html',False)
req(cand['v']==version and par['v']==previous,'runtime versions');req(cand['counts']==par['counts']==[20,16,4] and cand['seconds']==par['seconds']==6000,'final exam contract drift');req(cand['pool']==par['pool']==43 and cand['high']==par['high'] and len(cand['high'])==15 and cand['floor']==par['floor']==4,'final pool/trace contract drift');req(cand['orderSpec']==par['orderSpec'] and cand['recoverySpec']==par['recoverySpec'],'v214/v217 policy drift');req(cand['selectionSig']==par['selectionSig'],'500-seed selection/order signature drift');req(cand['sem'].get('ok') is True,'Subject B semantic validation failed');req(par['xpSpec'] is None,'v219 repair unexpectedly present in parent')
spec=cand['xpSpec'] or {};req(spec.get('policy')=='preserve-final-earned-xp-message-on-same-attempt-rerender' and spec.get('sourceAudit')=='v218-final_recovery_xp_message_rerender','v219 spec drift');req(spec.get('scoringChanged') is False and spec.get('persistedXpChanged') is False and spec.get('reasonHistoryChanged') is False and spec.get('remediationTargetsChanged') is False and spec.get('recoveryEntryChanged') is False and spec.get('displayOnly') is True,'v219 scope spec drift')

cov=cand['coverage'];req(cov['algorithm']==43 and not cov['algoBad'] and cov['security']==15 and not cov['secBad'],'remediation coverage drift')
p=cand['probe'];req(p,'candidate probe missing');req('+137 XP' in p['before']['message'] and '+137 XP' in p['after']['message'],'same-attempt zero rerender lost earned XP display');req(p['after']['open'] is True and p['after']['aria']=='true' and p['after']['insertions']==1,'v217 recovery disclosure behavior drift');req('+50 XP' in p['next']['message'],'new attempt inherited prior XP');req('+0 XP' in p['zero']['message'],'zero-earned attempt inherited stale XP');req('+240 XP' in p['perfect']['message'],'perfect-attempt XP display drift');req('renderBFinalResult(a,0);' in html,'reason callback contract changed; reassess repair')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/reference six-file mismatch')

fixture={'name':'subject-b-final-xp-repair-v219','version':version,'previous_version':previous,'parent_main_sha':parent,'learner_facing_change':True,'resolved_finding':'final_recovery_xp_message_rerender','source_audit_reproduced_defect':True,'repair_spec':spec,'probe':p,'runtime_preservation':{'final_counts':cand['counts'],'time_limit_seconds':cand['seconds'],'algorithm_pool':cand['pool'],'high_trace_count':len(cand['high']),'high_trace_floor':cand['floor'],'selection_signature_500_seeds_unchanged':True,'semantic_validator_ok':True},'remediation_coverage':cov,'candidate_reference_six_file_equal':True,'findings':{'high':[],'medium':[],'low':[]},'status':'passed-resolved-low'}
Path('_regression/subject-b-final-xp-repair-v219.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
Path('audits/SUBJECT_B_FINAL_XP_REPAIR_v219.txt').write_text(f'''FE QUEST v219 — Subject B Final-Practice XP Message Consistency Repair
================================================================================

Result
------
PASS — v218 LOW FINDING RESOLVED
Previous: v218
Source main: {parent}
Learner-facing change in v219: yes
Resolved finding: final_recovery_xp_message_rerender

Repair
------
The earned-XP value first shown for a final-practice attempt is retained when that same attempt is rerendered with earned=0, which is the existing rerender path used after choosing an error reason.
This is display-only. Scoring, persisted XP, reason history, remediation targets and the v217 recovery entry are unchanged.

Interaction proof
-----------------
The v218 audit is the source evidence for the pre-repair +0 XP display defect.
Candidate v219 showed +137 XP before and after the same-attempt earned=0 rerender.
The detailed review stayed open with aria-expanded=true and the v217 recovery entry remained single-instance.
A new attempt with 50 XP showed +50 XP; a zero-earned new attempt showed +0 XP; a perfect new attempt with 240 XP showed +240 XP.
The existing reason callback still invokes renderBFinalResult(a,0), so this narrow wrapper repairs that path without changing reason logic.

Preserved contracts
-------------------
Algorithm remediation targets valid: 43 / 43.
Security remediation targets valid: 15 / 15.
500 deterministic final-session seeds matched v218 selection/order.
100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4; v214 order and v217 recovery policies are unchanged.
Subject B semantic validation: OK.
Candidate/reference generated six release files byte-identical: yes.

Findings summary
----------------
High: 0
Medium: 0
Low: 0

Decision
--------
Accept the narrow XP-message consistency repair. Use v220 for a short post-repair check, then leave this result-screen path unless that check finds a learner-impacting issue.
''')
print('FEQUEST_SUBJECT_B_FINAL_XP_REPAIR_OK',json.dumps({'version':version,'after':p['after']['message'],'selectionSig':cand['selectionSig']},ensure_ascii=False))

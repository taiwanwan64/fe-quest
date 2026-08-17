from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-final-xp-postrepair-audit-(v(\d+))',branch)
    req(m,'bad Subject B final XP post-repair audit branch')
    version=m.group(1)
    return version,f'v{int(m.group(2))-1}'


def runtime(path,interaction):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function selectionSignature(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x220000+i)>>>0);const a=buildBFinal();h=hashText(h,a.map(x=>`${x.kind}:${x.sourceId}`).join('|'));}return h>>>0;}
function remediationCoverage(){
  const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),sec=SECURITY_SCENARIOS.map(makeFinalSecurity);
  const algoBad=algo.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).map(x=>x.sourceId);
  const secBad=sec.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).map(x=>x.sourceId);
  return {algorithm:algo.length,security:sec.length,algoBad,secBad};
}
function makeAttempt(correct,blank,seed){
  profile.bFinalStats={};Math.random=seedRand(seed>>>0);const items=buildBFinal();
  const details=items.map((x,i)=>{const ok=i<correct,isBlank=!ok&&i>=B_FINAL_COUNT-blank;return {sourceId:x.sourceId,kind:x.kind,format:bFinalFormatOf(x),domain:x.kind==='security'?(x.concept||'情報セキュリティ'):(x.domain||'擬似言語'),title:x.title,q:x.q,selected:isBlank?null:(ok?x.correctText:x.options[(x.a+1)%4]),correct:x.correctText,ok,explain:x.explain,studyMode:x.studyMode};});
  return {date:'2026-08-17',total:B_FINAL_COUNT,correct,blank,points:correct*50,rate:Math.round(correct/B_FINAL_COUNT*100),seconds:600,timeUp:false,algoCorrect:Math.min(correct,B_FINAL_ALGO_COUNT),secCorrect:Math.max(0,correct-B_FINAL_ALGO_COUNT),details};
}
function node(id=''){return {id,textContent:'',innerHTML:'',className:'',hidden:false,open:false,dataset:{},attrs:{},listeners:{},style:{},classList:{add(){},remove(){},toggle(){return false},contains(){return false}},setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]??null},addEventListener(t,fn){this.listeners[t]=fn},focus(){this.focused=true},scrollIntoView(){this.scrolled=true}};}
function probe(){
  const nodes=new Map(),state={button:null,insertions:0};
  const forward=node('bFinalBackMenu'),detail=node('detail'),firstWrong=node('firstWrong'),actions=node('actions'),result=node('bFinalResult');
  actions.firstChild=forward;actions.insertBefore=(n,b)=>{state.button=n;state.insertions++;};
  result.querySelector=(s)=>s==='.bmock-result-actions'?actions:s==='details.result-detail-fold'?detail:s==='.bfinal-review-item.wrong'?firstWrong:null;
  function get(id){if(id==='bFinalResult')return result;if(id==='bFinalBackMenu')return forward;if(id==='bFinalRecoveryV217')return state.button;if(!nodes.has(id))nodes.set(id,node(id));return nodes.get(id);}
  globalThis.document={getElementById:get,createElement:()=>node('dynamic'),querySelectorAll:()=>[],querySelector:()=>null,body:node('body'),documentElement:node('html'),activeElement:null,addEventListener(){},removeEventListener(){}};
  globalThis.requestAnimationFrame=(fn)=>{fn();return 1;};
  const snap=()=>({message:get('bFinalResultMessage').textContent,open:detail.open,aria:state.button?.attrs?.['aria-expanded']||null,label:state.button?.textContent||null,hidden:state.button?.hidden,insertions:state.insertions});
  const a=makeAttempt(17,1,0x220201);renderBFinalResult(a,137);const initial=snap();state.button?.listeners?.click?.();const opened=snap();renderBFinalResult(a,0);const rerender1=snap();renderBFinalResult(a,0);const rerender2=snap();
  const b=makeAttempt(19,0,0x220202);renderBFinalResult(b,50);const next=snap();
  const c=makeAttempt(19,0,0x220203);renderBFinalResult(c,0);const zero=snap();
  const d=makeAttempt(20,0,0x220204);renderBFinalResult(d,240);const perfect=snap();
  return {initial,opened,rerender1,rerender2,next,zero,perfect};
}
console.log('__V220__'+Buffer.from(JSON.stringify({v:APP_VERSION,counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,pool:B_EXAM_ALGO_ITEMS.length,high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,recoverySpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,xpSpec:globalThis.SUBJECT_B_FINAL_XP_V219_SPEC||null,sem:validateSubjectBSemantics(),selectionSig:selectionSignature(1000),coverage:remediationCoverage(),interaction:%INTERACTION%?probe():null})).toString('base64'));
'''.replace('%INTERACTION%','true' if interaction else 'false')
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-5000:])
        m=re.search(r'__V220__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return html,json.loads(base64.b64decode(m.group(1)))


version,previous=ctx();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v220' and previous=='v219','v220 post-repair audit expects v219 parent')
source=Path('audits/SUBJECT_B_FINAL_XP_REPAIR_v219.txt');req(source.exists(),'v219 XP repair evidence missing')
st=source.read_text();req('PASS — v218 LOW FINDING RESOLVED' in st and 'High: 0' in st and 'Medium: 0' in st and 'Low: 0' in st,'v219 repair evidence drift')
expected={'.github/subject-b-final-xp-postrepair-audit/validate_postrepair.py','.github/workflows/subject-b-final-xp-postrepair-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'v220 audit-only source drift: '+repr(sorted(changed^expected)))
repair=Path('app/subject-b-final-xp-overrides-v219.txt');req(repair.read_bytes()==subprocess.check_output(['git','show',parent+':app/subject-b-final-xp-overrides-v219.txt']),'v219 XP repair source drift')
html,cand=runtime('_site/index.html',True);_,par=runtime('_site_parent/index.html',False)
req(cand['v']==version and par['v']==previous,'runtime versions');req(cand['counts']==par['counts']==[20,16,4],'final counts drift');req(cand['seconds']==par['seconds']==6000,'time limit drift');req(cand['pool']==par['pool']==43,'algorithm pool drift');req(cand['high']==par['high'] and len(cand['high'])==15,'high-trace inventory drift');req(cand['floor']==par['floor']==4,'high-trace floor drift');req(cand['orderSpec']==par['orderSpec'],'v214 order spec drift');req(cand['recoverySpec']==par['recoverySpec'],'v217 recovery spec drift');req(cand['xpSpec']==par['xpSpec'],'v219 XP spec drift');req(cand['selectionSig']==par['selectionSig'],'1000-seed selection/order drift');req(cand['sem'].get('ok') is True,'Subject B semantic validation failed')
spec=cand['xpSpec'] or {};req(spec.get('policy')=='preserve-final-earned-xp-message-on-same-attempt-rerender','v219 XP policy missing');req(spec.get('displayOnly') is True and spec.get('scoringChanged') is False and spec.get('persistedXpChanged') is False and spec.get('recoveryEntryChanged') is False,'v219 XP repair scope drift')
cov=cand['coverage'];req(cov['algorithm']==43 and not cov['algoBad'],'algorithm remediation coverage drift');req(cov['security']==15 and not cov['secBad'],'security remediation coverage drift')
p=cand['interaction'];req('+137 XP' in p['initial']['message'],'initial earned XP message missing');req(p['initial']['open'] is False and p['initial']['insertions']==1,'new attempt recovery state drift');req(p['opened']['open'] is True and p['opened']['aria']=='true','recovery open state drift');req('+137 XP' in p['rerender1']['message'] and '+137 XP' in p['rerender2']['message'],'same-attempt zero rerender lost XP display');req(p['rerender1']['open'] is True and p['rerender1']['aria']=='true' and p['rerender1']['insertions']==1,'recovery state drift on rerender');req('+50 XP' in p['next']['message'] and p['next']['open'] is False,'new-attempt earned XP/reset drift');req('+0 XP' in p['zero']['message'],'zero-earned new attempt inherited prior XP');req('+240 XP' in p['perfect']['message'] and p['perfect']['hidden'] is True and p['perfect']['open'] is False,'perfect-attempt XP/recovery drift')
for token in ['renderBFinalResult(a,0);','preserve-final-earned-xp-message-on-same-attempt-rerender','surface-final-wrong-answer-recovery-entry']: req(token in html,'post-repair integration token missing: '+token)
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/reference six-file mismatch')
fixture={'name':f'subject-b-final-xp-postrepair-audit-{version}','version':version,'previous_version':previous,'parent_main_sha':parent,'learner_facing_change':False,'source_repair':'final_recovery_xp_message_rerender','interaction':p,'runtime_preservation':{'final_counts':cand['counts'],'time_limit_seconds':cand['seconds'],'algorithm_pool':cand['pool'],'high_trace_count':len(cand['high']),'high_trace_floor':cand['floor'],'selection_signature_1000_seeds_unchanged':True,'semantic_validator_ok':True},'remediation_coverage':cov,'candidate_reference_six_file_equal':True,'findings':{'high':[],'medium':[],'low':[]},'status':'passed-close-result-screen-path'}
Path(f'_regression/subject-b-final-xp-postrepair-audit-{version}.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
Path(f'audits/SUBJECT_B_FINAL_XP_POSTREPAIR_AUDIT_{version}.txt').write_text(f'''FE QUEST {version} — Subject B Final-Practice XP Post-Repair Audit
========================================================================

Result
------
PASS — NO FINDINGS
Previous: {previous}
Source main: {parent}
Learner-facing change in {version}: none

Post-repair proof
-----------------
A final-practice attempt showing +137 XP retained +137 XP across repeated same-attempt earned=0 rerenders.
The v217 recovery review stayed open with aria-expanded=true and a single recovery entry during those rerenders.
A new attempt correctly reset display state and showed its own +50 XP; a separate zero-earned attempt showed +0 XP; a perfect attempt showed +240 XP with the recovery entry hidden.

Preserved contracts
-------------------
Algorithm remediation targets valid: {cov['algorithm']} / {cov['algorithm']}.
Security remediation targets valid: {cov['security']} / {cov['security']}.
1000 deterministic final-session seeds matched v219 selection/order.
100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4; v214 order, v217 recovery and v219 XP-display policies are unchanged.
Subject B semantic validation: OK.
Candidate/reference generated six release files byte-identical: yes.

Findings summary
----------------
High: 0
Medium: 0
Low: 0

Decision
--------
Close the final-practice result-screen remediation/XP repair sequence. Do not continue modifying this path by default. Move v221 to a different Subject B learning-quality frontier.
''')
print(f'FEQUEST_SUBJECT_B_FINAL_XP_POSTREPAIR_AUDIT_OK version={version} parent={parent}')
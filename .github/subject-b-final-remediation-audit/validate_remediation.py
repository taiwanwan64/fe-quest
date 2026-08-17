from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-final-remediation-audit-(v(\d+))',branch)
    req(m,'bad Subject B final remediation audit branch')
    v=m.group(1)
    return v,f'v{int(m.group(2))-1}'


def runtime(path, do_probe):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function fullItem(x){return !!(x&&x.sourceId&&x.q&&Array.isArray(x.options)&&x.options.length===4&&Number.isInteger(x.a)&&x.a>=0&&x.a<4&&x.correctText&&x.explain&&x.studyMode);}
function coverage(){
  Math.random=seedRand(0x216010);
  const exerciseIds=new Set(B_EXERCISES.map(x=>x.id));
  const secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam);
  const sec=SECURITY_SCENARIOS.map(makeFinalSecurity);
  const algoTargets=algo.map(x=>({sourceId:x.sourceId,domain:x.domain,studyMode:x.studyMode,target:bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain),full:fullItem(x)}));
  const secTargets=sec.map(x=>({sourceId:x.sourceId,studyMode:x.studyMode,target:bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ'),full:fullItem(x)}));
  const algoBad=algoTargets.filter(x=>!x.full||x.target.mode!=='trace'||!exerciseIds.has(x.target.id));
  const secBad=secTargets.filter(x=>!x.full||x.target.mode!=='security'||x.target.id!==x.sourceId||!secIds.has(x.target.id));
  const reasons=['トレースミス','コード理解','読み違い','知識不足','時間不足'];
  const algoMeta=reasons.map(r=>({reason:r,meta:bFinalReviewReasonMeta(r,{kind:'algo'})}));
  const secMeta=reasons.map(r=>({reason:r,meta:bFinalReviewReasonMeta(r,{kind:'security'})}));
  return {algorithmItems:algo.length,securityScenarios:sec.length,algorithmBad:algoBad,securityBad:secBad,reasonCount:reasons.length,algoMeta,secMeta};
}
function sessions(n){
  let contractFailure=0,detailFailure=0,targetFailure=0;
  const ex=new Set(B_EXERCISES.map(x=>x.id));
  for(let i=0;i<n;i++){
    Math.random=seedRand((0x216100+i)>>>0);
    const a=buildBFinal();
    const algo=a.filter(x=>x.kind==='algo'),sec=a.filter(x=>x.kind==='security');
    if(a.length!==20||algo.length!==16||sec.length!==4||a[15]?.kind!=='algo'||a[16]?.kind!=='security')contractFailure++;
    if(a.some(x=>!fullItem(x)))detailFailure++;
    for(const x of a){
      const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain||x.concept||'');
      if(x.kind==='algo'&&(t.mode!=='trace'||!ex.has(t.id)))targetFailure++;
      if(x.kind==='security'&&(t.mode!=='security'||t.id!==x.sourceId))targetFailure++;
    }
  }
  return {sessions:n,contractFailure,detailFailure,targetFailure};
}
let probe=null;if(%PROBE%){probe={coverage:coverage(),sessions:sessions(2000)};}
console.log('__V216__'+Buffer.from(JSON.stringify({v:APP_VERSION,counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],pool:B_EXAM_ALGO_ITEMS.length,high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,spec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,sem:validateSubjectBSemantics(),probe})).toString('base64'));
'''.replace('%PROBE%','true' if do_probe else 'false')
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-5000:])
        m=re.search(r'__V216__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return html,json.loads(base64.b64decode(m.group(1)))


version,previous=ctx();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(previous=='v215','v216 remediation audit expects v215 parent')
source=Path('audits/SUBJECT_B_FINAL_BOUNDARY_INTEGRITY_AUDIT_v215.txt');req(source.exists(),'v215 boundary audit missing')
st=source.read_text();req('\nPASS\n' in st and 'High: 0' in st and 'Medium: 0' in st and 'Low: 0' in st,'v215 source audit evidence drift')

expected={'.github/subject-b-final-remediation-audit/validate_remediation.py','.github/workflows/subject-b-final-remediation-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(changed==expected,'v216 audit-only source drift: '+repr(sorted(changed^expected)))

html,cand=runtime('_site/index.html',True);parent_html,par=runtime('_site_parent/index.html',False)
req(cand['v']==version and par['v']==previous,'runtime versions')
req(cand['counts']==par['counts']==[20,16,4],'final counts drift');req(cand['pool']==par['pool']==43,'algorithm pool drift');req(cand['high']==par['high'] and len(cand['high'])==15,'high-trace inventory drift');req(cand['floor']==par['floor']==4,'high-trace floor drift');req(cand['spec']==par['spec'],'v214 order spec drift');req(cand['sem'].get('ok') is True,'Subject B semantic validation failed')

# Complete feedback and remediation contracts already present in production.
feedback_tokens={
 'detail_selected':'selected:ans===null?null:item.options[ans]',
 'detail_correct':'correct:item.correctText',
 'detail_explain':'explain:item.explain',
 'detail_domain':"domain:item.kind==='security'?(item.concept||'情報セキュリティ'):(item.domain||'擬似言語')",
 'review_answer':'あなたの回答：<b>${d.selected===null?',
 'review_correct':'正解：<b>${escapeHtml(d.correct)}</b>',
 'review_explain':'<div class="bfinal-review-e">${escapeHtml(d.explain)}</div>',
 'reason_prompt':'なぜ崩れましたか？',
 'reason_trace':'トレースミス','reason_code':'コード理解','reason_read':'読み違い','reason_knowledge':'知識不足','reason_time':'時間不足',
 'target_function':'function bFinalRemediationTarget(mode,source,domain)',
 'target_button':'data-bfinalstudy=',
 'mistake_persist':'bFinalMistakeStats',
 'final_stats':'st.seen++;if(ok)st.correct++;st.lastSeen=localDateISO(0);'
}
missing=[k for k,v in feedback_tokens.items() if v not in html];req(not missing,'feedback/remediation source contract missing: '+repr(missing))
req(all(v in parent_html for v in feedback_tokens.values()),'parent feedback/remediation contract drift')

# Learner-path visibility audit. The primary continuation action appears before a closed-by-default
# details element that owns the diagnosis and the full review. Per-question targeted remediation
# buttons are rendered into bFinalReviewList, so they are not visible until that disclosure is opened.
result_markup=re.search(r'<div class="bmock-result-actions">.*?<details class="result-detail-fold">.*?</details>',html,re.S)
req(result_markup,'final result action/review markup missing')
seg=result_markup.group(0)
req('id="bFinalBackMenu">次の科目Bへ →</button>' in seg,'primary continuation action drift')
req('<details class="result-detail-fold">' in seg and '<details class="result-detail-fold" open' not in seg,'review fold visibility drift')
req('詳しい結果・全20問レビューを見る' in seg and 'id="bFinalReviewList"' in seg,'review fold content drift')
req(seg.index('id="bFinalBackMenu"') < seg.index('class="result-detail-fold"'),'primary action no longer precedes review fold')

p=cand['probe'];cov=p['coverage'];sessions=p['sessions']
req(cov['algorithmItems']==43 and not cov['algorithmBad'],'algorithm remediation coverage failure: '+repr(cov['algorithmBad'][:3]))
req(cov['securityScenarios']>=1 and not cov['securityBad'],'security remediation coverage failure: '+repr(cov['securityBad'][:3]))
req(cov['reasonCount']==5 and all(len(x['meta'])==2 and all(x['meta']) for x in cov['algoMeta']+cov['secMeta']),'reason metadata coverage failure')
req(sessions['contractFailure']==sessions['detailFailure']==sessions['targetFailure']==0,'session remediation probe failure: '+repr(sessions))

files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/reference six-file mismatch')

medium={
 'id':'final_wrong_answer_recovery_visibility',
 'severity':'Medium',
 'observation':'Per-question diagnosis and targeted remediation are complete, but all of them live inside the closed-by-default detailed-results disclosure while the visible primary action immediately continues to the next Subject B activity.',
 'learner_risk':'A learner who misses questions can follow the dominant action without seeing the available reason classification, explanation-driven recovery step, or targeted practice button, adding avoidable friction to the wrong-answer -> understanding -> retry loop.',
 'recommended_repair':'Keep the existing next-Subject-B primary hierarchy for strong attempts, but when wrong or blank answers exist surface one concise wrong-answer review/recovery entry point before continuation (or auto-open a compact remediation summary) without expanding all 20 reviews by default.'
}
fixture={
 'name':f'subject-b-final-remediation-audit-{version}','version':version,'previous_version':previous,'parent_main_sha':parent,'learner_facing_change':False,
 'scope':'final-practice wrong-answer feedback, remediation targeting, persistence and recovery visibility',
 'runtime_preservation':{'final_counts':cand['counts'],'algorithm_pool':cand['pool'],'high_trace_count':len(cand['high']),'high_trace_floor':cand['floor'],'semantic_validator_ok':True,'v214_order_spec_unchanged':True},
 'feedback_contracts':{k:True for k in feedback_tokens},'remediation_coverage':cov,'session_probe':sessions,
 'visibility':{'primary_next_subject_b_visible':True,'review_closed_by_default':True,'targeted_remediation_inside_review_fold':True},
 'candidate_reference_six_file_equal':True,'findings':{'high':[],'medium':[medium],'low':[]},'status':'passed-with-medium-finding'
}
Path(f'_regression/subject-b-final-remediation-audit-{version}.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
Path(f'audits/SUBJECT_B_FINAL_REMEDIATION_AUDIT_{version}.txt').write_text(f'''FE QUEST {version} — Subject B Final-Practice Remediation Audit
====================================================================

Result
------
PASS — MEDIUM FINDING RECORDED
Previous: {previous}
Source main: {parent}
Learner-facing change in {version}: none

Scope
-----
Audit the post-final-practice path from a wrong answer to understanding and targeted practice. This is an FE QUEST learner-experience audit; it does not assert an official IPA review-flow requirement.

Feedback completeness
---------------------
Each final-practice review detail preserves the learner answer, correct answer, explanation, source ID, question kind, format/domain and study mode.
Wrong items also expose five self-diagnosis reasons: トレースミス / コード理解 / 読み違い / 知識不足 / 時間不足.
Mistake count, last reason and reason history are persisted in bFinalMistakeStats. Per-source final seen/correct/lastSeen statistics are also updated.

Targeted remediation coverage
-----------------------------
Algorithm final items checked: {cov['algorithmItems']} / {cov['algorithmItems']}.
Algorithm items with missing/incompatible remediation target: {len(cov['algorithmBad'])}.
Security scenarios checked: {cov['securityScenarios']}.
Security scenarios with missing/incompatible remediation target: {len(cov['securityBad'])}.
All five diagnosis reasons returned non-empty action title + explanation metadata for both algorithm and security examples.

Session probe
-------------
Deterministic generated final sessions: {sessions['sessions']}.
Structural/order failures: {sessions['contractFailure']}.
Missing feedback-detail failures: {sessions['detailFailure']}.
Missing/incompatible remediation-target occurrences: {sessions['targetFailure']}.

Learner-path visibility
-----------------------
The visible result action remains 「次の科目Bへ →」.
The diagnosis, format breakdown and all-20-question review are inside a result-detail-fold <details> element that is closed by default.
Per-question targeted remediation buttons are generated inside that review list. Therefore the recovery tools are functionally strong but require the learner to discover and open the detailed-results disclosure before they can use them.

Finding
-------
Medium — final_wrong_answer_recovery_visibility
The wrong-answer recovery machinery is already complete, but its entry point is subordinate to an immediately visible continuation action. A learner with mistakes can leave the result screen without seeing the most useful recovery path.

Recommended repair
------------------
Do not turn the whole 20-question review into the default screen. In the next targeted repair, when wrong or blank answers exist, surface one concise 「誤答を復習する」/recovery entry point near the result actions (or open a compact remediation summary). Preserve 「次の科目Bへ」 as the normal forward action for clean/strong attempts and leave full-detail review collapsible.

Preserved contracts
-------------------
100 minutes / 20 questions; algorithm 16 + security 4; v214 algorithm-then-security presentation order; algorithm pool 43; high-trace inventory 15 / floor 4.
Subject B semantic validation: OK.
Candidate/reference generated six release files byte-identical: yes.

Findings summary
----------------
High: 0
Medium: 1 — final_wrong_answer_recovery_visibility
Low: 0

Decision
--------
Publish {version} as audit-only. Do not silently change learner-facing behavior in this audit release. Use {f'v{int(version[1:])+1}'} for a narrowly scoped result-screen recovery-entry repair, then run a post-repair interaction audit.
''')
print(f'FEQUEST_SUBJECT_B_FINAL_REMEDIATION_AUDIT version={version} sessions={sessions["sessions"]} algo={cov["algorithmItems"]} security={cov["securityScenarios"]} medium=1 status=passed')

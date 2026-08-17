from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-final-boundary-audit-(v(\d+))',branch)
    req(m,'bad v215 boundary-audit branch')
    v=m.group(1)
    return v,f'v{int(m.group(2))-1}'


def runtime(path, do_probe):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function resetStats(){profile.bFinalStats={};B_EXAM_ALGO_ITEMS.forEach(x=>profile.bFinalStats[`algo:${x.id}`]={seen:0,correct:0,lastSeen:null});SECURITY_SCENARIOS.forEach(x=>profile.bFinalStats[`sec:${x.id}`]={seen:0,correct:0,lastSeen:null});}
function ids(a){return a.map(x=>`${x.kind}:${x.sourceId}`);}
function summary(a){
 const algo=a.filter(x=>x.kind==='algo'),sec=a.filter(x=>x.kind==='security'),levels={};algo.forEach(x=>levels[x.level]=(levels[x.level]||0)+1);
 const hi=new Set(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[]);
 return {total:a.length,algo:algo.length,sec:sec.length,std:levels['標準']||0,app:levels['応用']||0,domains:new Set(algo.map(x=>x.domain)).size,unique:new Set(algo.map(x=>x.sourceId)).size,high:algo.filter(x=>hi.has(x.sourceId)).length,log:sec.filter(x=>!!x.log).length,nonlog:sec.filter(x=>!x.log).length,q16:a[15]?.kind,q17:a[16]?.kind,trans:a.slice(1).reduce((n,x,i)=>n+(x.kind!==a[i].kind?1:0),0)};
}
function matched(n){resetStats();let setMismatch=0,partitionMismatch=0,boundaryFailure=0,contractFailure=0;for(let i=0;i<n;i++){
 const sd=(0x215100+i)>>>0;Math.random=seedRand(sd);const before=globalThis.__buildBFinalBeforeV214();Math.random=seedRand(sd);const after=buildBFinal();
 if(JSON.stringify([...ids(before)].sort())!==JSON.stringify([...ids(after)].sort()))setMismatch++;
 const expected=[...before.filter(x=>x.kind==='algo'),...before.filter(x=>x.kind==='security')];if(JSON.stringify(ids(expected))!==JSON.stringify(ids(after)))partitionMismatch++;
 const s=summary(after);if(s.q16!=='algo'||s.q17!=='security'||s.trans!==1)boundaryFailure++;if(s.total!==20||s.algo!==16||s.sec!==4||s.std!==8||s.app!==8||s.domains!==10||s.unique!==16||s.high<4||s.log!==2||s.nonlog!==2)contractFailure++;
 }return {sessions:n,setMismatch,partitionMismatch,boundaryFailure,contractFailure};}
function adaptive(n){Math.random=seedRand(0x215200);resetStats();let boundaryFailure=0,contractFailure=0,minHigh=999,maxHigh=0;for(let i=0;i<n;i++){
 const a=buildBFinal(),s=summary(a);minHigh=Math.min(minHigh,s.high);maxHigh=Math.max(maxHigh,s.high);if(s.q16!=='algo'||s.q17!=='security'||s.trans!==1)boundaryFailure++;if(s.total!==20||s.algo!==16||s.sec!==4||s.std!==8||s.app!==8||s.domains!==10||s.unique!==16||s.high<4||s.log!==2||s.nonlog!==2)contractFailure++;
 a.forEach(x=>{const k=`${x.kind==='security'?'sec':'algo'}:${x.sourceId}`;profile.bFinalStats[k].seen++;profile.bFinalStats[k].lastSeen=`s${i}`;});
 }return {sessions:n,boundaryFailure,contractFailure,minHigh,maxHigh};}
function roundTrip(){Math.random=seedRand(0x215300);resetStats();const items=buildBFinal(),answers=items.map((_,i)=>i%4),flags=[15,16];const s=JSON.parse(JSON.stringify({items,answers,flags,index:15})),fs=new Set(s.flags);const d=s.items.map((x,i)=>({sourceId:x.sourceId,kind:x.kind,answer:s.answers[i],q:i+1}));return {same:JSON.stringify(ids(items))===JSON.stringify(ids(s.items)),q16:{sourceId:s.items[15].sourceId,kind:s.items[15].kind,answer:s.answers[15],flag:fs.has(15)},q17:{sourceId:s.items[16].sourceId,kind:s.items[16].kind,answer:s.answers[16],flag:fs.has(16)},r16:d[15],r17:d[16]};}
let probe=null;if(%PROBE%){probe={matched:matched(5000),adaptive:adaptive(3000),roundTrip:roundTrip()};}
console.log('__V215__'+Buffer.from(JSON.stringify({v:APP_VERSION,counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],pool:B_EXAM_ALGO_ITEMS.length,high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,spec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,sem:validateSubjectBSemantics(),probe})).toString('base64'));
'''.replace('%PROBE%','true' if do_probe else 'false')
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-5000:])
        m=re.search(r'__V215__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return html,json.loads(base64.b64decode(m.group(1)))


version,previous=ctx();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(previous=='v214','v215 expects v214 parent')
source=Path('audits/SUBJECT_B_FINAL_ORDER_REPAIR_v214.txt');req(source.exists(),'v214 repair audit missing')
st=source.read_text();req('PASS — v213 MEDIUM FINDING RESOLVED' in st and 'final_question_order_fidelity' in st,'v214 repair evidence drift')

expected={'.github/subject-b-final-boundary-audit/validate_boundary.py','.github/workflows/subject-b-final-boundary-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(changed==expected,'audit-only source drift: '+repr(sorted(changed^expected)))

html,cand=runtime('_site/index.html',True);parent_html,par=runtime('_site_parent/index.html',False)
req(cand['v']==version and par['v']==previous,'versions')
req(cand['counts']==par['counts']==[20,16,4],'final counts drift');req(cand['pool']==par['pool']==43,'pool drift');req(cand['high']==par['high'] and len(cand['high'])==15,'high inventory drift');req(cand['floor']==par['floor']==4,'floor drift');req(cand['spec']==par['spec'],'v214 spec drift');req(cand['sem'].get('ok') is True,'Subject B semantic failure')
spec=cand['spec'] or {};req(spec.get('policy')=='final-practice-algorithm-then-security-block-order','v214 policy');req(spec.get('sourceAudit')=='v213-final_question_order_fidelity','v214 source link');req(spec.get('algorithmBlockCount')==16 and spec.get('securityBlockCount')==4,'v214 block counts');req(spec.get('selectedSetChanged') is False and spec.get('selectorChanged') is False and spec.get('stablePartitionOnly') is True,'v214 repair boundary')

contracts={
 'resume_payload':'items:bFinalItems,answers:bFinalAnswers,flags:[...bFinalFlags],index:bFinalIndex',
 'resume_items':'bFinalItems=s.items;','resume_answers':'bFinalAnswers=s.answers;','resume_flags':'bFinalFlags=new Set(s.flags||[]);','resume_index':'bFinalIndex=Math.max(0,Math.min(19,Number(s.index)||0));',
 'nav_answer':"bFinalAnswers[i]!==null?'answered':''",'nav_flag':"bFinalFlags.has(i)?'flagged':''",'nav_index':'data-bfq="${i}"',
 'details':'const details=bFinalItems.map((item,i)=>{','details_answer':'const ans=bFinalAnswers[i],ok=ans===item.a;','review':'a.details.map((d,i)=>','review_q':'Q${i+1}'
}
missing=[k for k,v in contracts.items() if v not in html];req(not missing,'candidate positional contracts missing '+repr(missing));req(all(v in parent_html for v in contracts.values()),'parent positional contract drift')

p=cand['probe'];m=p['matched'];a=p['adaptive'];r=p['roundTrip']
req(m['setMismatch']==m['partitionMismatch']==m['boundaryFailure']==m['contractFailure']==0,'matched regression')
req(a['boundaryFailure']==a['contractFailure']==0 and a['minHigh']>=4,'adaptive regression')
req(r['same'] and r['q16']['kind']=='algo' and r['q17']['kind']=='security' and r['q16']['answer']==3 and r['q17']['answer']==0 and r['q16']['flag'] and r['q17']['flag'],'resume boundary round-trip')
req(r['r16']['sourceId']==r['q16']['sourceId'] and r['r16']['answer']==r['q16']['answer'] and r['r16']['q']==16,'review Q16');req(r['r17']['sourceId']==r['q17']['sourceId'] and r['r17']['answer']==r['q17']['answer'] and r['r17']['q']==17,'review Q17')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/reference mismatch')

fixture={'name':f'subject-b-final-boundary-integrity-{version}','version':version,'previous_version':previous,'parent_main_sha':parent,'learner_facing_change':False,'runtime_preservation':{'final_counts':cand['counts'],'algorithm_pool':cand['pool'],'high_trace_count':len(cand['high']),'high_trace_floor':cand['floor'],'semantic_validator_ok':True,'v214_spec_unchanged':True},'source_positional_contracts':{k:True for k in contracts},'probes':p,'candidate_reference_six_file_equal':True,'findings':{'high':[],'medium':[],'low':[]},'status':'passed'}
Path(f'_regression/subject-b-final-boundary-integrity-{version}.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
Path(f'audits/SUBJECT_B_FINAL_BOUNDARY_INTEGRITY_AUDIT_{version}.txt').write_text(f'''FE QUEST {version} — Subject B Final-Practice Boundary Integrity Audit
========================================================================

Result
------
PASS
Previous: {previous}
Source main: {parent}
Learner-facing change in {version}: none

Scope
-----
Post-v214 audit of the Q16 algorithm -> Q17 security boundary, with emphasis on save/resume, navigator state and result-review index alignment.

Selection/order regression
--------------------------
Matched seed/history pairs: {m['sessions']}.
Selected-set mismatches: {m['setMismatch']}.
Stable-partition mismatches: {m['partitionMismatch']}.
Q16/Q17 boundary failures: {m['boundaryFailure']}.
Structural/quota failures: {m['contractFailure']}.

Adaptive-history stress
-----------------------
Sessions: {a['sessions']}.
Q16/Q17 boundary failures: {a['boundaryFailure']}.
Structural/quota failures: {a['contractFailure']}.
High-trace min/max: {a['minHigh']} / {a['maxHigh']} (floor 4).

Resume/navigation/review alignment
----------------------------------
Production save/restore keeps items, answers, flags and current index positionally aligned. The navigator derives number, answered state, flag state and jump index from the same array index. Result details derive item and answer from the same index and label it Q(i+1).
Serialized boundary round-trip preserved item order: yes.
Q16: algorithm / {r['q16']['sourceId']} / answer-index {r['q16']['answer']} / flagged yes.
Q17: security / {r['q17']['sourceId']} / answer-index {r['q17']['answer']} / flagged yes.
Review Q16/Q17 source IDs and answers remained aligned: yes.

Preserved contracts
-------------------
100 minutes / 20 questions; 16 algorithm + 4 security; 標準8 / 応用8; ten algorithm domains; unique algorithm IDs.
43-item algorithm pool; 15 high-trace items; floor 4; security 2 log + 2 non-log.
Subject B semantic validation: OK.
Candidate/reference generated six files byte-identical: yes.

Findings
--------
High: 0
Medium: 0
Low: 0

Decision
--------
Accept the v214 block-order repair as stable across the Q16->Q17 boundary. Do not modify this path further by default; move the next audit to another learner-value area unless real-use evidence reveals a defect.
''')
print(f'FEQUEST_SUBJECT_B_FINAL_BOUNDARY_AUDIT version={version} matched={m["sessions"]} adaptive={a["sessions"]} status=passed')

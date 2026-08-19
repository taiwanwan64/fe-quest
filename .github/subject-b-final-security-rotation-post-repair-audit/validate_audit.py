from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-final-security-rotation-post-repair-audit-(v(\d+))',branch)
    req(m,'bad Subject B final security rotation post-repair audit branch')
    version=m.group(1)
    return version,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function mark(items,day){for(const item of items){const key=item.kind==='security'?`sec:${item.sourceId}`:`algo:${item.sourceId}`;const st=profile.bFinalStats[key]||(profile.bFinalStats[key]={seen:0,correct:0,lastSeen:null});st.seen=(st.seen||0)+1;st.lastSeen=`2026-12-${String(day).padStart(2,'0')}`;}}
function sec(items){const s=items.filter(x=>x.kind==='security');return {ids:s.map(x=>x.sourceId),logs:s.filter(x=>!!x.log).length,cases:s.filter(x=>!x.log).length};}
function overlap(a,b){const x=new Set(a);return b.filter(v=>x.has(v)).length;}
function cohort(seed,sessions=10){profile.bFinalStats={};const seen=new Set(),rows=[];let prev=[];for(let i=0;i<sessions;i++){Math.random=seedRand((seed+i*104729)>>>0);const items=buildBFinal(),q=sec(items),ov=i?overlap(prev,q.ids):0;const before=seen.size;q.ids.forEach(id=>seen.add(id));rows.push({session:i+1,ids:q.ids,logs:q.logs,cases:q.cases,coverage:seen.size,newCount:seen.size-before,overlapPrev:ov,exactRepeat:i?JSON.stringify([...prev].sort())===JSON.stringify([...q.ids].sort()):false,block:items.slice(0,16).every(x=>x.kind==='algo')&&items.slice(16).every(x=>x.kind==='security')});mark(items,i+1);prev=q.ids;}return rows;}
function audit(){const cs=[];for(let i=0;i<200;i++)cs.push(cohort((0x240000+i)>>>0,10));const first5Pairs=cs.flatMap(c=>c.slice(1,5).map(r=>r.overlapPrev));const latePairs=cs.flatMap(c=>c.slice(5).map(r=>r.overlapPrev));const quotaBySession=Array.from({length:10},(_,i)=>{const m={};for(const c of cs){const r=c[i],k=`${r.logs}+${r.cases}`;m[k]=(m[k]||0)+1;}return m;});const minCoverage=Array.from({length:10},(_,i)=>Math.min(...cs.map(c=>c[i].coverage)));const maxCoverage=Array.from({length:10},(_,i)=>Math.max(...cs.map(c=>c[i].coverage)));return {cohorts:cs.length,all15By5:cs.filter(c=>c[4].coverage===15).length,first5Overlap:{mean:first5Pairs.reduce((a,b)=>a+b,0)/first5Pairs.length,max:Math.max(...first5Pairs),zero:first5Pairs.filter(x=>x===0).length,total:first5Pairs.length},lateOverlap:{mean:latePairs.reduce((a,b)=>a+b,0)/latePairs.length,max:Math.max(...latePairs),zero:latePairs.filter(x=>x===0).length,total:latePairs.length},exactRepeatCount:cs.reduce((n,c)=>n+c.filter(r=>r.exactRepeat).length,0),quotaBySession,minCoverage,maxCoverage,allBlocksValid:cs.every(c=>c.every(r=>r.logs>=1&&r.logs<=3&&r.cases>=1&&r.cases<=3&&r.logs+r.cases===4&&r.block)),examples:cs.slice(0,3)};}
function signature(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x240900+i)>>>0);const rows=[];for(let s=0;s<6;s++){const items=buildBFinal();rows.push(items.map(x=>`${x.kind}:${x.sourceId}`).join('|'));mark(items,s+1);}h=hashText(h,rows.join('||'));}return h>>>0;}
function remediation(){const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));const a=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),s=SECURITY_SCENARIOS.map(makeFinalSecurity);return {algorithm:a.length,security:s.length,algoBad:a.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).length,secBad:s.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).length};}
console.log('__V240__'+Buffer.from(JSON.stringify({v:APP_VERSION,spec:globalThis.SUBJECT_B_FINAL_SECURITY_ROTATION_V239_SPEC||null,audit:audit(),signature:signature(500),counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,pool:B_EXAM_ALGO_ITEMS.length,high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,remediation:remediation(),sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-7000:])
        m=re.search(r'__V240__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=ctx()
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v240' and previous=='v239','v240 audit expects v239 parent')
expected={'.github/subject-b-final-security-rotation-post-repair-audit/validate_audit.py','.github/workflows/subject-b-final-security-rotation-post-repair-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(changed==expected,'v240 audit-only source drift: '+repr(sorted(changed^expected)))

cand=runtime('_site/index.html');par=runtime('_site_parent/index.html')
req(cand['v']==version and par['v']==previous,'runtime versions')
req(cand['signature']==par['signature'],'audit-only repeated-final behavior drift')
req(cand['audit']==par['audit'],'audit-only learner-flow metrics drift')
req(cand['counts']==[20,16,4] and cand['seconds']==6000 and cand['pool']==43 and cand['high']==15 and cand['floor']==4,'final contract drift')
req(cand['remediation']=={'algorithm':43,'security':15,'algoBad':0,'secBad':0},'remediation drift')
req(cand['sem'].get('ok') is True,'Subject B semantic validation failed')
req((cand.get('spec') or {}).get('findingResolved')=='subject_b_final_security_long_run_coverage_gap','v239 repair spec missing')

a=cand['audit']
findings=[]
if a['all15By5']<a['cohorts']:
    findings.append(('High','subject_b_security_coverage_regressed','Not every cohort covers all 15 security scenarios by the fifth final.'))
if not a['allBlocksValid']:
    findings.append(('High','subject_b_security_format_boundary_invalid','A simulated final violated 4 unique security questions / 1..3 per format / block order.'))
if a['exactRepeatCount']>0:
    findings.append(('Medium','subject_b_security_exact_adjacent_block_repeat','An identical four-scenario security block repeated on adjacent finals.'))
if a['first5Overlap']['max']>=3 or a['first5Overlap']['mean']>1.0:
    findings.append(('Medium','subject_b_security_early_adjacent_overlap_high','Adjacent repetition before full coverage is higher than the post-repair learning target.'))

priority={'High':3,'Medium':2,'Low':1}
findings.sort(key=lambda x:-priority[x[0]])
result='PASS — NO FINDINGS' if not findings else f"PASS — {findings[0][0].upper()} FINDING RECORDED"
fixture={'version':version,'previous':previous,'parent':parent,'result':result,'findings':[{'priority':p,'marker':m,'detail':d} for p,m,d in findings],'metrics':a,'behaviorSignature':cand['signature'],'finalContracts':{'counts':cand['counts'],'seconds':cand['seconds'],'pool':cand['pool'],'highTrace':cand['high'],'floor':cand['floor']},'remediation':cand['remediation'],'semanticOK':True}
Path('_regression').mkdir(exist_ok=True)
Path(f'_regression/subject-b-final-security-rotation-post-repair-audit-{version}.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
find_text='none' if not findings else '\n'.join(f'- {p}: {m} — {d}' for p,m,d in findings)
audit=f'''FE QUEST {version} — Subject B Final Security Rotation Post-Repair Audit\n=======================================================================\n\nResult\n------\n{result}\nPrevious release: {previous}\nSource main: {parent}\nLearner-facing change in {version}: none\n\nCoverage and format flow\n------------------------\nCohorts simulated: {a['cohorts']} / 10 finals each\nAll 15 security scenarios covered by final 5: {a['all15By5']} / {a['cohorts']}\nMinimum cumulative coverage by session: {a['minCoverage']}\nMaximum cumulative coverage by session: {a['maxCoverage']}\nQuota distribution by session: {json.dumps(a['quotaBySession'],ensure_ascii=False)}\nEvery final kept four unique security questions, 1..3 from each format, algorithm block first and security block last: {'yes' if a['allBlocksValid'] else 'no'}\n\nAdjacent repetition\n-------------------\nBefore full coverage (session pairs 1→2 through 4→5): mean overlap {a['first5Overlap']['mean']:.3f} / 4, max {a['first5Overlap']['max']}, zero-overlap pairs {a['first5Overlap']['zero']} / {a['first5Overlap']['total']}\nAfter coverage window (session pairs 5→6 through 9→10): mean overlap {a['lateOverlap']['mean']:.3f} / 4, max {a['lateOverlap']['max']}, zero-overlap pairs {a['lateOverlap']['zero']} / {a['lateOverlap']['total']}\nExact adjacent four-question block repeats: {a['exactRepeatCount']}\n\nRegression\n----------\nCandidate repeated-final behavior signature vs v239: identical (500 deterministic six-final histories).\nFinal contract: 100 min / 20 total / 16 algorithm + 4 security / algorithm pool 43 / high-trace 15 / floor 4.\nRemediation: algorithm 43/43, security 15/15.\nSubject B semantic diagnostics: OK.\n\nFindings\n--------\n{find_text}\n\nDecision\n--------\nIf no finding is recorded, close the v237-v240 security rotation sequence and move to a new learner-value frontier rather than tuning the selector further. If a Medium/High finding is recorded, repair only the evidenced repetition boundary and preserve the v239 five-final coverage gain.\n'''
Path('audits').mkdir(exist_ok=True)
Path(f'audits/SUBJECT_B_FINAL_SECURITY_ROTATION_POST_REPAIR_AUDIT_{version}.txt').write_text(audit)
print(audit)

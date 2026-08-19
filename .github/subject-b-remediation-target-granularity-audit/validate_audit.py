from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-remediation-target-granularity-audit-(v(\d+))',branch)
    req(m,'bad Subject B remediation target granularity audit branch')
    version=m.group(1)
    return version,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function bankHash(){let h=2166136261>>>0;for(const q of B_EXAM_ALGO_ITEMS){h=hashText(h,JSON.stringify([q.id,q.domain,q.level,q.format,q.title,q.q,q.options,q.a]));}for(const x of B_EXERCISES){h=hashText(h,JSON.stringify([x.id,x.title,x.desc,x.code,x.steps]));}return h>>>0;}
function algoAudit(){
  const exMap=new Map(B_EXERCISES.map(x=>[x.id,x]));
  const reasons=['','トレースミス','コード理解','読み違い','知識不足','時間不足'];
  const rows=B_EXAM_ALGO_ITEMS.map(src=>{
    const d=makeFinalAlgoExam(src);
    const t=bFinalRemediationTarget(d.studyMode,d.sourceId,d.domain);
    const ex=t&&t.id?exMap.get(t.id):null;
    const metas={};
    for(const r of reasons){
      let m=null;
      try{m=bFinalReviewReasonMeta(r,d);}catch(e){m=['',''];}
      metas[r||'(none)']=Array.isArray(m)?m.map(String):[String(m||''),''];
    }
    const allMeta=Object.values(metas).flat().join(' ');
    return {sourceId:d.sourceId,domain:d.domain||'',format:d.format||'',title:d.title||'',q:d.q||'',target:t||null,targetTitle:ex?.title||'',targetDesc:ex?.desc||'',metas,
      metaMentionsTarget:!!(ex?.title&&allMeta.includes(ex.title)),
      timeMeta:metas['時間不足']||['','']};
  });
  const groups={};
  for(const r of rows){
    const id=r.target?.id||'(missing)';
    if(!groups[id])groups[id]={id,count:0,domains:new Set(),formats:new Set(),sources:[],targetTitle:r.targetTitle};
    const g=groups[id];g.count++;g.domains.add(r.domain);g.formats.add(r.format);g.sources.push(r.sourceId);
  }
  const clusters=Object.values(groups).map(g=>({id:g.id,count:g.count,domains:[...g.domains].sort(),formats:[...g.formats].sort(),sources:g.sources,targetTitle:g.targetTitle})).sort((a,b)=>b.count-a.count||a.id.localeCompare(b.id));
  const modeWords=s=>({mini:/ミニ模試/.test(s),compound:/複合/.test(s),trace:/TRACE|トレース/.test(s),time:/時間/.test(s)});
  const reasonRouteMismatches=[];
  for(const r of rows){
    const actual=r.target?.mode||'';
    for(const [reason,meta] of Object.entries(r.metas)){
      const txt=meta.join(' '),w=modeWords(txt);
      if(actual==='trace'&&(w.mini||w.compound))reasonRouteMismatches.push({sourceId:r.sourceId,reason,actual,meta});
      if(actual==='miniMock'&&w.trace)reasonRouteMismatches.push({sourceId:r.sourceId,reason,actual,meta});
    }
  }
  return {rows,clusters,uniqueTargets:clusters.filter(x=>x.id!=='(missing)').length,maxCluster:Math.max(...clusters.map(x=>x.count)),mixedDomainClusters:clusters.filter(x=>x.domains.length>1),missing:rows.filter(x=>!x.target||x.target.mode!=='trace'||!x.target.id||!exMap.has(x.target.id)),metaTargetNamed:rows.filter(x=>x.metaMentionsTarget).length,reasonRouteMismatches,renderer:String(renderBFinalResult),reasonMetaSource:String(bFinalReviewReasonMeta),targetSource:String(bFinalRemediationTarget)};
}
function securityAudit(){const ids=new Set(SECURITY_SCENARIOS.map(x=>x.id));const rows=SECURITY_SCENARIOS.map(x=>{const d=makeFinalSecurity(x),t=bFinalRemediationTarget(d.studyMode,d.sourceId,d.concept||'情報セキュリティ');return {sourceId:d.sourceId,target:t};});return {count:rows.length,bad:rows.filter(x=>!x.target||x.target.mode!=='security'||x.target.id!==x.sourceId||!ids.has(x.target.id))};}
const a=algoAudit(),s=securityAudit();
console.log('__V242__'+Buffer.from(JSON.stringify({v:APP_VERSION,algo:a,security:s,bankHash:bankHash(),contracts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-7000:])
        m=re.search(r'__V242__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=ctx()
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v242' and previous=='v241','v242 audit expects v241 parent')
expected={'.github/subject-b-remediation-target-granularity-audit/validate_audit.py','.github/workflows/subject-b-remediation-target-granularity-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(changed==expected,'v242 audit-only source drift: '+repr(sorted(changed^expected)))

cand=runtime('_site/index.html');par=runtime('_site_parent/index.html')
req(cand['v']==version and par['v']==previous,'runtime versions')
req(cand['bankHash']==par['bankHash'],'audit-only question/TRACE bank drift')
req(cand['algo']['rows']==par['algo']['rows'],'audit-only remediation mapping drift')
req(cand['contracts']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['security']['count']==15 and not cand['security']['bad'],'security remediation drift')
req(cand['sem'].get('ok') is True,'Subject B semantic validation failed')

a=cand['algo']; findings=[]
if a['missing']:
    findings.append(('High','subject_b_algorithm_remediation_target_unreachable',f"{len(a['missing'])} final algorithm items do not resolve to an existing TRACE target."))
if a['mixedDomainClusters']:
    findings.append(('Medium','subject_b_remediation_target_cross_domain_collapse',f"{len(a['mixedDomainClusters'])} TRACE target clusters mix multiple final-item domains."))
if a['reasonRouteMismatches']:
    findings.append(('Medium','subject_b_review_reason_action_route_mismatch',f"{len(a['reasonRouteMismatches'])} review reason/action messages name a different practice mode from the route actually launched."))
if a['maxCluster']>=9:
    findings.append(('Low','subject_b_remediation_target_granularity_coarse',f"Largest TRACE recovery target absorbs {a['maxCluster']} of 43 final algorithm items."))

priority={'High':3,'Medium':2,'Low':1};findings.sort(key=lambda x:-priority[x[0]])
result='PASS — NO FINDINGS' if not findings else f"PASS — {findings[0][0].upper()} FINDING RECORDED"
fixture={'version':version,'previous':previous,'parent':parent,'result':result,'findings':[{'priority':p,'marker':m,'detail':d} for p,m,d in findings],'uniqueTraceTargets':a['uniqueTargets'],'maxCluster':a['maxCluster'],'clusters':a['clusters'],'metaTargetNamed':a['metaTargetNamed'],'reasonRouteMismatches':a['reasonRouteMismatches'],'mixedDomainClusters':a['mixedDomainClusters'],'security':cand['security'],'contracts':cand['contracts'],'bankHash':cand['bankHash'],'semanticOK':True,'source':{'target':a['targetSource'],'reasonMeta':a['reasonMetaSource'],'renderer':a['renderer']}}
Path('_regression').mkdir(exist_ok=True)
Path(f'_regression/subject-b-remediation-target-granularity-audit-{version}.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
find_text='none' if not findings else '\n'.join(f'- {p}: {m} — {d}' for p,m,d in findings)
cluster_text='\n'.join(f"- {g['id']} ({g['targetTitle']}): {g['count']} items / domains {', '.join(g['domains'])} / formats {', '.join(g['formats'])}" for g in a['clusters'])
audit=f'''FE QUEST {version} — Subject B Remediation Target Granularity Audit\n===============================================================\n\nResult\n------\n{result}\nPrevious release: {previous}\nSource main: {parent}\nLearner-facing change in {version}: none\n\nAlgorithm recovery target topology\n----------------------------------\nFinal algorithm items: 43\nReachable TRACE targets: {a['uniqueTargets']}\nLargest target cluster: {a['maxCluster']} items\nTarget clusters mixing multiple final-item domains: {len(a['mixedDomainClusters'])}\nReview reason/action messages that name a different practice mode from the launched route: {len(a['reasonRouteMismatches'])}\nRows whose review advice explicitly names the exact TRACE exercise title: {a['metaTargetNamed']} / 43\n\nCluster detail\n--------------\n{cluster_text}\n\nSecurity recovery\n-----------------\nSecurity final remediation targets: {cand['security']['count']-len(cand['security']['bad'])}/{cand['security']['count']} direct and valid.\n\nRegression\n----------\nQuestion/TRACE bank hash vs v241: identical.\nFinal contract: 100 min / 20 total / 16 algorithm + 4 security / algorithm pool 43 / high-trace 15 / floor 4.\nSubject B semantic diagnostics: OK.\n\nFindings\n--------\n{find_text}\n\nDecision\n--------\nIf clean, the 43→TRACE recovery mapping is coarse only where it remains within one domain and does not contradict the learner-facing reason/action copy; keep the current mapping and move to the review UI's destination preview/actionability. If a finding is recorded, repair only the evidenced cluster or reason-to-route mismatch without changing scoring, question selection, timing, readiness thresholds, or the v239 security rotation behavior.\n'''
Path('audits').mkdir(exist_ok=True)
Path(f'audits/SUBJECT_B_REMEDIATION_TARGET_GRANULARITY_AUDIT_{version}.txt').write_text(audit)
print(audit)

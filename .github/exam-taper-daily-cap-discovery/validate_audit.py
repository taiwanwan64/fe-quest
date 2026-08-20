from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'exam-taper-daily-cap-discovery-(v(\d+))',b);req(m,'bad v323 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
const src={taperStudyCap:String(taperStudyCap),taperTaskAllocation:String(taperTaskAllocation),taskAllocation:String(taskAllocation),examStudyPhase:String(examStudyPhase)};
const safe=(fn,args)=>{try{return {ok:true,value:fn(...args)}}catch(e){return {ok:false,error:String(e)}}};
const probes={};
const tuples=[[60],[90],[14],[7],[3],[1],[0],[60,14],[60,7],[60,3],[60,1],[60,0],[14,60],[7,60],[3,60],[1,60],[0,60]];
for(const [name,fn] of [['taperStudyCap',taperStudyCap],['taperTaskAllocation',taperTaskAllocation]])probes[name]=tuples.map(args=>({args,...safe(fn,args)}));
console.log('__V323__'+Buffer.from(JSON.stringify({v:APP_VERSION,src,lengths:{taperStudyCap:taperStudyCap.length,taperTaskAllocation:taperTaskAllocation.length,taskAllocation:taskAllocation.length,examStudyPhase:examStudyPhase.length},probes,sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-12000:]);m=re.search(r'__V323__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v323','v322'),'expects v323');parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
p322=Path('_regression/exam-tapering-integrity-simulation-v322.fixture.json');req(p322.exists(),'v322 fixture missing');req(json.loads(p322.read_text()).get('result')=='PASS — EXAM TAPERING GUARDS INTACT','v322 result')
expected={'.github/exam-taper-daily-cap-discovery/validate_audit.py','.github/workflows/exam-taper-daily-cap-discovery.yml'};generated={'index.html','manifest.webmanifest','sw.js','_regression/exam-taper-daily-cap-discovery-v323.fixture.json','audits/EXAM_TAPER_DAILY_CAP_DISCOVERY_v323.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v323' and par['v']=='v322','versions');req(cand['src']==par['src'] and cand['lengths']==par['lengths'],'audit-only helper drift');req(cand['sem'].get('ok') is True and par['sem'].get('ok') is True,'semantic')
req(cand['lengths']['taperStudyCap']>=1,'taperStudyCap signature unresolved');req(cand['lengths']['taperTaskAllocation']>=1,'taperTaskAllocation signature unresolved')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
summary={'helperLengths':cand['lengths'],'sources':cand['src'],'probes':cand['probes'],'interpretation':'The production taper cap helpers are now captured verbatim and probed with one- and two-argument forms. This is discovery evidence only: the next simulation should use the actual signatures and values shown here rather than guessing a 45/30/15 contract.','decision':'USE DISCOVERED HELPER SIGNATURES/OUTPUTS FOR END-TO-END DAILY-PLAN SIMULATION'}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — TAPER DAILY-CAP HELPERS DISCOVERED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/exam-taper-daily-cap-discovery-v323.fixture.json').write_text(json.dumps(fixture,ensure_ascii=True,indent=2)+'\n');summary_text=json.dumps(summary,ensure_ascii=True,indent=2)
audit=f'''FE QUEST v323 — Exam Taper Daily-Cap Discovery\n================================================\n\nResult\n------\nPASS — TAPER DAILY-CAP HELPERS DISCOVERED\nPrevious release: v322\nSource main: {parent}\nLearner-facing change: none\n\nPurpose\n-------\nResolve the exact production signatures and behavior of taperStudyCap and taperTaskAllocation after v322 confirmed that explicit taper-budget helpers exist. No cap values are assumed in advance.\n\nSummary\n-------\n{summary_text}\n\nRegression\n----------\nLearner-facing behavior and taper helpers are unchanged from v322.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\nUse the discovered helper signatures and observed outputs for the next end-to-end daily-plan simulation. Do not change tapering behavior from discovery evidence alone.\n''';Path('audits').mkdir(exist_ok=True);Path('audits/EXAM_TAPER_DAILY_CAP_DISCOVERY_v323.txt').write_text(audit);print(audit)

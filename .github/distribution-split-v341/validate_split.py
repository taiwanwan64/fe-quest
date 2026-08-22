from pathlib import Path
import base64,hashlib,json,os,re,runpy,subprocess,tempfile

V='v341';P='v340'

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def sha(b): return hashlib.sha256(b).hexdigest()
def scripts_inline(path):
    h=Path(path).read_text()
    return '\n'.join(x for x in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if x.strip() and not x.lstrip().startswith('{'))

def runtime(js):
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
const C=require('crypto');const H=v=>C.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const safe=f=>{try{return {ok:true,value:f()}}catch(e){return {ok:false,error:String(e&&e.stack||e)}}};
const fhash=n=>safe(()=>H(String(eval(n))));
const compact=t=>t?{type:t.type||null,title:t.title||null,minutes:Number(t.minutes)||0,bmode:t.bmode||null,bid:t.bid||null,lessonId:t.lessonId||null}:null;
const out={
 version:APP_VERSION,
 questionCount:QUESTION_BANK.length,
 questionHash:H(QUESTION_BANK),
 answerDistribution:[0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length),
 cognitiveDistribution:['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length),
 subjectBHash:H([B_EXERCISES,SECURITY_SCENARIOS,B_EXAM_ALGO_ITEMS,B_COMPOUND_SETS]),
 subjectBSemantics:safe(()=>validateSubjectBSemantics()),
 today:safe(()=>buildTodayTasks().map(compact)),
 functionHashes:Object.fromEntries(['buildTodayTasks','effectiveStudyMinutes','taskAllocation','examDaysRemaining','firstRunNeedsSetupV340','firstRunHasLearningHistoryV340'].map(n=>[n,fhash(n)])),
 firstRunNeed:safe(()=>firstRunNeedsSetupV340()),
 profileKeys:Object.keys(profile||{}).sort(),settingsKeys:Object.keys(profile?.settings||{}).sort(),
 self:safe(()=>({ok:FEQUEST_SELF_CHECK?.ok,current:FEQUEST_SELF_CHECK?.currentContract,browser:FEQUEST_SELF_CHECK?.browserUiContract,releaseVersion:FEQUEST_SELF_CHECK?.releaseVersion})),
 contracts:globalThis.FEQUEST_RUNTIME_CONTRACTS||{count:0}
};
console.log('__V341__'+Buffer.from(JSON.stringify(out)).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'run.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node','--check',str(p)],capture_output=True,text=True);req(z.returncode==0,'node check '+z.stderr[-8000:])
        z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'node runtime '+z.stderr[-12000:])
        m=re.search(r'__V341__([A-Za-z0-9+/=]+)',z.stdout);req(m is not None,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))

branch=os.environ.get('GITHUB_HEAD_REF') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
req(branch=='distribution-split-v341','unexpected branch '+branch)
parent_sha=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()

inline=Path('_site/index.html').read_text(); final=Path('_site_split/index.html').read_text()
css=Path('_site_split/assets/app-v341.css').read_bytes(); jsb=Path('_site_split/assets/app-v341.js').read_bytes(); js=jsb.decode()
manifest=json.loads(Path('_site_split/assets/asset-manifest-v341.json').read_text())

req(len(inline.encode())>3_500_000,'inline baseline unexpectedly small')
req(len(final.encode())<150_000,'split HTML target missed: '+str(len(final.encode())))
req('<style' not in final.lower(),'inline style remains in final HTML')
req(not re.search(r'<script(?![^>]*\bsrc=)[^>]*>.*?</script>',final,re.S|re.I),'inline script remains in final HTML')
style_tag='<link rel="stylesheet" href="./assets/app-v341.css">'
script_tag='<script src="./assets/app-v341.js"></script>'
req(final.count(style_tag)==1 and final.count(script_tag)==1,'external asset tags')
req(f'<title>FE QUEST PWA {V}</title>' in final,'final title')
req("const APP_VERSION = 'v341';" in js,'external JS version')
req(len(css)==231671,'CSS byte drift')
req(len(jsb)>3_300_000,'JS payload unexpectedly small')

reconstructed=final.replace(style_tag,'<style>'+css.decode()+'</style>',1).replace(script_tag,'<script>'+js+'</script>',1)
req(reconstructed.rstrip()==inline.rstrip(),'externalization is not byte-reconstructable')
req(manifest.get('version')==V,'asset manifest version')
for item in manifest.get('assets',[]):
    p=Path('_site_split')/item['path'];req(p.exists(),'manifest asset missing '+item['path'])
    b=p.read_bytes();req(len(b)==item['utf8Bytes'] and sha(b)==item['sha256'],'manifest identity '+item['path'])
req(manifest['sourceInlineIndex']['sha256']==sha(inline.encode()),'inline source hash mismatch')

sw=Path('_site_split/sw.js').read_text()
for token in ["const APP_VERSION = 'v341';","fe-quest-v341-1","'./assets/app-v341.css'","'./assets/app-v341.js'","'./assets/asset-manifest-v341.json'",'staleWhileRevalidate','networkWithTimeout']:
    req(token in sw,'SW contract '+token)
req(not Path('_site_split/_regression').exists(),'regression files deployed')
req(not Path('_site_split/.github').exists(),'tooling deployed')

cand=runtime(js)
par=runtime(scripts_inline('_site_parent/index.html'))
req(cand['version']==V and par['version']==P,'runtime versions')
for k in ['questionCount','questionHash','answerDistribution','cognitiveDistribution','subjectBHash','today','functionHashes','profileKeys','settingsKeys']:
    req(cand[k]==par[k],'runtime semantic drift '+k)
req(cand['questionCount']==710,'question count')
req(cand['answerDistribution']==[178,178,177,177],'answer distribution')
req(cand['cognitiveDistribution']==[166,323,221],'cognitive distribution')
req(cand['subjectBSemantics']['ok'] and cand['subjectBSemantics']['value'].get('ok') is True,'Subject B semantics')
req(cand['firstRunNeed']['ok'] and cand['firstRunNeed']['value'] is True,'fresh first-run contract')
req((cand.get('contracts') or {}).get('count',0)==0,'runtime contract failures')
req(cand['self']['ok'] and cand['self']['value']['ok'] is True,'self check')
req(cand['self']['value']['current'].get('total')==71 and cand['self']['value']['current'].get('passed')==71,'current contract')
req(cand['self']['value']['browser'].get('total')==23,'browser UI contract')

source_index=Path('index.html').read_text()
req(source_index=='---\n---\n{% include_relative app/base-shell-v341.html %}\n','root source not minimal shell include')
req(Path('app/base-shell-v341.html').exists(),'base shell source missing')
req(Path('assets/app-v341.css').exists() and Path('assets/app-v341.js').exists(),'source assets missing')

summary={
 'inlineHtmlBytes':len(inline.encode()),'splitHtmlBytes':len(final.encode()),
 'htmlReductionBytes':len(inline.encode())-len(final.encode()),
 'htmlReductionPercent':round((1-len(final.encode())/len(inline.encode()))*100,2),
 'cssBytes':len(css),'jsBytes':len(jsb),
 'byteReconstructable':True,'offlineAssetCacheContract':True,
 'questionCount':710,'questionBankUnchanged':True,'subjectBContentUnchanged':True,
 'adaptivePlannerContractUnchanged':True,'profileSchemaUnchanged':True,'subjectBSemanticOK':True,
 'freshFirstRunContractPreserved':True,'runtimeContractFailures':0
}
fixture={'name':'distribution-split-v341','version':V,'previous':P,'parentMainSha':parent_sha,'result':'PASS — 3.68MB INLINE DOCUMENT SPLIT INTO A SMALL HTML SHELL + CACHED CSS/JS WITHOUT LEARNING SEMANTIC DRIFT','summary':summary,'assetManifest':manifest}
Path('_regression').mkdir(exist_ok=True);Path('_regression/distribution-split-v341.fixture.json').write_text(json.dumps(fixture,ensure_ascii=True,indent=2)+'\n')
report=f'''# FE QUEST v341 — Distribution split validation\n\nResult: **{fixture['result']}**\n\n- inline v341 HTML: **{summary['inlineHtmlBytes']:,} bytes**\n- split HTML: **{summary['splitHtmlBytes']:,} bytes**\n- HTML reduction: **{summary['htmlReductionPercent']}%**\n- external CSS: **{summary['cssBytes']:,} bytes**\n- external classic JS: **{summary['jsBytes']:,} bytes**\n- split HTML + CSS + JS can reconstruct the approved inline v341 document byte-for-byte (trailing newline ignored)\n- Service Worker APP_SHELL precaches CSS / JS / asset manifest\n- existing PWA navigation fallback + stale-while-revalidate retained\n- 科目A 710問 / 正答分布 / cognitive distribution unchanged\n- QUESTION_BANK / Subject B content hashes unchanged vs v340 parent\n- `buildTodayTasks()` / study-minute allocation / exam-day functions unchanged\n- profile/settings key contract unchanged\n- Subject B semantics: OK\n- fresh first-run setup contract: preserved\n- runtime non-destructive contract failures: 0\n\nThe v341 cutover keeps the old large source modules in the repository as migration/reference material, but production `index.html` now contains only front matter + one `base-shell-v341.html` include. The delivered page loads one external stylesheet and one synchronous classic script at the same document positions as the former inline tags.\n'''
Path('audits/DISTRIBUTION_SPLIT_v341.md').write_text(report)
print(report)

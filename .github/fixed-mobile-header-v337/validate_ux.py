from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'fixed-mobile-header-(v(\d+))',branch)
    req(m is not None,'bad v337 fixed mobile header branch')
    version=m.group(1); number=int(m.group(2))
    return version,f'v{number-1}'


def scripts(path):
    html=Path(path).read_text()
    return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))


def runtime(path):
    js=scripts(path)
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function fn(name){try{const v=eval(name);return typeof v==='function'?String(v):null}catch(e){return null}}
function value(name){try{return eval(name)}catch(e){return null}}
const hasV337=typeof applyFixedMobileHeaderV337==='function';
const out={
  v:APP_VERSION,
  spec:hasV337?value('FIXED_MOBILE_HEADER_SPEC_V337'):null,
  styleFn:hasV337?fn('installFixedMobileHeaderStyleV337'):null,
  findFn:hasV337?fn('findFixedMobileHeaderV337'):null,
  measureFn:hasV337?fn('measureFixedMobileHeaderV337'):null,
  applyFn:hasV337?fn('applyFixedMobileHeaderV337'):null,
  installFn:hasV337?fn('installFixedMobileHeaderV337'):null,
  bankSignature:QUESTION_BANK.map(q=>[q.id,q.cat,q.concept,q.difficulty,q.cognitiveLevel,q.q,q.options,q.a,q.exp,q.hint,q.choiceExps]),
  subjectBSemantics:validateSubjectBSemantics()
};
console.log('__V337_HEADER__'+Buffer.from(JSON.stringify(out)).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'runtime.js'; p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed '+z.stderr[-9000:])
        m=re.search(r'__V337_HEADER__([A-Za-z0-9+/=]+)',z.stdout)
        req(m is not None,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=context()
req((version,previous)==('v337','v336'),'expects v337 over v336')

required={
    'app/fixed-mobile-header-overrides-v337.txt',
    'index.html','manifest.webmanifest','sw.js',
    '.github/fixed-mobile-header-v337/prepare_reference.py',
    '.github/fixed-mobile-header-v337/validate_ux.py',
    '.github/workflows/fixed-mobile-header-v337.yml',
}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(required<=changed,'missing intended v337 files '+repr(sorted(required-changed)))
req(changed<=required,'unexpected v337 drift '+repr(sorted(changed-required)))

cand=runtime('_site/index.html')
par=runtime('_site_parent/index.html')
req(cand['v']=='v337' and par['v']=='v336','runtime versions')
req(par['spec'] is None,'parent unexpectedly contains v337 header feature')
req(cand['bankSignature']==par['bankSignature'],'question bank/content drift')
req(cand['subjectBSemantics'].get('ok') is True and par['subjectBSemantics'].get('ok') is True,'Subject B semantic regression')

expected={
    'scope':'mobile-app-header-persistence',
    'mobileMaxWidth':720,
    'headerMode':'fixed',
    'safeAreaAware':True,
    'measuredFlowReservation':True,
    'desktopBehavior':'preserve-existing-sticky',
}
req(cand['spec']==expected,'v337 header spec drift '+json.dumps(cand['spec'],ensure_ascii=False,sort_keys=True))

style=cand['styleFn'] or ''
find=cand['findFn'] or ''
measure=cand['measureFn'] or ''
apply=cand['applyFn'] or ''
install=cand['installFn'] or ''
compact=style.replace(' ','')
for token in ['@media(max-width:720px)','position:fixed','top:0','left:0','right:0','z-index:1400','env(safe-area-inset-top)','padding-top:var(']:
    req(token.replace(' ','') in compact,'v337 fixed-header style contract missing '+token)
for token in ['findAppHeaderV336','FE QUEST','querySelectorAll']:
    req(token in find,'v337 header discovery missing '+token)
for token in ['getBoundingClientRect','offsetHeight','setProperty','FIXED_MOBILE_HEADER_SPACE_VAR_V337']:
    req(token in measure,'v337 flow reservation measurement missing '+token)
for token in ['isFixedMobileHeaderModeV337','fequest-fixed-mobile-header-v337','fequest-fixed-mobile-header-space-v337','measureFixedMobileHeaderV337']:
    req(token in apply,'v337 mobile application contract missing '+token)
for token in ['resize','orientationchange','visualViewport','MutationObserver']:
    req(token in install,'v337 resilient refresh missing '+token)

release_files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in release_files),'candidate/reference six-file mismatch')
print('PASS — FE QUEST v337 fixed mobile header validated')

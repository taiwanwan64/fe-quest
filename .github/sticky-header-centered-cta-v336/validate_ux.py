from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'sticky-header-centered-cta-(v(\d+))',branch)
    req(m is not None,'bad v336 UX branch')
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
const hasV336=typeof isLearningCompletionCtaV336==='function';
const out={
  v:APP_VERSION,
  spec:hasV336?value('STICKY_HEADER_CENTERED_CTA_SPEC_V336'):null,
  matcher:hasV336?{
    exact:isLearningCompletionCtaV336({textContent:'学習完了 → 問題演習'}),
    compact:isLearningCompletionCtaV336({textContent:'学習完了→問題演習'}),
    next:isLearningCompletionCtaV336({textContent:'次の問題 →'}),
    answer:isLearningCompletionCtaV336({textContent:'回答する'})
  }:null,
  findFn:hasV336?fn('findAppHeaderV336'):null,
  ctaFn:hasV336?fn('applyLearningCompletionCtaCenteringV336'):null,
  styleFn:hasV336?fn('installStickyHeaderCenteredCtaStyleV336'):null,
  refreshFn:hasV336?fn('refreshStickyHeaderCenteredCtaV336'):null,
  installFn:hasV336?fn('installStickyHeaderCenteredCtaV336'):null,
  bankSignature:QUESTION_BANK.map(q=>[q.id,q.cat,q.concept,q.difficulty,q.cognitiveLevel,q.q,q.options,q.a,q.exp,q.hint,q.choiceExps]),
  subjectBSemantics:validateSubjectBSemantics()
};
console.log('__V336_UX__'+Buffer.from(JSON.stringify(out)).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'runtime.js'; p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed '+z.stderr[-9000:])
        m=re.search(r'__V336_UX__([A-Za-z0-9+/=]+)',z.stdout)
        req(m is not None,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=context()
req((version,previous)==('v336','v335'),'expects v336 over v335')

required={
    'app/sticky-header-centered-cta-overrides-v336.txt',
    'index.html','manifest.webmanifest','sw.js',
    '.github/sticky-header-centered-cta-v336/prepare_reference.py',
    '.github/sticky-header-centered-cta-v336/validate_ux.py',
    '.github/workflows/sticky-header-centered-cta-v336.yml',
}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(required<=changed,'missing intended v336 files '+repr(sorted(required-changed)))
req(changed<=required,'unexpected v336 drift '+repr(sorted(changed-required)))

cand=runtime('_site/index.html')
par=runtime('_site_parent/index.html')
req(cand['v']=='v336' and par['v']=='v335','runtime versions')
req(par['spec'] is None,'parent unexpectedly contains v336 UX feature')
req(cand['bankSignature']==par['bankSignature'],'question bank/content drift')
req(cand['subjectBSemantics'].get('ok') is True and par['subjectBSemantics'].get('ok') is True,'Subject B semantic regression')

expected={
    'scope':'persistent-app-header-and-learning-completion-cta',
    'headerMode':'sticky',
    'headerTop':0,
    'semanticHeaderDetection':True,
    'semanticCtaDetection':True,
    'centeredLearningCompletionCta':True,
}
req(cand['spec']==expected,'v336 UX spec drift '+json.dumps(cand['spec'],ensure_ascii=False,sort_keys=True))

matcher=cand['matcher'] or {}
req(matcher.get('exact') is True and matcher.get('compact') is True,'learning completion CTA must be detected')
req(matcher.get('next') is False and matcher.get('answer') is False,'centering matcher leaked to unrelated buttons')

find=cand['findFn'] or ''
cta=cand['ctaFn'] or ''
style=cand['styleFn'] or ''
install=cand['installFn'] or ''
for token in ['FE QUEST','querySelectorAll','parentElement']:
    req(token in find,'semantic header detection missing '+token)
for token in ['fequest-centered-learning-cta-v336','querySelectorAll']:
    req(token in cta,'learning CTA centering missing '+token)
compact=style.replace(' ','')
for token in ['position:sticky','top:0','z-index:1200','margin-left:auto','margin-right:auto','justify-content:center']:
    req(token.replace(' ','') in compact,'v336 style contract missing '+token)
for token in ['installStickyHeaderCenteredCtaStyleV336','refreshStickyHeaderCenteredCtaV336','MutationObserver','childList:true','subtree:true']:
    req(token.replace(' ','') in install.replace(' ',''),'v336 installer contract missing '+token)

release_files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in release_files),'candidate/reference six-file mismatch')
print('PASS — FE QUEST v336 persistent header + centered learning completion CTA validated')

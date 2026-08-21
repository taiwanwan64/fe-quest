from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'global-scroll-and-centered-cta-(v(\d+))',branch)
    req(m is not None,'bad v335 UX branch')
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
function label(s){try{return typeof isForwardTransitionButtonV335==='function'?isForwardTransitionButtonV335({textContent:s}):null}catch(e){return null}}
const out={
  v:APP_VERSION,
  spec:value('GLOBAL_TRANSITION_UX_SPEC_V335'),
  scrollFn:fn('scrollViewportTopV335'),
  forwardFn:fn('isForwardTransitionButtonV335'),
  centerFn:fn('installCenteredPrimaryCtaV335'),
  screenFn:fn('installScreenTransitionScrollV335'),
  installFn:fn('installGlobalTransitionUxV335'),
  labels:{
    nextQuestion:label('次の問題 →'),
    next:label('次へ'),
    lessonToQuiz:label('学習完了 → 問題演習'),
    retry:label('もう一度回答する'),
    result:label('結果を見る'),
    start:label('今日の復習を始める'),
    answer:label('回答する'),
    detail:label('詳細を表示')
  },
  bankSignature:QUESTION_BANK.map(q=>[q.id,q.cat,q.concept,q.difficulty,q.cognitiveLevel,q.q,q.options,q.a,q.exp,q.hint,q.choiceExps]),
  subjectBSemantics:validateSubjectBSemantics()
};
console.log('__V335_UX__'+Buffer.from(JSON.stringify(out)).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'runtime.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed '+z.stderr[-9000:])
        m=re.search(r'__V335_UX__([A-Za-z0-9+/=]+)',z.stdout)
        req(m is not None,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=context()
req((version,previous)==('v335','v334'),'expects v335 over v334')

required={
    'app/global-transition-ux-overrides-v335.txt',
    'index.html','manifest.webmanifest','sw.js',
    '.github/global-transition-ux-v335/prepare_reference.py',
    '.github/global-transition-ux-v335/validate_ux.py',
    '.github/workflows/global-transition-ux-v335.yml',
}
allowed=required|{'.github/workflows/review-next-scroll-top-v334.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(required<=changed,'missing intended v335 files '+repr(sorted(required-changed)))
req(changed<=allowed,'unexpected v335 drift '+repr(sorted(changed-allowed)))

cand=runtime('_site/index.html')
par=runtime('_site_parent/index.html')
req(cand['v']=='v335' and par['v']=='v334','runtime versions')
req(par['spec'] is None,'parent unexpectedly contains v335 UX feature')
req(cand['bankSignature']==par['bankSignature'],'question bank/content drift')
req(cand['subjectBSemantics'].get('ok') is True and par['subjectBSemantics'].get('ok') is True,'Subject B semantic regression')

spec=cand['spec'] or {}
req(spec.get('scope')=='screen-and-forward-content-transitions','scope drift')
req(spec.get('scrollTarget')=='window-top' and spec.get('scrollBehavior')=='auto','scroll contract drift')
req(spec.get('screenTransitions') is True and spec.get('forwardButtonTransitions') is True,'transition coverage drift')
req(spec.get('centeredSelectors')==['.quiz-actions.single-primary #quizSubmit','.sec-next'],'center selector drift')

labels=cand['labels'] or {}
for key in ['nextQuestion','next','lessonToQuiz','retry','result','start']:
    req(labels.get(key) is True,'expected forward label not covered: '+key)
for key in ['answer','detail']:
    req(labels.get(key) is False,'non-transition action must not force top scroll: '+key)

scroll=cand['scrollFn'] or ''
center=cand['centerFn'] or ''
screen=cand['screenFn'] or ''
install=cand['installFn'] or ''
for token in ['window.scrollTo','top:0','requestAnimationFrame','document.scrollingElement']:
    req(token.replace(' ','') in scroll.replace(' ',''),'scroll implementation missing '+token)
for token in ['justify-content:center','margin-left:auto','margin-right:auto','.quiz-actions.single-primary #quizSubmit','.sec-next']:
    req(token.replace(' ','') in center.replace(' ',''),'centered CTA contract missing '+token)
for token in ['MutationObserver',"querySelectorAll('.screen')",'attributeFilter']:
    req(token.replace(' ','') in screen.replace(' ',''),'screen-transition observer missing '+token)
req('installForwardTransitionScrollV335' in install and 'installScreenTransitionScrollV335' in install and 'installCenteredPrimaryCtaV335' in install,'installer contract incomplete')

release_files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in release_files),'candidate/reference six-file mismatch')
print('PASS — FE QUEST v335 global transition scroll + centered CTA validated')

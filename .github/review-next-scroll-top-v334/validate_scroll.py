from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'review-next-scroll-top-(v(\d+))',branch)
    req(m is not None,'bad review next scroll branch')
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
let decisions=null;
if(typeof shouldScrollReviewNextV334==='function'){
  decisions={
    reviewAnsweredHasNext:shouldScrollReviewNextV334('review',true,0,2),
    reviewUnanswered:shouldScrollReviewNextV334('review',false,0,2),
    reviewLastQuestion:shouldScrollReviewNextV334('review',true,1,2),
    randomAnsweredHasNext:shouldScrollReviewNextV334('random',true,0,2),
    weakAnsweredHasNext:shouldScrollReviewNextV334('weak',true,0,2)
  };
}
const out={
  v:APP_VERSION,
  spec:value('REVIEW_NEXT_SCROLL_TOP_SPEC_V334'),
  shouldFn:fn('shouldScrollReviewNextV334'),
  scrollFn:fn('scrollReviewQuestionToTopV334'),
  installFn:fn('installReviewNextScrollTopV334'),
  decisions,
  bankSignature:QUESTION_BANK.map(q=>[q.id,q.cat,q.concept,q.difficulty,q.cognitiveLevel,q.q,q.options,q.a,q.exp,q.hint,q.choiceExps]),
  subjectBSemantics:validateSubjectBSemantics()
};
console.log('__V334_REVIEW_SCROLL__'+Buffer.from(JSON.stringify(out)).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'runtime.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed '+z.stderr[-9000:])
        m=re.search(r'__V334_REVIEW_SCROLL__([A-Za-z0-9+/=]+)',z.stdout)
        req(m is not None,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=context()
req((version,previous)==('v334','v333'),'expects v334 over v333')

required={
    'app/review-next-scroll-top-overrides-v334.txt',
    'index.html',
    '.github/review-next-scroll-top-v334/prepare_reference.py',
    '.github/review-next-scroll-top-v334/validate_scroll.py',
    '.github/workflows/review-next-scroll-top-v334.yml',
}
allowed=required|{'manifest.webmanifest','sw.js','.github/workflows/full-data-reset-v333.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(required<=changed,'missing intended v334 files '+repr(sorted(required-changed)))
req(changed<=allowed,'unexpected v334 drift '+repr(sorted(changed-allowed)))

cand=runtime('_site/index.html')
par=runtime('_site_parent/index.html')
req(cand['v']=='v334' and par['v']=='v333','runtime versions')
req(par['spec'] is None and par['installFn'] is None,'parent unexpectedly contains v334 scroll feature')
req(cand['bankSignature']==par['bankSignature'],'question bank/content drift')
req(cand['subjectBSemantics'].get('ok') is True and par['subjectBSemantics'].get('ok') is True,'Subject B semantic regression')

expected_spec={
    'scope':'today-review-next-question',
    'mode':'review',
    'trigger':'answered-next-question',
    'target':'window-top',
    'behavior':'auto',
    'affectsOtherQuizModes':False,
}
req(cand['spec']==expected_spec,'scroll policy drift '+json.dumps(cand['spec'],ensure_ascii=False,sort_keys=True))

d=cand['decisions'] or {}
req(d.get('reviewAnsweredHasNext') is True,'review next question must scroll')
for key in ['reviewUnanswered','reviewLastQuestion','randomAnsweredHasNext','weakAnsweredHasNext']:
    req(d.get(key) is False,'scroll leaked outside intended transition: '+key)

scroll=cand['scrollFn'] or ''
install=cand['installFn'] or ''
should=cand['shouldFn'] or ''
req("mode==='review'" in should and 'answered===true' in should and 'index<total-1' in should.replace(' ',''),'review-only transition guard missing')
req('requestAnimationFrame' in scroll,'scroll must wait until next rendered frame')
req("window.scrollTo({top:0,left:0,behavior:'auto'})" in scroll.replace(' ',''),'window top scroll missing')
compact=install.replace(' ','')
for token in ["getElementById('quizSubmit')","addEventListener('click'",'{capture:true}','shouldScrollReviewNextV334(quizMode,quizAnswered,quizIndex,quizItems.length)']:
    req(token.replace(' ','') in compact,'install contract missing '+token)

release_files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in release_files),'candidate/reference six-file mismatch')
print('PASS — FE QUEST v334 Today Review next-question scroll-to-top validated')

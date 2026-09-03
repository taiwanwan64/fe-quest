from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import os
import sys
import time
import traceback

from playwright.sync_api import Error as PlaywrightError, sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / '_browser_evidence/v361'


def wait_for_stable_page(page):
    # On reload the app may restore the lesson instead of displaying Home.
    # Wait for the same boot/pageshow boundary without requiring a screen.
    deadline = time.monotonic() + 45
    for _ in range(8):
        remaining = max(1000, int((deadline-time.monotonic())*1000))
        try:
            page.wait_for_load_state('load', timeout=remaining)
            page.wait_for_function('window.FEQUEST_APP_BOOT_COMPLETE===true && window.__FEQ_PAGESHOW_SEEN===true', timeout=remaining)
            # A fresh service worker calls clients.claim(), triggering the app's
            # controllerchange reload after boot. Wait for control, then verify
            # the resulting document is stable before entering a lesson.
            page.wait_for_function("navigator.serviceWorker.controller?.state==='activated'", timeout=remaining)
            marker = page.evaluate('performance.timeOrigin')
            page.wait_for_timeout(750)
            state = page.evaluate('marker=>({sameDocument:performance.timeOrigin===marker,readyState:document.readyState,boot:window.FEQUEST_APP_BOOT_COMPLETE===true,pageshow:window.__FEQ_PAGESHOW_SEEN===true,controlled:navigator.serviceWorker.controller?.state===\'activated\'})',marker)
            if state['sameDocument'] and state['readyState']=='complete' and state['boot'] and state['pageshow'] and state['controlled']:
                return {'timeOrigin':marker,**state}
        except PlaywrightError:
            if time.monotonic() >= deadline:
                raise
    raise AssertionError('Navigation-stable boot/pageshow boundary not reached')


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, _format, *_args):
        pass

    def do_GET(self):
        if self.path.split('?', 1)[0] in ('/', '/index.html'):
            body = (ROOT / 'app/base-shell-v361.html').read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()


def values(page, kind):
    return page.locator(f'[data-sq-kind="{kind}"] [data-sq-value]').evaluate_all('(nodes)=>nodes.map(n=>n.dataset.sqValue)')


def learning(page):
    return page.evaluate('({progress:{...profile.lessonProgress},xp:profile.xp})')


def layout(page, selector):
    return page.locator(selector).evaluate('''root=>{
      const blocks=[root,...root.querySelectorAll('section,ol,li,h4,figcaption,p,button,[role=group],.sq-cards-v360,.sq-controls-v360')];
      const panels=[...root.querySelectorAll('.sq-panel-v360')].map(n=>{
        const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width};
      });
      const cells=[...root.querySelectorAll('.sq-values-v360')].map(n=>[...n.children].map(c=>c.getBoundingClientRect().y));
      return {
        panels,cells,
        overflows:blocks.filter(n=>n.scrollWidth>n.clientWidth+1).map(n=>n.className||n.tagName),
        documentOverflow:document.documentElement.scrollWidth>innerWidth+1,
        smallButtons:[...root.querySelectorAll('button')].filter(n=>n.getBoundingClientRect().height<44).length,
        buttonRows:['pop','push','dequeue','enqueue'].map(op=>{const n=root.querySelector(`[data-sq-op="${op}"]`);if(!n)return null;const r=n.getBoundingClientRect();return {y:r.y,height:r.height};})
      };
    }''')


def run_case(pw, base, name, engine, viewport, mobile=False):
    browser = getattr(pw, engine).launch()
    context = browser.new_context(viewport=viewport, locale='ja-JP', is_mobile=mobile,
                                  has_touch=mobile, device_scale_factor=2 if mobile else 1)
    page = context.new_page()
    page.add_init_script("window.__FEQ_PAGESHOW_SEEN=false;addEventListener('pageshow',()=>window.__FEQ_PAGESHOW_SEEN=true,{once:true});")
    errors, checks, metrics = [], [], {}
    page.on('pageerror', lambda e: errors.append(str(e)))

    def check(label, condition):
        checks.append({'name': label, 'pass': bool(condition)})
        assert condition, label

    def click(op):
        page.locator(f'[data-sq-op="{op}"]').click()

    def done():
        return page.evaluate('lessonInteractiveDone')

    def capture(selector, suffix):
        page.wait_for_function("!document.getElementById('toast')?.classList.contains('show')")
        node = page.locator(selector)
        node.scroll_into_view_if_needed()
        page.screenshot(path=str(OUT / f'{name}-{suffix}-context.png'))
        node.screenshot(path=str(OUT / f'{name}-{suffix}.png'),
                        style=f'body *{{visibility:hidden!important}}{selector},{selector} *{{visibility:visible!important}}')

    try:
        response = page.goto(base, wait_until='load', timeout=60_000)
        stable = wait_for_stable_page(page)
        check('HTTP 200 and v361 runtime', response.status == 200 and page.evaluate('APP_VERSION') == 'v361')
        page.evaluate("startLesson('core_14_04')")
        check('prior critical path diagram and scope retained', page.locator('.core-critical-path-v359').is_visible() and page.locator('.sq-figure-v360').count() == 0)
        page.evaluate("startLesson('core_03_01')")
        page.locator('.sq-figure-v360').wait_for(state='visible')
        check('static visual order and next values', values(page, 'stack') == ['C','B','A'] and values(page, 'queue') == ['A','B','C'])
        cards = page.locator('.sq-results-v360 > section')
        labels = cards.locator('span').all_text_contents()
        check('remaining-order labels are identical', labels == ['残りを取り出す順', '残りを取り出す順'])
        actual = page.evaluate("""()=>{
            const remaining=op=>{
                let r=stackQueueApplyV360(stackQueueInitialStateV360(),op);
                const first=r.event.value,rest=[];
                while((r=stackQueueApplyV360(r.state,op)).event) rest.push(r.event.value);
                return {first,rest:rest.join(' → ')};
            };
            return {stack:remaining('pop'),queue:remaining('dequeue')};
        }""")
        check('stack card matches remaining POP order B A', cards.nth(0).locator('code').inner_text() == actual['stack']['rest'] == 'B → A' and cards.nth(0).locator('b').inner_text() == actual['stack']['first'] + ' が出る')
        check('queue card matches remaining DEQUEUE order B C', cards.nth(1).locator('code').inner_text() == actual['queue']['rest'] == 'B → C' and cards.nth(1).locator('b').inner_text() == actual['queue']['first'] + ' が出る')
        check('comparison does not mix stored and removal directions', all('底' not in label and '末尾' not in label for label in labels) and cards.count() == 2)
        check('core diagram does not add controls or gate', page.locator('.sq-figure-v360 button').count() == 0 and done())
        check('article POP is not expanded as mail protocol', 'Post Office Protocol' not in page.locator('.core-article').inner_text() and 'POP（取り出し操作）' in page.locator('.core-article').inner_text())
        metrics['core'] = layout(page, '.sq-figure-v360')
        a, b = metrics['core']['panels']
        check('equal side-by-side comparison and aligned cells', a['x'] < b['x'] and abs(a['y']-b['y']) < 1 and abs(a['width']-b['width']) < 1 and all(abs(x-y)<1 for x,y in zip(*metrics['core']['cells'])))
        check('static diagram fits viewport', not metrics['core']['overflows'] and not metrics['core']['documentOverflow'])
        capture('.sq-figure-v360', 'core')
        page.evaluate("startLesson('core_03_01')")
        check('rerender has one figure', page.locator('.sq-figure-v360').count() == 1)

        page.evaluate("startLesson('stackqueue')")
        check('existing density audit keeps the three-page lab', page.evaluate('LESSONS.stackqueue.pages.length') == 3)
        check('legacy first page uses same TOP FRONT REAR view', values(page, 'stack') == ['C','B','A'] and values(page, 'queue') == ['A','B','C'])
        page.locator('#lessonNext').click()
        page.locator('[data-sq-op="pop"]').wait_for(state='visible')
        before = learning(page)
        page.evaluate("window.__sqOriginalPop=document.getElementById('popStack');window.__sqOriginalStatus=document.querySelector('.sq-event-v360');")
        page.locator('#lessonNext').click()
        check('next blocked before both removals', page.evaluate('lessonStep') == 1 and not done())
        click('pop')
        check('POP removes C and does not unlock alone', values(page,'stack') == ['B','A'] and values(page,'queue') == ['A','B','C'] and not done() and 'Cを取り出し' in page.locator('.sq-event-v360').inner_text())
        click('reset')
        check('reset before completion keeps confirmed POP but not completion', not done() and page.evaluate("dsSeen.has('stack')&&!dsSeen.has('queue')") and values(page,'stack') == ['C','B','A'])
        click('dequeue')
        check('DEQUEUE removes A and unlocks after both removals', values(page,'queue') == ['B','C'] and done() and 'Aを取り出し' in page.locator('.sq-event-v360').inner_text())
        check('existing recap is shown as completion takeaway', 'スタックならCが先、キューならAが先' in page.locator('#lessonCheck').inner_text())
        capture('.sq-demo-v360', 'interactive')
        metrics['interactive'] = layout(page, '.sq-demo-v360')
        check('interactive layout and touch sizes', not metrics['interactive']['overflows'] and not metrics['interactive']['documentOverflow'] and metrics['interactive']['smallButtons'] == 0)
        pop,push,dequeue,enqueue = metrics['interactive']['buttonRows']
        check('paired control rows have equal heights and positions', all(abs(a[k]-b[k])<1 for a,b in ((pop,dequeue),(push,enqueue)) for k in ('y','height')))
        click('reset')
        check('reset after completion retains gate and initial values', done() and values(page,'stack') == ['C','B','A'] and values(page,'queue') == ['A','B','C'])
        for value in ['C','B','A']:
            click('pop')
            check('repeated POP ' + value, f'{value}を取り出し' in page.locator('.sq-event-v360').inner_text())
        check('empty stack guarded', values(page,'stack') == [] and page.locator('#popStack').is_disabled())
        page.locator('#pushStackV360').focus()
        page.locator('#pushStackV360').press('Enter')
        check('keyboard PUSH adds D into empty stack', values(page,'stack') == ['D'] and '空 から D へ' in page.locator('.sq-event-v360').inner_text() and page.locator('#pushStackV360').evaluate('(n)=>n===document.activeElement'))
        for _ in range(5):
            page.locator('#pushStackV360').press('Enter')
        check('six-item cap and inverse focus', values(page,'stack') == ['I','H','G','F','E','D'] and page.locator('#pushStackV360').is_disabled() and page.locator('#popStack').evaluate('(n)=>n===document.activeElement'))
        metrics['full'] = layout(page, '.sq-demo-v360')
        check('full state fits viewport', not metrics['full']['overflows'] and not metrics['full']['documentOverflow'])
        click('reset')
        click('enqueue')
        check('ENQUEUE D stays at rear', values(page,'queue') == ['A','B','C','D'])
        for value in ['A','B','C','D']:
            click('dequeue')
            check('repeated DEQUEUE ' + value, f'{value}を取り出し' in page.locator('.sq-event-v360').inner_text())
        check('empty queue guarded', values(page,'queue') == [] and page.locator('#deqQueue').is_disabled())
        check('controls and live status are persistent DOM nodes', page.evaluate("window.__sqOriginalPop===document.getElementById('popStack')&&window.__sqOriginalStatus===document.querySelector('.sq-event-v360')") and page.locator('.sq-event-v360').get_attribute('aria-live') == 'polite')
        click('reset')
        check('exercise does not mutate saved lesson progress or XP', learning(page) == before)
        page.locator('#lessonNext').click()
        page.locator('#lessonQuizOptions').wait_for(state='visible')
        check('four-choice quiz unchanged and gated', page.evaluate('lessonStep') == 2 and page.locator('#lessonQuizOptions button').count() == 4 and page.evaluate("LESSONS.stackqueue.pages[2].quiz.answer") == 2 and not done())
        check('quiz POP names the stack operation', 'Post Office Protocol' not in page.locator('#lessonCopy').inner_text() and 'POP（取り出し操作）' in page.locator('#lessonCopy').inner_text())
        page.locator('#lessonNext').click()
        check('quiz cannot be skipped', page.evaluate('lessonStep') == 2 and learning(page) == before)
        page.locator('#lessonQuizOptions [data-i="2"]').click()
        page.locator('#lessonNext').click()
        expected = {'progress': {**before['progress'], 'stackqueue': 100}, 'xp': before['xp'] + (15 if before['progress'].get('stackqueue',0) >= 100 else 50)}
        check('existing completion and XP award preserved', learning(page) == expected)
        page.reload(wait_until='load')
        wait_for_stable_page(page)
        check('completed learning persists after reload', learning(page) == expected)
        page.evaluate("startLesson('stackqueue')")
        page.locator('#lessonNext').click()
        check('new visit starts fresh demo gate without deleting saved progress', not done() and page.evaluate('dsSeen.size') == 0 and values(page,'stack') == ['C','B','A'] and learning(page) == expected)
        check('no page errors or recovery screen', not errors and page.locator('#fequestAssetRecoveryV361').count() == 0)
        return {'name':name,'engine':engine,'stable':stable,'checks':checks,'metrics':metrics,'pageErrors':errors,'pass':True}
    except Exception:
        page.screenshot(path=str(OUT / f'{name}-failure.png'), full_page=True)
        return {'name':name,'engine':engine,'checks':checks,'metrics':metrics,'pageErrors':errors,'error':traceback.format_exc(),'pass':False}
    finally:
        context.close()
        browser.close()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(('127.0.0.1',0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = os.environ.get('V361_BASE_URL') or f'http://127.0.0.1:{server.server_address[1]}/'
    try:
        with sync_playwright() as pw:
            cases = [
                run_case(pw,base,'desktop-chromium-1366','chromium',{'width':1366,'height':900}),
                run_case(pw,base,'tablet-chromium-1024','chromium',{'width':1024,'height':768}),
                run_case(pw,base,'mobile-webkit-390','webkit',{'width':390,'height':844},True),
                run_case(pw,base,'narrow-webkit-320','webkit',{'width':320,'height':720},True),
            ]
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)
    report = {'name':'v361-stack-queue-output-order','baseUrl':base,'cases':cases,'result':'PASS' if all(c['pass'] for c in cases) else 'FAIL'}
    (OUT / 'result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if report['result'] != 'PASS':
        return 1
    print(f'PASS — V361 STACK QUEUE BROWSER {len(cases)}/{len(cases)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())

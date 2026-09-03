from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import sys
import time
import traceback

from playwright.sync_api import Error as PlaywrightError, sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "_browser_evidence/v363"

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,_format,*_args):
        pass
    def do_GET(self):
        if self.path.split("?",1)[0] in ("/","/index.html"):
            body=(ROOT/"app/base-shell-v363.html").read_bytes()
            self.send_response(200)
            self.send_header("Content-Type","text/html; charset=utf-8")
            self.send_header("Content-Length",str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()

def wait_for_stable_page(page):
    deadline=time.monotonic()+45
    for _ in range(8):
        remaining=max(1000,int((deadline-time.monotonic())*1000))
        try:
            page.wait_for_load_state("load",timeout=remaining)
            page.wait_for_function("window.FEQUEST_APP_BOOT_COMPLETE===true && window.__FEQ_PAGESHOW_SEEN===true",timeout=remaining)
            page.wait_for_function("navigator.serviceWorker.controller?.state==='activated'",timeout=remaining)
            marker=page.evaluate("performance.timeOrigin")
            page.wait_for_timeout(750)
            state=page.evaluate("""marker=>({
              same:performance.timeOrigin===marker,
              ready:document.readyState==='complete',
              boot:window.FEQUEST_APP_BOOT_COMPLETE===true,
              pageshow:window.__FEQ_PAGESHOW_SEEN===true,
              controlled:navigator.serviceWorker.controller?.state==='activated'
            })""",marker)
            if all(state.values()):
                return
        except PlaywrightError:
            if time.monotonic()>=deadline:
                raise
    raise AssertionError("stable boot/pageshow boundary not reached")

def memory_state(page):
    return page.evaluate("""()=>{
      showScreen('plan');setPlanDetailsOpen(true);renderMemoryHealth();
      const ring=document.getElementById('memoryHealthRing');
      const caption=document.getElementById('memoryHealthCaption');
      const rr=ring.getBoundingClientRect(),cr=caption.getBoundingClientRect();
      return {
        health:memoryHealth(),
        value:document.getElementById('memoryHealthValue').textContent,
        caption:caption.textContent,
        counts:['memoryFreshCount','memorySoonCount','memoryDueCount'].map(id=>document.getElementById(id).textContent),
        ringProgress:ring.style.getPropertyValue('--memory-p'),
        unmeasured:ring.classList.contains('is-unmeasured'),
        aria:ring.getAttribute('aria-label'),
        captionFits:cr.left>=rr.left-0.5&&cr.right<=rr.right+0.5&&caption.scrollWidth<=caption.clientWidth,
        advice:document.getElementById('memoryHealthAdvice').textContent,
        readiness:calcReadiness()
      };
    }""")

def run_case(pw,base,name,engine,viewport,mobile=False):
    browser=getattr(pw,engine).launch()
    context=browser.new_context(viewport=viewport,locale="ja-JP",is_mobile=mobile,has_touch=mobile,device_scale_factor=2 if mobile else 1)
    page=context.new_page()
    page.add_init_script("window.__FEQ_PAGESHOW_SEEN=false;addEventListener('pageshow',()=>window.__FEQ_PAGESHOW_SEEN=true,{once:true});")
    errors,checks,dialogs=[],[],[]
    page.on("pageerror",lambda error:errors.append(str(error)))
    def check(label,condition):
        checks.append({"name":label,"pass":bool(condition)})
        assert condition,label
    try:
        response=page.goto(base,wait_until="load",timeout=60_000)
        wait_for_stable_page(page)
        check("HTTP 200 and v363 runtime",response.status==200 and page.evaluate("APP_VERSION")=="v363")

        fresh=memory_state(page)
        check("fresh memory model is zero evidence",fresh["health"]=={"attempted":0,"avg":0,"fresh":0,"soon":0,"due":0})
        check("fresh ring says unmeasured instead of 100 percent",fresh["value"]=="未計測" and fresh["caption"]=="問題演習後に表示" and fresh["ringProgress"]=="0" and fresh["unmeasured"])
        check("fresh accessibility label and counts are correct",fresh["aria"]=="記憶保持率は未計測です" and fresh["counts"]==["0","0","0"])
        check("fresh caption fits inside the ring",fresh["captionFits"])
        check("fresh memory contributes nothing to readiness",fresh["readiness"]==0)

        measured=page.evaluate("""()=>{
          const q=QUESTION_BANK[0],today=localDateISO(0);
          profile.qStats[q.id]={attempts:1,correct:1,streak:1,due:localDateISO(1),last:today,lastReviewDate:today,stability:3,lapses:0,reviews:1,avgSeconds:30,timedAnswers:1,lastQuality:5};
          saveProfile();renderMemoryHealth();
          const h=memoryHealth(),ring=document.getElementById('memoryHealthRing');
          return {
            id:q.id,health:h,
            value:document.getElementById('memoryHealthValue').textContent,
            caption:document.getElementById('memoryHealthCaption').textContent,
            progress:ring.style.getPropertyValue('--memory-p'),
            unmeasured:ring.classList.contains('is-unmeasured'),
            aria:ring.getAttribute('aria-label')
          };
        }""")
        check("one real attempt enables measured retention",measured["health"]["attempted"]==1 and measured["health"]["avg"]==100 and measured["value"]=="100%")
        check("measured presentation is unchanged",measured["caption"]=="推定保持" and measured["progress"]=="100" and not measured["unmeasured"] and measured["aria"]=="推定記憶保持率 100%")

        def handle(dialog):
            dialogs.append(dialog.type)
            if dialog.type=="prompt":
                dialog.accept("初期化")
            else:
                dialog.accept()
        page.on("dialog",handle)
        old_origin=page.evaluate("performance.timeOrigin")
        page.locator("#resetLearningDataV333").evaluate("button=>button.click()")
        page.wait_for_function("old=>performance.timeOrigin!==old",arg=old_origin,timeout=20_000)
        wait_for_stable_page(page)
        check("real reset dialog sequence completed",dialogs==["confirm","prompt","alert"])

        reset=memory_state(page)
        check("complete reset restores unmeasured state",reset["health"]=={"attempted":0,"avg":0,"fresh":0,"soon":0,"due":0} and reset["value"]=="未計測" and reset["caption"]=="問題演習後に表示")
        check("complete reset restores empty ring and keeps layout",reset["ringProgress"]=="0" and reset["unmeasured"] and reset["captionFits"] and reset["counts"]==["0","0","0"])
        check("no page errors or recovery screen",not errors and page.locator("#fequestAssetRecoveryV363").count()==0)

        page.locator("#memoryHealthCard").wait_for(state="visible")
        page.locator("#memoryHealthCard").screenshot(path=str(OUT/f"{name}-reset-memory-health.png"))
        return {"name":name,"engine":engine,"checks":checks,"dialogs":dialogs,"fresh":fresh,"measured":measured,"reset":reset,"pageErrors":errors,"pass":True}
    except Exception:
        page.screenshot(path=str(OUT/f"{name}-failure.png"),full_page=True)
        return {"name":name,"engine":engine,"checks":checks,"dialogs":dialogs,"pageErrors":errors,"error":traceback.format_exc(),"pass":False}
    finally:
        context.close()
        browser.close()

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
    thread=Thread(target=server.serve_forever,daemon=True)
    thread.start()
    base=f"http://127.0.0.1:{server.server_address[1]}/"
    try:
        with sync_playwright() as pw:
            cases=[
                run_case(pw,base,"desktop-chromium-1366","chromium",{"width":1366,"height":900}),
                run_case(pw,base,"tablet-chromium-1024","chromium",{"width":1024,"height":768}),
                run_case(pw,base,"mobile-webkit-390","webkit",{"width":390,"height":844},True),
                run_case(pw,base,"narrow-webkit-320","webkit",{"width":320,"height":720},True),
            ]
    finally:
        server.shutdown();server.server_close();thread.join(timeout=5)
    report={"name":"v363-memory-health-unmeasured","cases":cases,"result":"PASS" if all(case["pass"] for case in cases) else "FAIL"}
    (OUT/"result.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if report["result"]!="PASS":
        return 1
    print(f"PASS — V363 MEMORY HEALTH BROWSER {len(cases)}/{len(cases)}")
    return 0

if __name__=="__main__":
    sys.exit(main())

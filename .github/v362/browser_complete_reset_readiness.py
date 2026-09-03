from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import sys
import time
import traceback

from playwright.sync_api import Error as PlaywrightError, sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "_browser_evidence/v362"

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,_format,*_args):
        pass
    def do_GET(self):
        if self.path.split("?",1)[0] in ("/","/index.html"):
            body=(ROOT/"app/base-shell-v362.html").read_bytes()
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
        check("HTTP 200 and v362 runtime",response.status==200 and page.evaluate("APP_VERSION")=="v362")
        check("complete reset control remains installed",page.locator("#resetLearningDataV333").count()==1)
        before=page.evaluate("""()=>{
          const q=QUESTION_BANK[0];
          profile.xp=777;profile.streak=9;
          profile.diagnosticCompleted=true;
          profile.diagnosticScores={'基礎理論':80};
          profile.skills['基礎理論']=85;
          profile.qStats[q.id]={attempts:3,correct:2,lastSeen:new Date().toISOString()};
          profile.sessions=[{date:localDateISO(0),rate:67,mode:'quiz',log:[]}];
          profile.lessonProgress[CORE_A_IDS[0]]=100;
          profile.mockHistory=[{mode:'full',rate:80}];
          profile.bProgress[B_EXERCISES[0].id]=100;
          profile.securityBProgress[SECURITY_SCENARIOS[0].id]=100;
          profile.bFinalHistory=[{rate:75}];
          profile.settings.examDate='2030-01-01';
          profile.settings.studyMinutes=120;
          saveProfile();
          return {readiness:calcReadiness(),practice:readinessComponents().aPractice,xp:profile.xp};
        }""")
        check("seeded learner has nonzero evidence",before["readiness"]>0 and before["practice"]>0 and before["xp"]==777)

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
        check("two confirmations and completion alert occurred",dialogs==["confirm","prompt","alert"])

        state=page.evaluate("""()=>{
          showScreen('plan');setPlanDetailsOpen(true);renderReadiness();
          const attempts=Object.values(profile.qStats||{}).reduce((sum,s)=>sum+(Number(s?.attempts)||0),0);
          const completedLessons=Object.values(profile.lessonProgress||{}).filter(x=>Number(x)>=100).length;
          const completedB=Object.values(profile.bProgress||{}).filter(x=>Number(x)>=100).length+
            Object.values(profile.securityBProgress||{}).filter(x=>Number(x)>=100).length;
          return {
            readiness:calcReadiness(),components:readinessComponents(),
            xp:profile.xp,streak:profile.streak,diagnostic:profile.diagnosticCompleted,
            diagnosticScores:Object.keys(profile.diagnosticScores||{}).length,
            attempts,completedLessons,completedB,
            sessions:(profile.sessions||[]).length,mocks:(profile.mockHistory||[]).length,
            bFinal:(profile.bFinalHistory||[]).length,
            examDate:profile.settings?.examDate||'',
            studyMinutes:profile.settings?.studyMinutes,
            skills:Object.values(profile.skills||{}),
            displayedTotal:document.getElementById('readinessValue')?.textContent,
            displayedRows:[...document.querySelectorAll('#readinessBreakdown .readiness-part b')].map(n=>n.textContent),
            firstRunState:document.getElementById('firstRunExperienceV340')?.dataset.state||'',
            storageRaw:localStorage.getItem(PROFILE_ATOMIC_KEY)||''
          };
        }""")
        check("readiness and all six components reset to zero",state["readiness"]==0 and all(value==0 for value in state["components"].values()))
        check("dashboard shows total and all rows as zero",state["displayedTotal"]=="0%" and state["displayedRows"]==["0%"]*6)
        check("learning evidence and rewards are empty",state["xp"]==0 and state["streak"]==0 and not state["diagnostic"] and state["diagnosticScores"]==0 and state["attempts"]==0 and state["completedLessons"]==0 and state["completedB"]==0 and state["sessions"]==0 and state["mocks"]==0 and state["bFinal"]==0)
        check("planning settings return to first-use defaults",state["examDate"]=="" and state["studyMinutes"]==60 and state["firstRunState"]=="setup")
        check("neutral internal priors remain for adaptive selection",state["skills"] and all(value==50 for value in state["skills"]))
        check("reset profile persisted without seeded values",'"xp":777' not in state["storageRaw"] and "2030-01-01" not in state["storageRaw"])
        check("no page errors or recovery screen",not errors and page.locator("#fequestAssetRecoveryV362").count()==0)
        page.locator("#readinessCard").wait_for(state="visible")
        page.locator("#readinessCard").screenshot(path=str(OUT/f"{name}-reset-readiness.png"))
        return {"name":name,"engine":engine,"checks":checks,"dialogs":dialogs,"state":state,"pageErrors":errors,"pass":True}
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
    report={"name":"v362-complete-reset-readiness","cases":cases,"result":"PASS" if all(case["pass"] for case in cases) else "FAIL"}
    (OUT/"result.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if report["result"]!="PASS":
        return 1
    print(f"PASS — V362 COMPLETE RESET BROWSER {len(cases)}/{len(cases)}")
    return 0

if __name__=="__main__":
    sys.exit(main())

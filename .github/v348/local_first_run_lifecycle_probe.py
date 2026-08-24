from __future__ import annotations

from datetime import date, timedelta
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import sys

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
SHELL = ROOT / "app/base-shell-v345.html"
OUT = ROOT / "_browser_evidence/v348/local-first-run-lifecycle.json"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, _format, *_args):
        return

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path in ("/", "/index.html"):
            body = SHELL.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()


def snapshot(page, label: str) -> dict:
    return page.evaluate(
        """label => {
          const root=document.getElementById('firstRunExperienceV340');
          const date=document.getElementById('firstRunExamDateV340');
          const submit=document.getElementById('firstRunCreatePlanV340');
          const error=document.getElementById('firstRunErrorV340');
          const primary=document.getElementById('firstRunPrimaryActionV340');
          const right=document.getElementById('rightDailyAction');
          const progress=document.getElementById('rightDailyProgress');
          const next=document.getElementById('rightDailyNext');
          const selectedMinute=document.querySelector('.v340-minute[aria-pressed="true"]');
          const visible=el=>!!el && getComputedStyle(el).display!=='none' && getComputedStyle(el).visibility!=='hidden' && el.getBoundingClientRect().width>0 && el.getBoundingClientRect().height>0;
          const read=(expr)=>{try{return {ok:true,value:eval(expr)}}catch(e){return {ok:false,error:String(e)}}};
          const pExam=read("profile?.settings?.examDate||null");
          const pMinutes=read("profile?.settings?.studyMinutes||null");
          const setup=read("firstRunNeedsSetupV340()");
          const tasks=read("(ensureTodayPlanSnapshot(false)||[]).length");
          const boot=read("appBootComplete");
          const pending=read("bootProfileSavePending");
          const writeBlocked=read("profileWriteBlocked");
          const conflictBlocked=read("profileConflictBlocked");
          const saveFailure=read("lastProfileSaveFailure||''");
          return {
            label,
            documentReadyState:document.readyState,
            pageshowSeen:window.__FEQ_PAGESHOW_SEEN===true,
            rootPresent:!!root,
            rootState:root?.dataset?.state||null,
            rootVisible:visible(root),
            dateValue:date?.value||null,
            submitPresent:!!submit,
            submitVisible:visible(submit),
            submitDisabled:submit?.disabled??null,
            submitText:submit?.textContent?.trim()||null,
            errorText:error?.textContent?.trim()||null,
            errorVisible:visible(error),
            selectedMinutes:selectedMinute?.dataset?.minutes||null,
            primaryPresent:!!primary,
            primaryVisible:visible(primary),
            rightText:right?.textContent?.trim()||null,
            rightVisible:visible(right),
            rightProgress:progress?.textContent?.trim()||null,
            rightNext:next?.textContent?.trim()||null,
            profileExamDate:pExam.value??null,
            profileStudyMinutes:pMinutes.value??null,
            setupNeeded:setup.value??null,
            taskCount:tasks.value??null,
            appBootComplete:boot.value??window.FEQUEST_APP_BOOT_COMPLETE??null,
            bootProfileSavePending:pending.value??null,
            profileWriteBlocked:writeBlocked.value??null,
            profileConflictBlocked:conflictBlocked.value??null,
            lastProfileSaveFailure:saveFailure.value??null,
            evalErrors:[pExam,pMinutes,setup,tasks,boot,pending,writeBlocked,conflictBlocked,saveFailure].filter(x=>!x.ok).map(x=>x.error)
          };
        }""",
        label,
    )


def run_once(pw, base_url: str, index: int, wait_until: str) -> dict:
    browser = pw.chromium.launch()
    context = browser.new_context(viewport={"width": 1440, "height": 1000}, locale="ja-JP")
    page = context.new_page()
    page.add_init_script(
        """window.__FEQ_PAGESHOW_SEEN=false;
        addEventListener('pageshow',()=>{window.__FEQ_PAGESHOW_SEEN=true;},{once:true});"""
    )
    page_errors: list[str] = []
    console_errors: list[str] = []
    failed_requests: list[str] = []
    page.on("pageerror", lambda err: page_errors.append(str(err)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.on("requestfailed", lambda req: failed_requests.append(f"{req.method} {req.url} :: {req.failure}"))

    response = page.goto(base_url, wait_until=wait_until, timeout=60_000)
    page.locator("#firstRunExperienceV340").wait_for(state="visible", timeout=30_000)
    page.wait_for_function("window.FEQUEST_APP_BOOT_COMPLETE === true", timeout=30_000)
    page.wait_for_load_state("load", timeout=30_000)
    page.wait_for_function("window.__FEQ_PAGESHOW_SEEN === true", timeout=30_000)
    page.wait_for_timeout(50)
    before = snapshot(page, "stable-after-pageshow-before-input")

    exam_date = (date.today() + timedelta(days=30)).isoformat()
    date_input = page.locator("#firstRunExamDateV340")
    date_input.fill(exam_date)
    minute = page.locator('.v340-minute[data-minutes="60"]')
    if minute.count():
        minute.click()
    page.wait_for_timeout(50)
    after_input = snapshot(page, "after-input-before-click")
    actual_date = date_input.input_value()
    input_stable = actual_date == exam_date

    page.locator("#firstRunCreatePlanV340").click()
    samples = [snapshot(page, "after-0ms")]
    elapsed = 0
    for target in (50, 200, 500, 1000, 3000):
        page.wait_for_timeout(target - elapsed)
        elapsed = target
        samples.append(snapshot(page, f"after-{target}ms"))

    ever_ready = any(s["rootState"] == "ready" and s["rootVisible"] for s in samples)
    ever_primary = any(s["primaryVisible"] for s in samples)
    final = samples[-1]
    generated = (final.get("taskCount") or 0) >= 1 and final.get("profileExamDate") == exam_date
    result = {
        "iteration": index,
        "waitUntil": wait_until,
        "httpStatus": response.status if response else None,
        "examDateExpected": exam_date,
        "dateInputStable": input_stable,
        "before": before,
        "afterInput": after_input,
        "samples": samples,
        "everReadyVisible": ever_ready,
        "everPrimaryVisible": ever_primary,
        "planGenerated": generated,
        "pageErrors": page_errors,
        "consoleErrors": console_errors,
        "failedRequests": failed_requests,
        "pass": input_stable and ever_ready and ever_primary and generated and not page_errors,
    }
    context.close()
    browser.close()
    return result


def main() -> int:
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base_url = f"http://127.0.0.1:{server.server_address[1]}/"
    cases = []
    try:
        with sync_playwright() as pw:
            for wait_until in ("domcontentloaded", "load"):
                for i in range(1, 4):
                    cases.append(run_once(pw, base_url, i, wait_until))
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)

    failures = [c for c in cases if not c["pass"]]
    report = {
        "name": "v348-local-first-run-lifecycle",
        "productionSource": "app/base-shell-v345.html",
        "chromiumCases": len(cases),
        "failures": len(failures),
        "result": "PASS" if not failures else "FAIL",
        "cases": cases,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if failures:
        return 1
    print("PASS — V348 LOCAL CHROMIUM FIRST-RUN LIFECYCLE")
    return 0


if __name__ == "__main__":
    sys.exit(main())

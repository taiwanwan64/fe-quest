from __future__ import annotations

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import os
import sys
import time

from playwright.sync_api import Error as PlaywrightError, sync_playwright


ROOT = Path(__file__).resolve().parents[2]
SHELL = ROOT / "app/base-shell-v358.html"
OUT = ROOT / "_browser_evidence/v358"


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


def wait_for_stable_page(page, timeout: int = 45_000) -> dict:
    """Wait through a possible first-load PWA activation navigation."""
    deadline = time.monotonic() + timeout / 1000
    last_error = ""
    for _attempt in range(1, 9):
        remaining = max(1_000, int((deadline - time.monotonic()) * 1000))
        if remaining <= 1_000 and time.monotonic() >= deadline:
            break
        try:
            page.wait_for_load_state("load", timeout=remaining)
            page.locator("#home").wait_for(state="visible", timeout=remaining)
            page.wait_for_function("window.FEQUEST_APP_BOOT_COMPLETE === true", timeout=remaining)
            page.wait_for_function("window.__FEQ_PAGESHOW_SEEN === true", timeout=remaining)
            marker = page.evaluate("performance.timeOrigin")
            page.wait_for_timeout(750)
            state = page.evaluate(
                """marker => ({
                  sameDocument: performance.timeOrigin === marker,
                  readyState: document.readyState,
                  boot: window.FEQUEST_APP_BOOT_COMPLETE === true,
                  pageshow: window.__FEQ_PAGESHOW_SEEN === true
                })""",
                marker,
            )
            if state["sameDocument"] and state["readyState"] == "complete" and state["boot"] and state["pageshow"]:
                return {"timeOrigin": marker, **state}
        except PlaywrightError as exc:
            last_error = str(exc)
            try:
                page.wait_for_timeout(150)
            except PlaywrightError:
                pass
    raise AssertionError(f"page did not reach a navigation-stable boot state: {last_error or 'timeout'}")


def collect_logic(page) -> dict:
    return page.evaluate(
        """() => {
          const figure=document.querySelector('.core-logic-trace-diagram-v358');
          const flow=document.querySelector('.core-logic-flow-v358');
          const middle=[...document.querySelectorAll('.core-logic-middle-v358>div')];
          const steps=document.querySelector('.core-trace-steps-v358');
          const tracked=[...document.querySelectorAll('.core-logic-flow-v358 section,.core-trace-steps-v358 li')];
          const text=figure?.textContent||'';
          return {
            count:document.querySelectorAll('.core-logic-trace-diagram-v358').length,
            automataCount:document.querySelectorAll('.core-automata-trace-diagram-v358').length,
            figure:figure?{width:figure.getBoundingClientRect().width,overflow:figure.scrollWidth>figure.clientWidth+1}:null,
            flowColumns:flow?getComputedStyle(flow).gridTemplateColumns.split(' ').filter(Boolean).length:0,
            middleCount:middle.length,
            stepColumns:steps?getComputedStyle(steps).gridTemplateColumns.split(' ').filter(Boolean).length:0,
            sectionOverflows:tracked.map(node=>node.scrollWidth>node.clientWidth+1),
            hasInputs:text.includes('入力A 1')&&text.includes('入力B 0'),
            hasIntermediate:text.includes('x = 1')&&text.includes('y = 1'),
            hasCalculation:text.includes('1 OR 0 = 1')&&text.includes('NOT 0 = 1')&&text.includes('1 AND 1 = 1'),
            hasOutput:text.includes('出力 = 1'),
          };
        }"""
    )


def collect_automata(page) -> dict:
    return page.evaluate(
        """() => {
          const figure=document.querySelector('.core-automata-trace-diagram-v358');
          const rules=document.querySelector('.core-automata-rules-v358');
          const trace=document.querySelector('.core-automata-trace-v358');
          const states=[...document.querySelectorAll('.core-automata-trace-v358 li')];
          const text=figure?.textContent||'';
          return {
            count:document.querySelectorAll('.core-automata-trace-diagram-v358').length,
            logicCount:document.querySelectorAll('.core-logic-trace-diagram-v358').length,
            figure:figure?{width:figure.getBoundingClientRect().width,overflow:figure.scrollWidth>figure.clientWidth+1}:null,
            ruleColumns:rules?getComputedStyle(rules).gridTemplateColumns.split(' ').filter(Boolean).length:0,
            traceColumns:trace?getComputedStyle(trace).gridTemplateColumns.split(' ').filter(Boolean).length:0,
            stateCount:states.length,
            states:states.map(node=>node.querySelector(':scope>b')?.textContent?.trim()||''),
            stateOverflows:states.map(node=>node.scrollWidth>node.clientWidth+1),
            hasRules:text.includes('0 → A')&&text.includes('1 → B')&&text.includes('0 → B')&&text.includes('1 → A'),
            hasInput:text.includes('1 → 0 → 1'),
            hasFinal:text.includes('最終状態：A'),
          };
        }"""
    )


def run_case(pw, base_url: str, name: str, engine: str, viewport: dict, mobile: bool = False) -> dict:
    browser = getattr(pw, engine).launch()
    context = browser.new_context(
        viewport=viewport,
        screen=viewport if mobile else None,
        locale="ja-JP",
        is_mobile=mobile,
        has_touch=mobile,
        device_scale_factor=2 if mobile else 1,
    )
    page = context.new_page()
    page.add_init_script(
        """window.__FEQ_PAGESHOW_SEEN=false;
        addEventListener('pageshow',()=>{window.__FEQ_PAGESHOW_SEEN=true;},{once:true});"""
    )
    page_errors: list[str] = []
    page.on("pageerror", lambda error: page_errors.append(str(error)))
    response = page.goto(base_url, wait_until="load", timeout=60_000)
    stable = wait_for_stable_page(page)

    page.evaluate("startLesson('core_04_03')")
    page.locator(".core-memory-hierarchy-diagram-v357").wait_for(state="visible", timeout=30_000)
    scoped_elsewhere = page.locator(".core-logic-trace-diagram-v358,.core-automata-trace-diagram-v358").count() == 0

    page.evaluate("startLesson('core_02_02')")
    page.locator(".core-logic-trace-diagram-v358").wait_for(state="visible", timeout=30_000)
    page.wait_for_timeout(200)
    logic = collect_logic(page)
    OUT.mkdir(parents=True, exist_ok=True)
    page.locator(".core-logic-trace-diagram-v358").screenshot(path=str(OUT / f"{name}-logic.png"))

    page.evaluate("startLesson('core_02_04')")
    page.locator(".core-automata-trace-diagram-v358").wait_for(state="visible", timeout=30_000)
    page.wait_for_timeout(200)
    automata = collect_automata(page)
    page.locator(".core-automata-trace-diagram-v358").screenshot(path=str(OUT / f"{name}-automata.png"))

    expected_flow_columns = 1 if viewport["width"] <= 720 else 5
    expected_step_columns = 1 if viewport["width"] <= 720 else 3
    expected_rule_columns = 1 if viewport["width"] <= 720 else 2
    expected_trace_columns = 1 if viewport["width"] <= 720 else 4
    document_overflow = page.evaluate("document.documentElement.scrollWidth>innerWidth+1")
    recovery_visible = page.locator("#fequestAssetRecoveryV358").count() > 0
    passed = all((
        response is not None,
        response.status == 200 if response else False,
        scoped_elsewhere,
        logic["count"] == 1,
        logic["automataCount"] == 0,
        logic["flowColumns"] == expected_flow_columns,
        logic["middleCount"] == 2,
        logic["stepColumns"] == expected_step_columns,
        logic["hasInputs"],
        logic["hasIntermediate"],
        logic["hasCalculation"],
        logic["hasOutput"],
        logic["figure"] is not None,
        not logic["figure"]["overflow"],
        not any(logic["sectionOverflows"]),
        automata["count"] == 1,
        automata["logicCount"] == 0,
        automata["ruleColumns"] == expected_rule_columns,
        automata["traceColumns"] == expected_trace_columns,
        automata["stateCount"] == 4,
        automata["states"] == ["A", "B", "B", "A"],
        automata["hasRules"],
        automata["hasInput"],
        automata["hasFinal"],
        automata["figure"] is not None,
        not automata["figure"]["overflow"],
        not any(automata["stateOverflows"]),
        not document_overflow,
        not recovery_visible,
        not page_errors,
    ))
    result = {
        "name": name,
        "engine": engine,
        "httpStatus": response.status if response else None,
        "stableDocument": stable,
        "scopedOutsideTargetLessons": scoped_elsewhere,
        "logic": logic,
        "automata": automata,
        "documentOverflow": document_overflow,
        "recoveryVisible": recovery_visible,
        "pageErrors": page_errors,
        "pass": passed,
    }
    context.close()
    browser.close()
    return result


def main() -> int:
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base_url = f"http://127.0.0.1:{server.server_address[1]}/"
    mobile_engine = os.environ.get("V358_MOBILE_ENGINE", "webkit")
    mobile_name = "mobile-webkit-390" if mobile_engine == "webkit" else f"mobile-{mobile_engine}-390"
    try:
        with sync_playwright() as pw:
            cases = [
                run_case(pw, base_url, "desktop-chromium-1366", "chromium", {"width": 1366, "height": 900}),
                run_case(pw, base_url, mobile_name, mobile_engine, {"width": 390, "height": 844}, True),
            ]
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)

    report = {
        "name": "v358-logic-automata-input-trace-diagrams",
        "productionSource": "app/base-shell-v358.html",
        "cases": cases,
        "result": "PASS" if all(case["pass"] for case in cases) else "FAIL",
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "result.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if report["result"] != "PASS":
        return 1
    print("PASS — V358 LOGIC/AUTOMATA TRACE DIAGRAM BROWSER LAYOUT 2/2")
    return 0


if __name__ == "__main__":
    sys.exit(main())

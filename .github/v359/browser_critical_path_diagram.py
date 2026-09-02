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
SHELL = ROOT / "app/base-shell-v359.html"
OUT = ROOT / "_browser_evidence/v359"


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


def collect(page) -> dict:
    return page.evaluate(
        r"""() => {
          const figure=document.querySelector('.core-critical-path-v359');
          const rect=n=>n.getBoundingClientRect();
          const routes=[...figure.querySelectorAll('.core-cp-route-v359')];
          const routeData=routes.map(n=>{
            const tasks=[...n.querySelectorAll('.core-cp-tasks-v359 li')].map(t=>({
              name:t.querySelector('span').textContent,
              days:Number(t.querySelector('b').textContent.replace('日','')),
              y:rect(t).top
            }));
            const total=n.querySelector('.core-cp-total-v359');
            const bar=n.querySelector('.core-cp-bar-v359');
            return {
              name:n.dataset.route, tasks,
              total:Number(total.querySelector('b').textContent.replace('日','')),
              float:Number(total.querySelector('small').textContent.match(/\d+/)[0]),
              barRatio:rect(bar.firstElementChild).width/rect(bar).width,
              x:rect(n).left,y:rect(n).top,width:rect(n).width,height:rect(n).height,
              badge:n.querySelector('.core-cp-badge-v359').textContent
            };
          });
          const split=rect(figure.querySelector('.core-cp-split-v359'));
          const join=rect(figure.querySelector('.core-cp-join-v359'));
          const text=figure.textContent;
          const tracked=[figure,...figure.querySelectorAll('section,li,p,h4,figcaption,.core-cp-total-v359,.core-cp-finish-v359')];
          const pathGrid=figure.querySelector('.core-cp-paths-v359');
          const notes=figure.querySelector('.core-cp-notes-v359');
          return {
            count:document.querySelectorAll('.core-critical-path-v359').length,
            routes:routeData,
            pathColumns:getComputedStyle(pathGrid).gridTemplateColumns.split(' ').length,
            noteColumns:getComputedStyle(notes).gridTemplateColumns.split(' ').length,
            connectorErrors:routes.map((r,i)=>Math.max(
              Math.abs((i?split.right-1:split.left+1)-(r.x+r.width/2)),
              Math.abs((i?join.right-1:join.left+1)-(r.x+r.width/2)))),
            overflows:tracked.filter(n=>n.scrollWidth>n.clientWidth+1).map(n=>n.className||n.tagName),
            hasJoin:text.includes('両方の完了を待つ')&&text.includes('max(7, 5) = 7'),
            hasDelay:text.includes('Aが1日遅れると全体も8日')&&text.includes('Bの遅れが合計2日以内'),
            title:figure.querySelector('figcaption').textContent,
            documentOverflow:document.documentElement.scrollWidth>innerWidth+1
          };
        }"""
    )


def run_case(pw, base_url, name, engine, viewport, mobile=False):
    browser = getattr(pw, engine).launch()
    context = browser.new_context(
        viewport=viewport, locale="ja-JP", is_mobile=mobile,
        has_touch=mobile, device_scale_factor=2 if mobile else 1,
    )
    page = context.new_page()
    page.add_init_script("""window.__FEQ_PAGESHOW_SEEN=false;
        addEventListener('pageshow',()=>{window.__FEQ_PAGESHOW_SEEN=true;},{once:true});""")
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    try:
        response = page.goto(base_url, wait_until="load", timeout=60_000)
        stable = wait_for_stable_page(page)
        # Existing lesson diagrams and lesson switching must still work.
        prior = []
        for topic, selector in (
            ("core_04_03", ".core-memory-hierarchy-diagram-v357"),
            ("core_02_02", ".core-logic-trace-diagram-v358"),
            ("core_02_04", ".core-automata-trace-diagram-v358"),
        ):
            page.evaluate("(id)=>startLesson(id)", topic)
            page.locator(selector).wait_for(state="visible", timeout=30_000)
            prior.append(page.locator(".core-critical-path-v359").count() == 0)
        page.evaluate("startLesson('core_14_04')")
        figure = page.locator(".core-critical-path-v359")
        figure.wait_for(state="visible", timeout=30_000)
        page.wait_for_timeout(200)
        metrics = collect(page)
        OUT.mkdir(parents=True, exist_ok=True)
        figure.screenshot(path=str(OUT / f"{name}.png"))
        page.screenshot(path=str(OUT / f"{name}-context.png"), full_page=True)
        # Rerender must not duplicate the figure.
        page.evaluate("startLesson('core_14_04')")
        figure.wait_for(state="visible")
        unique_after_rerender = figure.count() == 1
        a, b = metrics["routes"]
        path_math = all(
            sum(t["days"] for t in route["tasks"]) == route["total"]
            and 7 - route["total"] == route["float"]
            and route["tasks"][0]["y"] < route["tasks"][1]["y"]
            for route in (a, b)
        )
        passed = all((
            response is not None and response.status == 200,
            all(prior), unique_after_rerender,
            metrics["count"] == 1, metrics["pathColumns"] == 2,
            metrics["noteColumns"] == (1 if viewport["width"] <= 720 else 2),
            [(t["name"], t["days"]) for t in a["tasks"]] == [("作業A1", 3), ("作業A2", 4)],
            [(t["name"], t["days"]) for t in b["tasks"]] == [("作業B1", 2), ("作業B2", 3)],
            [a["total"], b["total"]] == [7, 5], path_math,
            a["badge"] == "クリティカルパス", a["float"] == 0, b["float"] == 2,
            abs(a["barRatio"] - 1) < .01, abs(b["barRatio"] - 5/7) < .01,
            abs(a["y"] - b["y"]) < 1, abs(a["width"] - b["width"]) < 1,
            abs(a["height"] - b["height"]) < 1,
            max(metrics["connectorErrors"]) < 2,
            not metrics["overflows"], not metrics["documentOverflow"],
            metrics["hasJoin"], metrics["hasDelay"], not errors,
            page.locator("#fequestAssetRecoveryV359").count() == 0,
        ))
        return {"name": name, "engine": engine, "stable": stable, "priorLessonsPass": all(prior),
                "pathMathPass": path_math, "uniqueAfterRerender": unique_after_rerender,
                "metrics": metrics, "pageErrors": errors, "pass": passed}
    finally:
        context.close()
        browser.close()


def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base_url = os.environ.get("V359_BASE_URL") or f"http://127.0.0.1:{server.server_address[1]}/"
    try:
        with sync_playwright() as pw:
            cases = [
                run_case(pw, base_url, "desktop-chromium-1366", "chromium", {"width": 1366, "height": 900}),
                run_case(pw, base_url, "tablet-chromium-1024", "chromium", {"width": 1024, "height": 768}),
                run_case(pw, base_url, "mobile-webkit-390", "webkit", {"width": 390, "height": 844}, True),
                run_case(pw, base_url, "narrow-webkit-320", "webkit", {"width": 320, "height": 720}, True),
            ]
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)
    report = {"name": "v359-critical-path-diagram", "baseUrl": base_url, "cases": cases,
              "result": "PASS" if all(case["pass"] for case in cases) else "FAIL"}
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "result.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if report["result"] != "PASS":
        return 1
    print(f"PASS — V359 CRITICAL PATH BROWSER LAYOUT {len(cases)}/{len(cases)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

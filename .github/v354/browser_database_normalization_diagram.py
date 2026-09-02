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
SHELL = ROOT / "app/base-shell-v354.html"
OUT = ROOT / "_browser_evidence/v354"


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
        """() => {
          const figure=document.querySelector('.core-dbnorm-diagram-v354');
          const flow=document.querySelector('.core-dbnorm-flow-v354');
          const after=document.querySelector('.core-dbnorm-after-grid-v354');
          const boxes=[...document.querySelectorAll('.core-dbnorm-table-box-v354')];
          const captions=[...document.querySelectorAll('.core-dbnorm-table-v354 caption')].map(node=>node.innerText.trim());
          return {
            viewport:{width:innerWidth,height:innerHeight},
            diagramCount:document.querySelectorAll('.core-dbnorm-diagram-v354').length,
            figure:figure?{width:figure.getBoundingClientRect().width,overflow:figure.scrollWidth>figure.clientWidth+1}:null,
            flowColumns:flow?getComputedStyle(flow).gridTemplateColumns.split(' ').filter(Boolean).length:0,
            afterColumns:after?getComputedStyle(after).gridTemplateColumns.split(' ').filter(Boolean).length:0,
            tableCount:document.querySelectorAll('.core-dbnorm-table-v354').length,
            tableOverflows:boxes.map(box=>box.scrollWidth>box.clientWidth+1),
            captions,
            hasBefore:figure?.textContent.includes('正規化前')||false,
            hasAfter:figure?.textContent.includes('正規化後')||false,
            hasThreeRoles:['注文そのもの','商品の基本情報','注文と商品を結ぶ'].every(label=>figure?.textContent.includes(label)),
            documentOverflow:document.documentElement.scrollWidth>innerWidth+1,
            recoveryVisible:!!document.getElementById('fequestAssetRecoveryV354'),
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

    page.evaluate("startLesson('core_01_05')")
    page.locator(".core-twos-diagram-v353").wait_for(state="visible", timeout=30_000)
    scoped_elsewhere = page.locator(".core-dbnorm-diagram-v354").count() == 0

    page.evaluate("startLesson('core_09_03')")
    page.locator(".core-dbnorm-diagram-v354").wait_for(state="visible", timeout=30_000)
    page.wait_for_timeout(250)
    metrics = collect(page)
    OUT.mkdir(parents=True, exist_ok=True)
    page.locator(".core-dbnorm-diagram-v354").screenshot(path=str(OUT / f"{name}.png"))

    layout_ok = metrics["flowColumns"] == (1 if viewport["width"] <= 820 else 3)
    after_layout_ok = metrics["afterColumns"] == (1 if viewport["width"] <= 480 else 2)
    expected_captions = (
        "正規化前の受注明細表",
        "注文\n注文そのもの",
        "商品\n商品の基本情報",
        "注文明細\n注文と商品を結ぶ",
    )
    passed = all((
        response is not None,
        response.status == 200 if response else False,
        scoped_elsewhere,
        metrics["diagramCount"] == 1,
        metrics["tableCount"] == 4,
        metrics["captions"] == list(expected_captions),
        metrics["hasBefore"],
        metrics["hasAfter"],
        metrics["hasThreeRoles"],
        layout_ok,
        after_layout_ok,
        metrics["figure"] is not None,
        not metrics["figure"]["overflow"],
        not any(metrics["tableOverflows"]),
        not metrics["documentOverflow"],
        not metrics["recoveryVisible"],
        not page_errors,
    ))
    result = {
        "name": name,
        "engine": engine,
        "httpStatus": response.status if response else None,
        "stableDocument": stable,
        "scopedOutsideDatabaseLesson": scoped_elsewhere,
        "metrics": metrics,
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
    mobile_engine = os.environ.get("V354_MOBILE_ENGINE", "webkit")
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
        "name": "v354-database-normalization-lesson-diagram",
        "productionSource": "app/base-shell-v354.html",
        "cases": cases,
        "result": "PASS" if all(case["pass"] for case in cases) else "FAIL",
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "result.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if report["result"] != "PASS":
        return 1
    print("PASS — V354 DATABASE NORMALIZATION DIAGRAM BROWSER LAYOUT 2/2")
    return 0


if __name__ == "__main__":
    sys.exit(main())

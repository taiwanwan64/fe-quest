from __future__ import annotations

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import os
import sys

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
SHELL = ROOT / "app/base-shell-v351.html"
OUT = ROOT / "_browser_evidence/v351"


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


def collect(page) -> dict:
    return page.evaluate(
        """() => {
          const rect=s=>document.querySelector(s)?.getBoundingClientRect();
          const style=s=>getComputedStyle(document.querySelector(s));
          const lines=s=>{
            const el=document.querySelector(s); if(!el)return null;
            const cs=getComputedStyle(el), lh=parseFloat(cs.lineHeight), h=el.getBoundingClientRect().height;
            return Number.isFinite(lh)&&lh>0 ? Math.round(h/lh) : null;
          };
          const grid=document.querySelector('#plan .plan-screen-grid');
          const columns=[...grid.children].map(el=>el.getBoundingClientRect());
          const cloud=document.querySelector('#cloudSyncCardV342');
          const install=document.querySelector('#pwaHealthCard .settings-install-card');
          const input=document.querySelector('#cloudSyncEmailV342');
          const health=style('#pwaHealthCard .pwa-health-grid').gridTemplateColumns.split(' ').filter(Boolean);
          return {
            viewport:{width:innerWidth,height:innerHeight},
            mainWidth:rect('main')?.width||0,
            gridColumns:style('#plan .plan-screen-grid').gridTemplateColumns,
            columnRects:columns.map(r=>({x:r.x,y:r.y,width:r.width,height:r.height})),
            cloudWidth:cloud?.getBoundingClientRect().width||0,
            cloudHeadingLines:lines('#cloudSyncCardV342 h2'),
            cloudHeadingOverflow:document.querySelector('#cloudSyncCardV342 h2')?.scrollWidth > document.querySelector('#cloudSyncCardV342 h2')?.clientWidth+1,
            cloudOverflow:cloud ? cloud.scrollWidth > cloud.clientWidth+1 : true,
            emailInputWidth:input?.getBoundingClientRect().width||0,
            emailButtonWidth:rect('#cloudSyncCardV342 [data-sync-action="send-link"]')?.width||0,
            installWidth:install?.getBoundingClientRect().width||0,
            installTitleLines:lines('#pwaHealthCard .install-title'),
            installOverflow:install ? install.scrollWidth > install.clientWidth+1 : true,
            healthColumns:health.length,
            documentOverflow:document.documentElement.scrollWidth > innerWidth+1,
            recoveryVisible:!!document.querySelector('#fequestAssetRecoveryV351'),
          };
        }"""
    )


def run_case(pw, base_url: str, name: str, engine: str, viewport: dict, mobile: bool = False) -> dict:
    browser_type = getattr(pw, engine)
    browser = browser_type.launch()
    context = browser.new_context(
        viewport=viewport,
        screen=viewport if mobile else None,
        locale="ja-JP",
        is_mobile=mobile,
        has_touch=mobile,
        device_scale_factor=2 if mobile else 1,
    )
    page = context.new_page()
    page_errors: list[str] = []
    page.on("pageerror", lambda error: page_errors.append(str(error)))
    response = page.goto(base_url, wait_until="load", timeout=60_000)
    page.locator("#home").wait_for(state="visible", timeout=30_000)
    page.wait_for_function("window.FEQUEST_APP_BOOT_COMPLETE === true", timeout=30_000)
    page.wait_for_timeout(500)
    page.evaluate("showScreen('plan',{instant:true}); setPlanDetailsOpen(true)")
    page.locator("#cloudSyncCardV342").wait_for(state="visible", timeout=30_000)
    page.locator("#pwaHealthCard").wait_for(state="visible", timeout=30_000)
    page.wait_for_timeout(300)
    metrics = collect(page)

    if viewport["width"] >= 1450:
        expected = (
            len(metrics["columnRects"]) == 2
            and abs(metrics["columnRects"][0]["y"] - metrics["columnRects"][1]["y"]) <= 2
            and metrics["columnRects"][1]["width"] >= 390
            and metrics["mainWidth"] >= 1100
            and metrics["cloudHeadingLines"] == 1
            and metrics["emailInputWidth"] >= 300
            and metrics["healthColumns"] == 2
        )
    elif viewport["width"] > 720:
        expected = (
            len(metrics["columnRects"]) == 2
            and abs(metrics["columnRects"][0]["x"] - metrics["columnRects"][1]["x"]) <= 2
            and metrics["columnRects"][1]["y"] > metrics["columnRects"][0]["y"]
            and metrics["cloudHeadingLines"] == 1
            and metrics["emailInputWidth"] >= 500
            and metrics["healthColumns"] == 3
        )
    else:
        expected = (
            len(metrics["columnRects"]) == 2
            and abs(metrics["columnRects"][0]["x"] - metrics["columnRects"][1]["x"]) <= 2
            and metrics["emailInputWidth"] >= 260
            and metrics["healthColumns"] == 1
        )

    passed = (
        response is not None
        and response.status == 200
        and expected
        and metrics["installTitleLines"] <= 2
        and not metrics["cloudHeadingOverflow"]
        and not metrics["cloudOverflow"]
        and not metrics["installOverflow"]
        and not metrics["documentOverflow"]
        and not metrics["recoveryVisible"]
        and not page_errors
    )
    OUT.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=str(OUT / f"{name}.png"), full_page=True)
    result = {
        "name": name,
        "engine": engine,
        "httpStatus": response.status if response else None,
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
    mobile_engine = os.environ.get("V351_MOBILE_ENGINE", "webkit")
    mobile_name = "mobile-webkit-390" if mobile_engine == "webkit" else f"mobile-{mobile_engine}-390"
    try:
        with sync_playwright() as pw:
            cases = [
                run_case(pw, base_url, "desktop-1920", "chromium", {"width": 1920, "height": 1080}),
                run_case(pw, base_url, "desktop-1366", "chromium", {"width": 1366, "height": 900}),
                run_case(pw, base_url, mobile_name, mobile_engine, {"width": 390, "height": 844}, True),
            ]
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)

    report = {
        "name": "v351-progress-settings-layout",
        "productionSource": "app/base-shell-v351.html",
        "cases": cases,
        "result": "PASS" if all(case["pass"] for case in cases) else "FAIL",
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "result.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if report["result"] != "PASS":
        return 1
    print("PASS — V351 PROGRESS SETTINGS BROWSER LAYOUT 3/3")
    return 0


if __name__ == "__main__":
    sys.exit(main())

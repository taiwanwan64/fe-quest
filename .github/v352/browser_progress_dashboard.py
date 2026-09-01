from __future__ import annotations

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import os
import sys

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
SHELL = ROOT / "app/base-shell-v352.html"
OUT = ROOT / "_browser_evidence/v352"
CARD_IDS = [
    "examPaceCard", "todayAllocationCard", "weekPlanCard", "reviewForecastCard",
    "readinessCard", "memoryHealthCard", "roadmapCard", "learningSettingsCard",
]


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
        """(cardIds) => {
          const byId=id=>document.getElementById(id);
          const box=id=>{
            const r=byId(id)?.getBoundingClientRect();
            return r?{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}:null;
          };
          const fold=byId('planDataFold');
          const grid=byId('planDataFold')?.querySelector('.plan-data-grid');
          const cloud=byId('cloudSyncCardV342');
          const pwa=byId('pwaHealthCard');
          return {
            viewport:{width:innerWidth,height:innerHeight},
            mainWidth:document.querySelector('main')?.getBoundingClientRect().width||0,
            cards:Object.fromEntries(cardIds.map(id=>[id,box(id)])),
            topColumns:getComputedStyle(document.querySelector('#plan .plan-dashboard-top-grid')).gridTemplateColumns.split(' ').filter(Boolean).length,
            lowerColumns:getComputedStyle(document.querySelector('#plan .plan-dashboard-lower-grid')).gridTemplateColumns.split(' ').filter(Boolean).length,
            fold:{open:!!fold?.open,box:box('planDataFold')},
            dataColumns:grid?getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length:0,
            cloudBox:cloud?box('cloudSyncCardV342'):null,
            pwaBox:pwa?box('pwaHealthCard'):null,
            cloudVisible:!!fold?.open&&!!cloud&&getComputedStyle(cloud).display!=='none'&&cloud.getBoundingClientRect().height>0,
            pwaVisible:!!fold?.open&&!!pwa&&getComputedStyle(pwa).display!=='none'&&pwa.getBoundingClientRect().height>0,
            emailWidth:byId('cloudSyncEmailV342')?.getBoundingClientRect().width||0,
            documentOverflow:document.documentElement.scrollWidth>innerWidth+1,
            dashboardOverflow:[...document.querySelectorAll('#plan .plan-dashboard-grid>.planner-card')].some(el=>el.scrollWidth>el.clientWidth+1),
            dataOverflow:fold?fold.scrollWidth>fold.clientWidth+1:true,
            recoveryVisible:!!byId('fequestAssetRecoveryV352'),
          };
        }""",
        CARD_IDS,
    )


def close(a: float, b: float, tolerance: float = 2) -> bool:
    return abs(a - b) <= tolerance


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
    page_errors: list[str] = []
    page.on("pageerror", lambda error: page_errors.append(str(error)))
    response = page.goto(base_url, wait_until="load", timeout=60_000)
    page.locator("#home").wait_for(state="visible", timeout=30_000)
    page.wait_for_function("window.FEQUEST_APP_BOOT_COMPLETE === true", timeout=30_000)
    page.wait_for_timeout(600)
    page.evaluate("showScreen('plan',{instant:true}); setPlanDetailsOpen(true)")
    page.locator("#planDataFold").wait_for(state="visible", timeout=30_000)
    page.locator("#cloudSyncCardV342").wait_for(state="attached", timeout=30_000)
    page.wait_for_timeout(300)
    closed_metrics = collect(page)
    OUT.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=str(OUT / f"{name}-dashboard.png"), full_page=True)

    page.locator("#planDataFold > summary").click()
    page.locator("#cloudSyncCardV342").wait_for(state="visible", timeout=30_000)
    page.locator("#pwaHealthCard").wait_for(state="visible", timeout=30_000)
    page.wait_for_timeout(200)
    open_metrics = collect(page)
    page.screenshot(path=str(OUT / f"{name}-data-open.png"), full_page=True)

    c = closed_metrics["cards"]
    mobile_order = ["examPaceCard", "todayAllocationCard", "weekPlanCard", "reviewForecastCard", "readinessCard", "memoryHealthCard", "roadmapCard", "learningSettingsCard"]
    order = [c[item]["y"] for item in mobile_order]
    fold_below = closed_metrics["fold"]["box"]["y"] > max(c[item]["bottom"] for item in CARD_IDS) - 2

    if viewport["width"] >= 1101:
        paired = all((
            closed_metrics["topColumns"] == 2,
            closed_metrics["lowerColumns"] == 2,
            close(c["examPaceCard"]["y"], c["todayAllocationCard"]["y"]),
            close(c["weekPlanCard"]["y"], c["reviewForecastCard"]["y"]),
            close(c["readinessCard"]["y"], c["memoryHealthCard"]["y"]),
            max(c[item]["width"] for item in CARD_IDS) - min(c[item]["width"] for item in CARD_IDS) <= 2,
            abs(c["learningSettingsCard"]["bottom"] - c["roadmapCard"]["bottom"]) <= 50,
            open_metrics["dataColumns"] == 2,
            close(open_metrics["cloudBox"]["y"], open_metrics["pwaBox"]["y"]),
            close(open_metrics["cloudBox"]["width"], open_metrics["pwaBox"]["width"]),
            open_metrics["emailWidth"] >= 300,
        ))
    else:
        paired = all((
            closed_metrics["topColumns"] == 1,
            closed_metrics["lowerColumns"] == 1,
            all(close(c[CARD_IDS[0]]["x"], c[item]["x"]) for item in CARD_IDS[1:]),
            all(order[i] < order[i + 1] for i in range(len(order) - 1)),
            open_metrics["dataColumns"] == 1,
            open_metrics["cloudBox"]["y"] < open_metrics["pwaBox"]["y"],
            open_metrics["emailWidth"] >= (260 if viewport["width"] <= 720 else 500),
        ))

    passed = all((
        response is not None,
        response.status == 200 if response else False,
        paired,
        fold_below,
        closed_metrics["fold"]["open"] is False,
        closed_metrics["cloudVisible"] is False,
        closed_metrics["pwaVisible"] is False,
        open_metrics["fold"]["open"] is True,
        open_metrics["cloudVisible"],
        open_metrics["pwaVisible"],
        not closed_metrics["documentOverflow"],
        not closed_metrics["dashboardOverflow"],
        not open_metrics["documentOverflow"],
        not open_metrics["dataOverflow"],
        not open_metrics["recoveryVisible"],
        not page_errors,
    ))
    result = {
        "name": name,
        "engine": engine,
        "httpStatus": response.status if response else None,
        "closed": closed_metrics,
        "open": open_metrics,
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
    mobile_engine = os.environ.get("V352_MOBILE_ENGINE", "webkit")
    mobile_name = "mobile-webkit-390" if mobile_engine == "webkit" else f"mobile-{mobile_engine}-390"
    try:
        with sync_playwright() as pw:
            cases = [
                run_case(pw, base_url, "desktop-1920", "chromium", {"width": 1920, "height": 1080}),
                run_case(pw, base_url, "desktop-1366", "chromium", {"width": 1366, "height": 900}),
                run_case(pw, base_url, "tablet-1024", "chromium", {"width": 1024, "height": 900}),
                run_case(pw, base_url, mobile_name, mobile_engine, {"width": 390, "height": 844}, True),
            ]
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)

    report = {
        "name": "v352-learning-priority-progress-dashboard",
        "productionSource": "app/base-shell-v352.html",
        "cases": cases,
        "result": "PASS" if all(case["pass"] for case in cases) else "FAIL",
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "result.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if report["result"] != "PASS":
        return 1
    print("PASS — V352 PROGRESS DASHBOARD BROWSER LAYOUT 4/4")
    return 0


if __name__ == "__main__":
    sys.exit(main())

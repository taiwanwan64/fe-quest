from __future__ import annotations

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import os
import sys

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
SHELL = ROOT / "app/base-shell-v353.html"
OUT = ROOT / "_browser_evidence/v353"


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
          const figure=document.querySelector('.core-twos-diagram-v353');
          const rows=[...document.querySelectorAll('.core-twos-number-v353')];
          const signed=rows.filter(row=>row.querySelector('.core-twos-sign-v353'));
          const pair=row=>{
            const sign=row.querySelector('.core-twos-sign-v353')?.getBoundingClientRect();
            const code=row.querySelector('code')?.getBoundingClientRect();
            const box=row.getBoundingClientRect();
            return {sign,code,box,wrap:getComputedStyle(row).flexWrap,overflow:row.scrollWidth>row.clientWidth+1};
          };
          const flow=document.querySelector('.core-twos-flow-v353');
          return {
            viewport:{width:innerWidth,height:innerHeight},
            figure:figure?{width:figure.getBoundingClientRect().width,overflow:figure.scrollWidth>figure.clientWidth+1}:null,
            flowColumns:flow?getComputedStyle(flow).gridTemplateColumns.split(' ').filter(Boolean).length:0,
            signed:signed.map(pair),
            plus:figure?.textContent.includes('+5')||false,
            minus:figure?.textContent.includes('-5')||false,
            diagramCount:document.querySelectorAll('.core-twos-diagram-v353').length,
            documentOverflow:document.documentElement.scrollWidth>innerWidth+1,
            recoveryVisible:!!document.getElementById('fequestAssetRecoveryV353'),
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
    page_errors: list[str] = []
    page.on("pageerror", lambda error: page_errors.append(str(error)))
    response = page.goto(base_url, wait_until="load", timeout=60_000)
    page.locator("#home").wait_for(state="visible", timeout=30_000)
    page.wait_for_function("window.FEQUEST_APP_BOOT_COMPLETE === true", timeout=30_000)
    page.evaluate("startLesson('core_01_05')")
    page.locator(".core-twos-diagram-v353").wait_for(state="visible", timeout=30_000)
    page.wait_for_timeout(250)
    metrics = collect(page)
    OUT.mkdir(parents=True, exist_ok=True)
    page.locator(".core-twos-diagram-v353").screenshot(path=str(OUT / f"{name}.png"))

    signed_inline = len(metrics["signed"]) == 2 and all(
        row["wrap"] == "nowrap"
        and not row["overflow"]
        and row["sign"]["right"] < row["code"]["left"]
        and abs((row["sign"]["top"] + row["sign"]["bottom"]) / 2 - (row["code"]["top"] + row["code"]["bottom"]) / 2) <= 3
        for row in metrics["signed"]
    )
    layout_ok = metrics["flowColumns"] == (1 if viewport["width"] <= 720 else 5)
    passed = all((
        response is not None,
        response.status == 200 if response else False,
        metrics["diagramCount"] == 1,
        metrics["plus"],
        metrics["minus"],
        signed_inline,
        layout_ok,
        metrics["figure"] is not None,
        not metrics["figure"]["overflow"],
        not metrics["documentOverflow"],
        not metrics["recoveryVisible"],
        not page_errors,
    ))
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
    mobile_engine = os.environ.get("V353_MOBILE_ENGINE", "webkit")
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
        "name": "v353-inline-twos-complement-lesson-diagram",
        "productionSource": "app/base-shell-v353.html",
        "cases": cases,
        "result": "PASS" if all(case["pass"] for case in cases) else "FAIL",
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "result.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if report["result"] != "PASS":
        return 1
    print("PASS — V353 INLINE LESSON DIAGRAM BROWSER LAYOUT 2/2")
    return 0


if __name__ == "__main__":
    sys.exit(main())

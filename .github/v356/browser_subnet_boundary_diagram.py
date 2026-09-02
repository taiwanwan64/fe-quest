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
SHELL = ROOT / "app/base-shell-v356.html"
OUT = ROOT / "_browser_evidence/v356"


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
          const figure=document.querySelector('.core-subnet-diagram-v356');
          const rows=[...document.querySelectorAll('.core-subnet-binary-row-v356')];
          const bitlines=[...document.querySelectorAll('.core-subnet-bitline-v356')];
          const boundaries=[...document.querySelectorAll('.core-subnet-bitline-v356 .core-subnet-boundary-v356')];
          const boundaryLefts=boundaries.map(node=>Math.round(node.getBoundingClientRect().left*10)/10);
          const boundaryAligned=boundaryLefts.length===3&&boundaryLefts.every(left=>Math.abs(left-boundaryLefts[0])<=1);
          const network=[...document.querySelectorAll('.core-subnet-network-bits-v356')];
          const hosts=[...document.querySelectorAll('.core-subnet-host-bits-v356')];
          const text=figure?.textContent||'';
          return {
            viewport:{width:innerWidth,height:innerHeight},
            diagramCount:document.querySelectorAll('.core-subnet-diagram-v356').length,
            figure:figure?{width:figure.getBoundingClientRect().width,overflow:figure.scrollWidth>figure.clientWidth+1}:null,
            rowCount:rows.length,
            rowColumns:rows.map(row=>getComputedStyle(row).gridTemplateColumns.split(' ').filter(Boolean).length),
            bitlineColumns:bitlines.map(line=>getComputedStyle(line).gridTemplateColumns.split(' ').filter(Boolean).length),
            boundaryLefts,
            boundaryAligned,
            segmentOverflows:[...network,...hosts].map(node=>node.scrollWidth>node.clientWidth+1),
            networkWiderThanHost:network.length===3&&hosts.length===3&&network.every((node,index)=>node.getBoundingClientRect().width>hosts[index].getBoundingClientRect().width*3.5),
            colorsDistinct:network.length>0&&hosts.length>0&&getComputedStyle(network[0]).backgroundColor!==getComputedStyle(hosts[0]).backgroundColor,
            summaryColumns:(()=>{const node=document.querySelector('.core-subnet-summary-v356');return node?getComputedStyle(node).gridTemplateColumns.split(' ').filter(Boolean).length:0;})(),
            hasCidr:text.includes('192.168.1.130/26')&&text.includes('26bit ＋ 6bit'),
            hasMask:text.includes('255.255.255.192'),
            hasResult:text.includes('ネットワークアドレスは 192.168.1.128'),
            hasZeroRule:text.includes('ホスト部をすべて0にする'),
            documentOverflow:document.documentElement.scrollWidth>innerWidth+1,
            recoveryVisible:!!document.getElementById('fequestAssetRecoveryV356'),
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
    scoped_elsewhere = page.locator(".core-subnet-diagram-v356").count() == 0

    page.evaluate("startLesson('core_10_04')")
    page.locator(".core-subnet-diagram-v356").wait_for(state="visible", timeout=30_000)
    page.wait_for_timeout(250)
    metrics = collect(page)
    OUT.mkdir(parents=True, exist_ok=True)
    page.locator(".core-subnet-diagram-v356").screenshot(path=str(OUT / f"{name}.png"))

    expected_row_columns = 1 if viewport["width"] <= 720 else 2
    expected_summary_columns = 1 if viewport["width"] <= 720 else 3
    passed = all((
        response is not None,
        response.status == 200 if response else False,
        scoped_elsewhere,
        metrics["diagramCount"] == 1,
        metrics["rowCount"] == 3,
        metrics["rowColumns"] == [expected_row_columns] * 3,
        metrics["bitlineColumns"] == [3, 3, 3],
        metrics["boundaryAligned"],
        metrics["networkWiderThanHost"],
        metrics["colorsDistinct"],
        metrics["summaryColumns"] == expected_summary_columns,
        metrics["hasCidr"],
        metrics["hasMask"],
        metrics["hasResult"],
        metrics["hasZeroRule"],
        metrics["figure"] is not None,
        not metrics["figure"]["overflow"],
        not any(metrics["segmentOverflows"]),
        not metrics["documentOverflow"],
        not metrics["recoveryVisible"],
        not page_errors,
    ))
    result = {
        "name": name,
        "engine": engine,
        "httpStatus": response.status if response else None,
        "stableDocument": stable,
        "scopedOutsideSubnetLesson": scoped_elsewhere,
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
    mobile_engine = os.environ.get("V356_MOBILE_ENGINE", "webkit")
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
        "name": "v356-subnet-network-host-boundary-diagram",
        "productionSource": "app/base-shell-v356.html",
        "cases": cases,
        "result": "PASS" if all(case["pass"] for case in cases) else "FAIL",
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "result.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if report["result"] != "PASS":
        return 1
    print("PASS — V356 SUBNET BOUNDARY DIAGRAM BROWSER LAYOUT 2/2")
    return 0


if __name__ == "__main__":
    sys.exit(main())

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
SHELL = ROOT / "app/base-shell-v357.html"
OUT = ROOT / "_browser_evidence/v357"


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
          const figure=document.querySelector('.core-memory-hierarchy-diagram-v357');
          const stage=document.querySelector('.core-memory-stage-v357');
          const levels=[...document.querySelectorAll('.core-memory-level-v357')];
          const axes=[...document.querySelectorAll('.core-memory-axis-v357')];
          const mobileTrends=document.querySelector('.core-memory-mobile-trends-v357');
          const widths=levels.map(node=>Math.round(node.getBoundingClientRect().width*10)/10);
          const tops=levels.map(node=>Math.round(node.getBoundingClientRect().top*10)/10);
          const colors=levels.map(node=>getComputedStyle(node).backgroundColor);
          const names=levels.map(node=>node.querySelector('b')?.textContent?.trim()||'');
          const text=figure?.textContent||'';
          return {
            viewport:{width:innerWidth,height:innerHeight},
            diagramCount:document.querySelectorAll('.core-memory-hierarchy-diagram-v357').length,
            figure:figure?{width:figure.getBoundingClientRect().width,overflow:figure.scrollWidth>figure.clientWidth+1}:null,
            stageColumns:stage?getComputedStyle(stage).gridTemplateColumns.split(' ').filter(Boolean).length:0,
            levelCount:levels.length,
            names,
            widths,
            widthsIncrease:widths.length===4&&widths.every((width,index)=>index===0||width>widths[index-1]+8),
            topClearlySmaller:widths.length===4&&widths[0]<widths[3]*.72,
            verticalOrder:tops.length===4&&tops.every((top,index)=>index===0||top>tops[index-1]),
            levelOverflows:levels.map(node=>node.scrollWidth>node.clientWidth+1),
            distinctColors:new Set(colors).size===4,
            axesDisplay:axes.map(node=>getComputedStyle(node).display),
            mobileTrendsDisplay:mobileTrends?getComputedStyle(mobileTrends).display:'missing',
            hasTrend:text.includes('CPUに近いほど高速・小容量')&&text.includes('下へ行くほど一般に低速'),
            hasRoles:text.includes('今すぐ使う値を保持')&&text.includes('よく使うデータを一時保持')&&text.includes('実行中のプログラムを保持')&&text.includes('大容量・電源断後も保持'),
            hasExamRule:text.includes('容量が大きいほど高速')&&text.includes('役割の違う記憶装置を階層にして使います'),
            documentOverflow:document.documentElement.scrollWidth>innerWidth+1,
            recoveryVisible:!!document.getElementById('fequestAssetRecoveryV357'),
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

    page.evaluate("startLesson('core_10_04')")
    page.locator(".core-subnet-diagram-v356").wait_for(state="visible", timeout=30_000)
    scoped_elsewhere = page.locator(".core-memory-hierarchy-diagram-v357").count() == 0

    page.evaluate("startLesson('core_04_03')")
    page.locator(".core-memory-hierarchy-diagram-v357").wait_for(state="visible", timeout=30_000)
    page.wait_for_timeout(250)
    metrics = collect(page)
    OUT.mkdir(parents=True, exist_ok=True)
    page.locator(".core-memory-hierarchy-diagram-v357").screenshot(path=str(OUT / f"{name}.png"))

    expected_stage_columns = 1 if viewport["width"] <= 640 else 3
    expected_axis_display = "none" if viewport["width"] <= 640 else "grid"
    expected_mobile_trends = "grid" if viewport["width"] <= 640 else "none"
    passed = all((
        response is not None,
        response.status == 200 if response else False,
        scoped_elsewhere,
        metrics["diagramCount"] == 1,
        metrics["stageColumns"] == expected_stage_columns,
        metrics["levelCount"] == 4,
        metrics["names"] == ["レジスタ", "キャッシュ", "主記憶（RAM）", "補助記憶"],
        metrics["widthsIncrease"],
        metrics["topClearlySmaller"],
        metrics["verticalOrder"],
        metrics["distinctColors"],
        metrics["axesDisplay"] == [expected_axis_display, expected_axis_display],
        metrics["mobileTrendsDisplay"] == expected_mobile_trends,
        metrics["hasTrend"],
        metrics["hasRoles"],
        metrics["hasExamRule"],
        metrics["figure"] is not None,
        not metrics["figure"]["overflow"],
        not any(metrics["levelOverflows"]),
        not metrics["documentOverflow"],
        not metrics["recoveryVisible"],
        not page_errors,
    ))
    result = {
        "name": name,
        "engine": engine,
        "httpStatus": response.status if response else None,
        "stableDocument": stable,
        "scopedOutsideMemoryLesson": scoped_elsewhere,
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
    mobile_engine = os.environ.get("V357_MOBILE_ENGINE", "webkit")
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
        "name": "v357-memory-speed-capacity-hierarchy-diagram",
        "productionSource": "app/base-shell-v357.html",
        "cases": cases,
        "result": "PASS" if all(case["pass"] for case in cases) else "FAIL",
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "result.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if report["result"] != "PASS":
        return 1
    print("PASS — V357 MEMORY HIERARCHY DIAGRAM BROWSER LAYOUT 2/2")
    return 0


if __name__ == "__main__":
    sys.exit(main())

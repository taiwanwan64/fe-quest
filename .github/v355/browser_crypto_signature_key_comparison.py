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
SHELL = ROOT / "app/base-shell-v355.html"
OUT = ROOT / "_browser_evidence/v355"


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
          const figure=document.querySelector('.core-keycompare-diagram-v355');
          const tracks=[...document.querySelectorAll('.core-keycompare-track-v355')];
          const contentBoxes=[...document.querySelectorAll('.core-keycompare-step-v355,.core-keycompare-payload-v355')];
          const cardLefts=track=>[...track.children]
            .filter(node=>node.matches('.core-keycompare-step-v355,.core-keycompare-payload-v355'))
            .map(node=>Math.round(node.getBoundingClientRect().left*10)/10);
          const lefts=tracks.map(cardLefts);
          const aligned=lefts.length===2&&lefts[0].length===3&&lefts[1].length===3&&lefts[0].every((left,index)=>Math.abs(left-lefts[1][index])<=1);
          const text=figure?.textContent||'';
          return {
            viewport:{width:innerWidth,height:innerHeight},
            diagramCount:document.querySelectorAll('.core-keycompare-diagram-v355').length,
            figure:figure?{width:figure.getBoundingClientRect().width,overflow:figure.scrollWidth>figure.clientWidth+1}:null,
            trackCount:tracks.length,
            trackColumns:tracks.map(track=>getComputedStyle(track).gridTemplateColumns.split(' ').filter(Boolean).length),
            cardLefts:lefts,
            columnsAligned:aligned,
            contentBoxOverflows:contentBoxes.map(box=>box.scrollWidth>box.clientWidth+1),
            hasEncryptionKeys:text.includes('受信者の公開鍵')&&text.includes('受信者の秘密鍵'),
            hasSignatureKeys:text.includes('署名者の秘密鍵')&&text.includes('署名者の公開鍵'),
            hasHashAccuracy:text.includes('文書のハッシュへ署名'),
            hasPurposeContrast:text.includes('目的：秘密に送る')&&text.includes('目的：本人・改ざん確認'),
            documentOverflow:document.documentElement.scrollWidth>innerWidth+1,
            recoveryVisible:!!document.getElementById('fequestAssetRecoveryV355'),
          };
        }"""
    )


def diagram_in_lesson(page, lesson_id: str, screenshot_name: str) -> dict:
    page.evaluate("lessonId => startLesson(lessonId)", lesson_id)
    page.locator(".core-keycompare-diagram-v355").wait_for(state="visible", timeout=30_000)
    page.wait_for_timeout(200)
    metrics = collect(page)
    OUT.mkdir(parents=True, exist_ok=True)
    page.locator(".core-keycompare-diagram-v355").screenshot(path=str(OUT / screenshot_name))
    return metrics


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
    scoped_elsewhere = page.locator(".core-keycompare-diagram-v355").count() == 0

    crypto = diagram_in_lesson(page, "core_11_02", f"{name}-core-11-02.png")
    signature = diagram_in_lesson(page, "core_11_03", f"{name}-core-11-03.png")
    expected_columns = 1 if viewport["width"] <= 820 else 5

    def metrics_pass(metrics: dict) -> bool:
        return all((
            metrics["diagramCount"] == 1,
            metrics["trackCount"] == 2,
            metrics["trackColumns"] == [expected_columns, expected_columns],
            metrics["columnsAligned"] if expected_columns == 5 else True,
            metrics["hasEncryptionKeys"],
            metrics["hasSignatureKeys"],
            metrics["hasHashAccuracy"],
            metrics["hasPurposeContrast"],
            metrics["figure"] is not None,
            not metrics["figure"]["overflow"],
            not any(metrics["contentBoxOverflows"]),
            not metrics["documentOverflow"],
            not metrics["recoveryVisible"],
        ))

    passed = all((
        response is not None,
        response.status == 200 if response else False,
        scoped_elsewhere,
        metrics_pass(crypto),
        metrics_pass(signature),
        not page_errors,
    ))
    result = {
        "name": name,
        "engine": engine,
        "httpStatus": response.status if response else None,
        "stableDocument": stable,
        "scopedOutsideSecurityLessons": scoped_elsewhere,
        "core1102": crypto,
        "core1103": signature,
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
    mobile_engine = os.environ.get("V355_MOBILE_ENGINE", "webkit")
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
        "name": "v355-crypto-signature-key-comparison",
        "productionSource": "app/base-shell-v355.html",
        "cases": cases,
        "result": "PASS" if all(case["pass"] for case in cases) else "FAIL",
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "result.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if report["result"] != "PASS":
        return 1
    print("PASS — V355 CRYPTO SIGNATURE KEY COMPARISON BROWSER LAYOUT 2/2")
    return 0


if __name__ == "__main__":
    sys.exit(main())

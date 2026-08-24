from __future__ import annotations

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import sys

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
SHELL = ROOT / "app/base-shell-v345.html"
OUT = ROOT / "_browser_evidence/v348/local-fail-open.json"


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


def visible(page, selector: str) -> bool:
    loc = page.locator(selector)
    return loc.count() > 0 and loc.first.is_visible()


def run_optional_probe(pw, base_url: str) -> dict:
    browser = pw.webkit.launch()
    context = browser.new_context(
        viewport={"width": 390, "height": 844},
        screen={"width": 390, "height": 844},
        locale="ja-JP",
        is_mobile=True,
        has_touch=True,
        device_scale_factor=3,
    )
    page = context.new_page()
    failed = []
    page.on("requestfailed", lambda req: failed.append(f"{req.method} {req.url} :: {req.failure}"))
    page.route("**/cloud/reconciliation-v342.js", lambda route: route.abort("failed"))
    response = page.goto(base_url, wait_until="domcontentloaded", timeout=60_000)
    page.locator("#home").wait_for(state="visible", timeout=30_000)
    page.wait_for_timeout(2_000)
    recovery = visible(page, "#fequestAssetRecoveryV345")
    result = {
        "name": "optional-cloud-asset-failure",
        "status": response.status if response else None,
        "recoveryVisible": recovery,
        "homeVisible": visible(page, "#home"),
        "failedRequests": failed,
        "pass": not recovery and visible(page, "#home"),
    }
    context.close()
    browser.close()
    return result


def run_core_probe(pw, base_url: str) -> dict:
    browser = pw.chromium.launch()
    context = browser.new_context(viewport={"width": 1200, "height": 900}, locale="ja-JP")
    page = context.new_page()
    failed = []
    page.on("requestfailed", lambda req: failed.append(f"{req.method} {req.url} :: {req.failure}"))
    page.route("**/assets/app-v345.js", lambda route: route.abort("failed"))
    response = page.goto(base_url, wait_until="domcontentloaded", timeout=60_000)
    page.wait_for_timeout(800)
    recovery = visible(page, "#fequestAssetRecoveryV345")
    result = {
        "name": "essential-core-script-failure",
        "status": response.status if response else None,
        "recoveryVisible": recovery,
        "failedRequests": failed,
        "pass": recovery,
    }
    context.close()
    browser.close()
    return result


def main() -> int:
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base_url = f"http://127.0.0.1:{server.server_address[1]}/"
    try:
        with sync_playwright() as pw:
            optional = run_optional_probe(pw, base_url)
            core = run_core_probe(pw, base_url)
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)

    report = {
        "name": "v348-local-fail-open-probe",
        "productionSource": "app/base-shell-v345.html",
        "optionalCloudMustFailOpen": optional,
        "essentialCoreMustRecover": core,
        "result": "PASS" if optional["pass"] and core["pass"] else "FAIL",
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if report["result"] != "PASS":
        return 1
    print("PASS — V348 LOCAL FAIL-OPEN PROBE")
    return 0


if __name__ == "__main__":
    sys.exit(main())

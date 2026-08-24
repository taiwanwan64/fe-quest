from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path
import json
import sys
import traceback

from playwright.sync_api import sync_playwright

PRODUCTION_URL = "https://taiwanwan64.github.io/fe-quest/"
PRIVACY_URL = PRODUCTION_URL + "privacy.html"
OUT = Path("_browser_evidence/v348")
OUT.mkdir(parents=True, exist_ok=True)


def require(ok: bool, message: str) -> None:
    if not ok:
        raise AssertionError(message)


def active_screen(page):
    return page.evaluate("document.querySelector('.screen.active')?.id || null")


def run_case(pw, name: str, browser_type, context_options: dict) -> dict:
    case_dir = OUT / name
    case_dir.mkdir(parents=True, exist_ok=True)
    browser = browser_type.launch()
    context = browser.new_context(**context_options)
    page = context.new_page()
    page_errors: list[str] = []
    console_errors: list[str] = []
    failed_requests: list[str] = []

    page.on("pageerror", lambda err: page_errors.append(str(err)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.on("requestfailed", lambda req: failed_requests.append(f"{req.method} {req.url} :: {req.failure}"))

    result = {
        "browser": name,
        "productionUrl": PRODUCTION_URL,
        "pageErrors": page_errors,
        "consoleErrors": console_errors,
        "failedRequests": failed_requests,
    }

    try:
        response = page.goto(PRODUCTION_URL, wait_until="domcontentloaded", timeout=90_000)
        require(response is not None and response.ok, f"{name}: production navigation failed")
        page.locator("#home").wait_for(state="visible", timeout=45_000)
        page.wait_for_timeout(1_000)

        title = page.title()
        result["title"] = title
        result["initialStatus"] = response.status
        require("FE QUEST" in title and "v345" in title, f"{name}: unexpected production title: {title!r}")
        require(page.locator("#fequestAssetRecoveryV345").count() == 0, f"{name}: asset recovery UI was shown")

        first_run = page.locator("#firstRunExperienceV340")
        first_run.wait_for(state="visible", timeout=20_000)
        result["freshFirstRunVisible"] = True

        future_exam = (date.today() + timedelta(days=30)).isoformat()
        exam_input = page.locator("#firstRunExamDateV340")
        exam_input.fill(future_exam)
        result["examDate"] = future_exam

        create_plan = page.locator("#firstRunCreatePlanV340")
        require(create_plan.is_visible(), f"{name}: create-plan CTA is not visible")
        create_plan.click()
        ready = page.locator('#firstRunExperienceV340[data-state="ready"]')
        ready.wait_for(state="visible", timeout=30_000)

        task_rows = page.locator("#firstRunExperienceV340 .v340-task")
        task_count = task_rows.count()
        result["firstRunTaskCount"] = task_count
        result["firstRunTaskText"] = [task_rows.nth(i).inner_text() for i in range(task_count)]
        require(task_count >= 1, f"{name}: first-run plan contains no task")
        start_now = page.locator("#firstRunStartV340")
        require(start_now.is_visible(), f"{name}: first-run start CTA is missing")
        page.screenshot(path=str(case_dir / "01-first-run-ready.png"), full_page=True)

        start_now.click()
        page.wait_for_timeout(800)
        require(page.locator("#firstRunExperienceV340").count() == 0, f"{name}: first-run overlay did not close")
        first_learning_screen = active_screen(page)
        result["firstLearningScreen"] = first_learning_screen
        require(first_learning_screen not in (None, "home"), f"{name}: first task did not leave home")
        require(page.locator("#fequestAssetRecoveryV345").count() == 0, f"{name}: asset recovery UI appeared after starting")

        page.locator('.nav-btn[data-screen="home"]').first.click()
        page.locator("#home").wait_for(state="visible", timeout=15_000)
        diagnostic = page.locator("#startDiagnostic")
        require(diagnostic.is_visible(), f"{name}: diagnostic CTA is not visible after returning home")
        diagnostic.click()
        page.locator("#diagnostic.screen.active").wait_for(state="visible", timeout=15_000)
        page.wait_for_timeout(300)
        option_count = page.locator("#diagOptions button").count()
        result["diagnosticOptionCount"] = option_count
        require(option_count >= 2, f"{name}: diagnostic first question/options were not rendered")
        page.screenshot(path=str(case_dir / "02-diagnostic-entry.png"), full_page=True)

        # Deliberately do not assert the Home today-resume CTA after abandoning the
        # diagnostic. The product keeps onboarding gated until the diagnostic is
        # completed; the completed-diagnostic -> today-task handoff is contract-covered
        # by v347 and belongs in the final human end-to-end pass.
        page.locator('.nav-btn[data-screen="home"]').first.click()
        page.locator("#home").wait_for(state="visible", timeout=15_000)
        result["homeAfterDiagnosticAbort"] = active_screen(page) == "home"
        require(result["homeAfterDiagnosticAbort"], f"{name}: could not return home from diagnostic")

        page.reload(wait_until="domcontentloaded", timeout=90_000)
        page.locator("#home").wait_for(state="visible", timeout=30_000)
        page.wait_for_timeout(500)
        first_run_after_reload = page.locator("#firstRunExperienceV340").count() > 0 and page.locator("#firstRunExperienceV340").first.is_visible()
        result["firstRunVisibleAfterReload"] = first_run_after_reload
        require(not first_run_after_reload, f"{name}: saved first-run settings were lost after reload")
        require(page.locator("#startDiagnostic").is_visible(), f"{name}: diagnostic CTA missing after reload")
        require(page.locator("#fequestAssetRecoveryV345").count() == 0, f"{name}: asset recovery UI appeared after reload")
        page.screenshot(path=str(case_dir / "03-home-after-reload.png"), full_page=True)

        privacy = context.request.get(PRIVACY_URL, timeout=30_000)
        result["privacyStatus"] = privacy.status
        privacy_text = privacy.text()
        require(privacy.ok, f"{name}: privacy page returned {privacy.status}")
        require("v345で公開中のローカルファースト学習・任意のクラウド同期・アカウント削除の実装を基準" in privacy_text,
                f"{name}: privacy page does not match current production baseline")

        require(not page_errors, f"{name}: uncaught page errors: {page_errors}")
        result["result"] = "PASS"
    except Exception as exc:
        result["result"] = "FAIL"
        result["error"] = str(exc)
        result["traceback"] = traceback.format_exc()
        try:
            page.screenshot(path=str(case_dir / "FAIL.png"), full_page=True)
        except Exception:
            pass
    finally:
        context.close()
        browser.close()

    return result


def main() -> int:
    with sync_playwright() as pw:
        results = [
            run_case(
                pw,
                "chromium-desktop",
                pw.chromium,
                {"viewport": {"width": 1440, "height": 1000}, "locale": "ja-JP"},
            ),
            run_case(
                pw,
                "webkit-mobile",
                pw.webkit,
                {
                    "viewport": {"width": 390, "height": 844},
                    "screen": {"width": 390, "height": 844},
                    "locale": "ja-JP",
                    "is_mobile": True,
                    "has_touch": True,
                    "device_scale_factor": 3,
                },
            ),
        ]

    report = {
        "name": "v348-production-browser-acceptance",
        "productionVersion": "v345",
        "target": PRODUCTION_URL,
        "result": "PASS" if all(x.get("result") == "PASS" for x in results) else "FAIL",
        "cases": results,
        "notes": [
            "This verifies live GitHub Pages in Chromium and WebKit engines.",
            "It is not a substitute for one final physical-device Safari/Chrome pass before inviting external testers.",
            "The 12-question diagnostic completion handoff and today-resume route remain contract-covered by v347; v348 verifies real-browser diagnostic entry and first-question rendering without asserting UI that is intentionally gated while the diagnostic is incomplete.",
            "Optional Supabase requests may be blocked by the CI network; product acceptance is based on the local-first learner path and uncaught browser errors, not availability of optional cloud sync in the runner.",
        ],
    }
    report_path = OUT / "result.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if report["result"] != "PASS":
        return 1
    print("PASS — V348 LIVE PRODUCTION BROWSER ACCEPTANCE")
    return 0


if __name__ == "__main__":
    sys.exit(main())

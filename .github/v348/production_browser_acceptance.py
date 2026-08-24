from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path
import json
import sys
import time
import traceback

from playwright.sync_api import Error as PlaywrightError, sync_playwright

PRODUCTION_URL = "https://taiwanwan64.github.io/fe-quest/"
PRIVACY_URL = PRODUCTION_URL + "privacy.html"
OUT = Path("_browser_evidence/v348")
OUT.mkdir(parents=True, exist_ok=True)


def require(ok: bool, message: str) -> None:
    if not ok:
        raise AssertionError(message)


def active_screen(page):
    return page.evaluate("document.querySelector('.screen.active')?.id || null")


def wait_for_stable_page(page, timeout: int = 45_000) -> dict:
    """Wait for a settled document, including a possible PWA boot/update reload.

    Fresh browser contexts may install/activate the service worker and navigate once
    shortly after the first load. Assertions against the replaced document create a
    false failure and do not represent a human-interactable state. We therefore require
    boot + pageshow and then verify that performance.timeOrigin remains unchanged for a
    quiet window before interacting.
    """
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
    raise AssertionError(f"production page did not reach a navigation-stable boot state: {last_error or 'timeout'}")


def recovery_state(page) -> dict:
    locator = page.locator("#fequestAssetRecoveryV345")
    count = locator.count()
    visible = bool(count and locator.first.is_visible())
    text = locator.first.inner_text()[:300] if count else ""
    return {"count": count, "visible": visible, "text": text}


def run_case(pw, name: str, browser_type, context_options: dict) -> dict:
    case_dir = OUT / name
    case_dir.mkdir(parents=True, exist_ok=True)
    browser = browser_type.launch()
    context = browser.new_context(**context_options)
    page = context.new_page()
    page.add_init_script(
        """window.__FEQ_PAGESHOW_SEEN=false;
        addEventListener('pageshow',()=>{window.__FEQ_PAGESHOW_SEEN=true;},{once:true});"""
    )
    page_errors: list[str] = []
    console_errors: list[str] = []
    failed_requests: list[str] = []
    top_level_navigations: list[str] = []

    page.on("pageerror", lambda err: page_errors.append(str(err)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.on("requestfailed", lambda req: failed_requests.append(f"{req.method} {req.url} :: {req.failure}"))
    page.on("framenavigated", lambda frame: top_level_navigations.append(frame.url) if frame == page.main_frame else None)

    result = {
        "browser": name,
        "productionUrl": PRODUCTION_URL,
        "pageErrors": page_errors,
        "consoleErrors": console_errors,
        "failedRequests": failed_requests,
        "topLevelNavigations": top_level_navigations,
    }

    try:
        response = page.goto(PRODUCTION_URL, wait_until="load", timeout=90_000)
        require(response is not None and response.ok, f"{name}: production navigation failed")
        settled = wait_for_stable_page(page)

        title = page.title()
        result["title"] = title
        result["initialStatus"] = response.status
        result["settledPage"] = settled
        result["pageshowSeen"] = page.evaluate("window.__FEQ_PAGESHOW_SEEN === true")
        result["documentReadyState"] = page.evaluate("document.readyState")
        require("FE QUEST" in title and "v345" in title, f"{name}: unexpected production title: {title!r}")
        recovery = recovery_state(page)
        result["assetRecoveryAtSettledBoot"] = recovery
        require(not recovery["visible"], f"{name}: visible asset recovery UI was shown after settled boot")

        first_run = page.locator("#firstRunExperienceV340")
        first_run.wait_for(state="visible", timeout=20_000)
        setup_button = page.locator("#firstRunCreatePlanV340")
        setup_button.wait_for(state="visible", timeout=10_000)
        # Confirm the pageshow-driven setup render has stopped replacing its children.
        page.evaluate("window.__FEQ_SETUP_BUTTON_STABLE=document.getElementById('firstRunCreatePlanV340')")
        page.wait_for_timeout(300)
        require(
            page.evaluate("document.getElementById('firstRunCreatePlanV340')===window.__FEQ_SETUP_BUTTON_STABLE"),
            f"{name}: first-run form was still being rebuilt after settled boot",
        )
        result["freshFirstRunVisible"] = True

        future_exam = (date.today() + timedelta(days=30)).isoformat()
        exam_input = page.locator("#firstRunExamDateV340")
        exam_input.fill(future_exam)
        page.wait_for_timeout(100)
        actual_exam = exam_input.input_value()
        result["examDate"] = future_exam
        result["examDateInputValue"] = actual_exam
        require(actual_exam == future_exam, f"{name}: exam-date input did not remain stable after settled load/pageshow")

        setup_button.wait_for(state="visible", timeout=10_000)
        setup_button.click()
        ready = page.locator('#firstRunExperienceV340[data-state="ready"]')
        ready.wait_for(state="visible", timeout=30_000)

        task_rows = page.locator("#firstRunExperienceV340 .v340-task")
        task_count = task_rows.count()
        result["firstRunTaskCount"] = task_count
        result["firstRunTaskText"] = [task_rows.nth(i).inner_text() for i in range(task_count)]
        require(task_count >= 1, f"{name}: first-run plan contains no task")
        start_now = page.locator("#firstRunStartV340")
        start_now.wait_for(state="visible", timeout=10_000)
        page.screenshot(path=str(case_dir / "01-first-run-ready.png"), full_page=True)

        start_now.click()
        page.wait_for_timeout(800)
        require(page.locator("#firstRunExperienceV340").count() == 0, f"{name}: first-run overlay did not close")
        first_learning_screen = active_screen(page)
        result["firstLearningScreen"] = first_learning_screen
        require(first_learning_screen not in (None, "home"), f"{name}: first task did not leave home")
        recovery = recovery_state(page)
        result["assetRecoveryAfterLearningStart"] = recovery
        require(not recovery["visible"], f"{name}: visible asset recovery UI appeared after starting")

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

        page.reload(wait_until="load", timeout=90_000)
        settled_reload = wait_for_stable_page(page)
        result["settledReload"] = settled_reload
        first_run_after_reload = page.locator("#firstRunExperienceV340").count() > 0 and page.locator("#firstRunExperienceV340").first.is_visible()
        result["firstRunVisibleAfterReload"] = first_run_after_reload
        require(not first_run_after_reload, f"{name}: saved first-run settings were lost after reload")
        require(page.locator("#startDiagnostic").is_visible(), f"{name}: diagnostic CTA missing after reload")
        recovery = recovery_state(page)
        result["assetRecoveryAfterReload"] = recovery
        require(not recovery["visible"], f"{name}: visible asset recovery UI appeared after reload")
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
        "interactionBoundary": "navigation-stable after load/pageshow",
        "result": "PASS" if all(x.get("result") == "PASS" for x in results) else "FAIL",
        "cases": results,
        "notes": [
            "This verifies live GitHub Pages in Chromium and WebKit engines after load/pageshow and after any short PWA boot/update navigation has settled, matching a human-interactable onboarding state.",
            "It is not a substitute for one final physical-device Safari/Chrome pass before inviting external testers.",
            "The 12-question diagnostic completion handoff and today-resume route remain contract-covered by v347; v348 verifies real-browser diagnostic entry and first-question rendering without asserting UI that is intentionally gated while the diagnostic is incomplete.",
            "Optional Supabase requests may be blocked by the CI network; product acceptance is based on the local-first learner path and uncaught browser errors, not availability of optional cloud sync in the runner.",
            "Asset recovery is rejected when it is visible after the document has settled; a recovery node observed only in a document that is immediately replaced by an intentional PWA boot navigation is not treated as learner-visible failure.",
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

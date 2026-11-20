"""Optional browser check against a running demo (requires Playwright)."""

import os
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=os.getenv("CHROMIUM_PATH") or None)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(os.getenv("DEMO_URL", "http://localhost:8080"))
        expect(page.get_by_role("heading", name="Your next opportunity")).to_be_visible()
        expect(
            page.get_by_role("heading", name="Python Backend Developer", exact=True)
        ).to_be_visible()
        screenshot = os.getenv("SCREENSHOT_PATH")
        if screenshot:
            Path(screenshot).parent.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=screenshot, full_page=True)
        page.get_by_placeholder("Title or company").fill("Northstar")
        page.get_by_role("heading", name="Python Backend Developer", exact=True).click()
        expect(page.get_by_text("86 / 100", exact=True)).to_be_visible()
        page.get_by_label("Status", exact=True).select_option("applied")
        page.get_by_role("button", name="Back to vacancies").click()
        page.get_by_role("button", name="Archive Python Backend Developer", exact=True).click()
        page.get_by_label("Queue", exact=True).select_option("true")
        expect(
            page.get_by_role("button", name="Restore Python Backend Developer", exact=True)
        ).to_be_visible()
        page.get_by_role("button", name="Restore Python Backend Developer", exact=True).click()
        page.get_by_label("Queue", exact=True).select_option("false")
        page.reload()
        expect(page.get_by_text("applied", exact=True).first).to_be_visible()
        page.get_by_role("button", name="profile", exact=True).click()
        expect(page.get_by_role("heading", name="Alex Example")).to_be_visible()
        page.get_by_role("button", name="normalizer", exact=True).click()
        page.get_by_role("button", name="Normalize text").click()
        expect(page.locator("pre")).to_contain_text("Python & PostgreSQL")
        page.set_viewport_size({"width": 390, "height": 844})
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
        assert not errors, errors
        browser.close()
        print(
            "Browser smoke passed: rendering, analysis, archive/restore, persistence, profile, normalization, mobile."
        )


if __name__ == "__main__":
    main()

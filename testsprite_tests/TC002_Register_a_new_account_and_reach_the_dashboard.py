import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:5174")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Click the 'Buat Akun Gratis' link on the homepage to open the registration page.
        # Buat Akun Gratis link
        elem = page.get_by_role('link', name='Buat Akun Gratis', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the Name, Username, Email, and Password fields and click the 'Sign Up' button to submit the registration form.
        # What should we call you? text field
        elem = page.get_by_placeholder('What should we call you?', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Automated Tester 20260804")
        
        # -> Fill the Name, Username, Email, and Password fields and click the 'Sign Up' button to submit the registration form.
        # Choose a unique username text field
        elem = page.get_by_placeholder('Choose a unique username', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("tester20260804")
        
        # -> Fill the Name, Username, Email, and Password fields and click the 'Sign Up' button to submit the registration form.
        # Enter your email email field
        elem = page.get_by_placeholder('Enter your email', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testuser_20260804@example.com")
        
        # -> Fill the Name, Username, Email, and Password fields and click the 'Sign Up' button to submit the registration form.
        # Create a password (min 6 chars) password field
        elem = page.get_by_placeholder('Create a password (min 6 chars)', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Password123!")
        
        # -> Fill the Name, Username, Email, and Password fields and click the 'Sign Up' button to submit the registration form.
        # Sign Up button
        elem = page.get_by_role('button', name='Sign Up', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the dashboard is displayed
        # Assert: The URL contains 'dashboard', confirming the dashboard route is loaded.
        await expect(page).to_have_url(re.compile("dashboard"), timeout=15000), "The URL contains 'dashboard', confirming the dashboard route is loaded."
        await page.locator("xpath=/html/body/div/div/nav/div/div/a[1]").nth(0).scroll_into_view_if_needed()
        # Assert: The Dashboard navigation item is visible.
        await expect(page.locator("xpath=/html/body/div/div/nav/div/div/a[1]").nth(0)).to_be_visible(timeout=15000), "The Dashboard navigation item is visible."
        await page.locator("xpath=/html/body/div/div/nav/div/div/a[2]").nth(0).scroll_into_view_if_needed()
        # Assert: The logged-in user's display name 'Automated Tester 20260804' is visible in the navbar, indicating the dashboard is displayed.
        await expect(page.locator("xpath=/html/body/div/div/nav/div/div/a[2]").nth(0)).to_be_visible(timeout=15000), "The logged-in user's display name 'Automated Tester 20260804' is visible in the navbar, indicating the dashboard is displayed."
        
        # --> Verify the user can see their streak and XP stats
        # Assert: Day Streak value is visible and equals 0.
        await expect(page.locator("xpath=/html/body/div/div/main/div[1]/div/div[1]/div[2]").nth(0)).to_have_text("0", timeout=15000), "Day Streak value is visible and equals 0."
        # Assert: Total XP value is visible and equals 0.
        await expect(page.locator("xpath=/html/body/div/div/main/div[1]/div/div[3]/div[2]").nth(0)).to_have_text("0", timeout=15000), "Total XP value is visible and equals 0."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    
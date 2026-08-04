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
        
        # -> Click the 'Login' link in the top navigation to open the login page.
        # Login link
        elem = page.get_by_role('link', name='Login', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the 'Enter your email' and 'Enter your password' fields and click the 'Login' button to submit the form.
        # Enter your email email field
        elem = page.get_by_placeholder('Enter your email', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("example@gmail.com")
        
        # -> Fill the 'Enter your email' and 'Enter your password' fields and click the 'Login' button to submit the form.
        # Enter your password password field
        elem = page.get_by_placeholder('Enter your password', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("password123")
        
        # -> Fill the 'Enter your email' and 'Enter your password' fields and click the 'Login' button to submit the form.
        # Login button
        elem = page.get_by_role('button', name='Login', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Sign up' link to open the registration page.
        # Sign up link
        elem = page.get_by_role('link', name='Sign up', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the 'Name' field with 'Test User'.
        # What should we call you? text field
        elem = page.get_by_placeholder('What should we call you?', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Test User")
        
        # -> Fill the 'Name' field with 'Test User'.
        # Choose a unique username text field
        elem = page.get_by_placeholder('Choose a unique username', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testuser20260804")
        
        # -> Fill the 'Name' field with 'Test User'.
        # Enter your email email field
        elem = page.get_by_placeholder('Enter your email', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testuser_20260804_101500@example.com")
        
        # -> Fill the 'Name' field with 'Test User'.
        # Create a password (min 6 chars) password field
        elem = page.get_by_placeholder('Create a password (min 6 chars)', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Password123!")
        
        # -> Click the 'Sign Up' button to submit the registration form.
        # Sign Up button
        elem = page.get_by_role('button', name='Sign Up', exact=True)
        await elem.click(timeout=10000)
        
        # -> Enter a unique quest name into the 'Tambahkan quest baru...' field and click the 'Tambah' button to create the quest.
        # Tambahkan quest baru... text field
        elem = page.get_by_placeholder('Tambahkan quest baru...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Test Quest 20260804 101500")
        
        # -> Enter a unique quest name into the 'Tambahkan quest baru...' field and click the 'Tambah' button to create the quest.
        # Tambah button
        elem = page.get_by_role('button', name='Tambah', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the quest's check button to mark 'Test Quest 20260804 101500' as complete and then verify the 'Total XP' and 'Day Streak' values update.
        # button
        elem = page.locator('xpath=/html/body/div/div/main/div/section/div[2]/div/div[2]/button[4]')
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the XP total increases
        # Assert: Total XP displays 10 after completing the quest.
        await expect(page.locator("xpath=/html/body/div/div/main/div[1]/div/div[3]/div[2]").nth(0)).to_have_text("10", timeout=15000), "Total XP displays 10 after completing the quest."
        
        # --> Verify the day streak increases
        # Assert: Day streak shows 1, confirming it increased.
        await expect(page.locator("xpath=/html/body/div/div/main/div[1]/div/div[1]/div[2]").nth(0)).to_have_text("1", timeout=15000), "Day streak shows 1, confirming it increased."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    
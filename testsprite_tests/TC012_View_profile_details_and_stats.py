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
        
        # -> Open the Login page (navigate to the site's /login route).
        await page.goto("http://localhost:5174/login")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Fill 'example@gmail.com' into the Email field, fill 'password123' into the Password field, then click the 'Login' button.
        # Enter your email email field
        elem = page.get_by_placeholder('Enter your email', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("example@gmail.com")
        
        # -> Fill 'example@gmail.com' into the Email field, fill 'password123' into the Password field, then click the 'Login' button.
        # Enter your password password field
        elem = page.get_by_placeholder('Enter your password', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("password123")
        
        # -> Fill 'example@gmail.com' into the Email field, fill 'password123' into the Password field, then click the 'Login' button.
        # Login button
        elem = page.get_by_role('button', name='Login', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Sign up' link to open the registration page.
        # Sign up link
        elem = page.get_by_role('link', name='Sign up', exact=True)
        await elem.click(timeout=10000)
        
        # -> Complete the 'Create Account' form (Name, Username, Email, Password) and click the 'Sign Up' button.
        # What should we call you? text field
        elem = page.get_by_placeholder('What should we call you?', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Test User")
        
        # -> Complete the 'Create Account' form (Name, Username, Email, Password) and click the 'Sign Up' button.
        # Choose a unique username text field
        elem = page.get_by_placeholder('Choose a unique username', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testuser20260804")
        
        # -> Complete the 'Create Account' form (Name, Username, Email, Password) and click the 'Sign Up' button.
        # Enter your email email field
        elem = page.get_by_placeholder('Enter your email', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testuser_20260804_0001@example.com")
        
        # -> Complete the 'Create Account' form (Name, Username, Email, Password) and click the 'Sign Up' button.
        # Create a password (min 6 chars) password field
        elem = page.get_by_placeholder('Create a password (min 6 chars)', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Password123!")
        
        # -> Complete the 'Create Account' form (Name, Username, Email, Password) and click the 'Sign Up' button.
        # Sign Up button
        elem = page.get_by_role('button', name='Sign Up', exact=True)
        await elem.click(timeout=10000)
        
        # -> Change the Username field to 'testuser20260804_1' and click the 'Sign Up' button to retry registration.
        # Choose a unique username text field
        elem = page.get_by_placeholder('Choose a unique username', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testuser20260804_1")
        
        # -> Change the Username field to 'testuser20260804_1' and click the 'Sign Up' button to retry registration.
        # Sign Up button
        elem = page.get_by_role('button', name='Sign Up', exact=True)
        await elem.click(timeout=10000)
        
        # -> Change the Username field to a unique value and click the 'Sign Up' button to retry registration (use the 'Username' field and the 'Sign Up' button).
        # Choose a unique username text field
        elem = page.get_by_placeholder('Choose a unique username', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testuser20260804_2")
        
        # -> Change the Username field to a unique value and click the 'Sign Up' button to retry registration (use the 'Username' field and the 'Sign Up' button).
        # Sign Up button
        elem = page.get_by_role('button', name='Sign Up', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Test User' link in the top navigation to open the profile page.
        # Test User link
        elem = page.get_by_role('link', name='Test User', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the profile details and streak stats are displayed
        # Assert: Profile name 'Test User' is visible on the page.
        await expect(page.locator("xpath=/html/body/div[1]/div/div/div[1]").nth(0)).to_contain_text("Test User", timeout=15000), "Profile name 'Test User' is visible on the page."
        # Assert: Username handle 'testuser20260804_2' is visible on the profile.
        await expect(page.locator("xpath=/html/body/div[1]/div/div/div[1]").nth(0)).to_contain_text("testuser20260804_2", timeout=15000), "Username handle 'testuser20260804_2' is visible on the profile."
        # Assert: Email 'testuser_20260804_0001@example.com' is visible on the profile.
        await expect(page.locator("xpath=/html/body/div[1]/div/div/div[1]").nth(0)).to_contain_text("testuser_20260804_0001@example.com", timeout=15000), "Email 'testuser_20260804_0001@example.com' is visible on the profile."
        # Assert: The 'Current Streak' stat is displayed.
        await expect(page.locator("xpath=/html/body/div[1]/div/div/div[2]/div[1]").nth(0)).to_contain_text("Current Streak", timeout=15000), "The 'Current Streak' stat is displayed."
        # Assert: The 'Max Streak' stat is displayed.
        await expect(page.locator("xpath=/html/body/div[1]/div/div/div[2]/div[2]").nth(0)).to_contain_text("Max Streak", timeout=15000), "The 'Max Streak' stat is displayed."
        # Assert: The 'Total XP' stat is displayed.
        await expect(page.locator("xpath=/html/body/div[1]/div/div/div[2]/div[3]").nth(0)).to_contain_text("Total XP", timeout=15000), "The 'Total XP' stat is displayed."
        
        # --> Verify the achievements section is displayed
        # Assert: The Achievements section title 'Achievements' is visible on the profile page.
        await expect(page.locator("xpath=/html/body/div[1]/div/div/div[3]").nth(0)).to_contain_text("Achievements", timeout=15000), "The Achievements section title 'Achievements' is visible on the profile page."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    
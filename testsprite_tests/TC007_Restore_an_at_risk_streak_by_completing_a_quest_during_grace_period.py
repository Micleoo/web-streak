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
        
        # -> Fill the Email field with example@gmail.com and the Password field with password123, then click the 'Login' button.
        # Enter your email email field
        elem = page.get_by_placeholder('Enter your email', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("example@gmail.com")
        
        # -> Fill the Email field with example@gmail.com and the Password field with password123, then click the 'Login' button.
        # Enter your password password field
        elem = page.get_by_placeholder('Enter your password', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("password123")
        
        # -> Fill the Email field with example@gmail.com and the Password field with password123, then click the 'Login' button.
        # Login button
        elem = page.get_by_role('button', name='Login', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Sign up' link to open the registration page.
        # Sign up link
        elem = page.get_by_role('link', name='Sign up', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the registration form (Name, Username, Email, Password) and click the 'Sign Up' button.
        # What should we call you? text field
        elem = page.get_by_placeholder('What should we call you?', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Test User")
        
        # -> Fill the registration form (Name, Username, Email, Password) and click the 'Sign Up' button.
        # Choose a unique username text field
        elem = page.get_by_placeholder('Choose a unique username', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testuser20260804")
        
        # -> Fill the registration form (Name, Username, Email, Password) and click the 'Sign Up' button.
        # Enter your email email field
        elem = page.get_by_placeholder('Enter your email', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testuser_20260804@example.com")
        
        # -> Fill the registration form (Name, Username, Email, Password) and click the 'Sign Up' button.
        # Create a password (min 6 chars) password field
        elem = page.get_by_placeholder('Create a password (min 6 chars)', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Password123!")
        
        # -> Fill the registration form (Name, Username, Email, Password) and click the 'Sign Up' button.
        # Sign Up button
        elem = page.get_by_role('button', name='Sign Up', exact=True)
        await elem.click(timeout=10000)
        
        # -> Enter a new unique email (e.g., testuser_20260804_1@example.com) into the Email field and click the 'Sign Up' button.
        # Enter your email email field
        elem = page.get_by_placeholder('Enter your email', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testuser_20260804_1@example.com")
        
        # -> Enter a new unique email (e.g., testuser_20260804_1@example.com) into the Email field and click the 'Sign Up' button.
        # Sign Up button
        elem = page.get_by_role('button', name='Sign Up', exact=True)
        await elem.click(timeout=10000)
        
        # -> Change the 'Username' field to 'testuser20260804_2', change the 'Email' field to 'testuser_20260804_2@example.com', set 'Password' to 'Password123!', then click the 'Sign Up' button.
        # Choose a unique username text field
        elem = page.get_by_placeholder('Choose a unique username', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testuser20260804_2")
        
        # -> Change the 'Username' field to 'testuser20260804_2', change the 'Email' field to 'testuser_20260804_2@example.com', set 'Password' to 'Password123!', then click the 'Sign Up' button.
        # Enter your email email field
        elem = page.get_by_placeholder('Enter your email', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testuser_20260804_2@example.com")
        
        # -> Change the 'Username' field to 'testuser20260804_2', change the 'Email' field to 'testuser_20260804_2@example.com', set 'Password' to 'Password123!', then click the 'Sign Up' button.
        # Create a password (min 6 chars) password field
        elem = page.get_by_placeholder('Create a password (min 6 chars)', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Password123!")
        
        # -> Change the 'Username' field to 'testuser20260804_2', change the 'Email' field to 'testuser_20260804_2@example.com', set 'Password' to 'Password123!', then click the 'Sign Up' button.
        # Sign Up button
        elem = page.get_by_role('button', name='Sign Up', exact=True)
        await elem.click(timeout=10000)
        
        # -> Add a new daily quest by typing 'RestoreQuest_20260804_1' into the 'Tambahkan quest baru...' field and clicking the 'Tambah' button.
        # Tambahkan quest baru... text field
        elem = page.get_by_placeholder('Tambahkan quest baru...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("RestoreQuest_20260804_1")
        
        # -> Add a new daily quest by typing 'RestoreQuest_20260804_1' into the 'Tambahkan quest baru...' field and clicking the 'Tambah' button.
        # Waktu number field
        elem = page.get_by_placeholder('Waktu', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("1")
        
        # -> Add a new daily quest by typing 'RestoreQuest_20260804_1' into the 'Tambahkan quest baru...' field and clicking the 'Tambah' button.
        # Tambah button
        elem = page.get_by_role('button', name='Tambah', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the checkmark (complete) button next to the 'RestoreQuest_20260804_1' quest to mark it as completed during the grace period.
        # button
        elem = page.locator('xpath=/html/body/div/div/main/div/section/div[2]/div/div[2]/button[4]')
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the streak is restored
        # Assert: Day Streak value is 1, confirming the streak was restored.
        await expect(page.locator("xpath=/html/body/div/div/main/div[1]/div/div[1]/div[2]").nth(0)).to_have_text("1", timeout=15000), "Day Streak value is 1, confirming the streak was restored."
        # Assert: The streak widget displays the 'Day Streak' label.
        await expect(page.locator("xpath=/html/body/div/div/main/div[1]/div/div[1]").nth(0)).to_contain_text("Day Streak", timeout=15000), "The streak widget displays the 'Day Streak' label."
        
        # --> Verify the XP total increases
        # Assert: Total XP displays 10, confirming XP increased.
        await expect(page.locator("xpath=/html/body/div/div/main/div[1]/div/div[3]/div[2]").nth(0)).to_have_text("10", timeout=15000), "Total XP displays 10, confirming XP increased."
        # Assert: The completed quest entry shows '+10 XP', confirming the awarded XP.
        await expect(page.locator("xpath=/html/body/div/div/main/div[1]/section/div[2]/div").nth(0)).to_contain_text("+10 XP", timeout=15000), "The completed quest entry shows '+10 XP', confirming the awarded XP."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    
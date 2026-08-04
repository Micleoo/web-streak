import { test, expect } from '@playwright/test';

test.describe('Testing Web Streak App (Local: http://localhost:5173)', () => {
  test('Full E2E Flow: Register, Login, Complete Quest (XP & Bara check), Leaderboard, Profile', async ({ page }) => {
    const timestamp = Date.now().toString().slice(-6);
    const testName = `Penguji Streak ${timestamp}`;
    const testUsername = `user_${timestamp}`;
    const testEmail = `tester_${timestamp}@example.com`;
    const testPassword = `Pass1234_${timestamp}`;

    console.log(`[TEST] 1. Registrasi user baru & Login...`);
    console.log(`[TEST] Credentials: username=${testUsername}, email=${testEmail}`);

    // Step 1: Navigate to Home and click Register
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-results/1_homepage.png' });

    // Click Get Started / Register
    await page.click('a[href="/register"]');
    await expect(page).toHaveURL(/.*register/);
    await page.screenshot({ path: 'test-results/2_register_page.png' });

    // Fill Register Form
    await page.fill('input[placeholder="What should we call you?"]', testName);
    await page.fill('input[placeholder="Choose a unique username"]', testUsername);
    await page.fill('input[placeholder="Enter your email"]', testEmail);
    await page.fill('input[placeholder="Create a password (min 6 chars)"]', testPassword);

    // Select category (e.g. Coding button)
    const codingCategoryBtn = page.locator('button:has-text("Coding")');
    if (await codingCategoryBtn.isVisible()) {
      await codingCategoryBtn.click();
    }

    // Submit Registration
    await page.click('button[type="submit"]:has-text("Sign Up")');

    // Wait for navigation to /dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/.*dashboard/);
    await page.waitForTimeout(2000); // Allow data fetch
    await page.screenshot({ path: 'test-results/3_dashboard_after_register.png' });

    console.log(`[TEST] Berhasil registrasi & login! User berada di Dashboard.`);

    // Check greeting contains user name
    const greetingEl = page.locator('.dashboard-title');
    await expect(greetingEl).toContainText(testName);

    // Step 2: Selesaikan quest dan pastikan XP serta status Bara bertambah
    console.log(`[TEST] 2. Memeriksa XP & Bara awal, membuat quest, dan menyelesaikan quest...`);

    // Capture initial XP and Streak
    const xpCard = page.locator('.stat-card').filter({ hasText: 'Total XP' }).locator('.stat-value');
    const streakCard = page.locator('.stat-card').filter({ hasText: 'Day Streak' }).locator('.stat-value');

    const initialXpText = (await xpCard.textContent()) || '0';
    const initialStreakText = (await streakCard.textContent()) || '0';
    const initialXp = parseInt(initialXpText.trim(), 10);
    const initialStreak = parseInt(initialStreakText.trim(), 10);

    console.log(`[TEST] Status Awal -> XP: ${initialXp}, Day Streak (Bara): ${initialStreak}`);

    // Create a new Quest
    const questName = `Quest Pengujian ${timestamp}`;
    await page.fill('input[placeholder="Tambahkan quest baru..."]', questName);
    await page.fill('input[placeholder="Waktu"]', '30');
    await page.click('button:has-text("Tambah")');

    // Wait for quest to appear
    const createdQuestItem = page.locator('.quest-item, .quest-card').filter({ hasText: questName });
    await expect(createdQuestItem).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/4_quest_created.png' });
    console.log(`[TEST] Quest '${questName}' berhasil dibuat.`);

    // Complete the quest by clicking the check button
    const checkBtn = createdQuestItem.locator('.quest-check-btn, button:has(.lucide-check)');
    await checkBtn.click();

    // Wait for XP to increase
    await expect(xpCard).not.toHaveText(initialXpText, { timeout: 10000 });
    await page.waitForTimeout(1500); // Allow streak & animation to update

    const updatedXpText = (await xpCard.textContent()) || '0';
    const updatedStreakText = (await streakCard.textContent()) || '0';
    const updatedXp = parseInt(updatedXpText.trim(), 10);
    const updatedStreak = parseInt(updatedStreakText.trim(), 10);

    console.log(`[TEST] Status Setelah Quest Selesai -> XP: ${updatedXp} (+${updatedXp - initialXp} XP), Day Streak: ${updatedStreak}`);
    expect(updatedXp).toBeGreaterThan(initialXp);
    expect(updatedStreak).toBeGreaterThanOrEqual(1);

    await page.screenshot({ path: 'test-results/5_quest_completed_xp_increased.png' });

    // Step 3: Buka Leaderboard & Profile
    console.log(`[TEST] 3. Menguji Leaderboard dan Halaman Profil...`);

    // Verify Leaderboard on Dashboard
    const leaderboardSection = page.locator('.leaderboard-card, .leaderboard-section');
    await expect(leaderboardSection).toBeVisible();

    // Check Global tab
    const globalTab = page.locator('button:has-text("Global")');
    if (await globalTab.isVisible()) {
      await globalTab.click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: 'test-results/6_leaderboard_global.png' });

    // Check Friends tab
    const friendsTab = page.locator('button:has-text("Teman")');
    if (await friendsTab.isVisible()) {
      await friendsTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/7_leaderboard_friends.png' });
      // Switch back to global
      await globalTab.click();
    }

    // Navigate to Profile page
    const profileLink = page.locator('.nav-profile-name, a[href="/profile"]').first();
    await profileLink.click();
    await page.waitForURL('**/profile', { timeout: 10000 });
    await expect(page).toHaveURL(/.*profile/);
    await page.waitForTimeout(1000);

    // Verify Profile content
    await expect(page.locator('.profile-info h1')).toContainText(testName);
    const profileXp = page.locator('.stat-card').filter({ hasText: 'Total XP' }).locator('h3');
    await expect(profileXp).toHaveText(String(updatedXp));

    await page.screenshot({ path: 'test-results/8_profile_page.png' });
    console.log(`[TEST] Halaman Profil berhasil dibuka & data valid! (Name: ${testName}, XP: ${updatedXp})`);

    console.log(`[TEST] Semua pengujian (1, 2, 3) BERHASIL 100%!`);
  });
});

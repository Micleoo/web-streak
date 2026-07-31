import { test, expect } from '@playwright/test';

test('core flow: register, onboard, dashboard quest', async ({ page }) => {
  // Use a unique email and username
  const uniqueId = Date.now();
  const email = `testuser${uniqueId}@example.com`;
  const username = `test_${uniqueId}`;

  // 1. Go to Home Page and Register
  await page.goto('http://localhost:5173/');
  await page.click('text=Buat Akun Gratis');
  
  await expect(page).toHaveURL(/.*register/);
  await page.fill('input[type="text"]', 'Test User');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("Sign Up")');

  // 2. Onboarding
  await expect(page).toHaveURL(/.*onboarding/);
  await page.fill('input[id="username"]', username);
  // Wait for validation
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Mulai Petualangan!")');

  // 3. Dashboard
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.locator('h1')).toContainText('Test User');
  
  // Create a Quest
  await page.fill('input[placeholder="Tambahkan quest baru..."]', 'My First Quest');
  await page.fill('input[placeholder="Menit (Opsional)"]', '30');
  await page.click('button:has-text("Tambah")');

  // Verify quest appears
  await expect(page.locator('.quest-card').filter({ hasText: 'My First Quest' })).toBeVisible();

  // 4. Complete the Quest
  const questCard = page.locator('.quest-card').filter({ hasText: 'My First Quest' });
  const checkBtn = questCard.locator('.quest-check-btn');
  
  // Get initial XP (from header or stats card)
  const initialXpEl = page.locator('.stat-card').filter({ hasText: 'Total XP' }).locator('h3, .stat-value');
  const initialXpText = await initialXpEl.textContent();
  const initialXp = parseInt(initialXpText || '0', 10);

  // Click check
  await checkBtn.click();

  // Wait for XP to increase (it takes a moment for the refetch)
  await expect(initialXpEl).not.toHaveText(initialXpText || '0', { timeout: 5000 });

  // 5. Go to Profile
  await page.click('.navbar-links a[href="/profile"]');
  await expect(page).toHaveURL(/.*profile/);
  
  // Verify XP is updated there too
  const profileXpEl = page.locator('.stat-card').filter({ hasText: 'Total XP' }).locator('h3, .stat-value');
  const profileXpText = await profileXpEl.textContent();
  expect(parseInt(profileXpText || '0', 10)).toBeGreaterThan(initialXp);
});

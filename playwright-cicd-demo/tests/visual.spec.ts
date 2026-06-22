import { test, expect } from '@playwright/test';

test.describe('Visual regression @visual', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Visual tylko na projekcie chromium');
  });

  test('strona logowania wygląda poprawnie @visual', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Logowanie' })).toBeVisible();

    await expect(page).toHaveScreenshot('login-page.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });

  test('karta produktu wygląda poprawnie @visual', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'demo-token-123');
    });
    await page.goto('/products');

    const firstCard = page.getByTestId('product-card').first();
    await expect(firstCard).toBeVisible();

    await expect(firstCard).toHaveScreenshot('first-product-card.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

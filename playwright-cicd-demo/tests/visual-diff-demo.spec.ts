import { test, expect } from '@playwright/test';

test.describe('DEMO: visual wykrywa zmianę @visual @demo', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Tylko chromium');
    test.skip(!!process.env.CI, 'Test demonstracyjny - tylko lokalnie');
  });

  test('zmienione tło nie zgadza się z baseline', async ({ page }) => {
    test.fail();

    await page.goto('/login');
    await page.addStyleTag({ content: 'body { background: #ffffff !important; }' });
    await expect(page).toHaveScreenshot('demo-diff.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

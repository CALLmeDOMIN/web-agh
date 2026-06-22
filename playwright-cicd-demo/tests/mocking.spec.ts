import { test, expect } from '@playwright/test';

test.describe('API mocking (page.route)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'demo-token-123');
    });
  });

  test('pokazuje komunikat błędu, gdy API produktów zwraca 500', async ({ page }) => {
    await page.route('**/api/products', (route) =>
      route.fulfill({ status: 500, body: 'Server Error' }),
    );

    await page.goto('/products');

    await expect(page.getByRole('alert')).toHaveText('Nie udało się załadować produktów');
  });

  test('wyświetla podstawione (zamockowane) produkty', async ({ page }) => {
    await page.route('**/api/products', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 999, name: 'Zmockowany produkt', price: 1 }]),
      }),
    );

    await page.goto('/products');

    await expect(page.getByTestId('product-card')).toHaveCount(1);
    await expect(page.getByText('Zmockowany produkt')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';
import { ProductsPage } from './pages/ProductsPage';

test.describe('Produkty (E2E + Page Object Model)', () => {
  let productsPage: ProductsPage;

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'demo-token-123');
    });
    productsPage = new ProductsPage(page);
    await productsPage.goto();
    await expect(productsPage.heading).toBeVisible();
  });

  test('wyświetla produkty pobrane z API', async () => {
    await productsPage.expectProductVisible('Klawiatura mechaniczna');
    await productsPage.expectProductVisible('Mysz gamingowa');
  });

  test('dodaje nowy produkt przez formularz', async () => {
    const nazwa = `Słuchawki ${Date.now()}`;
    await productsPage.addProduct(nazwa, 399);
    await productsPage.expectProductVisible(nazwa);
  });

  test('pusty formularz nie zostaje wysłany (walidacja HTML required)', async ({
    page,
  }) => {
    await productsPage.addButton.click();
    await expect(page).toHaveURL(/\/products/);
  });
});

import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

const EMAIL = process.env.TEST_USER_EMAIL ?? 'user@example.com';
const PASSWORD = process.env.TEST_USER_PASSWORD ?? 'tajne123';

test.describe('Logowanie (E2E + Page Object Model)', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('poprawne dane logują i przenoszą na /products', async ({ page }) => {
    await loginPage.login(EMAIL, PASSWORD);

    await expect(page).toHaveURL(/\/products/);
    await expect(page.getByRole('heading', { name: 'Produkty' })).toBeVisible();
  });

  test('błędne hasło pokazuje komunikat błędu', async ({ page }) => {
    await loginPage.login('user@example.com', 'zle-haslo');

    await loginPage.expectError('Nieprawidłowy email lub hasło');
    await expect(page).toHaveURL(/\/login/);
  });

  test('niezalogowany użytkownik jest przekierowany na /login', async ({ page }) => {
    await page.goto('/products');
    await expect(page).toHaveURL(/\/login/);
  });
});

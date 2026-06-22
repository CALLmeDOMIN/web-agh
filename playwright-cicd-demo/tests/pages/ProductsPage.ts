import { type Page, type Locator, expect } from '@playwright/test';

export class ProductsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly productCards: Locator;
  readonly nameInput: Locator;
  readonly priceInput: Locator;
  readonly addButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Produkty', level: 1 });
    this.productCards = page.getByTestId('product-card');
    this.nameInput = page.getByLabel('Nazwa');
    this.priceInput = page.getByLabel('Cena');
    this.addButton = page.getByRole('button', { name: 'Dodaj' });
  }

  async goto() {
    await this.page.goto('/products');
  }

  async addProduct(name: string, price: number) {
    await this.nameInput.fill(name);
    await this.priceInput.fill(String(price));
    await this.addButton.click();
  }

  async expectProductVisible(name: string) {
    await expect(this.productCards.filter({ hasText: name })).toBeVisible();
  }
}

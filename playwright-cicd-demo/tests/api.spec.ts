import { test, expect } from '@playwright/test';

const API = process.env.BASE_URL || 'http://localhost:3000';

test.describe('API testing (bez UI)', () => {
  test('GET /api/products zwraca listę produktów', async ({ request }) => {
    const res = await request.get(`${API}/api/products`);

    expect(res.ok()).toBeTruthy();
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(3);
    expect(body[0]).toHaveProperty('name');
    expect(body[0]).toHaveProperty('price');
  });

  test('POST /api/login z poprawnymi danymi zwraca token', async ({ request }) => {
    const res = await request.post(`${API}/api/login`, {
      data: { email: 'user@example.com', password: 'tajne123' },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.token).toBeTruthy();
  });

  test('POST /api/login z błędnymi danymi zwraca 401', async ({ request }) => {
    const res = await request.post(`${API}/api/login`, {
      data: { email: 'user@example.com', password: 'zle' },
    });

    expect(res.status()).toBe(401);
  });

  test('POST /api/products BEZ tokenu zwraca 401', async ({ request }) => {
    const res = await request.post(`${API}/api/products`, {
      data: { name: 'Bez autoryzacji', price: 1 },
    });

    expect(res.status()).toBe(401);
  });

  test('POST /api/products Z tokenem tworzy produkt (201)', async ({ request }) => {
    const res = await request.post(`${API}/api/products`, {
      headers: { Authorization: 'Bearer demo-token-123' },
      data: { name: `API-Produkt-${Date.now()}`, price: 59 },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.name).toContain('API-Produkt');
  });

  test('walidacja: POST /api/products z błędnymi danymi zwraca 400', async ({
    request,
  }) => {
    const res = await request.post(`${API}/api/products`, {
      headers: { Authorization: 'Bearer demo-token-123' },
      data: { name: '', price: 'nie-liczba' },
    });

    expect(res.status()).toBe(400);
  });
});

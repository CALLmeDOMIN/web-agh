export interface Product {
  id: number;
  name: string;
  price: number;
}

const BASE = '/api';

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Błąd logowania');
  }
  const data = await res.json();
  return data.token as string;
}

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE}/products`);
  if (!res.ok) throw new Error('Nie udało się pobrać produktów');
  return res.json();
}

export async function createProduct(
  name: string,
  price: number,
  token: string,
): Promise<Product> {
  const res = await fetch(`${BASE}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, price }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Nie udało się dodać produktu');
  }
  return res.json();
}

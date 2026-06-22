import { useEffect, useState, type FormEvent } from 'react';
import { getProducts, createProduct, type Product } from '../api';

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setProducts(await getProducts());
    } catch {
      setError('Nie udało się załadować produktów');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError('');
    const token = localStorage.getItem('token') || '';
    try {
      await createProduct(name, Number(price), token);
      setName('');
      setPrice('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    }
  }

  return (
    <div>
      <h1>Produkty</h1>

      <ul className="product-list">
        {products.map((p) => (
          <li key={p.id} className="product-card" data-testid="product-card">
            <span className="product-name">{p.name}</span>
            <span className="product-price">{p.price} zł</span>
          </li>
        ))}
      </ul>

      <div className="card form-card">
        <h2>Dodaj produkt</h2>
        <form onSubmit={handleAdd} aria-label="Formularz produktu">
          <label>
            Nazwa
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Cena
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </label>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <button type="submit">Dodaj</button>
        </form>
      </div>
    </div>
  );
}

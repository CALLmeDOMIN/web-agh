import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// "Baza danych" xd
interface Product {
  id: number;
  name: string;
  price: number;
}

const products: Product[] = [
  { id: 1, name: 'Klawiatura mechaniczna', price: 299 },
  { id: 2, name: 'Mysz gamingowa', price: 149 },
  { id: 3, name: 'Monitor 27 cali', price: 1199 },
];
let nextId = 4;

const TOKEN = 'demo-token-123';
const USERS = [{ email: 'user@example.com', password: 'tajne123' }];

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.headers.authorization !== `Bearer ${TOKEN}`) {
    res.status(401).json({ message: 'Brak autoryzacji' });
    return;
  }
  next();
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body ?? {};
  const ok = USERS.some((u) => u.email === email && u.password === password);
  if (!ok) {
    res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    return;
  }
  res.json({ token: TOKEN, email });
});

app.get('/api/products', (_req, res) => {
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) {
    res.status(404).json({ message: 'Nie znaleziono produktu' });
    return;
  }
  res.json(product);
});

app.post('/api/products', requireAuth, (req, res) => {
  const { name, price } = req.body ?? {};
  if (typeof name !== 'string' || name.trim() === '' || typeof price !== 'number') {
    res.status(400).json({ message: 'Wymagane: name (string) oraz price (number)' });
    return;
  }
  const product: Product = { id: nextId++, name, price };
  products.push(product);
  res.status(201).json(product);
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`API serwer działa na http://localhost:${PORT}`);
});

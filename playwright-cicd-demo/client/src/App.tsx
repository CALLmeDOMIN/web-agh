import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ProductsPage } from './pages/ProductsPage';

function isAuthenticated(): boolean {
  return Boolean(localStorage.getItem('token'));
}

export default function App() {
  const authed = isAuthenticated();
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  return (
    <div>
      <nav className="nav">
        <Link to="/products" className="brand">
          Sklep Demo
        </Link>
        {authed && (
          <button onClick={logout} className="link-button">
            Wyloguj
          </button>
        )}
      </nav>

      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/products"
            element={authed ? <ProductsPage /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </main>
    </div>
  );
}

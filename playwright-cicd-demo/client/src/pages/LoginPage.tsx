import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = await login(email, password);
      localStorage.setItem('token', token);
      navigate('/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card form-card">
      <h1>Logowanie</h1>
      <form onSubmit={handleSubmit} aria-label="Formularz logowania">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Hasło
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading}>
          {loading ? 'Logowanie...' : 'Zaloguj'}
        </button>
      </form>
      <p className="hint">Demo: user@example.com / tajne123</p>
    </div>
  );
}

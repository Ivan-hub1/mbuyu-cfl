import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import Logo from '../../components/ui/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);

      const user = data.user;
      if (user.role === 'STAFF' && user.staffRole === 'DRIVER') {
        navigate('/driver/welcome');
      } else if (user.role === 'STAFF' && user.staffRole === 'OPERATIONS') {
        navigate('/dashboard/maintenance');
      } else {
        navigate('/dashboard');
      }
    } catch {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        <div className="card">
          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-gray-400 text-sm mb-6">
            Sign in to manage your shipments.
          </p>

          <form onSubmit={submit} className="space-y-4">
            <input
              className="input-field"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="input-field"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button className="btn-primary w-full">Sign In</button>
          </form>

          <p className="text-sm text-gray-400 mt-6 text-center">
            No account?{' '}
            <Link to="/register" className="text-brand-orange hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
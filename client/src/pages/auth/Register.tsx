import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import Logo from '../../components/ui/Logo';
import SEO from '../../components/seo/SEO';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { data } = await api.post('/auth/register', {
        name,
        email,
        password,
        phone,
      });
      login(data.token, data.user, data.tenant);
      navigate('/dashboard');
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        'Could not create account. Try a different email.';
      setError(msg);
    }
  };

  return (
    <>
      <SEO
        title="Create an Account"
        description="Sign up for Mbuyu CFL and start shipping across Africa with full visibility."
      />

      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Logo size="lg" />
          </div>
          <div className="card">
            <h1 className="text-2xl font-bold mb-1">Create your account</h1>
            <p className="text-gray-400 text-sm mb-6">
              Start shipping with Mbuyu CFL.
            </p>

            <form onSubmit={submit} className="space-y-4">
              <input
                className="input-field"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
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
                type="tel"
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <input
                className="input-field"
                type="password"
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" className="btn-primary w-full">
                Create Account
              </button>
            </form>

            <p className="text-sm text-gray-400 mt-6 text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-orange hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
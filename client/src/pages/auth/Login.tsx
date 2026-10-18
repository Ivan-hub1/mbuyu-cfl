import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore, type Tenant } from '../../store/authStore';
import Logo from '../../components/ui/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Company code — only needed when this email exists in several companies
  const [company, setCompany] = useState('');
  const [showCompany, setShowCompany] = useState(false);
  const [companyChoices, setCompanyChoices] = useState<Tenant[]>([]);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', {
        email,
        password,
        company: company.trim() || null,
      });
      login(data.token, data.user, data.tenant);

      const user = data.user;
      if (user.role === 'STAFF' && user.staffRole === 'DRIVER') {
        navigate('/driver/welcome');
      } else if (user.role === 'STAFF' && user.staffRole === 'OPERATIONS') {
        navigate('/dashboard/maintenance');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const res = (err as {
        response?: { status?: number; data?: { code?: string; error?: string; companies?: Tenant[] } };
      }).response;
      if (res?.data?.code === 'COMPANY_REQUIRED') {
        setShowCompany(true);
        setCompanyChoices(res.data.companies || []);
        setError('Your account exists in more than one company. Choose which one to sign in to.');
      } else if (res?.status === 403) {
        setError(res.data?.error || 'This account is disabled.');
      } else {
        setError('Invalid email or password.');
      }
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
            {showCompany ? (
              <div>
                <input
                  className="input-field"
                  placeholder="Company code (e.g. mbuyu)"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
                {companyChoices.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {companyChoices.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCompany(c.slug)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition ${
                          company === c.slug
                            ? 'bg-brand-orange text-white border-brand-orange'
                            : 'border-brand-black-muted text-gray-300 hover:border-brand-orange'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCompany(true)}
                className="text-xs text-gray-500 hover:text-brand-orange"
              >
                Signing in to a specific company?
              </button>
            )}
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
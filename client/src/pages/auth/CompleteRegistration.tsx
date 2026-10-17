import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import Logo from '../../components/ui/Logo';

interface InviteData {
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  companyName?: string | null;
  quotedAmount?: string | null;
  quotedCurrency?: string | null;
  adminResponse?: string | null;
}

export default function CompleteRegistration() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState('');

  // Form
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [ninNumber, setNinNumber] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Uganda');
  const [documentUrl, setDocumentUrl] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load invite
  useEffect(() => {
    if (!token) {
      setInviteError('Missing invite token in the URL.');
      setLoadingInvite(false);
      return;
    }
    api
      .get(`/auth/invite/${token}`)
      .then((r) => {
        setInvite(r.data);
        // Pre-fill from quote
        setName(r.data.fullName || '');
        setPhone(r.data.phone || '');
        setCompanyName(r.data.companyName || '');
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.error ||
          'This invite link is invalid or has expired.';
        setInviteError(msg);
      })
      .finally(() => setLoadingInvite(false));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (!ninNumber.trim() && !passportNumber.trim()) {
      return setError(
        'Please provide either a NIN number or a Passport number'
      );
    }
    if (!phone.trim()) return setError('Contact phone is required');
    if (!name.trim()) return setError('Full name is required');

    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/complete-registration', {
        token,
        password,
        name: name.trim(),
        phone: phone.trim(),
        companyName: companyName.trim() || null,
        tinNumber: tinNumber.trim() || null,
        ninNumber: ninNumber.trim() || null,
        passportNumber: passportNumber.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        country: country.trim() || null,
        documentUrl: documentUrl.trim() || null,
      });

      login(data.token, data.user, data.tenant);
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err?.response?.data?.error || 'Failed to complete registration.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading your invite…</div>
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="card max-w-md text-center">
          <div className="text-5xl mb-3">🔒</div>
          <h1 className="text-xl font-bold mb-2">Invite not valid</h1>
          <p className="text-sm text-gray-400 mb-6">{inviteError}</p>
          <Link to="/login" className="btn-primary text-sm">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>

        <div className="card">
          <h1 className="text-2xl font-bold mb-1">Complete your account</h1>
          <p className="text-gray-400 text-sm mb-6">
            Welcome, {invite?.fullName}. Please add a few details to activate
            your Mbuyu CFL customer account.
          </p>

          {/* Quote summary */}
          {invite && (
            <div className="p-4 rounded-lg bg-brand-orange/10 border border-brand-orange/30 mb-6 text-sm">
              <p className="text-xs text-brand-orange uppercase tracking-wide mb-1">
                Quote Reference
              </p>
              <p className="font-mono text-white">{invite.reference}</p>
              {invite.quotedAmount && (
                <p className="text-gray-300 mt-1">
                  Quoted:{' '}
                  <strong className="text-brand-orange">
                    {invite.quotedCurrency} {invite.quotedAmount}
                  </strong>
                </p>
              )}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            {/* Pre-filled */}
            <section className="space-y-4">
              <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Contact (from your quote)
              </h3>

              <div>
                <label className="input-label">Email</label>
                <input
                  className="input-field opacity-70"
                  value={invite?.email || ''}
                  disabled
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Full Name *</label>
                  <input
                    className="input-field"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Contact Phone *</label>
                  <input
                    className="input-field"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Company Name</label>
                <input
                  className="input-field"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            </section>

            {/* Compliance */}
            <section className="space-y-4 pt-4 border-t border-brand-black-muted">
              <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Compliance Information
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">TIN Number</label>
                  <input
                    className="input-field"
                    placeholder="Optional"
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="input-label">
                    NIN Number <span className="text-xs text-gray-500">(or)</span>
                  </label>
                  <input
                    className="input-field"
                    placeholder="National ID Number"
                    value={ninNumber}
                    onChange={(e) => setNinNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">
                    Passport Number{' '}
                    <span className="text-xs text-gray-500">(or)</span>
                  </label>
                  <input
                    className="input-field"
                    placeholder="If not a Ugandan citizen"
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="input-label">Document URL</label>
                  <input
                    className="input-field"
                    placeholder="Link to scanned ID (optional)"
                    value={documentUrl}
                    onChange={(e) => setDocumentUrl(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Address</label>
                <input
                  className="input-field"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">City</label>
                  <input
                    className="input-field"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="input-label">Country</label>
                  <input
                    className="input-field"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Password */}
            <section className="space-y-4 pt-4 border-t border-brand-black-muted">
              <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Set Your Password
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Password *</label>
                  <input
                    type="password"
                    className="input-field"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="input-label">Confirm Password *</label>
                  <input
                    type="password"
                    className="input-field"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </section>

            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? 'Creating your account…' : 'Create My Account'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-orange hover:underline">
                Sign in instead
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
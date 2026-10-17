import { useEffect, useState } from 'react';
import api from '../../lib/api';

// ═══════════════════════════════════════════════════════════
// COMPANIES — platform owner (SUPER_ADMIN) manages tenants
// ═══════════════════════════════════════════════════════════

interface Company {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  trackingPrefix: string;
  tagline: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  address: string | null;
  createdAt: string;
  _count: { users: number; shipments: number; vehicles: number };
}

const EMPTY_FORM = {
  name: '',
  slug: '',
  trackingPrefix: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
};

function apiError(err: unknown, fallback: string): string {
  const data = (err as {
    response?: { data?: { error?: string; details?: Record<string, string[]> } };
  }).response?.data;
  if (data?.details) {
    return Object.entries(data.details)
      .map(([k, v]) => `${k}: ${v.join(', ')}`)
      .join(' · ');
  }
  return data?.error || fallback;
}

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const refresh = async () => {
    try {
      const { data } = await api.get('/platform/tenants');
      setCompanies(data);
      setError('');
    } catch (err) {
      setError(apiError(err, 'Failed to load companies.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api
      .get('/platform/tenants')
      .then(({ data }) => setCompanies(data))
      .catch((err) => setError(apiError(err, 'Failed to load companies.')))
      .finally(() => setLoading(false));
  }, []);

  const toggleActive = async (c: Company) => {
    const action = c.isActive ? 'Deactivate' : 'Reactivate';
    if (
      !confirm(
        `${action} ${c.name}?${c.isActive ? '\n\nAll of its users will be signed out immediately.' : ''}`
      )
    ) {
      return;
    }
    try {
      await api.patch(`/platform/tenants/${c.id}`, { isActive: !c.isActive });
      refresh();
    } catch (err) {
      alert(apiError(err, `Failed to ${action.toLowerCase()} company.`));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Companies</h1>
          <p className="text-gray-400 text-sm mt-1">
            Each company has its own users, shipments, fleet and quotes.
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
          + New Company
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 text-red-400 rounded-lg p-3 text-sm mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <div className="grid gap-4">
          {companies.map((c) => (
            <div key={c.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-lg font-semibold">{c.name}</h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        c.isActive
                          ? 'bg-green-500/15 text-green-400 border-green-500/30'
                          : 'bg-red-500/15 text-red-400 border-red-500/30'
                      }`}
                    >
                      {c.isActive ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    Code <span className="font-mono text-brand-orange">{c.slug}</span>
                    {' · '}Tracking <span className="font-mono">{c.trackingPrefix}-…</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {[c.contactEmail, c.contactPhone, c.address].filter(Boolean).join(' · ') ||
                      'No contact details yet'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Quote form link:{' '}
                    <span className="font-mono">
                      {window.location.origin}/quote?company={c.slug}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-6 text-center">
                  <Stat label="Users" value={c._count.users} />
                  <Stat label="Shipments" value={c._count.shipments} />
                  <Stat label="Vehicles" value={c._count.vehicles} />
                  <button
                    onClick={() => toggleActive(c)}
                    className={`text-xs px-3 py-2 rounded-lg border transition ${
                      c.isActive
                        ? 'border-red-500/40 text-red-400 hover:bg-red-500/10'
                        : 'border-green-500/40 text-green-400 hover:bg-green-500/10'
                    }`}
                  >
                    {c.isActive ? 'Deactivate' : 'Reactivate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateCompanyModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xl font-bold text-brand-orange">{value}</p>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
    </div>
  );
}

function CreateCompanyModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof typeof EMPTY_FORM) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Suggest code + tracking prefix from the name until the admin edits them
  const setName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm((f) => {
      const words = name.trim().split(/\s+/).filter(Boolean);
      return {
        ...f,
        name,
        slug:
          f.slug && f.slug !== slugify(f.name) ? f.slug : slugify(name),
        trackingPrefix:
          f.trackingPrefix && f.trackingPrefix !== prefixFrom(f.name)
            ? f.trackingPrefix
            : prefixFrom(words.join(' ')),
      };
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/platform/tenants', {
        name: form.name.trim(),
        slug: form.slug.trim(),
        trackingPrefix: form.trackingPrefix.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        address: form.address.trim(),
        admin: {
          name: form.adminName.trim(),
          email: form.adminEmail.trim(),
          password: form.adminPassword,
        },
      });
      alert(
        `✅ ${form.name} created.\n\nIts admin (${form.adminEmail}) has been emailed their login details.\nThey sign in with company code: ${form.slug}`
      );
      onCreated();
    } catch (err) {
      setError(apiError(err, 'Failed to create company.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="card w-full max-w-lg my-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-brand-black-muted">
          <h3 className="text-lg font-bold">New Company</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Company name">
            <input className="input-field" value={form.name} onChange={setName} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company code" hint="lowercase, used at login">
              <input
                className="input-field font-mono"
                value={form.slug}
                onChange={set('slug')}
                pattern="[a-z0-9-]+"
                required
              />
            </Field>
            <Field label="Tracking prefix" hint="e.g. ACME-2026-00001">
              <input
                className="input-field font-mono"
                value={form.trackingPrefix}
                onChange={(e) =>
                  setForm((f) => ({ ...f, trackingPrefix: e.target.value.toUpperCase() }))
                }
                pattern="[A-Z0-9]+"
                required
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact email">
              <input className="input-field" type="email" value={form.contactEmail} onChange={set('contactEmail')} />
            </Field>
            <Field label="Contact phone">
              <input className="input-field" value={form.contactPhone} onChange={set('contactPhone')} />
            </Field>
          </div>
          <Field label="Address">
            <input className="input-field" value={form.address} onChange={set('address')} />
          </Field>

          <div className="border-t border-brand-black-muted pt-4">
            <p className="text-sm font-semibold mb-3">First admin for this company</p>
            <div className="space-y-3">
              <input className="input-field" placeholder="Full name" value={form.adminName} onChange={set('adminName')} required />
              <input className="input-field" type="email" placeholder="Email" value={form.adminEmail} onChange={set('adminEmail')} required />
              <input
                className="input-field"
                type="text"
                placeholder="Temporary password (min 6)"
                value={form.adminPassword}
                onChange={set('adminPassword')}
                minLength={6}
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-400 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-brand-black-muted">
            <button type="button" onClick={onClose} className="btn-outline text-sm" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary text-sm" disabled={saving}>
              {saving ? 'Creating…' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        {label}
        {hint && <span className="text-xs text-gray-500 font-normal"> — {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function prefixFrom(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const raw = words.length > 1 ? words.map((w) => w[0]).join('') : words[0] || '';
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

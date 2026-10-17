import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

// ═══════════════════════════════════════════════════════════
// COMPANY SETTINGS — a company admin edits the name and contact
// details shown on customer emails and quote PDFs.
// ═══════════════════════════════════════════════════════════

const FIELDS = [
  { key: 'name', label: 'Company name', type: 'text' },
  { key: 'tagline', label: 'Tagline', type: 'text' },
  { key: 'contactEmail', label: 'Contact email', type: 'email' },
  { key: 'contactPhone', label: 'Contact phone', type: 'text' },
  { key: 'website', label: 'Website', type: 'text' },
  { key: 'address', label: 'Address', type: 'text' },
] as const;

type FormState = Record<(typeof FIELDS)[number]['key'], string>;

export default function CompanySettings() {
  const { tenant, token, user, login } = useAuthStore();
  const [form, setForm] = useState<FormState | null>(null);
  const [meta, setMeta] = useState<{ slug: string; trackingPrefix: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    api
      .get('/admin/company')
      .then(({ data }) => {
        setMeta({ slug: data.slug, trackingPrefix: data.trackingPrefix });
        setForm(
          Object.fromEntries(FIELDS.map((f) => [f.key, data[f.key] || ''])) as FormState
        );
      })
      .catch(() => setMessage({ text: 'Failed to load company details.', ok: false }));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage(null);
    try {
      const { data } = await api.patch('/admin/company', form);
      // Keep the name shown in the sidebar in sync
      if (token && user && tenant) {
        login(token, user, { ...tenant, name: data.name });
      }
      setMessage({ text: '✓ Saved — new emails and PDFs will use these details.', ok: true });
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setMessage({ text: msg || 'Failed to save.', ok: false });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold">Company Settings</h1>
      <p className="text-gray-400 text-sm mt-1 mb-8">
        Shown on customer emails and quotation PDFs.
      </p>

      {!form ? (
        <p className="text-gray-400">{message?.text || 'Loading…'}</p>
      ) : (
        <form onSubmit={save} className="card space-y-4">
          {meta && (
            <div className="grid grid-cols-2 gap-3 text-sm pb-4 border-b border-brand-black-muted">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide">Company code</p>
                <p className="font-mono text-brand-orange">{meta.slug}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide">Tracking prefix</p>
                <p className="font-mono">{meta.trackingPrefix}</p>
              </div>
            </div>
          )}

          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{f.label}</label>
              <input
                className="input-field"
                type={f.type}
                value={form[f.key]}
                required={f.key === 'name'}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              />
            </div>
          ))}

          {message && (
            <p className={`text-sm ${message.ok ? 'text-green-400' : 'text-red-400'}`}>
              {message.text}
            </p>
          )}

          <button className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}
    </div>
  );
}

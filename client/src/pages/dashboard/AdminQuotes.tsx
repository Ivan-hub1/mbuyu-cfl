import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { getAllQuotes, STATUS_COLOR, updateQuote } from '../../lib/quotes';
import type { QuoteRequest, QuoteStatus } from '../../types';

// ─── Download quote as branded PDF ───────────────────────
async function downloadQuotePdf(quoteId: string, reference: string) {
  try {
    const res = await api.get(`/quotes/${quoteId}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Quote-${reference}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[download pdf]', err);
    alert('Failed to download PDF. Make sure you are logged in as admin.');
  }
}

// ─── Country tax rules (mirrors server/src/lib/taxes.ts) ──
const TAX_RULES: { country: string; taxName: string; rate: number }[] = [
  { country: 'Uganda', taxName: 'VAT', rate: 18 },
  { country: 'Kenya', taxName: 'VAT', rate: 16 },
  { country: 'Tanzania', taxName: 'VAT', rate: 18 },
  { country: 'Rwanda', taxName: 'VAT', rate: 18 },
  { country: 'Burundi', taxName: 'VAT', rate: 18 },
  { country: 'South Sudan', taxName: 'VAT', rate: 18 },
  { country: 'DR Congo', taxName: 'VAT', rate: 16 },
  { country: 'Ethiopia', taxName: 'VAT', rate: 15 },
  { country: 'Somalia', taxName: 'Sales Tax', rate: 10 },
  { country: 'Djibouti', taxName: 'VAT', rate: 10 },
  { country: 'United Arab Emirates', taxName: 'VAT', rate: 5 },
];

function getTaxRule(country: string) {
  if (!country) return null;
  const normalized = country.trim().toLowerCase();
  return (
    TAX_RULES.find((r) => r.country.toLowerCase() === normalized) || null
  );
}

const FILTERS: ('ALL' | QuoteStatus)[] = [
  'ALL',
  'NEW',
  'REVIEWING',
  'QUOTED',
  'ACCEPTED',
  'REJECTED',
];

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT — Quote List
// ═══════════════════════════════════════════════════════════
export default function AdminQuotes() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [filter, setFilter] = useState<'ALL' | QuoteStatus>('ALL');
  const [selected, setSelected] = useState<QuoteRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllQuotes();
      setQuotes(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load quotes. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered =
    filter === 'ALL' ? quotes : quotes.filter((q) => q.status === filter);

  const counts = quotes.reduce<Record<string, number>>((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {});

  if (selected) {
    return (
      <QuoteDetail
        quote={selected}
        onBack={() => {
          setSelected(null);
          refresh();
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Quote Requests</h1>
          <p className="text-gray-400 text-sm mt-1">
            {quotes.length} total · {counts.NEW || 0} new
          </p>
        </div>
        <button
          onClick={refresh}
          className="btn-outline text-sm px-4 py-2"
          disabled={loading}
        >
          {loading ? '↻ Loading…' : '↻ Refresh'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                active
                  ? 'bg-brand-orange text-white border-brand-orange'
                  : 'bg-brand-black-soft text-gray-300 border-brand-black-muted hover:border-brand-orange/50'
              }`}
            >
              {f}
              {f !== 'ALL' && counts[f] ? ` (${counts[f]})` : ''}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="card text-center py-8 text-red-400 mb-6">{error}</div>
      )}

      {!error && filtered.length === 0 && (
        <div className="card text-center py-16">
          <p className="text-gray-400">
            {loading ? 'Loading…' : 'No quote requests yet.'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Requests submitted through the public Quote form will appear here.
          </p>
        </div>
      )}

      {!error && filtered.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-black-muted text-gray-400 text-left">
                <th className="p-4 font-medium">Reference</th>
                <th className="p-4 font-medium">Client</th>
                <th className="p-4 font-medium hidden md:table-cell">Route</th>
                <th className="p-4 font-medium hidden lg:table-cell">Cargo</th>
                <th className="p-4 font-medium hidden lg:table-cell">
                  Submitted
                </th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">PDF</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr
                  key={q.id}
                  onClick={() => setSelected(q)}
                  className="border-b border-brand-black-muted last:border-0 hover:bg-brand-black/40 cursor-pointer transition"
                >
                  <td className="p-4 font-mono text-brand-orange text-xs">
                    {q.reference}
                  </td>
                  <td className="p-4">
                    <div className="font-medium">{q.fullName}</div>
                    <div className="text-xs text-gray-500">{q.email}</div>
                  </td>
                  <td className="p-4 hidden md:table-cell text-gray-300">
                    {q.originCity}, {q.originCountry} → {q.destinationCity},{' '}
                    {q.destinationCountry}
                  </td>
                  <td className="p-4 hidden lg:table-cell text-gray-300">
                    {q.cargoType}
                  </td>
                  <td className="p-4 hidden lg:table-cell text-gray-400 text-xs">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLOR[q.status]}`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadQuotePdf(q.id, q.reference);
                      }}
                      className="text-brand-orange hover:underline text-xs"
                    >
                      📄 Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// QUOTE DETAIL VIEW
// ═══════════════════════════════════════════════════════════
function QuoteDetail({
  quote,
  onBack,
}: {
  quote: QuoteRequest;
  onBack: () => void;
}) {
  const [status, setStatus] = useState<QuoteStatus>(quote.status);
  const [quotedAmount, setQuotedAmount] = useState(quote.quotedAmount || '');
  const [quotedCurrency, setQuotedCurrency] = useState(
    quote.quotedCurrency || 'USD'
  );
  const [adminResponse, setAdminResponse] = useState(quote.adminResponse || '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const navigate = useNavigate();

  // ─── Tax state ────────────────────────────────────────
  const autoRule = getTaxRule(quote.destinationCountry);
  const [taxName, setTaxName] = useState(
    quote.taxName || autoRule?.taxName || ''
  );
  const [taxRate, setTaxRate] = useState(
    quote.taxRate || (autoRule ? String(autoRule.rate) : '')
  );
  const [applyTax, setApplyTax] = useState(
    !!(quote.taxRate || autoRule)
  );

  // ─── Live computed values ─────────────────────────────
  const base = parseFloat(quotedAmount) || 0;
  const rateNum = parseFloat(taxRate) || 0;
  const taxAmt = applyTax ? (base * rateNum) / 100 : 0;
  const total = base + taxAmt;

  const fmt = (n: number) =>
    `${quotedCurrency} ${n.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const save = async (newStatus?: QuoteStatus) => {
    setSaving(true);

    const minDuration = new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const patch: Partial<QuoteRequest> = {
        status: newStatus || status,
        quotedAmount,
        quotedCurrency,
        adminResponse,
        taxName: applyTax ? taxName : null,
        taxRate: applyTax ? taxRate : null,
        taxAmount: applyTax ? taxAmt.toFixed(2) : null,
      };
      await Promise.all([updateQuote(quote.id, patch), minDuration]);
      setStatus(patch.status!);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to save response');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="text-sm text-gray-400 hover:text-brand-orange mb-6 transition"
      >
        ← Back to all quotes
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold font-mono">
              {quote.reference}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLOR[status]}`}
            >
              {status}
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Submitted {new Date(quote.createdAt).toLocaleString()}
          </p>
        </div>

        <button
          onClick={() => downloadQuotePdf(quote.id, quote.reference)}
          className="btn-outline text-sm px-4 py-2"
        >
          📄 Download PDF
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column — details */}
        <div className="lg:col-span-2 space-y-6">
          <section className="card">
            <h3 className="text-sm font-semibold text-brand-orange uppercase mb-4">
              Contact
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <Info label="Full Name" value={quote.fullName} />
              <Info label="Company" value={quote.companyName || '—'} />
              <Info label="Email" value={quote.email} />
              <Info label="Phone" value={quote.phone} />
              <Info label="Preferred Contact" value={quote.preferredContact} />
            </div>
          </section>

          <section className="card">
            <h3 className="text-sm font-semibold text-brand-orange uppercase mb-4">
              Shipment
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <Info label="Cargo Type" value={quote.cargoType} />
              <Info label="Transport Mode" value={quote.transportMode} />
              <Info label="Weight" value={`${quote.weightKg} kg`} />
              <Info
                label="Volume"
                value={quote.volumeCbm ? `${quote.volumeCbm} CBM` : '—'}
              />
              <Info label="Pieces" value={quote.pieces} />
              <Info
                label="Cargo Value"
                value={
                  quote.cargoValue
                    ? `${quote.cargoValueCurrency} ${quote.cargoValue}`
                    : '—'
                }
              />
              <Info
                label="Description"
                value={quote.cargoDescription}
                className="sm:col-span-2"
              />
            </div>
          </section>

          <section className="card">
            <h3 className="text-sm font-semibold text-brand-orange uppercase mb-4">
              Route & Schedule
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <Info
                label="Origin"
                value={`${quote.originCity}, ${quote.originCountry}`}
              />
              <Info
                label="Destination"
                value={`${quote.destinationCity}, ${quote.destinationCountry}`}
              />
              <Info label="Shipping Date" value={quote.shippingDate} />
              <Info label="Incoterms" value={quote.incoterms} />
            </div>
          </section>

          {(quote.specialRequirements || quote.hasDocuments) && (
            <section className="card">
              <h3 className="text-sm font-semibold text-brand-orange uppercase mb-4">
                Additional
              </h3>
              {quote.specialRequirements && (
                <div className="text-sm mb-3">
                  <p className="text-gray-500 mb-1">Special Requirements</p>
                  <p className="text-gray-200 whitespace-pre-wrap">
                    {quote.specialRequirements}
                  </p>
                </div>
              )}
              {quote.hasDocuments && (
                <p className="text-sm text-brand-orange">
                  📎 Client has documents to share
                </p>
              )}
            </section>
          )}
        </div>

        {/* Right column — response */}
        <div className="space-y-6">
          <section className="card sticky top-24">
            <h3 className="text-sm font-semibold text-brand-orange uppercase mb-4">
              Your Response
            </h3>

            <div className="space-y-5">
              {/* ── Quoted Amount (FIXED LAYOUT) ── */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Quoted Amount
                </label>
                <div className="grid grid-cols-[1fr_100px] gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={quotedAmount}
                    onChange={(e) => setQuotedAmount(e.target.value)}
                    placeholder="e.g. 4500"
                    className="input-field w-full"
                  />
                  <select
                    value={quotedCurrency}
                    onChange={(e) => setQuotedCurrency(e.target.value)}
                    className="input-field w-full"
                  >
                    {['USD', 'EUR', 'UGX', 'KES', 'TZS', 'GBP', 'AED'].map(
                      (c) => (
                        <option key={c}>{c}</option>
                      )
                    )}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Base amount before tax.
                </p>
              </div>

              {/* ── Tax Section ── */}
              <div className="border-t border-brand-black-muted pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">
                    Include Tax
                  </label>
                  <input
                    type="checkbox"
                    checked={applyTax}
                    onChange={(e) => setApplyTax(e.target.checked)}
                    className="accent-brand-orange w-4 h-4 cursor-pointer"
                  />
                </div>

                {applyTax && (
                  <>
                    <div className="grid grid-cols-[1fr_100px] gap-2">
                      <input
                        type="text"
                        value={taxName}
                        onChange={(e) => setTaxName(e.target.value)}
                        placeholder="VAT"
                        className="input-field w-full"
                      />
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={taxRate}
                          onChange={(e) => setTaxRate(e.target.value)}
                          placeholder="18"
                          className="input-field w-full pr-7"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                          %
                        </span>
                      </div>
                    </div>

                    {autoRule && (
                      <p className="text-xs text-gray-500 mt-1.5">
                        Auto-detected for{' '}
                        <span className="text-brand-orange">
                          {quote.destinationCountry}
                        </span>
                        : {autoRule.taxName} {autoRule.rate}%
                      </p>
                    )}

                    {!autoRule && quote.destinationCountry && (
                      <p className="text-xs text-gray-500 mt-1.5">
                        No tax rule on file for{' '}
                        <span className="text-brand-orange">
                          {quote.destinationCountry}
                        </span>
                        . Enter manually.
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* ── Live Summary ── */}
              {base > 0 && (
                <div className="bg-brand-black rounded-lg p-3 border border-brand-black-muted space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-white font-mono">{fmt(base)}</span>
                  </div>
                  {applyTax && taxAmt > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">
                        {taxName || 'Tax'} ({rateNum.toFixed(0)}%)
                      </span>
                      <span className="text-white font-mono">
                        {fmt(taxAmt)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-brand-black-muted">
                    <span className="text-brand-orange font-semibold">
                      Total
                    </span>
                    <span className="text-brand-orange font-bold font-mono">
                      {fmt(total)}
                    </span>
                  </div>
                </div>
              )}

              {/* ── Message ── */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Message to Client
                </label>
                <textarea
                  rows={6}
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Include breakdown, transit time, terms, next steps…"
                  className="input-field resize-none"
                />
              </div>

              {/* ── Status ── */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Update Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as QuoteStatus)}
                  className="input-field"
                >
                  <option value="NEW">NEW</option>
                  <option value="REVIEWING">REVIEWING</option>
                  <option value="QUOTED">QUOTED</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <button
                onClick={() => save()}
                className="btn-primary w-full"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save Response'}
              </button>

              {quotedAmount && (
                <button
                  onClick={() => {
                    setStatus('QUOTED');
                    save('QUOTED');
                  }}
                  className="btn-outline w-full text-sm"
                  disabled={saving}
                >
                  Save & Mark as QUOTED
                </button>
              )}

              {status === 'QUOTED' && !quote.shipmentId && (
                <button
                  onClick={() => setShowAcceptModal(true)}
                  className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition disabled:opacity-60"
                  disabled={saving}
                >
                  ✓ Accept & Create Shipment
                </button>
              )}

              {quote.shipmentId && (
                <div className="bg-green-500/10 border border-green-500/40 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-400 mb-2">
                    ✓ Shipment already created from this quote
                  </p>
                  <button
                    onClick={() => navigate(`/dashboard`)}
                    className="text-xs text-green-400 underline hover:text-green-300"
                  >
                    View in Shipments →
                  </button>
                </div>
              )}

              {saved && (
                <p className="text-center text-sm text-green-400">✓ Saved</p>
              )}

              {quote.respondedAt && (
                <p className="text-xs text-gray-500 text-center">
                  Last response: {new Date(quote.respondedAt).toLocaleString()}
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Accept & Create Shipment Modal */}
      {showAcceptModal && (
        <AcceptQuoteModal
          quote={quote}
          onClose={() => setShowAcceptModal(false)}
          onSuccess={() => {
            setShowAcceptModal(false);
            onBack();
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ACCEPT QUOTE MODAL
// ═══════════════════════════════════════════════════════════
function AcceptQuoteModal({
  quote,
  onClose,
  onSuccess,
}: {
  quote: QuoteRequest;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [staffList, setStaffList] = useState<
    { id: string; name: string; role: string }[]
  >([]);
  const [assignedToId, setAssignedToId] = useState('');
  const [weightKg, setWeightKg] = useState(quote.weightKg || '');
  const [volumeCbm, setVolumeCbm] = useState(quote.volumeCbm || '');
  const [pieces, setPieces] = useState(quote.pieces || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/users')
      .then(({ data }) => {
        const staff = data.filter(
          (u: any) => u.role === 'STAFF' || u.role === 'ADMIN'
        );
        setStaffList(staff);
      })
      .catch((err) => console.error('[load staff]', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post(`/quotes/${quote.id}/accept`, {
        assignedToId: assignedToId || null,
        weightKg: weightKg || quote.weightKg,
        volumeCbm: volumeCbm || null,
        pieces: pieces || quote.pieces,
      });

      alert(
        `✅ Shipment created!\n\nTracking number: ${data.trackingNumber}\n\nCustomer has been marked as ACCEPTED.`
      );
      onSuccess();
    } catch (err: any) {
  console.error('[save] failed', err);
  const status = err?.response?.status;
  const body = err?.response?.data;
  const detail =
    typeof body === 'string'
      ? body
      : body?.details
      ? Object.entries(body.details)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\n')
      : body?.error;
  alert(
    `Failed to save response${status ? ` (HTTP ${status})` : ''}\n\n${
      detail || err?.message || 'No details'
    }`
  );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="card w-full max-w-lg my-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-brand-black-muted">
          <h3 className="text-lg font-bold">Accept Quote & Create Shipment</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="bg-brand-black rounded-lg p-4 mb-6 text-sm">
          <p className="text-xs text-gray-500 mb-2">QUOTE DETAILS</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-gray-500">Customer</p>
              <p className="text-white">{quote.fullName}</p>
            </div>
            <div>
              <p className="text-gray-500">Route</p>
              <p className="text-white">
                {quote.originCity} → {quote.destinationCity}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Cargo</p>
              <p className="text-white">{quote.cargoType}</p>
            </div>
            <div>
              <p className="text-gray-500">Reference</p>
              <p className="text-white font-mono">{quote.reference}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Weight (kg)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input-field"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Volume (CBM) — Optional
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input-field"
              value={volumeCbm}
              onChange={(e) => setVolumeCbm(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Number of Pieces
            </label>
            <input
              type="number"
              min="1"
              className="input-field"
              value={pieces}
              onChange={(e) => setPieces(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Assign to Staff
            </label>
            <select
              className="input-field"
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
            >
              <option value="">— Unassigned —</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-400 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-brand-black-muted">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline text-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Creating…' : '✓ Create Shipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════
function Info({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-gray-200">{value}</p>
    </div>
  );
}
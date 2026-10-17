import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { vehiclesApi, checklistsApi } from '../../lib/fleetApi';
import type { Vehicle, Checklist, ChecklistFormData } from '../../types/fleet';

// ─── Inspection items ─────────────────────────────────────
const INSPECTION_ITEMS = [
  { key: 'oilOk', label: 'Oil level', hint: 'Check engine oil is at the correct level' },
  { key: 'waterOk', label: 'Water / coolant', hint: 'Radiator and coolant reservoir levels' },
  { key: 'tyresOk', label: 'Tyres', hint: 'Pressure, tread depth, no visible damage' },
  { key: 'brakesOk', label: 'Brake system', hint: 'Brake pedal feel, no leaks, handbrake works' },
  { key: 'engineOk', label: 'Engine', hint: 'No unusual noises, no leaks, no warning lights' },
  { key: 'lightsOk', label: 'Lights', hint: 'Headlights, indicators, brake lights, hazards' },
  { key: 'hornOk', label: 'Horn', hint: 'Sounds clearly when pressed' },
  { key: 'mirrorsOk', label: 'Mirrors', hint: 'Side and rear-view mirrors intact and adjusted' },
  { key: 'bodyOk', label: 'Body / structure', hint: 'No cracks, no loose panels, doors close properly' },
] as const;

type CheckKey = typeof INSPECTION_ITEMS[number]['key'];
type Checks = Record<CheckKey, boolean>;

const EMPTY_CHECKS: Checks = {
  oilOk: true,
  waterOk: true,
  tyresOk: true,
  brakesOk: true,
  engineOk: true,
  lightsOk: true,
  hornOk: true,
  mirrorsOk: true,
  bodyOk: true,
};

// ═══════════════════════════════════════════════════════════
// STANDALONE PAGE — /driver/checklist
// ═══════════════════════════════════════════════════════════

export default function ChecklistFormPage() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState<{ status: string; id: string } | null>(null);

  if (success) {
    const isFlagged = success.status === 'FLAGGED';
    return (
      <div className="min-h-screen bg-brand-black">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="card text-center">
            <div
              className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl ${
                isFlagged
                  ? 'bg-brand-orange/10 text-brand-orange'
                  : 'bg-green-500/10 text-green-400'
              }`}
            >
              {isFlagged ? '⚠️' : '✅'}
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {isFlagged ? 'Checklist Flagged' : 'Checklist Approved'}
            </h1>
            <p className="text-gray-400 mb-6">
              {isFlagged
                ? 'Your vehicle has issues that need attention. The maintenance team has been notified.'
                : 'All checks passed. You can now start your journey.'}
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              {!isFlagged && (
                <button
                  onClick={() => navigate('/driver/shipments')}
                  className="btn-primary"
                >
                  Go to My Shipments →
                </button>
              )}
              <button
                onClick={() => {
                  setSuccess(null);
                }}
                className="btn-ghost"
              >
                Submit Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Pre-Trip Vehicle Checklist</h1>
          <p className="text-gray-400 mt-1">
            Complete this inspection before starting any journey.
          </p>
        </div>
        <ChecklistFormBody
          onSuccess={(result) =>
            setSuccess({ status: result.status, id: result.id })
          }
          onCancel={() => navigate('/dashboard')}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// REUSABLE FORM BODY
// ═══════════════════════════════════════════════════════════

export function ChecklistFormBody({
  onSuccess,
  onCancel,
  fixedVehicleId,
  submitLabel = 'Submit Checklist',
}: {
  onSuccess: (checklist: Checklist) => void;
  onCancel?: () => void;
  fixedVehicleId?: string;
  submitLabel?: string;
}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [vehicleId, setVehicleId] = useState(fixedVehicleId || '');
  const [driverName, setDriverName] = useState('');
  const [driverPermitNo, setDriverPermitNo] = useState('');
  const [driverPermitClass, setDriverPermitClass] = useState('');
  const [driverPermitExpiry, setDriverPermitExpiry] = useState('');
  const [checks, setChecks] = useState<Checks>(EMPTY_CHECKS);
  const [issuesNotes, setIssuesNotes] = useState('');

  useEffect(() => {
    vehiclesApi
      .available()
      .then(setVehicles)
      .catch(() => setError('Failed to load vehicles. Please refresh.'))
      .finally(() => setLoadingVehicles(false));
  }, []);

  const toggleCheck = (key: CheckKey) => {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const failedCount = INSPECTION_ITEMS.filter((item) => !checks[item.key]).length;
  const hasIssues = failedCount > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!vehicleId) return setError('Please select a vehicle.');
    if (!driverName.trim()) return setError('Please enter your full name.');
    if (!driverPermitNo.trim()) return setError('Please enter your permit number.');
    if (!driverPermitClass.trim()) return setError('Please enter your permit class.');
    if (!driverPermitExpiry) return setError('Please enter your permit expiry date.');

    const expiry = new Date(driverPermitExpiry);
    if (expiry.getTime() < Date.now()) {
      return setError('Your driving permit has expired.');
    }

    if (hasIssues && !issuesNotes.trim()) {
      return setError(
        'You flagged issues. Please describe them so maintenance knows what to fix.'
      );
    }

    setSubmitting(true);
    try {
      const payload: ChecklistFormData = {
        vehicleId,
        driverName: driverName.trim(),
        driverPermitNo: driverPermitNo.trim(),
        driverPermitClass: driverPermitClass.trim(),
        driverPermitExpiry: new Date(driverPermitExpiry).toISOString(),
        ...checks,
        issuesNotes: issuesNotes.trim() || undefined,
      };

      const result = await checklistsApi.submit(payload);
      onSuccess(result);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to submit checklist.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* ─── Vehicle Selection ────────────────────────── */}
      {!fixedVehicleId && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-brand-orange">
            1. Vehicle
          </h2>
          {loadingVehicles ? (
            <p className="text-gray-500 text-sm">Loading vehicles…</p>
          ) : vehicles.length === 0 ? (
            <p className="text-red-400 text-sm">
              No vehicles available. Contact your supervisor.
            </p>
          ) : (
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="input-field"
              required
            >
              <option value="">— Select a vehicle —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} — {v.type}
                  {v.capacity ? ` (${v.capacity})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* ─── Driver Identity ──────────────────────────── */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 text-brand-orange">
          {fixedVehicleId ? '1. Driver Details' : '2. Driver Details'}
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Full Name</label>
            <input
              className="input-field"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="As on your permit"
              required
            />
          </div>
          <div>
            <label className="input-label">Permit Number</label>
            <input
              className="input-field"
              value={driverPermitNo}
              onChange={(e) => setDriverPermitNo(e.target.value)}
              placeholder="e.g. UG-1234567"
              required
            />
          </div>
          <div>
            <label className="input-label">Permit Class</label>
            <input
              className="input-field"
              value={driverPermitClass}
              onChange={(e) => setDriverPermitClass(e.target.value)}
              placeholder="e.g. B, C, CE"
              required
            />
          </div>
          <div>
            <label className="input-label">Permit Expiry</label>
            <input
              type="date"
              className="input-field"
              value={driverPermitExpiry}
              onChange={(e) => setDriverPermitExpiry(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* ─── Inspection Items ─────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-brand-orange">
            {fixedVehicleId ? '2. Vehicle Inspection' : '3. Vehicle Inspection'}
          </h2>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              hasIssues
                ? 'bg-brand-orange/10 text-brand-orange border-brand-orange/30'
                : 'bg-green-500/10 text-green-400 border-green-500/30'
            }`}
          >
            {hasIssues ? `${failedCount} issue${failedCount > 1 ? 's' : ''}` : 'All OK'}
          </span>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Tap each item to toggle between <span className="text-green-400">OK</span>{' '}
          and <span className="text-brand-orange">Issue</span>. All items start as OK.
        </p>

        <div className="grid md:grid-cols-2 gap-3">
          {INSPECTION_ITEMS.map((item) => {
            const ok = checks[item.key];
            return (
              <button
                type="button"
                key={item.key}
                onClick={() => toggleCheck(item.key)}
                className={`text-left p-4 rounded-lg border-2 transition ${
                  ok
                    ? 'border-green-500/40 bg-green-500/5 hover:border-green-500/60'
                    : 'border-brand-orange bg-brand-orange/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.hint}</div>
                  </div>
                  <div
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      ok
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-brand-orange text-white'
                    }`}
                  >
                    {ok ? 'OK' : 'ISSUE'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Notes ────────────────────────────────────── */}
      {hasIssues && (
        <div className="card border-brand-orange/50">
          <h2 className="text-lg font-semibold mb-2 text-brand-orange">
            {fixedVehicleId ? '3. Describe the Issues' : '4. Describe the Issues'}
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Required — the maintenance team needs to know what's wrong.
          </p>
          <textarea
            className="input-field min-h-[120px]"
            value={issuesNotes}
            onChange={(e) => setIssuesNotes(e.target.value)}
            placeholder="e.g. Front-left tyre has low pressure and a slow leak."
            required
          />
        </div>
      )}

      {/* ─── Error ────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ─── Actions ──────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting || loadingVehicles || vehicles.length === 0}
          className="btn-primary flex-1 md:flex-initial"
        >
          {submitting
            ? 'Submitting…'
            : hasIssues
            ? 'Submit & Notify Maintenance'
            : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface Vehicle {
  id: string;
  plate: string;
  type: string;
  capacity: string | null;
  status: 'AVAILABLE' | 'ON_TRIP' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  notes: string | null;
  createdAt: string;
  _count?: {
    checklists: number;
    journeys: number;
  };
}

const STATUS_STYLE: Record<string, string> = {
  AVAILABLE: 'bg-green-500/15 text-green-400 border-green-500/30',
  ON_TRIP: 'bg-brand-orange/15 text-brand-orange border-brand-orange/30',
  MAINTENANCE: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  OUT_OF_SERVICE: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const VEHICLE_TYPES = ['Truck', 'Trailer', 'Van', 'Pickup', 'Other'] as const;

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [filter, setFilter] = useState<'ALL' | Vehicle['status']>('ALL');

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/vehicles');
      setVehicles(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load vehicles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered =
    filter === 'ALL'
      ? vehicles
      : vehicles.filter((v) => v.status === filter);

  const stats = {
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === 'AVAILABLE').length,
    onTrip: vehicles.filter((v) => v.status === 'ON_TRIP').length,
    maintenance: vehicles.filter((v) => v.status === 'MAINTENANCE').length,
  };

  const handleDelete = async (id: string, plate: string) => {
    if (!confirm(`Delete vehicle ${plate}? This cannot be undone.`)) return;
    try {
      await api.delete(`/vehicles/${id}`);
      refresh();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to delete vehicle');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold">Fleet Vehicles</h2>
          <p className="text-gray-400 text-sm mt-1">
            {stats.total} total · {stats.available} available · {stats.onTrip} on
            trip · {stats.maintenance} in maintenance
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="btn-outline text-sm px-4 py-2"
            disabled={loading}
          >
            {loading ? '↻ Loading…' : '↻ Refresh'}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary text-sm px-4 py-2"
          >
            + Add Vehicle
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Total</p>
          <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-gray-400 text-xs uppercase tracking-wider">
            Available
          </p>
          <p className="text-3xl font-bold text-green-400 mt-2">
            {stats.available}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-400 text-xs uppercase tracking-wider">
            On Trip
          </p>
          <p className="text-3xl font-bold text-brand-orange mt-2">
            {stats.onTrip}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-400 text-xs uppercase tracking-wider">
            Maintenance
          </p>
          <p className="text-3xl font-bold text-yellow-400 mt-2">
            {stats.maintenance}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['ALL', 'AVAILABLE', 'ON_TRIP', 'MAINTENANCE', 'OUT_OF_SERVICE'] as const).map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition border ${
                filter === f
                  ? 'bg-brand-orange text-white border-brand-orange'
                  : 'bg-brand-black-soft text-gray-300 border-brand-black-muted hover:border-brand-orange/50'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          )
        )}
      </div>

      {error && (
        <div className="card text-center py-8 text-red-400 mb-6">{error}</div>
      )}

      {!error && !loading && filtered.length === 0 && (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🚚</div>
          <p className="text-gray-400">
            {vehicles.length === 0
              ? 'No vehicles yet.'
              : 'No vehicles match this filter.'}
          </p>
          {vehicles.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Add your first vehicle to get started.
            </p>
          )}
        </div>
      )}

      {!error && filtered.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-black-muted text-gray-400 text-left">
                <th className="p-4 font-medium">Plate</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium hidden md:table-cell">
                  Capacity
                </th>
                <th className="p-4 font-medium hidden lg:table-cell">
                  Trips
                </th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-brand-black-muted last:border-0 hover:bg-brand-black/40"
                >
                  <td className="p-4 font-mono font-semibold text-brand-orange">
                    {v.plate}
                  </td>
                  <td className="p-4 text-gray-200">{v.type}</td>
                  <td className="p-4 hidden md:table-cell text-gray-400">
                    {v.capacity || '—'}
                  </td>
                  <td className="p-4 hidden lg:table-cell text-gray-400">
                    {v._count?.journeys ?? 0}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        STATUS_STYLE[v.status]
                      }`}
                    >
                      {v.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => setEditing(v)}
                        className="text-brand-orange hover:underline text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(v.id, v.plate)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <VehicleModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            refresh();
          }}
        />
      )}

      {editing && (
        <VehicleModal
          existing={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CREATE / EDIT MODAL
// ═══════════════════════════════════════════════════════════
function VehicleModal({
  existing,
  onClose,
  onSuccess,
}: {
  existing?: Vehicle;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!existing;
  const [plate, setPlate] = useState(existing?.plate || '');
  const [type, setType] = useState(existing?.type || 'Truck');
  const [capacity, setCapacity] = useState(existing?.capacity || '');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [status, setStatus] = useState<Vehicle['status']>(
    existing?.status || 'AVAILABLE'
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!plate.trim()) return setError('Plate number is required.');

    setSaving(true);
    try {
      const payload = {
        plate: plate.trim().toUpperCase(),
        type,
        capacity: capacity.trim() || undefined,
        notes: notes.trim() || undefined,
        ...(isEdit && { status }),
      };

      if (isEdit) {
        await api.patch(`/vehicles/${existing!.id}`, payload);
      } else {
        await api.post('/vehicles', payload);
      }

      onSuccess();
    } catch (err: any) {
      setError(
        err?.response?.data?.error || 'Failed to save vehicle. Try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="card w-full max-w-md my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">
            {isEdit ? `Edit ${existing!.plate}` : 'Add Vehicle'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Number Plate *
            </label>
            <input
              className="input-field font-mono uppercase"
              placeholder="e.g. UBG 123A"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Vehicle Type *
            </label>
            <select
              className="input-field"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {VEHICLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Capacity
            </label>
            <input
              className="input-field"
              placeholder="e.g. 20 Tonnes"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>

          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Status
              </label>
              <select
                className="input-field"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as Vehicle['status'])
                }
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="ON_TRIP">ON TRIP</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Notes
            </label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="Optional notes about this vehicle"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline text-sm"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-sm"
              disabled={saving}
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface Shipment {
  id: string;
  trackingNumber: string;
  customerName: string;
  originCity: string;
  originCountry: string;
  destinationCity: string;
  destinationCountry: string;
  status: string;
  assignedTo?: { id: string; name: string; email: string } | null;
  createdAt: string;
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  staffRole?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  PICKED_UP: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  IN_TRANSIT: 'bg-brand-orange/15 text-brand-orange border-brand-orange/30',
  AT_CUSTOMS: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  CUSTOMS_HOLD: 'bg-red-500/15 text-red-400 border-red-500/30',
  CUSTOMS_CLEARED: 'bg-green-500/15 text-green-400 border-green-500/30',
  OUT_FOR_DELIVERY:
    'bg-brand-orange/15 text-brand-orange border-brand-orange/30',
  DELIVERED: 'bg-green-500/15 text-green-400 border-green-500/30',
  EXCEPTION: 'bg-red-500/15 text-red-400 border-red-500/30',
  CANCELLED: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

export default function Shipments() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assigning, setAssigning] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const [shipRes, usersRes] = await Promise.all([
        api.get('/shipments'),
        api.get('/admin/users'),
      ]);
      setShipments(shipRes.data);
      // Only DRIVER staff
      setStaff(
        usersRes.data.filter(
          (u: StaffUser) => u.role === 'STAFF' && u.staffRole === 'DRIVER'
        )
      );
    } catch (err) {
      console.error(err);
      setError('Failed to load shipments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const assign = async (shipmentId: string, assignedToId: string) => {
    setAssigning(shipmentId);
    try {
      await api.patch(`/shipments/${shipmentId}/assign`, {
        assignedToId: assignedToId || null,
      });
      await refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to assign');
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold">Shipments</h2>
          <p className="text-gray-400 text-sm mt-1">
            {shipments.length} total
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

      {error && (
        <div className="card text-center py-8 text-red-400 mb-6">{error}</div>
      )}

      {!error && !loading && shipments.length === 0 && (
        <div className="card text-center py-16">
          <p className="text-gray-400">No shipments yet.</p>
          <p className="text-sm text-gray-500 mt-2">
            Accept a quote to create a shipment.
          </p>
        </div>
      )}

      {!error && shipments.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-black-muted text-gray-400 text-left">
                <th className="p-4 font-medium">Tracking</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium hidden md:table-cell">Route</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-brand-black-muted last:border-0 hover:bg-brand-black/40"
                >
                  <td className="p-4 font-mono text-brand-orange text-xs">
                    {s.trackingNumber}
                  </td>
                  <td className="p-4">{s.customerName}</td>
                  <td className="p-4 hidden md:table-cell text-gray-400 text-xs">
                    {s.originCity} → {s.destinationCity}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        STATUS_COLORS[s.status] || STATUS_COLORS.PENDING
                      }`}
                    >
                      {s.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={s.assignedTo?.id || ''}
                      onChange={(e) => assign(s.id, e.target.value)}
                      disabled={assigning === s.id}
                      className="input-field text-xs py-1.5 min-w-[160px]"
                    >
                      <option value="">— Unassigned —</option>
                      {staff.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
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
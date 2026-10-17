import { useEffect, useState } from 'react';
import api from '../../lib/api';
import type { Shipment, ShipmentEvent } from '../../types';
import Navbar from '../../components/layout/Navbar';
import SEO from '../../components/seo/SEO';
import { useAuthStore } from '../../store/authStore';
import StaffShipmentDetail from './StaffShipmentDetail';

const FILTERS = [
  'ALL',
  'PENDING',
  'PICKED_UP',
  'IN_TRANSIT',
  'AT_CUSTOMS',
  'CUSTOMS_CLEARED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
] as const;

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  PICKED_UP: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  IN_TRANSIT: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  AT_CUSTOMS: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  CUSTOMS_HOLD: 'bg-red-500/15 text-red-400 border-red-500/30',
  CUSTOMS_CLEARED: 'bg-green-500/15 text-green-400 border-green-500/30',
  OUT_FOR_DELIVERY: 'bg-brand-orange/15 text-brand-orange border-brand-orange/30',
  DELIVERED: 'bg-green-500/15 text-green-400 border-green-500/30',
  EXCEPTION: 'bg-red-500/15 text-red-400 border-red-500/30',
  CANCELLED: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

interface ShipmentWithEvents extends Shipment {
  events?: ShipmentEvent[];
}

export default function StaffDashboard() {
  const { user } = useAuthStore();
  const [shipments, setShipments] = useState<ShipmentWithEvents[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<ShipmentWithEvents | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/shipments/mine');
      setShipments(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load your assigned shipments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered =
    filter === 'ALL'
      ? shipments
      : shipments.filter((s) => s.status === filter);

  const counts = shipments.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  if (selected) {
    return (
      <StaffShipmentDetail
        shipment={selected}
        onBack={() => {
          setSelected(null);
          refresh();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <SEO
        title="Staff Dashboard"
        description="Your assigned Mbuyu CFL shipments."
      />
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Staff Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">
              Welcome, {user?.name}. You have {shipments.length} assigned
              shipment{shipments.length !== 1 ? 's' : ''}.
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

        {shipments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                  filter === f
                    ? 'bg-brand-orange text-white border-brand-orange'
                    : 'bg-brand-black-soft text-gray-300 border-brand-black-muted hover:border-brand-orange/50'
                }`}
              >
                {f.replace(/_/g, ' ')}
                {f !== 'ALL' && counts[f] ? ` (${counts[f]})` : ''}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="card text-center py-8 text-red-400 mb-6">
            {error}
          </div>
        )}

        {!error && shipments.length === 0 && (
          <div className="card text-center py-16">
            <p className="text-gray-400">
              {loading ? 'Loading…' : 'No assigned shipments yet.'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Your admin will assign shipments to you as they come in.
            </p>
          </div>
        )}

        {!error && shipments.length > 0 && filtered.length === 0 && (
          <div className="card text-center py-16">
            <p className="text-gray-400">No shipments with this status.</p>
          </div>
        )}

        {!error && filtered.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((s) => {
              const lastEvent = s.events?.[0];
              return (
                <div
                  key={s.id}
                  className="card hover:border-brand-orange transition cursor-pointer"
                  onClick={() => setSelected(s)}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-mono text-brand-orange text-sm font-semibold">
                        {s.trackingNumber}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {s.customerName}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${
                        STATUS_COLORS[s.status] || STATUS_COLORS.PENDING
                      }`}
                    >
                      {s.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-sm text-gray-300 mb-3">
                    {s.originCity}, {s.originCountry} → {s.destinationCity},{' '}
                    {s.destinationCountry}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-brand-black-muted">
                    <div className="text-xs text-gray-500">
                      {lastEvent ? (
                        <>
                          {lastEvent.status.replace(/_/g, ' ')} ·{' '}
                          {new Date(lastEvent.createdAt).toLocaleDateString()}
                        </>
                      ) : (
                        'No updates yet'
                      )}
                    </div>
                    <span className="text-xs text-brand-orange font-medium">
                      Update →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../lib/api';
import type { Shipment } from '../../types';

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

export default function DriverShipments() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/shipments/mine');
      setShipments(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load your assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const active = shipments.filter(
    (s) => s.status !== 'DELIVERED' && s.status !== 'CANCELLED'
  );
  const completed = shipments.filter(
    (s) => s.status === 'DELIVERED' || s.status === 'CANCELLED'
  );

  return (
    <div className="min-h-screen bg-brand-black">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Shipments</h1>
            <p className="text-gray-400 mt-1">
              {active.length} active · {completed.length} completed
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

        {!error && shipments.length === 0 && !loading && (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-400">No shipments assigned to you yet.</p>
            <p className="text-sm text-gray-500 mt-2">
              Your admin will assign shipments as they come in.
            </p>
          </div>
        )}

        {active.length > 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-semibold text-brand-orange uppercase tracking-wider mb-4">
              Active Assignments
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {active.map((s) => (
                <ShipmentCard key={s.id} shipment={s} />
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Completed
            </h2>
            <div className="grid md:grid-cols-2 gap-4 opacity-70">
              {completed.map((s) => (
                <ShipmentCard key={s.id} shipment={s} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ShipmentCard({ shipment }: { shipment: Shipment }) {
  const canStart =
    shipment.status === 'PENDING' || shipment.status === 'PICKED_UP';

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-mono text-brand-orange text-sm font-semibold">
            {shipment.trackingNumber}
          </p>
          <p className="text-xs text-gray-500 mt-1">{shipment.customerName}</p>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${
            STATUS_COLORS[shipment.status] || STATUS_COLORS.PENDING
          }`}
        >
          {shipment.status.replace(/_/g, ' ')}
        </span>
      </div>

      <p className="text-sm text-gray-300 mb-3">
        {shipment.originCity}, {shipment.originCountry} →{' '}
        {shipment.destinationCity}, {shipment.destinationCountry}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-brand-black-muted">
        <div className="text-xs text-gray-500">
          {shipment.description?.slice(0, 40) || '—'}
        </div>
        {canStart ? (
          <Link
            to={`/driver/shipment/${shipment.id}/start`}
            className="btn-primary text-xs px-4 py-2"
          >
            Start Journey →
          </Link>
        ) : (
          <span className="text-xs text-gray-500">In transit</span>
        )}
      </div>
    </div>
  );
}
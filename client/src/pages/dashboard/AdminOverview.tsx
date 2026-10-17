import { useEffect, useState } from 'react';
import api from '../../lib/api';
import type { QuoteRequest, Shipment } from '../../types';
import { useAuthStore } from '../../store/authStore';

const QUOTE_STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  REVIEWING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  QUOTED: 'bg-brand-orange/15 text-brand-orange border-brand-orange/30',
  ACCEPTED: 'bg-green-500/15 text-green-400 border-green-500/30',
  REJECTED: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const SHIPMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  PICKED_UP: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  IN_TRANSIT: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  AT_CUSTOMS: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  CUSTOMS_HOLD: 'bg-red-500/15 text-red-400 border-red-500/30',
  CUSTOMS_CLEARED: 'bg-green-500/15 text-green-400 border-green-500/30',
  OUT_FOR_DELIVERY:
    'bg-brand-orange/15 text-brand-orange border-brand-orange/30',
  DELIVERED: 'bg-green-500/15 text-green-400 border-green-500/30',
  EXCEPTION: 'bg-red-500/15 text-red-400 border-red-500/30',
  CANCELLED: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

export default function AdminOverview() {
  const { user } = useAuthStore();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [quotesRes, shipmentsRes] = await Promise.all([
        api.get('/quotes'),
        api.get('/shipments'),
      ]);
      setQuotes(quotesRes.data);
      setShipments(shipmentsRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ─── Stats ──────────────────────────────────────────────
  // Total quotes
  const totalQuotes = quotes.length;

  // Pending review (NEW + REVIEWING)
  const pendingReview = quotes.filter(
    (q) => q.status === 'NEW' || q.status === 'REVIEWING'
  ).length;

  // Quoted (waiting for customer decision)
  const quotedCount = quotes.filter((q) => q.status === 'QUOTED').length;

  // Accepted (won)
  const acceptedCount = quotes.filter((q) => q.status === 'ACCEPTED').length;

  // Active shipments (not delivered, not cancelled)
  const activeShipments = shipments.filter(
    (s) => s.status !== 'DELIVERED' && s.status !== 'CANCELLED'
  ).length;

  // Delivered (all time)
  const deliveredCount = shipments.filter((s) => s.status === 'DELIVERED').length;

  // Conversion rate (accepted / total quotes)
  const conversionRate =
    totalQuotes > 0 ? Math.round((acceptedCount / totalQuotes) * 100) : 0;

  // Assigned to staff
  const assignedToStaff = shipments.filter((s) => s.assignedToId).length;

  // Recent activity (sorted)
  const recentQuotes = [...quotes]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const recentShipments = [...shipments]
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    )
    .slice(0, 5);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  if (loading) {
    return (
      <div className="card text-center py-16">
        <p className="text-gray-400">Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-16">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={loadData} className="btn-outline text-sm">
          ↻ Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">
          {greeting}, <span className="text-brand-orange">{user?.name}</span>
        </h1>
        <p className="text-gray-400 text-sm">
          Here's what's happening at Mbuyu CFL today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon="📋"
          label="Total Quotes"
          value={totalQuotes}
          subtitle={`${pendingReview} pending review`}
          highlight={pendingReview > 0}
        />
        <StatCard
          icon="💰"
          label="Quoted"
          value={quotedCount}
          subtitle="Waiting for customer"
        />
        <StatCard
          icon="📦"
          label="Active Shipments"
          value={activeShipments}
          subtitle={`${assignedToStaff} assigned to staff`}
        />
        <StatCard
          icon="✅"
          label="Delivered"
          value={deliveredCount}
          subtitle="All time"
        />
      </div>

      {/* Two-column activity */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Quotes */}
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-brand-orange uppercase">
              📋 Recent Quotes
            </h2>
            {pendingReview > 0 && (
              <span className="text-xs text-brand-orange">
                {pendingReview} need attention
              </span>
            )}
          </div>

          {recentQuotes.length === 0 ? (
            <p className="text-gray-500 text-sm py-6 text-center">
              No quotes yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recentQuotes.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-brand-black-muted last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs text-brand-orange truncate">
                      {q.reference}
                    </p>
                    <p className="text-sm text-gray-300 truncate">
                      {q.fullName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {q.originCity} → {q.destinationCity}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${
                      QUOTE_STATUS_COLORS[q.status]
                    }`}
                  >
                    {q.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Shipments */}
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-brand-orange uppercase">
              🚚 Recent Shipments
            </h2>
            {activeShipments > 0 && (
              <span className="text-xs text-brand-orange">
                {activeShipments} active
              </span>
            )}
          </div>

          {recentShipments.length === 0 ? (
            <p className="text-gray-500 text-sm py-6 text-center">
              No shipments yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recentShipments.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-brand-black-muted last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs text-brand-orange truncate">
                      {s.trackingNumber}
                    </p>
                    <p className="text-sm text-gray-300 truncate">
                      {s.customerName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {s.originCity} → {s.destinationCity}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${
                      SHIPMENT_STATUS_COLORS[s.status] ||
                      SHIPMENT_STATUS_COLORS.PENDING
                    }`}
                  >
                    {s.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Quick stats */}
      <section className="card">
        <h2 className="text-sm font-semibold text-brand-orange uppercase mb-4">
          ⚡ Business Snapshot
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase">Total Quotes</p>
            <p className="text-2xl font-bold text-white mt-1">{totalQuotes}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase">
              Total Shipments
            </p>
            <p className="text-2xl font-bold text-white mt-1">
              {shipments.length}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase">Accepted</p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {acceptedCount}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase">
              Conversion Rate
            </p>
            <p className="text-2xl font-bold text-brand-orange mt-1">
              {conversionRate}%
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── StatCard component ─────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  subtitle,
  highlight,
}: {
  icon: string;
  label: string;
  value: number;
  subtitle?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`card ${
        highlight ? 'border-brand-orange/40 bg-brand-orange/5' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {highlight && (
          <span className="text-xs text-brand-orange font-semibold">!</span>
        )}
      </div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p
        className={`text-3xl font-bold mt-1 ${
          highlight ? 'text-brand-orange' : 'text-white'
        }`}
      >
        {value}
      </p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import type { Shipment, ShipmentEvent, ShipmentStatus } from '../../types';
import Navbar from '../../components/layout/Navbar';
import LoadingOverlay from '../../components/splash/LoadingOverlay';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

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

export default function StaffShipmentDetail({
  shipment: initialShipment,
  onBack,
}: {
  shipment: Shipment;
  onBack: () => void;
}) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isDriver = user?.staffRole === 'DRIVER';

  const [shipment, setShipment] = useState<Shipment>(initialShipment);
  const [events, setEvents] = useState<ShipmentEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newStatus, setNewStatus] = useState<ShipmentStatus>(
    initialShipment.status
  );
  const [newLocation, setNewLocation] = useState('');
  const [newNote, setNewNote] = useState('');
  const [eventError, setEventError] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const [detailRes, eventsRes] = await Promise.all([
        api.get(`/shipments/${shipment.id}`),
        api.get(`/shipments/${shipment.id}/events`),
      ]);
      setShipment(detailRes.data);
      setEvents(eventsRes.data);
      setNewStatus(detailRes.data.status);
    } catch (err) {
      console.error(err);
      setError('Failed to load shipment details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventError('');
    if (!newLocation.trim()) {
      setEventError('Location is required');
      return;
    }
    setShowLoadingOverlay(true);
    const minDuration = new Promise((resolve) => setTimeout(resolve, 1500));
    try {
      await Promise.all([
        api.post(`/shipments/${shipment.id}/events`, {
          status: newStatus,
          location: newLocation,
          note: newNote || null,
        }),
        minDuration,
      ]);
      setShowAddEvent(false);
      setNewLocation('');
      setNewNote('');
      await refresh();
    } catch (err: any) {
      console.error(err);
      setEventError(err?.response?.data?.error || 'Failed to add event');
    } finally {
      setShowLoadingOverlay(false);
    }
  };

  // Driver can start a journey on this shipment if it's PENDING or PICKED_UP
  const canStartJourney =
    isDriver &&
    (shipment.status === 'PENDING' || shipment.status === 'PICKED_UP');

  return (
    <>
      <LoadingOverlay visible={showLoadingOverlay} message="Updating…" />

      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <button
            onClick={onBack}
            className="text-sm text-gray-400 hover:text-brand-orange mb-6 transition"
          >
            ← Back to my shipments
          </button>

          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-2xl md:text-3xl font-bold font-mono">
                  {shipment.trackingNumber}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    STATUS_COLORS[shipment.status] || STATUS_COLORS.PENDING
                  }`}
                >
                  {shipment.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Assigned to you · Created{' '}
                {new Date(shipment.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="flex gap-2">
              {canStartJourney && (
                <button
                  onClick={() =>
                    navigate(`/driver/shipment/${shipment.id}/start`)
                  }
                  className="btn-primary text-sm px-5 py-2"
                >
                  🚚 Start Journey
                </button>
              )}
              <button
                onClick={refresh}
                className="btn-outline text-sm px-4 py-2"
                disabled={loading}
              >
                {loading ? '↻ Loading…' : '↻ Refresh'}
              </button>
            </div>
          </div>

          {error && (
            <div className="card text-center py-8 text-red-400 mb-6">{error}</div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <section className="card">
                <h3 className="text-sm font-semibold text-brand-orange uppercase mb-4">
                  Customer
                </h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <Info label="Full Name" value={shipment.customerName} />
                  <Info label="Email" value={shipment.customerEmail} />
                  <Info label="Phone" value={shipment.customerPhone} />
                  {shipment.reference && (
                    <Info label="Reference" value={shipment.reference} />
                  )}
                </div>
              </section>

              <section className="card">
                <h3 className="text-sm font-semibold text-brand-orange uppercase mb-4">
                  Cargo
                </h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <Info label="Type" value={shipment.cargoType} />
                  <Info label="Weight" value={`${shipment.weightKg} kg`} />
                  <Info
                    label="Volume"
                    value={
                      shipment.volumeCbm ? `${shipment.volumeCbm} CBM` : '—'
                    }
                  />
                  <Info label="Pieces" value={shipment.pieces} />
                  <Info
                    label="Description"
                    value={shipment.description}
                    className="sm:col-span-2"
                  />
                </div>
              </section>

              <section className="card">
                <h3 className="text-sm font-semibold text-brand-orange uppercase mb-4">
                  Route
                </h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <Info
                    label="Origin"
                    value={`${shipment.originCity}, ${shipment.originCountry}`}
                  />
                  <Info
                    label="Destination"
                    value={`${shipment.destinationCity}, ${shipment.destinationCountry}`}
                  />
                </div>
              </section>

              {!isDriver && (
                <button
                  onClick={() => setShowAddEvent(!showAddEvent)}
                  className="btn-primary w-full text-base py-4"
                >
                  {showAddEvent ? '− Cancel' : '+ Add Status Update'}
                </button>
              )}
            </div>

            <div className="space-y-6">
              {showAddEvent && !isDriver && (
                <section className="card">
                  <h3 className="text-sm font-semibold text-brand-orange uppercase mb-4">
                    New Update
                  </h3>

                  <form onSubmit={handleAddEvent} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        className="input-field text-sm"
                        value={newStatus}
                        onChange={(e) =>
                          setNewStatus(e.target.value as ShipmentStatus)
                        }
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PICKED_UP">PICKED UP</option>
                        <option value="IN_TRANSIT">IN TRANSIT</option>
                        <option value="AT_CUSTOMS">AT CUSTOMS</option>
                        <option value="CUSTOMS_HOLD">CUSTOMS HOLD</option>
                        <option value="CUSTOMS_CLEARED">CUSTOMS CLEARED</option>
                        <option value="OUT_FOR_DELIVERY">
                          OUT FOR DELIVERY
                        </option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="EXCEPTION">EXCEPTION</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Location
                      </label>
                      <input
                        className="input-field text-sm"
                        placeholder="e.g. Mombasa Port"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Note (optional)
                      </label>
                      <textarea
                        rows={3}
                        className="input-field text-sm resize-none"
                        placeholder="e.g. Cleared customs, proceeding to Kampala"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                      />
                    </div>

                    {eventError && (
                      <p className="text-red-400 text-xs">{eventError}</p>
                    )}

                    <button
                      type="submit"
                      className="btn-primary text-sm w-full"
                    >
                      Post Update
                    </button>
                  </form>
                </section>
              )}

              <section className="card">
                <h3 className="text-sm font-semibold text-brand-orange uppercase mb-4">
                  Timeline
                </h3>

                {events.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No updates yet.
                  </p>
                ) : (
                  <ol className="relative border-l-2 border-brand-black-muted ml-3">
                    {events.map((e, i) => (
                      <li key={e.id} className="mb-6 ml-5">
                        <span
                          className={`absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full ring-4 ring-brand-black-soft ${
                            i === 0 ? 'bg-brand-orange' : 'bg-brand-black-muted'
                          }`}
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4
                            className={`text-sm font-semibold ${
                              i === 0 ? 'text-brand-orange' : 'text-white'
                            }`}
                          >
                            {e.status.replace(/_/g, ' ')}
                          </h4>
                          <time className="text-xs text-gray-500">
                            {new Date(e.createdAt).toLocaleString()}
                          </time>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          📍 {e.location}
                        </p>
                        {e.note && (
                          <p className="text-xs text-gray-300 mt-1 italic">
                            "{e.note}"
                          </p>
                        )}
                        {e.createdBy && (
                          <p className="text-xs text-gray-500 mt-1">
                            by {e.createdBy.name}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

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
      <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-gray-200">{value}</p>
    </div>
  );
}
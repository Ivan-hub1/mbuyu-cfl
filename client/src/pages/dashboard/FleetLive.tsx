import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { journeysApi } from '../../lib/fleetApi';
import type { LiveJourney } from '../../lib/fleetApi';
import type { JourneyEvent } from '../../types/fleet';
import TransferModal from '../../components/transfers/TransferModal';

export default function FleetLive() {
  const [journeys, setJourneys] = useState<LiveJourney[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTimeline, setSelectedTimeline] = useState<JourneyEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshTimer = useRef<number | null>(null);

  // Transfer modal state
  const [transferFor, setTransferFor] = useState<LiveJourney | null>(null);

  const refresh = async () => {
    setError('');
    try {
      const data = await journeysApi.live();
      setJourneys(data);
      setLastUpdated(new Date());
      if (!selectedId && data.length > 0) setSelectedId(data[0].id);
      if (selectedId && !data.find((j) => j.id === selectedId)) {
        setSelectedId(data.length > 0 ? data[0].id : null);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load live journeys.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!autoRefresh) {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
        refreshTimer.current = null;
      }
      return;
    }
    refreshTimer.current = window.setInterval(refresh, 30_000);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedTimeline([]);
      return;
    }
    setLoadingTimeline(true);
    journeysApi
      .timeline(selectedId)
      .then((res) => setSelectedTimeline(res.events))
      .catch((e) => console.error(e))
      .finally(() => setLoadingTimeline(false));
  }, [selectedId]);

  const selected = journeys.find((j) => j.id === selectedId) || null;

  const stats = {
    active: journeys.length,
    paused: journeys.filter((j) => j.isPaused).length,
    incidentsToday: journeys.reduce(
      (sum, j) => sum + (j.stats?.incidents || 0),
      0
    ),
    totalKmToday: journeys.reduce(
      (sum, j) => sum + (j.stats?.totalKm || 0),
      0
    ),
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live Fleet
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {lastUpdated
              ? `Last updated ${lastUpdated.toLocaleTimeString()}`
              : 'Loading…'}
            {' · '}
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-3 h-3 accent-brand-orange"
              />
              <span>Auto-refresh (30s)</span>
            </label>
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="btn-outline text-sm px-4 py-2"
        >
          {loading ? '↻ Loading…' : '↻ Refresh Now'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon="🚚" label="Active Journeys" value={String(stats.active)} />
        <StatCard
          icon="⏸️"
          label="Paused"
          value={String(stats.paused)}
          accent={stats.paused > 0 ? 'yellow' : undefined}
        />
        <StatCard
          icon="⚠️"
          label="Incidents"
          value={String(stats.incidentsToday)}
          accent={stats.incidentsToday > 0 ? 'red' : undefined}
        />
        <StatCard
          icon="🛣️"
          label="Distance (km)"
          value={stats.totalKmToday.toFixed(1)}
        />
      </div>

      {error && (
        <div className="card text-center py-6 text-red-400 mb-6">{error}</div>
      )}

      {!loading && journeys.length === 0 && (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-400">No active journeys right now.</p>
        </div>
      )}

      {journeys.length > 0 && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card p-0 overflow-hidden" style={{ minHeight: 500 }}>
              <MapContainer
                center={[5, 20]}
                zoom={4}
                style={{ width: '100%', height: '520px', background: '#0a0a0a' }}
                scrollWheelZoom
              >
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution=""
                />
                {journeys.map((j) => {
                  if (!j.lastEvent) return null;
                  const isSelected = j.id === selectedId;
                  const color = j.isPaused
                    ? '#EAB308'
                    : isSelected
                    ? '#E85D04'
                    : '#3B82F6';
                  const size = isSelected ? 44 : 34;
                  const icon = divIcon({
                    className: 'no-default-icon',
                    html: `
                      <div style="position:relative;width:${size}px;height:${size}px;">
                        <span style="
                          position:absolute;top:50%;left:50%;
                          width:${size / 2}px;height:${size / 2}px;
                          border-radius:50%;
                          background:${color};
                          border:3px solid #fff;
                          transform:translate(-50%,-50%);
                          box-shadow:0 0 16px ${color};
                          z-index:3;
                        "></span>
                      </div>
                    `,
                    iconSize: [size, size],
                    iconAnchor: [size / 2, size / 2],
                  });
                  return (
                    <Marker
                      key={j.id}
                      position={[j.lastEvent.lat, j.lastEvent.lng]}
                      icon={icon}
                      eventHandlers={{ click: () => setSelectedId(j.id) }}
                    >
                      <Popup>
                        <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 180 }}>
                          <strong>{j.driver.name}</strong>
                          <br />
                          <span style={{ color: '#666' }}>
                            {j.vehicle.plate}
                          </span>
                          {j.shipment && (
                            <>
                              <br />
                              <span style={{ fontFamily: 'monospace', color: '#E85D04' }}>
                                {j.shipment.trackingNumber}
                              </span>
                            </>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {journeys.map((j) => (
              <button
                key={j.id}
                onClick={() => setSelectedId(j.id)}
                className={`card w-full text-left transition ${
                  j.id === selectedId
                    ? 'border-brand-orange bg-brand-orange/5'
                    : 'hover:border-brand-orange/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">
                      {j.driver.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {j.vehicle.plate} · {j.vehicle.type}
                    </p>
                  </div>
                  {j.isPaused ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/40">
                      PAUSED
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse mt-1.5" />
                  )}
                </div>
                {j.shipment && (
                  <p className="font-mono text-xs text-brand-orange truncate">
                    📦 {j.shipment.trackingNumber}
                  </p>
                )}
                {j.stats && (
                  <div className="flex gap-3 mt-3 pt-2 border-t border-brand-black-muted text-xs text-gray-500">
                    <span>{j.stats.totalKm} km</span>
                    <span>·</span>
                    <span>{j.stats.stops} stops</span>
                    {j.stats.incidents > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-red-400">
                          {j.stats.incidents} incidents
                        </span>
                      </>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="card mt-6">
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div>
              <h3 className="text-lg font-bold">
                {selected.driver.name}
                {selected.isPaused && (
                  <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/40">
                    PAUSED
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-400">
                {selected.vehicle.plate} — {selected.vehicle.type}
                {selected.driver.phone && ` · ${selected.driver.phone}`}
              </p>
            </div>

            {/* Transfer button */}
            {!selected.isPaused && selected.shipment && (
              <button
                onClick={() => setTransferFor(selected)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-lg transition text-sm"
              >
                🔄 Transfer Shipment
              </button>
            )}
          </div>

          {selected.stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <MiniStat label="Distance" value={`${selected.stats.totalKm} km`} />
              <MiniStat label="Duration" value={`${selected.stats.durationHours} h`} />
              <MiniStat label="Avg Speed" value={`${selected.stats.avgSpeedKmh} km/h`} />
              <MiniStat label="Checkpoints" value={String(selected.stats.checkpoints)} />
              <MiniStat
                label="Incidents"
                value={String(selected.stats.incidents)}
                accent={selected.stats.incidents > 0 ? 'red' : undefined}
              />
            </div>
          )}

          {selected.shipment && (
            <div className="p-4 rounded-lg bg-brand-black border border-brand-black-muted mb-4 text-sm">
              <p className="font-mono text-brand-orange">
                {selected.shipment.trackingNumber}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {selected.shipment.customerName} ·{' '}
                {selected.shipment.originCity} →{' '}
                {selected.shipment.destinationCity}
              </p>
            </div>
          )}

          <h4 className="text-sm font-semibold text-brand-orange uppercase mb-3">
            Recent Events
          </h4>
          {loadingTimeline ? (
            <p className="text-gray-500 text-sm">Loading timeline…</p>
          ) : selectedTimeline.length === 0 ? (
            <p className="text-gray-500 text-sm">No events yet.</p>
          ) : (
            <ol className="relative border-l-2 border-brand-black-muted ml-3 max-h-[300px] overflow-y-auto">
              {[...selectedTimeline]
                .reverse()
                .slice(0, 20)
                .map((e, i) => (
                  <li key={e.id} className="mb-4 ml-5">
                    <span
                      className={`absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full ring-4 ring-brand-black ${
                        i === 0 ? 'bg-brand-orange' : 'bg-brand-black-muted'
                      }`}
                    />
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p
                          className={`text-sm font-semibold ${
                            i === 0 ? 'text-brand-orange' : ''
                          }`}
                        >
                          {labelForEvent(e.type)}
                        </p>
                        {e.note && (
                          <p className="text-xs text-gray-400 mt-0.5">{e.note}</p>
                        )}
                      </div>
                      <time className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(e.createdAt).toLocaleTimeString()}
                      </time>
                    </div>
                  </li>
                ))}
            </ol>
          )}
        </div>
      )}

      {/* Transfer modal */}
      {transferFor && (
        <TransferModal
          journeyId={transferFor.id}
          trackingNumber={transferFor.shipment?.trackingNumber || '—'}
          oldDriverName={transferFor.driver.name}
          oldVehiclePlate={transferFor.vehicle.plate}
          onClose={() => setTransferFor(null)}
          onSuccess={() => {
            setTransferFor(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  accent?: 'red' | 'yellow';
}) {
  const color =
    accent === 'red'
      ? 'text-red-400'
      : accent === 'yellow'
      ? 'text-yellow-400'
      : 'text-white';
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'red';
}) {
  return (
    <div className="p-3 rounded-lg bg-brand-black border border-brand-black-muted">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p
        className={`text-base font-bold mt-0.5 ${
          accent === 'red' ? 'text-red-400' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function labelForEvent(type: string): string {
  switch (type) {
    case 'STARTED':
      return '🚚 Journey started';
    case 'CHECKPOINT':
      return '📍 Reached checkpoint';
    case 'STOP':
      return '⏸️ Stopped';
    case 'INCIDENT':
      return '⚠️ Incident reported';
    case 'UPDATE':
      return '📝 Update posted';
    case 'RESUMED':
      return '▶️ Resumed';
    case 'TRANSFERRED':
      return '🔄 Transferred to another driver';
    case 'ENDED':
      return '🏁 Ended';
    default:
      return type;
  }
}
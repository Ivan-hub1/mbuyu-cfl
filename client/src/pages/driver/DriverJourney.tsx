import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useReverseGeocode } from '../../hooks/useReverseGeocode';
import { checklistsApi, journeysApi } from '../../lib/fleetApi';
import type { JourneyStats } from '../../lib/fleetApi';
import api from '../../lib/api';
import type { Checklist, Journey } from '../../types/fleet';

const ADMIN_WHATSAPP = import.meta.env.VITE_ADMIN_WHATSAPP || '256755028392';

interface AssignedShipment {
  id: string;
  trackingNumber: string;
  customerName: string;
  destinationCity: string;
  status: string;
}

export default function DriverJourney() {
  const navigate = useNavigate();
  const { id: journeyIdFromUrl } = useParams<{ id: string }>();

  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);

  const loadJourney = () => {
    if (!journeyIdFromUrl) {
      setLoading(false);
      return;
    }
    journeysApi
      .get(journeyIdFromUrl)
      .then(setJourney)
      .catch(() => setJourney(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadJourney();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyIdFromUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-16 text-center text-gray-500">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        {journey ? (
          <LiveTracker journey={journey} setJourney={setJourney} />
        ) : (
          <StartJourney navigate={navigate} />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// START JOURNEY
// ═══════════════════════════════════════════════════════════

function StartJourney({ navigate }: { navigate: (to: string) => void }) {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [shipments, setShipments] = useState<AssignedShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [selectedChecklist, setSelectedChecklist] = useState('');
  const [selectedShipment, setSelectedShipment] = useState('');

  const { getCurrentPosition, loading: geoLoading, error: geoError, clearError } = useGeolocation();

  useEffect(() => {
    Promise.all([
      checklistsApi.mine(),
      api.get('/shipments/mine').then((r) => r.data),
    ])
      .then(([cls, shps]) => {
        setChecklists(cls);
        setShipments(
          shps.filter(
            (s: AssignedShipment) =>
              s.status !== 'DELIVERED' && s.status !== 'CANCELLED'
          )
        );
      })
      .catch(() => setError('Failed to load data.'))
      .finally(() => setLoading(false));
  }, []);

  const readyChecklists = checklists.filter(
    (c) => c.status === 'APPROVED' || c.status === 'CLEARED'
  );

  const start = async () => {
    if (!selectedChecklist) return setError('Please select a cleared checklist.');
    setError('');
    clearError();
    setStarting(true);
    try {
      const pos = await getCurrentPosition();
      const checklist = readyChecklists.find((c) => c.id === selectedChecklist);
      if (!checklist) throw new Error('Checklist not found');
      const result = await journeysApi.start({
        vehicleId: checklist.vehicleId,
        checklistId: checklist.id,
        shipmentId: selectedShipment || undefined,
        lat: pos.lat,
        lng: pos.lng,
      });
      navigate(`/driver/journey/${result.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to start journey.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Start Journey</h1>
        <p className="text-gray-400 mt-1">
          Select a cleared checklist and the shipment you're delivering.
        </p>
      </div>

      {loading ? (
        <div className="card text-gray-500">Loading…</div>
      ) : readyChecklists.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-semibold mb-2">No cleared checklists</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            You need an approved or cleared checklist before starting a journey.
          </p>
          <button onClick={() => navigate('/driver/checklist')} className="btn-primary">
            Complete Checklist
          </button>
        </div>
      ) : (
        <div className="card space-y-6">
          <div>
            <label className="input-label">Select Checklist</label>
            <select
              value={selectedChecklist}
              onChange={(e) => setSelectedChecklist(e.target.value)}
              className="input-field"
            >
              <option value="">— Choose a cleared checklist —</option>
              {readyChecklists.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.vehicle?.plate} — {c.vehicle?.type} —{' '}
                  {new Date(c.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">Link to Shipment (optional)</label>
            <select
              value={selectedShipment}
              onChange={(e) => setSelectedShipment(e.target.value)}
              className="input-field"
            >
              <option value="">— No shipment linked —</option>
              {shipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.trackingNumber} — {s.customerName} → {s.destinationCity}
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 rounded-lg bg-brand-orange/10 border border-brand-orange/30 text-sm">
            <div className="font-semibold text-brand-orange mb-1">
              📍 Location will be captured automatically
            </div>
            <div className="text-gray-400 text-xs">
              When you tap "Start Journey", the browser will request your real GPS location.
            </div>
          </div>

          {(error || geoError) && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error || geoError}
            </div>
          )}

          <button onClick={start} disabled={starting || geoLoading} className="btn-primary w-full">
            {geoLoading ? 'Getting your location…' : starting ? 'Starting journey…' : 'Start Journey'}
          </button>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// LIVE TRACKER
// ═══════════════════════════════════════════════════════════

function LiveTracker({
  journey,
  setJourney,
}: {
  journey: Journey;
  setJourney: (j: Journey) => void;
}) {
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [liveDistanceKm, setLiveDistanceKm] = useState<number | null>(null);

  const [stopEndsAt, setStopEndsAt] = useState<number | null>(null);
  const [stopRemaining, setStopRemaining] = useState<number>(0);

  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  const { getCurrentPosition, loading: geoLoading, error: geoError, clearError } = useGeolocation();
  const { reverse } = useReverseGeocode();

  const events = journey.events ?? [];
  const isPaused = journey.isPaused;

  // Stop countdown
  useEffect(() => {
    if (!stopEndsAt) return;
    const id = setInterval(() => {
      const remaining = Math.max(0, stopEndsAt - Date.now());
      setStopRemaining(remaining);
      if (remaining === 0) setStopEndsAt(null);
    }, 1000);
    return () => clearInterval(id);
  }, [stopEndsAt]);

  // Live GPS watcher — disabled while paused
  useEffect(() => {
    if (journey.status !== 'IN_TRANSIT') return;
    if (isPaused) return;
    if (events.length === 0) return;
    const lastEvt = events[events.length - 1];

    const compute = async () => {
      try {
        const pos = await getCurrentPosition();
        const R = 6371;
        const toRad = (x: number) => (x * Math.PI) / 180;
        const dLat = toRad(pos.lat - lastEvt.lat);
        const dLng = toRad(pos.lng - lastEvt.lng);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(lastEvt.lat)) *
            Math.cos(toRad(pos.lat)) *
            Math.sin(dLng / 2) ** 2;
        const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        setLiveDistanceKm(km);
      } catch {
        // silent
      }
    };
    compute();
    const interval = setInterval(compute, 60_000);
    return () => clearInterval(interval);
  }, [journey.status, isPaused, events.length, getCurrentPosition]);

  const isEnded = journey.status === 'COMPLETED' || journey.status === 'ABORTED';

  // ─── Post Checkpoint ─────────────────────────────────────
  const postCheckpoint = async () => {
    setError('');
    clearError();
    setPosting(true);
    try {
      const pos = await getCurrentPosition();
      const place = await reverse(pos.lat, pos.lng);
      await journeysApi.postEvent(journey.id, {
        type: 'CHECKPOINT',
        lat: pos.lat,
        lng: pos.lng,
        locationName: place,
      });
      const fresh = await journeysApi.get(journey.id);
      setJourney(fresh);
      setLiveDistanceKm(0);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to post checkpoint.');
    } finally {
      setPosting(false);
    }
  };

  // ─── Stopped ─────────────────────────────────────────────
  const postStop = async () => {
    setError('');
    clearError();
    setPosting(true);
    try {
      const pos = await getCurrentPosition();
      const place = await reverse(pos.lat, pos.lng);
      await journeysApi.postEvent(journey.id, {
        type: 'STOP',
        lat: pos.lat,
        lng: pos.lng,
        locationName: place,
      });
      const fresh = await journeysApi.get(journey.id);
      setJourney(fresh);
      setLiveDistanceKm(0);
      setStopEndsAt(Date.now() + 10 * 60 * 1000);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to record stop.');
    } finally {
      setPosting(false);
    }
  };

  // ─── Incident ────────────────────────────────────────────
  const submitIncident = async (payload: {
    reason: string;
    severity: string;
    description: string;
    locationName: string;
    lat: number;
    lng: number;
  }) => {
    setError('');
    clearError();
    setPosting(true);
    try {
      await journeysApi.postEvent(journey.id, {
        type: 'INCIDENT',
        lat: payload.lat,
        lng: payload.lng,
        locationName: payload.locationName,
        incidentReason: payload.reason,
        incidentSeverity: payload.severity,
        incidentDescription: payload.description,
      });
      const fresh = await journeysApi.get(journey.id);
      setJourney(fresh);
      setShowIncidentForm(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to report incident.');
    } finally {
      setPosting(false);
    }
  };

  // ─── Update (new) ────────────────────────────────────────
  const submitUpdate = async (text: string) => {
    setError('');
    clearError();
    setPosting(true);
    try {
      const pos = await getCurrentPosition();
      const place = await reverse(pos.lat, pos.lng);
      await journeysApi.postEvent(journey.id, {
        type: 'UPDATE',
        lat: pos.lat,
        lng: pos.lng,
        locationName: place,
        note: text,
      });
      const fresh = await journeysApi.get(journey.id);
      setJourney(fresh);
      setShowUpdateForm(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to post update.');
    } finally {
      setPosting(false);
    }
  };

  // ─── Resume (new) ────────────────────────────────────────
  const resumeJourney = async () => {
    setError('');
    clearError();
    setPosting(true);
    try {
      const pos = await getCurrentPosition();
      const place = await reverse(pos.lat, pos.lng);
      await journeysApi.postEvent(journey.id, {
        type: 'RESUMED',
        lat: pos.lat,
        lng: pos.lng,
        locationName: place,
      });
      const fresh = await journeysApi.get(journey.id);
      setJourney(fresh);
      setLiveDistanceKm(0);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to resume journey.');
    } finally {
      setPosting(false);
    }
  };

  // ─── End ─────────────────────────────────────────────────
  const confirmEnd = async () => {
    setError('');
    clearError();
    setPosting(true);
    try {
      const pos = await getCurrentPosition();
      const place = await reverse(pos.lat, pos.lng);
      await journeysApi.postEvent(journey.id, {
        type: 'ENDED',
        lat: pos.lat,
        lng: pos.lng,
        locationName: place,
      });
      const fresh = await journeysApi.get(journey.id);
      setJourney(fresh);
      setShowEndModal(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to end journey.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">
            {isEnded ? 'Journey Completed' : 'Live Journey'}
          </h1>
          <p className="text-gray-400 mt-1">
            {journey.vehicle?.plate} — {journey.vehicle?.type}
          </p>
          {journey.shipment && (
            <p className="text-xs text-brand-orange mt-1 font-mono">
              📦 Linked to {journey.shipment.trackingNumber}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isPaused && !isEnded && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-yellow-500/10 text-yellow-400 border-yellow-500/40">
              ⏸️ PAUSED
            </span>
          )}
          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
              isEnded
                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                : 'bg-brand-orange/10 text-brand-orange border-brand-orange/30'
            }`}
          >
            {journey.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Paused banner */}
      {isPaused && !isEnded && (
        <div className="mb-6 p-5 rounded-lg bg-yellow-500/10 border-2 border-yellow-500/40">
          <div className="flex items-start gap-3">
            <div className="text-3xl">⏸️</div>
            <div className="flex-1">
              <h3 className="font-bold text-yellow-400 mb-1">
                Journey Paused — Incident Reported
              </h3>
              <p className="text-sm text-gray-300 mb-2">
                Live GPS tracking is paused. Post updates about what's happening,
                then resume the journey when you're ready to continue.
              </p>
              <p className="text-xs text-gray-500">
                Only "Add Update" and "Resume Journey" are available while paused.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live GPS bar */}
      {!isEnded && !isPaused && (
        <div className="mb-6 p-3 rounded-lg bg-brand-black-soft border border-brand-black-muted flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-gray-400">Live GPS tracking active</span>
          </div>
          <div className="text-gray-500 font-mono">
            {liveDistanceKm !== null
              ? `${liveDistanceKm.toFixed(2)} km since last update`
              : 'Getting your location…'}
          </div>
        </div>
      )}

      {/* Stop countdown */}
      {stopEndsAt && !isEnded && !isPaused && (
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/40 mb-6">
          <div className="font-semibold text-yellow-400 mb-1">
            ⏸️ Stopped — auto-resume in {Math.ceil(stopRemaining / 1000)}s
          </div>
          <div className="text-xs text-gray-400">
            The journey will automatically continue after 10 minutes.
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!isEnded && (
        <div className="card mb-6">
          <h2 className="text-sm font-semibold text-brand-orange uppercase mb-4">
            Journey Actions
          </h2>

          {/* Paused state — only Update + Resume */}
          {isPaused ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowUpdateForm(true)}
                disabled={posting || geoLoading}
                className="flex flex-col items-center justify-center gap-2 p-5 rounded-lg bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold transition disabled:opacity-50 text-sm"
              >
                <span className="text-3xl">📝</span>
                <span>Add Update</span>
                <span className="text-xs opacity-80 font-normal">
                  Post what's happening
                </span>
              </button>

              <button
                onClick={resumeJourney}
                disabled={posting || geoLoading}
                className="flex flex-col items-center justify-center gap-2 p-5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition disabled:opacity-50 text-sm"
              >
                <span className="text-3xl">▶️</span>
                <span>Resume Journey</span>
                <span className="text-xs opacity-80 font-normal">
                  Continue tracking
                </span>
              </button>
            </div>
          ) : (
            /* Normal state — all four buttons */
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={postCheckpoint}
                disabled={posting || geoLoading}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold transition disabled:opacity-50 text-sm"
              >
                <span className="text-2xl">📍</span>
                <span>{geoLoading ? '…' : 'Checkpoint'}</span>
              </button>

              <button
                onClick={postStop}
                disabled={posting || geoLoading || !!stopEndsAt}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black font-semibold transition disabled:opacity-50 text-sm"
              >
                <span className="text-2xl">⏸️</span>
                <span>Stopped</span>
              </button>

              <button
                onClick={() => setShowIncidentForm(true)}
                disabled={posting || geoLoading}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-white font-semibold transition disabled:opacity-50 text-sm"
              >
                <span className="text-2xl">⚠️</span>
                <span>Incident</span>
              </button>

              <button
                onClick={() => setShowEndModal(true)}
                disabled={posting || geoLoading}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 font-semibold transition disabled:opacity-50 text-sm"
              >
                <span className="text-2xl">🏁</span>
                <span>End</span>
              </button>
            </div>
          )}

          {(error || geoError) && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error || geoError}
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-6">Journey Timeline</h2>
        {events.length === 0 ? (
          <p className="text-gray-500 text-sm">No events yet.</p>
        ) : (
          <ol className="relative border-l-2 border-brand-black-muted ml-3">
            {[...events].reverse().map((e, i) => (
              <li key={e.id} className="mb-6 ml-6">
                <span
                  className={`absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full ring-4 ring-brand-black-soft ${
                    i === 0 ? 'bg-brand-orange' : 'bg-brand-black-muted'
                  }`}
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4
                      className={`font-semibold text-sm ${
                        i === 0 ? 'text-brand-orange' : ''
                      }`}
                    >
                      {labelForEvent(e.type)}
                    </h4>
                    {e.note && (
                      <p className="text-sm text-gray-400 mt-1">{e.note}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      {e.lat.toFixed(5)}, {e.lng.toFixed(5)}
                      {e.locationName ? ` — ${e.locationName}` : ''}
                    </p>
                  </div>
                  <time className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleString()}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {showIncidentForm && (
        <IncidentModal
          onClose={() => setShowIncidentForm(false)}
          onSubmit={submitIncident}
          submitting={posting}
          adminWhatsApp={ADMIN_WHATSAPP}
        />
      )}

      {showUpdateForm && (
        <UpdateModal
          onClose={() => setShowUpdateForm(false)}
          onSubmit={submitUpdate}
          submitting={posting}
        />
      )}

      {showEndModal && (
        <EndJourneyModal
          journeyId={journey.id}
          onClose={() => setShowEndModal(false)}
          onConfirm={confirmEnd}
          confirming={posting}
        />
      )}
    </>
  );
}

function labelForEvent(type: string): string {
  switch (type) {
    case 'STARTED':
      return '🚚 Journey has started';
    case 'CHECKPOINT':
      return '📍 Reached checkpoint';
    case 'STOP':
      return '⏸️ Stopped for a break';
    case 'INCIDENT':
      return '⚠️ Incident reported';
    case 'UPDATE':
      return '📝 Update posted';
    case 'RESUMED':
      return '▶️ Journey resumed';
    case 'ENDED':
      return '🏁 Journey ended';
    default:
      return type;
  }
}

// ═══════════════════════════════════════════════════════════
// UPDATE MODAL — quick text-only update
// ═══════════════════════════════════════════════════════════

function UpdateModal({
  onClose,
  onSubmit,
  submitting,
}: {
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
  submitting: boolean;
}) {
  const [text, setText] = useState('');

  const trimmedLen = text.trim().length;
  const canSubmit = trimmedLen >= 5 && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit(text.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="card w-full max-w-lg my-8">
        <div className="flex items-center justify-between mb-6 border-b border-brand-black-muted pb-4">
          <div>
            <h3 className="text-xl font-bold text-brand-orange">
              📝 Post an Update
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Describe what's happening at this moment. Your location is captured
              automatically.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="input-label">Update *</label>
            <textarea
              className="input-field min-h-[120px]"
              placeholder="e.g. Police arrived at the scene, taking statements. Waiting for clearance."
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              autoFocus
            />
            <p
              className={`text-xs mt-1 ${
                trimmedLen >= 5 ? 'text-green-400' : 'text-gray-500'
              }`}
            >
              {trimmedLen >= 5
                ? `✓ ${trimmedLen} characters`
                : `${trimmedLen}/5 characters minimum`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-brand-black-muted">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline text-sm"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`font-semibold px-6 py-2.5 rounded-lg transition text-sm ${
                canSubmit
                  ? 'bg-brand-orange hover:bg-brand-orange-dark text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Posting…' : 'Post Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// INCIDENT MODAL
// ═══════════════════════════════════════════════════════════

type IncidentSubmitData = {
  reason: string;
  severity: string;
  description: string;
  locationName: string;
  lat: number;
  lng: number;
};

function IncidentModal({
  onClose,
  onSubmit,
  submitting,
  adminWhatsApp,
}: {
  onClose: () => void;
  onSubmit: (data: IncidentSubmitData) => Promise<void>;
  submitting: boolean;
  adminWhatsApp: string;
}) {
  const [reason, setReason] = useState('');
  const [severity, setSeverity] = useState('moderate');
  const [description, setDescription] = useState('');
  const [injuries, setInjuries] = useState<'no' | 'minor' | 'serious'>('no');
  const [vehicleDamage, setVehicleDamage] = useState<'none' | 'minor' | 'major'>('none');
  const [cargoCompromised, setCargoCompromised] = useState(false);
  const [policeNotified, setPoliceNotified] = useState(false);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [placeName, setPlaceName] = useState('');
  const [locating, setLocating] = useState(true);
  const [locationError, setLocationError] = useState('');

  const { getCurrentPosition } = useGeolocation();
  const { reverse } = useReverseGeocode();

  const [submitted, setSubmitted] = useState<IncidentSubmitData | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLocating(true);
        const pos = await getCurrentPosition();
        if (!mounted) return;
        setCoords({ lat: pos.lat, lng: pos.lng });
        const place = await reverse(pos.lat, pos.lng);
        if (!mounted) return;
        setPlaceName(place);
      } catch (err: any) {
        if (!mounted) return;
        setLocationError(err?.message || 'Unable to capture location.');
      } finally {
        if (mounted) setLocating(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retryLocation = async () => {
    setLocationError('');
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      setCoords({ lat: pos.lat, lng: pos.lng });
      const place = await reverse(pos.lat, pos.lng);
      setPlaceName(place);
    } catch (err: any) {
      setLocationError(err?.message || 'Unable to capture location.');
    } finally {
      setLocating(false);
    }
  };

  const descriptionLen = description.trim().length;
  const descriptionValid = descriptionLen >= 10;
  const reasonValid = reason.trim().length > 0;
  const locationReady = !!coords;

  const canSubmit = reasonValid && descriptionValid && locationReady && !submitting;

  const buildWhatsAppUrl = (data: IncidentSubmitData) => {
    const text = encodeURIComponent(
      `🚨 *INCIDENT REPORT*\n\n*Reason:* ${data.reason}\n*Severity:* ${data.severity}\n*Location:* ${data.locationName} (${data.lat.toFixed(5)}, ${data.lng.toFixed(5)})\n*Description:* ${data.description}\n*Injuries:* ${injuries}\n*Vehicle damage:* ${vehicleDamage}\n*Cargo compromised:* ${cargoCompromised}\n*Police notified:* ${policeNotified}`
    );
    return `https://wa.me/${adminWhatsApp}?text=${text}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !coords) return;

    const fullDescription = [
      description.trim(),
      `Injuries: ${injuries}`,
      `Vehicle damage: ${vehicleDamage}`,
      `Cargo compromised: ${cargoCompromised ? 'Yes' : 'No'}`,
      `Police notified: ${policeNotified ? 'Yes' : 'No'}`,
    ].join(' | ');

    const payload: IncidentSubmitData = {
      reason,
      severity,
      description: fullDescription,
      locationName: placeName,
      lat: coords.lat,
      lng: coords.lng,
    };

    try {
      await onSubmit(payload);
    } catch {
      return;
    }

    setSubmitted(payload);
  };

  if (submitted) {
    const whatsappUrl = buildWhatsAppUrl(submitted);

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="card w-full max-w-lg my-8 text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center text-4xl">
            🚨
          </div>
          <h3 className="text-2xl font-bold text-red-400 mb-2">
            Incident Reported
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            Your report has been saved to the journey timeline. The journey is
            now <strong className="text-yellow-400">paused</strong>. Contact the
            admin and post updates as things develop.
          </p>

          <div className="p-4 rounded-lg bg-brand-black border border-brand-black-muted text-left mb-6">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Report Summary
            </div>
            <div className="space-y-1.5 text-sm">
              <p>
                <span className="text-gray-500">Reason:</span>{' '}
                <span className="text-white">{submitted.reason}</span>
              </p>
              <p>
                <span className="text-gray-500">Severity:</span>{' '}
                <span className="text-white uppercase">{submitted.severity}</span>
              </p>
              <p>
                <span className="text-gray-500">Location:</span>{' '}
                <span className="text-white">{submitted.locationName}</span>
              </p>
              <p className="text-xs text-gray-500 font-mono">
                {submitted.lat.toFixed(5)}, {submitted.lng.toFixed(5)}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/40 mb-6">
            <div className="font-bold text-red-400 mb-2 text-sm">
              ⚠️ Contact the Admin Immediately
            </div>
            <p className="text-xs text-gray-300 mb-4">
              Tap below to open WhatsApp with your full report pre-filled.
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1EBE5A] text-white font-bold py-4 px-6 rounded-lg transition text-base"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Call Admin on WhatsApp
            </a>
          </div>

          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-300 transition"
          >
            Close — I'll post updates next
          </button>
        </div>
      </div>
    );
  }

  const reasons = [
    'Accident / Collision',
    'Robbery / Theft',
    'Armed attack',
    'Vehicle breakdown',
    'Road blockade / Protest',
    'Medical emergency',
    'Cargo damage',
    'Tyre burst',
    'Fire',
    'Flood / Weather',
    'Police stop / Checkpoint issue',
    'Other',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="card w-full max-w-2xl my-8">
        <div className="flex items-center justify-between mb-6 border-b border-brand-black-muted pb-4">
          <div>
            <h3 className="text-xl font-bold text-red-400">⚠️ Report Incident</h3>
            <p className="text-xs text-gray-500 mt-1">
              Complete this form. The journey will be paused so you can post
              updates.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div
          className={`mb-5 p-4 rounded-lg border ${
            locationReady
              ? 'bg-green-500/10 border-green-500/40'
              : locationError
              ? 'bg-red-500/10 border-red-500/40'
              : 'bg-brand-orange/10 border-brand-orange/40'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">
                  {locationReady ? '📍' : locationError ? '❌' : '⏳'}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    locationReady
                      ? 'text-green-400'
                      : locationError
                      ? 'text-red-400'
                      : 'text-brand-orange'
                  }`}
                >
                  {locationReady
                    ? 'Location captured automatically'
                    : locationError
                    ? 'Could not capture location'
                    : 'Capturing your location…'}
                </span>
              </div>
              {locationReady && (
                <>
                  <p className="text-sm text-gray-200 font-medium">
                    {placeName || 'Locating place name…'}
                  </p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    {coords!.lat.toFixed(5)}, {coords!.lng.toFixed(5)}
                  </p>
                </>
              )}
              {locationError && (
                <p className="text-xs text-red-400 mt-1">{locationError}</p>
              )}
              {locating && !locationReady && !locationError && (
                <p className="text-xs text-gray-400 mt-1">
                  Please grant location access if prompted.
                </p>
              )}
            </div>
            {locationError && (
              <button
                type="button"
                onClick={retryLocation}
                className="text-xs font-semibold text-red-400 hover:underline whitespace-nowrap"
              >
                ↻ Retry
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="input-label">Incident Type *</label>
            <select
              className="input-field"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              <option value="">— Select what happened —</option>
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">Severity *</label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'moderate', 'high'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={`py-2 rounded-lg border-2 text-sm font-semibold transition ${
                    severity === s
                      ? s === 'high'
                        ? 'border-red-500 bg-red-500 text-white'
                        : s === 'moderate'
                        ? 'border-yellow-500 bg-yellow-500 text-black'
                        : 'border-green-500 bg-green-500 text-white'
                      : 'border-brand-black-muted text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">What happened? *</label>
            <textarea
              className="input-field min-h-[120px]"
              placeholder="Describe exactly what happened, in your own words."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
            />
            <p
              className={`text-xs mt-1 ${
                descriptionValid
                  ? 'text-green-400'
                  : descriptionLen > 0
                  ? 'text-yellow-400'
                  : 'text-gray-500'
              }`}
            >
              {descriptionValid
                ? `✓ ${descriptionLen} characters — good`
                : `${descriptionLen}/10 characters minimum`}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="input-label">Injuries?</label>
              <select
                className="input-field"
                value={injuries}
                onChange={(e) => setInjuries(e.target.value as any)}
              >
                <option value="no">None</option>
                <option value="minor">Minor injuries</option>
                <option value="serious">Serious injuries</option>
              </select>
            </div>
            <div>
              <label className="input-label">Vehicle Damage?</label>
              <select
                className="input-field"
                value={vehicleDamage}
                onChange={(e) => setVehicleDamage(e.target.value as any)}
              >
                <option value="none">None</option>
                <option value="minor">Minor</option>
                <option value="major">Major</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={cargoCompromised}
                onChange={(e) => setCargoCompromised(e.target.checked)}
                className="w-4 h-4 accent-brand-orange"
              />
              Cargo compromised
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={policeNotified}
                onChange={(e) => setPoliceNotified(e.target.checked)}
                className="w-4 h-4 accent-brand-orange"
              />
              Police already notified
            </label>
          </div>

          <div className="pt-4 border-t border-brand-black-muted">
            {!canSubmit && (
              <div className="mb-3 text-xs text-gray-500 space-y-0.5">
                {!locationReady && !locationError && <p>⏳ Waiting for location…</p>}
                {locationError && (
                  <p className="text-red-400">❌ Location failed — click Retry</p>
                )}
                {!reasonValid && <p>• Select an incident type</p>}
                {!descriptionValid && (
                  <p>
                    • Describe what happened (at least 10 characters, currently{' '}
                    {descriptionLen})
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn-outline text-sm"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className={`font-semibold px-6 py-2.5 rounded-lg transition text-sm ${
                  canSubmit
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {submitting ? 'Reporting…' : 'Submit & Call Admin'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// END JOURNEY MODAL
// ═══════════════════════════════════════════════════════════

function EndJourneyModal({
  journeyId,
  onClose,
  onConfirm,
  confirming,
}: {
  journeyId: string;
  onClose: () => void;
  onConfirm: () => void;
  confirming: boolean;
}) {
  const [stats, setStats] = useState<JourneyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    journeysApi
      .stats(journeyId)
      .then(setStats)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [journeyId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="card w-full max-w-lg my-8">
        <div className="flex items-center justify-between mb-6 border-b border-brand-black-muted pb-4">
          <h3 className="text-xl font-bold">End Journey</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          Here's a summary of your journey. Review it, then confirm to end.
        </p>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading stats…</div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatTile icon="🛣️" label="Total Distance" value={`${stats.totalKm} km`} />
            <StatTile icon="⏱️" label="Duration" value={`${stats.durationHours} hrs`} />
            <StatTile icon="⚡" label="Avg Speed" value={`${stats.avgSpeedKmh} km/h`} />
            <StatTile icon="📍" label="Checkpoints" value={String(stats.checkpoints)} />
            <StatTile icon="⏸️" label="Stops" value={String(stats.stops)} />
            <StatTile
              icon="⚠️"
              label="Incidents"
              value={String(stats.incidents)}
              accent={stats.incidents > 0 ? 'red' : undefined}
            />
          </div>
        ) : (
          <div className="text-red-400 text-sm mb-6">Failed to load stats.</div>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t border-brand-black-muted">
          <button onClick={onClose} className="btn-outline text-sm" disabled={confirming}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirming}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm"
          >
            {confirming ? 'Ending…' : 'Confirm & End Journey'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  accent?: 'red';
}) {
  return (
    <div className="p-4 rounded-lg bg-brand-black border border-brand-black-muted">
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p
        className={`text-lg font-bold mt-1 ${
          accent === 'red' ? 'text-red-400' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { maintenanceApi } from '../../lib/fleetApi';
import type { MaintenanceTicket } from '../../types/fleet';
import CameraCapture from '../../components/camera/CameraCapture';

type Tab = 'queue' | 'mine' | 'resolved';

export default function Maintenance() {
  const [tab, setTab] = useState<Tab>('queue');
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailTicket, setDetailTicket] = useState<MaintenanceTicket | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [cameraMode, setCameraMode] = useState<'before' | 'after' | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'queue') {
        const data = await maintenanceApi.queue();
        setTickets(data);
      } else if (tab === 'mine') {
        const data = await maintenanceApi.mine();
        setTickets(data);
      } else {
        const data = await maintenanceApi.queue('RESOLVED');
        setTickets(data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load maintenance tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const openDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const full = await maintenanceApi.get(id);
      setDetailTicket(full);
    } catch (e) {
      console.error(e);
      alert('Failed to load ticket details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const startRepair = async (id: string) => {
    try {
      await maintenanceApi.start(id);
      alert('Repair started. You can now take the BEFORE photo.');
      if (detailTicket) {
        const fresh = await maintenanceApi.get(id);
        setDetailTicket(fresh);
      }
      refresh();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to start repair');
    }
  };

  const handlePhotoCapture = async (dataUrl: string) => {
    if (!detailTicket || !cameraMode) return;
    try {
      if (cameraMode === 'before') {
        await maintenanceApi.uploadBeforePhoto(detailTicket.id, dataUrl);
      } else {
        await maintenanceApi.uploadAfterPhoto(detailTicket.id, dataUrl);
      }
      const fresh = await maintenanceApi.get(detailTicket.id);
      setDetailTicket(fresh);
      setCameraMode(null);
      refresh();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to save photo');
    }
  };

  const resolve = async (id: string) => {
    const note = prompt('Describe what was fixed (required):');
    if (!note || note.trim().length < 3) {
      alert('Resolution note is required');
      return;
    }
    try {
      await maintenanceApi.resolve(id, note.trim());
      alert('✅ Ticket resolved. Driver has been notified.');
      setDetailTicket(null);
      refresh();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to resolve ticket');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Maintenance Queue</h2>
          <p className="text-gray-400 text-sm mt-1">
            Inspect, repair, photograph and resolve vehicle issues.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="btn-outline text-sm px-4 py-2"
        >
          {loading ? '↻ Loading…' : '↻ Refresh'}
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {(['queue', 'mine', 'resolved'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setDetailTicket(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
              tab === t
                ? 'bg-brand-orange text-white border-brand-orange'
                : 'bg-brand-black-soft text-gray-300 border-brand-black-muted hover:border-brand-orange/50'
            }`}
          >
            {t === 'queue'
              ? 'Open Queue'
              : t === 'mine'
              ? 'My Tickets'
              : 'Resolved'}
          </button>
        ))}
      </div>

      {error && (
        <div className="card text-center py-8 text-red-400 mb-6">{error}</div>
      )}

      {detailTicket ? (
        <TicketDetail
          ticket={detailTicket}
          onBack={() => setDetailTicket(null)}
          onStartRepair={() => startRepair(detailTicket.id)}
          onCameraBefore={() => setCameraMode('before')}
          onCameraAfter={() => setCameraMode('after')}
          onResolve={() => resolve(detailTicket.id)}
        />
      ) : (
        <>
          {!loading && tickets.length === 0 && (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">🔧</div>
              <p className="text-gray-400">
                {tab === 'queue'
                  ? 'No open tickets. Fleet is healthy.'
                  : tab === 'mine'
                  ? 'You have not started any repairs yet.'
                  : 'No resolved tickets yet.'}
              </p>
            </div>
          )}

          {tickets.length > 0 && (
            <div className="space-y-3">
              {tickets.map((t) => (
                <TicketCard
                  key={t.id}
                  ticket={t}
                  onClick={() => openDetail(t.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {loadingDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="card">Loading ticket…</div>
        </div>
      )}

      {cameraMode && (
        <CameraCapture
          title={
            cameraMode === 'before'
              ? '📸 BEFORE Repair Photo'
              : '📸 AFTER Repair Photo'
          }
          subtitle={
            cameraMode === 'before'
              ? 'Photograph the issue as you found it. This cannot be edited or uploaded.'
              : 'Photograph the fixed issue. This confirms the repair is done.'
          }
          onCapture={handlePhotoCapture}
          onCancel={() => setCameraMode(null)}
        />
      )}
    </div>
  );
}

function TicketCard({
  ticket,
  onClick,
}: {
  ticket: MaintenanceTicket;
  onClick: () => void;
}) {
  const statusColor =
    ticket.status === 'OPEN'
      ? 'bg-red-500/15 text-red-400 border-red-500/30'
      : ticket.status === 'IN_PROGRESS'
      ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
      : ticket.status === 'RESOLVED'
      ? 'bg-green-500/15 text-green-400 border-green-500/30'
      : 'bg-gray-500/15 text-gray-400 border-gray-500/30';

  const checklist = ticket.checklist;

  return (
    <button
      onClick={onClick}
      className="card w-full text-left hover:border-brand-orange transition"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColor}`}
            >
              {ticket.status.replace('_', ' ')}
            </span>
            {checklist?.vehicle && (
              <span className="font-mono text-xs text-brand-orange">
                🚚 {checklist.vehicle.plate}
              </span>
            )}
          </div>

          <p className="font-semibold text-sm mt-1">{ticket.issue}</p>

          {checklist?.driver && (
            <p className="text-xs text-gray-500 mt-1">
              Driver: {checklist.driver.name}
            </p>
          )}

          {ticket.resolutionNote && (
            <p className="text-xs text-gray-400 mt-1 italic">
              "{ticket.resolutionNote}"
            </p>
          )}
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">
            {new Date(ticket.createdAt).toLocaleDateString()}
          </p>
          <div className="flex gap-1 mt-2">
            {ticket.photoBefore && (
              <span className="text-xs text-green-400" title="Before photo taken">
                📸B
              </span>
            )}
            {ticket.photoAfter && (
              <span className="text-xs text-green-400" title="After photo taken">
                📸A
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function TicketDetail({
  ticket,
  onBack,
  onStartRepair,
  onCameraBefore,
  onCameraAfter,
  onResolve,
}: {
  ticket: MaintenanceTicket;
  onBack: () => void;
  onStartRepair: () => void;
  onCameraBefore: () => void;
  onCameraAfter: () => void;
  onResolve: () => void;
}) {
  const checklist = ticket.checklist;

  const hasBefore = !!ticket.photoBefore;
  const hasAfter = !!ticket.photoAfter;
  const isInProgress = ticket.status === 'IN_PROGRESS';
  const isResolved = ticket.status === 'RESOLVED';

  return (
    <div>
      <button
        onClick={onBack}
        className="text-sm text-gray-400 hover:text-brand-orange mb-6 transition"
      >
        ← Back to queue
      </button>

      <div className="card mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h3 className="text-xl font-bold">🔧 {ticket.issue}</h3>
            <p className="text-sm text-gray-400 mt-1">
              Status: <strong>{ticket.status.replace('_', ' ')}</strong>
              {ticket.startedAt && (
                <> · Started {new Date(ticket.startedAt).toLocaleString()}</>
              )}
            </p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Ticket ID: {ticket.id.slice(0, 12)}</p>
            <p>Opened: {new Date(ticket.createdAt).toLocaleString()}</p>
          </div>
        </div>

        {checklist && (
          <div className="grid sm:grid-cols-3 gap-4 p-4 rounded-lg bg-brand-black border border-brand-black-muted">
            <Info label="Vehicle" value={checklist.vehicle?.plate || '—'} />
            <Info label="Vehicle Type" value={checklist.vehicle?.type || '—'} />
            <Info label="Driver" value={checklist.driver?.name || '—'} />
          </div>
        )}

        {checklist?.issuesNotes && (
          <div className="mt-4 p-3 rounded-lg bg-brand-orange/10 border border-brand-orange/30 text-sm">
            <p className="text-xs font-semibold text-brand-orange uppercase mb-1">
              Driver's Notes
            </p>
            <p className="text-gray-200">{checklist.issuesNotes}</p>
          </div>
        )}
      </div>

      {ticket.status === 'OPEN' && (
        <div className="card mb-6">
          <h3 className="text-sm font-semibold text-brand-orange uppercase mb-2">
            Step 1 — Start Repair
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Tap to indicate you're beginning the repair. Only then can you
            capture the before photo.
          </p>
          <button onClick={onStartRepair} className="btn-primary">
            ▶️ Start Repair
          </button>
        </div>
      )}

      {isInProgress && (
        <div className="card mb-6">
          <h3 className="text-sm font-semibold text-brand-orange uppercase mb-2">
            Step 2 — Before Photo
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Take a live photo of the issue <strong>before you touch anything</strong>.
            The photo is captured directly from your camera — uploading is disabled.
          </p>

          {hasBefore ? (
            <div className="relative rounded-lg overflow-hidden border border-green-500/40">
              <img
                src={ticket.photoBefore!}
                alt="Before repair"
                className="w-full max-h-[400px] object-contain bg-black"
              />
              <div className="absolute top-2 left-2 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-semibold">
                ✓ BEFORE —{' '}
                {new Date(ticket.photoBeforeTakenAt!).toLocaleTimeString()}
              </div>
            </div>
          ) : (
            <button onClick={onCameraBefore} className="btn-primary">
              📸 Take Before Photo
            </button>
          )}
        </div>
      )}

      {isInProgress && hasBefore && (
        <div className="card mb-6">
          <h3 className="text-sm font-semibold text-brand-orange uppercase mb-2">
            Step 3 — After Photo
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Once the repair is complete, take a live photo showing the fixed
            part. This confirms the work is done.
          </p>

          {hasAfter ? (
            <div className="relative rounded-lg overflow-hidden border border-green-500/40">
              <img
                src={ticket.photoAfter!}
                alt="After repair"
                className="w-full max-h-[400px] object-contain bg-black"
              />
              <div className="absolute top-2 left-2 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-semibold">
                ✓ AFTER —{' '}
                {new Date(ticket.photoAfterTakenAt!).toLocaleTimeString()}
              </div>
            </div>
          ) : (
            <button onClick={onCameraAfter} className="btn-primary">
              📸 Take After Photo
            </button>
          )}
        </div>
      )}

      {isInProgress && hasBefore && hasAfter && (
        <div className="card mb-6 border-green-500/40">
          <h3 className="text-sm font-semibold text-green-400 uppercase mb-2">
            Step 4 — Resolve Ticket
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Describe what you fixed. The driver will be notified automatically.
          </p>
          <button
            onClick={onResolve}
            className="btn-primary bg-green-600 hover:bg-green-700"
          >
            ✅ Mark as Resolved
          </button>
        </div>
      )}

      {isResolved && (
        <div className="card border-green-500/40">
          <div className="text-center py-4">
            <div className="text-5xl mb-3">✅</div>
            <h3 className="text-lg font-bold text-green-400 mb-2">
              Ticket Resolved
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Resolved at{' '}
              {ticket.resolvedAt
                ? new Date(ticket.resolvedAt).toLocaleString()
                : '—'}
            </p>
            {ticket.resolutionNote && (
              <div className="max-w-md mx-auto p-3 rounded-lg bg-brand-black border border-brand-black-muted text-sm text-left">
                <p className="text-xs text-gray-500 uppercase mb-1">Resolution</p>
                <p className="text-gray-200">{ticket.resolutionNote}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            {ticket.photoBefore && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Before</p>
                <img
                  src={ticket.photoBefore}
                  alt="Before"
                  className="w-full rounded-lg border border-brand-black-muted"
                />
              </div>
            )}
            {ticket.photoAfter && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">After</p>
                <img
                  src={ticket.photoAfter}
                  alt="After"
                  className="w-full rounded-lg border border-brand-black-muted"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-sm text-gray-200">{value}</p>
    </div>
  );
}
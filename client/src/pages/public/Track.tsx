import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../lib/api';
import TrackingForm from '../../components/tracking/TrackingForm';
import SEO from '../../components/seo/SEO';

type ShipmentStatus =
  | 'PENDING'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'AT_CUSTOMS'
  | 'CUSTOMS_HOLD'
  | 'CUSTOMS_CLEARED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'EXCEPTION'
  | 'CANCELLED';

interface PublicEvent {
  id: string;
  status: ShipmentStatus;
  location: string;
  note?: string | null;
  createdAt: string;
}

interface PublicDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

interface PublicShipment {
  trackingNumber: string;
  status: ShipmentStatus;
  description: string;
  cargoType: string;
  weightKg: string;
  pieces: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  createdAt: string;
  updatedAt: string;
  events: PublicEvent[];
  documents: PublicDocument[];
}

const STATUS_COLORS: Record<string, string> = {
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

// ─── Icon helper ────────────────────────────────────────
function docIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
  return '📎';
}

// ─── Size formatter ─────────────────────────────────────
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function Track() {
  const { code } = useParams();
  const [shipment, setShipment] = useState<PublicShipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setError('');
    setSearched(true);

    api
      .get(`/shipments/track/${code.trim()}`)
      .then((res) => setShipment(res.data))
      .catch((err) => {
        if (err?.response?.status === 404) {
          setError('Tracking number not found. Please check and try again.');
        } else {
          setError('Failed to look up this shipment. Try again later.');
        }
        setShipment(null);
      })
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <>
      <SEO
        title="Track Your Cargo"
        description="Enter your Mbuyu CFL tracking number to see live status and full journey timeline."
      />

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="inline-block px-4 py-1.5 rounded-full border border-brand-orange/40 bg-brand-orange/10 text-brand-orange text-xs font-semibold mb-4">
            TRACK YOUR CARGO
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Where is my <span className="text-brand-orange">shipment?</span>
          </h1>
          <p className="text-gray-400">
            Enter your Mbuyu CFL tracking number below to see the latest status.
          </p>
        </div>

        <div className="card mb-8">
          <TrackingForm />
          <p className="text-xs text-gray-500 mt-4 text-center">
            Example: <span className="text-brand-orange">MBCFL-2026-00001</span>
          </p>
        </div>

        {loading && (
          <div className="card text-center py-12">
            <p className="text-gray-400">Searching for your shipment…</p>
          </div>
        )}

        {!loading && error && (
          <div className="card text-center py-12 border-red-500/40 bg-red-500/5">
            <p className="text-red-400 mb-4">❌ {error}</p>
            <p className="text-xs text-gray-500">
              Double-check the tracking number — it looks like MBCFL-2026-00001.
            </p>
          </div>
        )}

        {!loading && !error && !shipment && !searched && (
          <div className="card text-center py-12">
            <p className="text-gray-400">
              Enter a tracking number to see its journey.
            </p>
          </div>
        )}

        {!loading && shipment && (
          <div className="card">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-6 border-b border-brand-black-muted">
              <div>
                <p className="text-xs text-gray-500 mb-1">TRACKING NUMBER</p>
                <p className="font-mono text-brand-orange font-semibold text-lg">
                  {shipment.trackingNumber}
                </p>
              </div>
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  STATUS_COLORS[shipment.status] || STATUS_COLORS.PENDING
                }`}
              >
                {shipment.status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Details */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6 text-sm">
              <Info
                label="From"
                value={`${shipment.originCity}, ${shipment.originCountry}`}
              />
              <Info
                label="To"
                value={`${shipment.destinationCity}, ${shipment.destinationCountry}`}
              />
              <Info label="Cargo Type" value={shipment.cargoType} />
              <Info
                label="Weight"
                value={`${shipment.weightKg} kg · ${shipment.pieces} piece${
                  shipment.pieces === '1' ? '' : 's'
                }`}
              />
              <Info
                label="Description"
                value={shipment.description}
                className="sm:col-span-2"
              />
            </div>

            {/* Timeline */}
            <div className="pt-6 border-t border-brand-black-muted">
              <h3 className="text-sm font-semibold text-brand-orange uppercase mb-6">
                📍 Journey Timeline
              </h3>

              {shipment.events.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  No events recorded yet.
                </p>
              ) : (
                <ol className="relative border-l-2 border-brand-black-muted ml-3">
                  {shipment.events.map((e, i) => (
                    <li key={e.id} className="mb-6 ml-6 last:mb-0">
                      <span
                        className={`absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full ring-4 ring-brand-black-soft ${
                          i === 0
                            ? 'bg-brand-orange'
                            : 'bg-brand-black-muted'
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
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/* 📎 DOCUMENTS SECTION                        */}
            {/* ═══════════════════════════════════════════ */}
            {shipment.documents && shipment.documents.length > 0 && (
              <div className="pt-6 mt-6 border-t border-brand-black-muted">
                <h3 className="text-sm font-semibold text-brand-orange uppercase mb-4">
                  📎 Documents ({shipment.documents.length})
                </h3>
                <div className="space-y-2">
                  {shipment.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={doc.fileName}
                      className="flex items-center justify-between bg-brand-black rounded-lg px-4 py-3 hover:bg-brand-black/60 hover:border-brand-orange/40 border border-transparent transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-2xl flex-shrink-0">
                          {docIcon(doc.mimeType)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-200 truncate group-hover:text-brand-orange transition">
                            {doc.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatSize(doc.fileSize)} ·{' '}
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-brand-orange font-medium flex-shrink-0 ml-3">
                        Download ↓
                      </span>
                    </a>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  Click any document to download or view it.
                </p>
              </div>
            )}

            {/* Contact footer */}
            <div className="pt-6 mt-6 border-t border-brand-black-muted text-center">
              <p className="text-xs text-gray-500">
                Questions about this shipment?{' '}
                <a
                  href="mailto:info@mbuyucfl.com"
                  className="text-brand-orange hover:underline"
                >
                  Contact us
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Info helper ────────────────────────────────────────
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
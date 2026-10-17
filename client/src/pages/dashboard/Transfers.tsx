import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { transfersApi } from '../../lib/transfersApi';
import type { ShipmentTransferRecord } from '../../types/transfers';
import {
  TRANSFER_REASON_LABELS,
  CARGO_CONDITION_LABELS,
} from '../../types/transfers';

export default function Transfers() {
  const [transfers, setTransfers] = useState<ShipmentTransferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    transfersApi
      .list()
      .then(setTransfers)
      .catch((err) => {
        console.error(err);
        setError('Failed to load transfers.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Shipment Transfers</h2>
          <p className="text-gray-400 text-sm mt-1">
            History of every shipment handoff — {transfers.length} total
          </p>
        </div>
      </div>

      {error && (
        <div className="card text-center py-8 text-red-400 mb-6">{error}</div>
      )}

      {loading && (
        <div className="card text-center py-16 text-gray-500">Loading…</div>
      )}

      {!loading && transfers.length === 0 && (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🔄</div>
          <p className="text-gray-400">No transfers recorded yet.</p>
          <p className="text-sm text-gray-500 mt-2">
            When a shipment is handed off to another driver, it appears here.
          </p>
        </div>
      )}

      {!loading && transfers.length > 0 && (
        <div className="space-y-3">
          {transfers.map((t) => {
            const isExpanded = expanded === t.id;
            const photos = t.photoUrls ? JSON.parse(t.photoUrls) : [];
            return (
              <div key={t.id} className="card">
                <button
                  onClick={() => setExpanded(isExpanded ? null : t.id)}
                  className="w-full text-left"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-brand-orange text-sm">
                        {t.shipment?.trackingNumber || t.shipmentId}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {t.shipment?.customerName}
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="text-gray-500">
                        {new Date(t.createdAt).toLocaleString()}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          t.reason === 'ACCIDENT' || t.reason === 'SECURITY_INCIDENT'
                            ? 'bg-red-500/15 text-red-400'
                            : t.reason === 'BREAKDOWN'
                            ? 'bg-yellow-500/15 text-yellow-400'
                            : 'bg-gray-500/15 text-gray-400'
                        }`}
                      >
                        {TRANSFER_REASON_LABELS[t.reason]}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                    <span>👤 {t.oldDriver?.name || '—'}</span>
                    <span className="text-brand-orange">→</span>
                    <span>👤 {t.newDriver?.name || '—'}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-brand-black-muted">
                    <div className="text-xs text-gray-500">
                      📍 {t.locationName || `${t.lat.toFixed(4)}, ${t.lng.toFixed(4)}`}
                    </div>
                    <span className="text-brand-orange text-xs">
                      {isExpanded ? 'Hide details ↑' : 'View details ↓'}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-brand-black-muted space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3 text-xs">
                      <InfoRow
                        label="Old Vehicle"
                        value={t.oldJourney?.vehicle?.plate || '—'}
                      />
                      <InfoRow
                        label="New Vehicle"
                        value={t.newJourney?.vehicle?.plate || '—'}
                      />
                      <InfoRow
                        label="Cargo Condition"
                        value={CARGO_CONDITION_LABELS[t.cargoCondition]}
                        accent={
                          t.cargoCondition === 'INTACT'
                            ? 'green'
                            : t.cargoCondition === 'UNKNOWN'
                            ? 'gray'
                            : 'red'
                        }
                      />
                      <InfoRow
                        label="Initiated By"
                        value={t.initiatedBy?.name || '—'}
                      />
                    </div>

                    {t.reasonNote && (
                      <Block title="Reason Note">{t.reasonNote}</Block>
                    )}
                    {t.cargoNotes && (
                      <Block title="Cargo Notes">{t.cargoNotes}</Block>
                    )}
                    {t.damageNotes && (
                      <Block title="Damage Notes">{t.damageNotes}</Block>
                    )}
                    {t.missingItems && (
                      <Block title="Missing Items">{t.missingItems}</Block>
                    )}

                    {photos.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-2">
                          Photos ({photos.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {photos.map((url: string) => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={url}
                                alt="Cargo"
                                className="w-24 h-24 object-cover rounded border border-brand-black-muted hover:border-brand-orange transition"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Link
                        to={`/dashboard/fleet-live`}
                        className="text-xs text-brand-orange hover:underline"
                      >
                        View live fleet →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'red' | 'green' | 'gray';
}) {
  const color =
    accent === 'red'
      ? 'text-red-400'
      : accent === 'green'
      ? 'text-green-400'
      : accent === 'gray'
      ? 'text-gray-400'
      : 'text-gray-200';
  return (
    <div>
      <p className="text-gray-500 text-[10px] uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className={`${color}`}>{value}</p>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase mb-1">{title}</p>
      <div className="p-3 rounded bg-brand-black border border-brand-black-muted text-sm text-gray-300">
        {children}
      </div>
    </div>
  );
}
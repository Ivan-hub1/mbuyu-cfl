import { useEffect, useState } from 'react';
import { transfersApi } from '../../lib/transfersApi';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useReverseGeocode } from '../../hooks/useReverseGeocode';
import api from '../../lib/api';
import CameraCapture from '../camera/CameraCapture';
import type { TransferPayload, TransferReason, CargoCondition } from '../../types/transfers';
import { TRANSFER_REASON_LABELS, CARGO_CONDITION_LABELS } from '../../types/transfers';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  staffRole?: string | null;
}

interface Vehicle {
  id: string;
  plate: string;
  type: string;
  status: string;
}

interface Props {
  journeyId: string;
  trackingNumber: string;
  oldDriverName: string;
  oldVehiclePlate: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 1 | 2 | 3 | 4;

export default function TransferModal({
  journeyId,
  trackingNumber,
  oldDriverName,
  oldVehiclePlate,
  onClose,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [reason, setReason] = useState<TransferReason | ''>('');
  const [reasonNote, setReasonNote] = useState('');

  // Step 2
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');

  // Step 3
  const [cargoCondition, setCargoCondition] = useState<CargoCondition>('INTACT');
  const [cargoNotes, setCargoNotes] = useState('');
  const [missingItems, setMissingItems] = useState('');
  const [damageNotes, setDamageNotes] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  // Location (captured once on mount)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState('');
  const [, setCapturingLocation] = useState(true);
  const [locationError, setLocationError] = useState('');

  const { getCurrentPosition } = useGeolocation();
  const { reverse } = useReverseGeocode();

  // ─── Capture location on mount ────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const pos = await getCurrentPosition();
        if (!mounted) return;
        setCoords({ lat: pos.lat, lng: pos.lng });
        const place = await reverse(pos.lat, pos.lng);
        if (!mounted) return;
        setLocationName(place);
      } catch (err: any) {
        if (!mounted) return;
        setLocationError(
          err?.message || 'Unable to capture location. Please enable GPS.'
        );
      } finally {
        if (mounted) setCapturingLocation(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Load drivers + vehicles when entering step 2 ─────────
  useEffect(() => {
    if (step !== 2) return;
    setLoadingOptions(true);
    Promise.all([
      api.get('/admin/users').then((r) => r.data),
      api.get('/vehicles/available').then((r) => r.data),
    ])
      .then(([users, vhs]) => {
        const driverList: Driver[] = users.filter(
          (u: Driver) => u.role === 'STAFF' && u.staffRole === 'DRIVER'
        );
        setDrivers(driverList);
        setVehicles(vhs);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load drivers or vehicles.');
      })
      .finally(() => setLoadingOptions(false));
  }, [step]);

  // ─── Photo upload ─────────────────────────────────────────
  const handlePhotoUpload = async (dataUrl: string) => {
    setUploadingPhoto(true);
    setError('');
    try {
      const { data } = await api.post('/uploads/document', { dataUrl });
      setPhotoUrls((prev) => [...prev, data.url]);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      setCameraOpen(false);
    }
  };

  const removePhoto = (url: string) => {
    setPhotoUrls((prev) => prev.filter((u) => u !== url));
  };

  // ─── Submit ───────────────────────────────────────────────
  const submit = async () => {
    if (!coords) {
      setError('Location required. Please retry.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const payload: TransferPayload = {
        newDriverId: selectedDriver,
        newVehicleId: selectedVehicle,
        reason: reason as TransferReason,
        reasonNote: reasonNote.trim() || undefined,
        cargoCondition,
        cargoNotes: cargoNotes.trim() || undefined,
        missingItems: missingItems.trim() || undefined,
        damageNotes: damageNotes.trim() || undefined,
        photoUrls,
        lat: coords.lat,
        lng: coords.lng,
        locationName: locationName || undefined,
      };
      await transfersApi.initiate(journeyId, payload);
      onSuccess();
    } catch (err: any) {
      setError(
        err?.response?.data?.error || 'Failed to complete transfer.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Validation per step ──────────────────────────────────
  const canAdvance1 = reason !== '';
  const canAdvance2 = !!selectedDriver && !!selectedVehicle;
  const canAdvance3 =
    !!coords &&
    !uploadingPhoto &&
    (cargoCondition === 'INTACT' || cargoNotes.trim().length > 0);

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-8 bg-brand-black-soft border border-brand-black-muted rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-black-muted flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-brand-orange">
              🔄 Transfer Shipment
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Journey for <span className="font-mono text-white">{trackingNumber}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl leading-none p-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex-1 flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    step >= (n as Step)
                      ? 'bg-brand-orange text-white'
                      : 'bg-brand-black-muted text-gray-500'
                  }`}
                >
                  {step > (n as Step) ? '✓' : n}
                </div>
                {n < 4 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      step > (n as Step) ? 'bg-brand-orange' : 'bg-brand-black-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {step === 1 && 'Reason for transfer'}
            {step === 2 && 'Select new driver & vehicle'}
            {step === 3 && 'Cargo condition at handoff'}
            {step === 4 && 'Confirm transfer'}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* ─── STEP 1: Reason ─── */}
          {step === 1 && (
            <>
              <div>
                <label className="input-label">Reason for Transfer *</label>
                <div className="grid sm:grid-cols-2 gap-2 mt-2">
                  {(Object.keys(TRANSFER_REASON_LABELS) as TransferReason[]).map(
                    (r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setReason(r)}
                        className={`text-left px-4 py-3 rounded-lg border-2 transition text-sm ${
                          reason === r
                            ? 'border-brand-orange bg-brand-orange/10 text-white'
                            : 'border-brand-black-muted text-gray-300 hover:border-brand-orange/40'
                        }`}
                      >
                        {TRANSFER_REASON_LABELS[r]}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="input-label">Additional Notes</label>
                <textarea
                  rows={3}
                  className="input-field resize-none"
                  placeholder="e.g. Front tyre blew out near Mbarara, driver is unharmed"
                  value={reasonNote}
                  onChange={(e) => setReasonNote(e.target.value)}
                />
              </div>
            </>
          )}

          {/* ─── STEP 2: Driver + Vehicle ─── */}
          {step === 2 && (
            <>
              {loadingOptions ? (
                <p className="text-gray-500 text-sm text-center py-6">
                  Loading drivers and vehicles…
                </p>
              ) : (
                <>
                  <div>
                    <label className="input-label">Current Driver</label>
                    <div className="p-3 rounded-lg bg-brand-black border border-brand-black-muted text-sm">
                      <p className="text-gray-200">{oldDriverName}</p>
                      <p className="text-xs text-gray-500">
                        Vehicle: {oldVehiclePlate}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="input-label">New Driver *</label>
                    <select
                      className="input-field"
                      value={selectedDriver}
                      onChange={(e) => setSelectedDriver(e.target.value)}
                    >
                      <option value="">— Select a driver —</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} — {d.email}
                        </option>
                      ))}
                    </select>
                    {drivers.length === 0 && (
                      <p className="text-xs text-yellow-400 mt-1">
                        No other drivers available in the system.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="input-label">New Vehicle *</label>
                    <select
                      className="input-field"
                      value={selectedVehicle}
                      onChange={(e) => setSelectedVehicle(e.target.value)}
                    >
                      <option value="">— Select a vehicle —</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.plate} — {v.type} ({v.status})
                        </option>
                      ))}
                    </select>
                    {vehicles.length === 0 && (
                      <p className="text-xs text-yellow-400 mt-1">
                        No available vehicles. Add or release one first.
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/30 text-xs text-gray-300">
                    <p className="font-semibold text-blue-400 mb-1">
                      ℹ️ What happens next
                    </p>
                    <p>
                      The current journey ends. A new journey is created for the
                      new driver, linked to the same shipment. The new driver
                      will be emailed and must complete a fresh checklist before
                      starting.
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          {/* ─── STEP 3: Cargo condition ─── */}
          {step === 3 && (
            <>
              <div>
                <label className="input-label">Cargo Condition *</label>
                <div className="grid sm:grid-cols-2 gap-2 mt-2">
                  {(Object.keys(CARGO_CONDITION_LABELS) as CargoCondition[]).map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCargoCondition(c)}
                        className={`text-left px-4 py-3 rounded-lg border-2 transition text-sm ${
                          cargoCondition === c
                            ? c === 'INTACT'
                              ? 'border-green-500 bg-green-500/10 text-white'
                              : c === 'MAJOR_DAMAGE' || c === 'MISSING_ITEMS'
                              ? 'border-red-500 bg-red-500/10 text-white'
                              : 'border-yellow-500 bg-yellow-500/10 text-white'
                            : 'border-brand-black-muted text-gray-300 hover:border-brand-orange/40'
                        }`}
                      >
                        {CARGO_CONDITION_LABELS[c]}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Condition-specific fields */}
              {(cargoCondition === 'PARTIALLY_DAMAGED' ||
                cargoCondition === 'MAJOR_DAMAGE') && (
                <div>
                  <label className="input-label">Damage Description *</label>
                  <textarea
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Describe the damage to the cargo"
                    value={damageNotes}
                    onChange={(e) => setDamageNotes(e.target.value)}
                  />
                </div>
              )}

              {cargoCondition === 'MISSING_ITEMS' && (
                <div>
                  <label className="input-label">Missing Items *</label>
                  <textarea
                    rows={3}
                    className="input-field resize-none"
                    placeholder="e.g. 3 of 50 boxes missing"
                    value={missingItems}
                    onChange={(e) => setMissingItems(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="input-label">
                  General Notes {cargoCondition !== 'INTACT' && '*'}
                </label>
                <textarea
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Any other observations at the handoff point"
                  value={cargoNotes}
                  onChange={(e) => setCargoNotes(e.target.value)}
                />
              </div>

              {/* Photos */}
              <div>
                <label className="input-label">
                  Photos of the Cargo ({photoUrls.length})
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Take live photos of the cargo as found. Strongly recommended
                  when the condition is not intact.
                </p>

                {photoUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {photoUrls.map((url) => (
                      <div key={url} className="relative">
                        <img
                          src={url}
                          alt="Cargo"
                          className="w-20 h-20 object-cover rounded border border-brand-black-muted"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(url)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold leading-none"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setCameraOpen(true)}
                  disabled={uploadingPhoto}
                  className="btn-outline text-sm"
                >
                  {uploadingPhoto ? 'Uploading…' : '📸 Take Photo'}
                </button>
              </div>

              {/* Location status */}
              <div
                className={`p-3 rounded-lg border text-xs ${
                  coords
                    ? 'bg-green-500/10 border-green-500/40 text-green-400'
                    : locationError
                    ? 'bg-red-500/10 border-red-500/40 text-red-400'
                    : 'bg-brand-orange/10 border-brand-orange/40 text-brand-orange'
                }`}
              >
                {coords ? (
                  <>
                    <p className="font-semibold mb-0.5">📍 Handoff location captured</p>
                    <p className="text-gray-300">
                      {locationName || 'Resolving place name…'}
                    </p>
                    <p className="font-mono text-gray-500 mt-0.5">
                      {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </p>
                  </>
                ) : locationError ? (
                  <p>❌ {locationError}</p>
                ) : (
                  <p>⏳ Capturing location…</p>
                )}
              </div>
            </>
          )}

          {/* ─── STEP 4: Confirm ─── */}
          {step === 4 && (
            <>
              <div className="p-4 rounded-lg bg-brand-black border border-brand-black-muted text-sm space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Transfer Summary
                </p>
                <InfoRow label="Shipment" value={trackingNumber} mono />
                <InfoRow
                  label="Reason"
                  value={
                    reason
                      ? TRANSFER_REASON_LABELS[reason as TransferReason]
                      : '—'
                  }
                />
                {reasonNote && (
                  <InfoRow label="Note" value={reasonNote} />
                )}
                <div className="border-t border-brand-black-muted my-3" />
                <InfoRow label="Current Driver" value={oldDriverName} />
                <InfoRow label="Current Vehicle" value={oldVehiclePlate} mono />
                <div className="border-t border-brand-black-muted my-3" />
                <InfoRow
                  label="New Driver"
                  value={
                    drivers.find((d) => d.id === selectedDriver)?.name || '—'
                  }
                />
                <InfoRow
                  label="New Vehicle"
                  value={
                    vehicles.find((v) => v.id === selectedVehicle)?.plate || '—'
                  }
                  mono
                />
                <div className="border-t border-brand-black-muted my-3" />
                <InfoRow
                  label="Cargo Condition"
                  value={CARGO_CONDITION_LABELS[cargoCondition]}
                />
                {photoUrls.length > 0 && (
                  <InfoRow label="Photos" value={`${photoUrls.length}`} />
                )}
                <InfoRow
                  label="Handoff Location"
                  value={
                    locationName
                      ? `${locationName} (${coords?.lat.toFixed(4)}, ${coords?.lng.toFixed(4)})`
                      : coords
                      ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                      : '—'
                  }
                />
              </div>

              <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/30 text-sm text-red-300">
                <p className="font-semibold text-red-400 mb-1">
                  ⚠️ Confirm the transfer
                </p>
                <p>
                  This will end the current journey and create a new one.
                  The customer will see a real-time update on their tracking
                  page. This cannot be undone.
                </p>
              </div>
            </>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-brand-black-muted flex flex-wrap gap-3 justify-between">
          <button
            type="button"
            onClick={() => (step === 1 ? onClose() : setStep((step - 1) as Step))}
            className="btn-ghost text-sm"
            disabled={submitting}
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((step + 1) as Step)}
              className="btn-primary text-sm"
              disabled={
                (step === 1 && !canAdvance1) ||
                (step === 2 && !canAdvance2) ||
                (step === 3 && !canAdvance3)
              }
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm"
            >
              {submitting ? 'Transferring…' : '🔄 Confirm Transfer'}
            </button>
          )}
        </div>
      </div>

      {/* Camera modal */}
      {cameraOpen && (
        <CameraCapture
          title="📸 Cargo Condition Photo"
          subtitle="Photograph the cargo as it is right now, before transferring."
          onCapture={handlePhotoUpload}
          onCancel={() => setCameraOpen(false)}
        />
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-3 text-xs">
      <span className="text-gray-500 uppercase tracking-wide">{label}</span>
      <span
        className={`text-right ${mono ? 'font-mono text-brand-orange' : 'text-gray-200'}`}
      >
        {value}
      </span>
    </div>
  );
}
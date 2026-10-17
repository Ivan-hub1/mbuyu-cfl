import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { ChecklistFormBody } from './ChecklistForm';
import { useGeolocation } from '../../hooks/useGeolocation';
import { vehiclesApi, journeysApi } from '../../lib/fleetApi';
import api from '../../lib/api';
import type { Vehicle, Checklist } from '../../types/fleet';
import type { Shipment } from '../../types';

type Step = 'checklist' | 'confirm' | 'starting';

export default function ShipmentJourneyFlow() {
  const navigate = useNavigate();
  const { id: shipmentId } = useParams<{ id: string }>();

  const [step, setStep] = useState<Step>('checklist');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loadingShipment, setLoadingShipment] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Checklist result
  const [checklist, setChecklist] = useState<Checklist | null>(null);

  // Confirm step state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [startError, setStartError] = useState('');

  const {
    getCurrentPosition,
    loading: geoLoading,
    error: geoError,
    clearError,
  } = useGeolocation();

  // Load shipment + vehicles
  useEffect(() => {
    if (!shipmentId) return;
    Promise.all([
      api.get(`/shipments/${shipmentId}`).then((r) => r.data),
      vehiclesApi.available(),
    ])
      .then(([shp, vhs]) => {
        setShipment(shp);
        setVehicles(vhs);
        // Pre-select the vehicle if it was captured in the checklist step
        // (won't be here yet — user picks below)
      })
      .catch(() => setLoadError('Failed to load shipment details.'))
      .finally(() => setLoadingShipment(false));
  }, [shipmentId]);

  if (!shipmentId) {
    return (
      <div className="min-h-screen bg-brand-black">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-16 text-center text-red-400">
          Missing shipment id.
        </div>
      </div>
    );
  }

  if (loadingShipment) {
    return (
      <div className="min-h-screen bg-brand-black">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-16 text-center text-gray-500">
          Loading shipment…
        </div>
      </div>
    );
  }

  if (loadError || !shipment) {
    return (
      <div className="min-h-screen bg-brand-black">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-16 text-center text-red-400">
          {loadError || 'Shipment not found.'}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 1 — Checklist
  // ═══════════════════════════════════════════════════════════

  if (step === 'checklist') {
    return (
      <div className="min-h-screen bg-brand-black">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-10">
          {/* Progress */}
          <div className="flex items-center gap-3 mb-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand-orange text-white flex items-center justify-center font-bold">
                1
              </div>
              <span className="text-brand-orange font-semibold">
                Vehicle Checklist
              </span>
            </div>
            <div className="flex-1 h-px bg-brand-black-muted" />
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-6 h-6 rounded-full bg-brand-black-muted flex items-center justify-center font-bold">
                2
              </div>
              <span>Confirm & Start</span>
            </div>
          </div>

          <div className="card mb-6 bg-brand-orange/5 border-brand-orange/30">
            <div className="text-sm">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                Starting journey for
              </div>
              <div className="font-mono text-brand-orange font-semibold">
                {shipment.trackingNumber}
              </div>
              <div className="text-gray-300 mt-1">
                {shipment.originCity} → {shipment.destinationCity}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold">Pre-Trip Vehicle Checklist</h1>
            <p className="text-gray-400 text-sm mt-1">
              Complete the vehicle inspection before starting your journey.
            </p>
          </div>

          <ChecklistFormBody
            onSuccess={(result) => {
              if (result.status === 'FLAGGED') {
                // Stay on checklist step — driver must wait for maintenance
                // The form shows the flagged state internally via its own
                // onSuccess flow? Actually no — we intercept here.
                // We'll just show a message and lock the flow.
                setChecklist(result);
                return;
              }
              setChecklist(result);
              setStep('confirm');
            }}
            onCancel={() => navigate('/driver/shipments')}
            submitLabel="Submit & Continue"
          />

          {/* If checklist came back FLAGGED, show blocking message */}
          {checklist?.status === 'FLAGGED' && (
            <div className="mt-6 p-5 rounded-lg bg-brand-orange/10 border border-brand-orange/40">
              <div className="text-xl mb-2">⚠️</div>
              <h3 className="font-semibold text-brand-orange mb-2">
                Checklist flagged — journey blocked
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                Your vehicle has issues that need attention. The maintenance
                team has been notified. Once repairs are done and the checklist
                is cleared, you can start your journey.
              </p>
              <button
                onClick={() => navigate('/driver/shipments')}
                className="btn-outline text-sm"
              >
                Back to My Shipments
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 2 — Confirm & Start
  // ═══════════════════════════════════════════════════════════

  // Pre-select the vehicle from the checklist if available
  const presetVehicleId = checklist?.vehicleId || '';
  const effectiveVehicleId = vehicleId || presetVehicleId;

  const start = async () => {
    if (!checklist) {
      setStartError('Checklist missing.');
      return;
    }
    if (!effectiveVehicleId) {
      setStartError('Please select a vehicle.');
      return;
    }
    setStartError('');
    clearError();
    setStep('starting');

    try {
      const pos = await getCurrentPosition();

      const result = await journeysApi.start({
        vehicleId: effectiveVehicleId,
        checklistId: checklist.id,
        shipmentId: shipmentId,
        lat: pos.lat,
        lng: pos.lng,
      });

      navigate(`/driver/journey/${result.id}`);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error || err?.message || 'Failed to start journey.';
      setStartError(msg);
      setStep('confirm');
    }
  };

  return (
    <div className="min-h-screen bg-brand-black">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-6 text-xs">
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold">
              ✓
            </div>
            <span>Vehicle Checklist</span>
          </div>
          <div className="flex-1 h-px bg-brand-orange" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-orange text-white flex items-center justify-center font-bold">
              2
            </div>
            <span className="text-brand-orange font-semibold">
              Confirm & Start
            </span>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Ready to Start Journey</h1>
          <p className="text-gray-400 mt-1">
            Confirm the details below. When you click Start, your GPS location
            will be captured and the customer's tracking timeline will update.
          </p>
        </div>

        {/* Shipment summary */}
        <div className="card mb-6">
          <h3 className="text-sm font-semibold text-brand-orange uppercase mb-4">
            Shipment
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <Info label="Tracking Number" value={shipment.trackingNumber} />
            <Info label="Customer" value={shipment.customerName} />
            <Info
              label="Origin"
              value={`${shipment.originCity}, ${shipment.originCountry}`}
            />
            <Info
              label="Destination"
              value={`${shipment.destinationCity}, ${shipment.destinationCountry}`}
            />
            <Info label="Cargo Type" value={shipment.cargoType} />
            <Info label="Weight" value={`${shipment.weightKg} kg`} />
          </div>
        </div>

        {/* Vehicle selection */}
        <div className="card mb-6">
          <h3 className="text-sm font-semibold text-brand-orange uppercase mb-4">
            Vehicle
          </h3>
          {presetVehicleId ? (
            <p className="text-sm text-gray-300">
              {checklist?.vehicle?.plate || 'Vehicle selected in checklist'} —{' '}
              {checklist?.vehicle?.type || ''}
            </p>
          ) : (
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="input-field"
              required
            >
              <option value="">— Select a vehicle —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} — {v.type}
                  {v.capacity ? ` (${v.capacity})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Location notice */}
        <div className="card mb-6 bg-brand-orange/5 border-brand-orange/30">
          <div className="font-semibold text-brand-orange mb-1 text-sm">
            📍 GPS Location
          </div>
          <p className="text-xs text-gray-400">
            When you click Start Journey, your browser will request your real
            location. This becomes the "Cargo Picked Up" event on the customer's
            tracking page.
          </p>
        </div>

        {(startError || geoError) && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-6">
            {startError || geoError}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={start}
            disabled={geoLoading || step === 'starting'}
            className="btn-primary flex-1 md:flex-initial"
          >
            {step === 'starting' || geoLoading
              ? 'Getting location & starting…'
              : 'Start Journey'}
          </button>
          <button
            onClick={() => navigate('/driver/shipments')}
            className="btn-ghost"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-gray-200">{value}</p>
    </div>
  );
}
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Location {
  city: string;
  country: string;
  lat: number;
  lng: number;
  isHub?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const LOCATIONS: Location[] = [
  { city: 'Guangzhou', country: 'China', lat: 23.1291, lng: 113.2644, size: 'md' },
  { city: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708, size: 'md' },
  { city: 'Mombasa', country: 'Kenya', lat: -4.0435, lng: 39.6682, size: 'md' },
  { city: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219, size: 'md' },
  { city: 'Zanzibar', country: 'Tanzania', lat: -6.1659, lng: 39.2026, size: 'sm' },
  { city: 'Dar es Salaam', country: 'Tanzania', lat: -6.7924, lng: 39.2083, size: 'md' },
  { city: 'Juba', country: 'South Sudan', lat: 4.8594, lng: 31.5713, size: 'sm' },
  { city: 'Kampala', country: 'Uganda', lat: 0.3476, lng: 32.5825, isHub: true, size: 'lg' },
  { city: 'Goma', country: 'DR Congo', lat: -1.6771, lng: 29.2287, size: 'sm' },
  { city: 'Kigali', country: 'Rwanda', lat: -1.9441, lng: 30.0619, size: 'sm' },
  { city: 'Bujumbura', country: 'Burundi', lat: -3.3614, lng: 29.3599, size: 'sm' },
  { city: 'Tripoli', country: 'Libya', lat: 32.8872, lng: 13.1913, size: 'sm' },
  { city: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357, size: 'md' },
  { city: 'Casablanca', country: 'Morocco', lat: 33.5731, lng: -7.5898, size: 'md' },
  { city: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792, size: 'md' },
  { city: 'Freetown', country: 'Sierra Leone', lat: 8.4657, lng: -13.2317, size: 'sm' },
  { city: 'Nouakchott', country: 'Mauritania', lat: 18.0735, lng: -15.9582, size: 'sm' },
  { city: 'Maputo', country: 'Mozambique', lat: -25.9692, lng: 32.5732, size: 'sm' },
  { city: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473, size: 'md' },
];

// ─── Curved path ───────────────────────────────────────────
function curvedPath(
  from: [number, number],
  to: [number, number],
  segments = 60,
  curvature = 0.12
): [number, number][] {
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const perpLat = -dLng;
  const perpLng = dLat;

  const pts: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const lat = lat1 + dLat * t;
    const lng = lng1 + dLng * t;
    const bump = Math.sin(t * Math.PI) * curvature;
    pts.push([lat + perpLat * bump, lng + perpLng * bump]);
  }
  return pts;
}

// ─── Routes ────────────────────────────────────────────────
const ROUTES: [[number, number], [number, number]][] = [
  [[23.1291, 113.2644], [25.2048, 55.2708]],
  [[25.2048, 55.2708], [-4.0435, 39.6682]],
  [[-4.0435, 39.6682], [-1.2921, 36.8219]],
  [[-1.2921, 36.8219], [0.3476, 32.5825]],
  [[0.3476, 32.5825], [-6.1659, 39.2026]],
  [[-6.1659, 39.2026], [-1.2921, 36.8219]],
  [[-6.7924, 39.2083], [-1.2921, 36.8219]],
  [[0.3476, 32.5825], [4.8594, 31.5713]],
  [[0.3476, 32.5825], [-1.6771, 29.2287]],
  [[0.3476, 32.5825], [-1.9441, 30.0619]],
  [[0.3476, 32.5825], [-3.3614, 29.3599]],
  [[0.3476, 32.5825], [32.8872, 13.1913]],
  [[0.3476, 32.5825], [30.0444, 31.2357]],
  [[0.3476, 32.5825], [6.5244, 3.3792]],
  [[0.3476, 32.5825], [8.4657, -13.2317]],
  [[0.3476, 32.5825], [33.5731, -7.5898]],
  [[0.3476, 32.5825], [18.0735, -15.9582]],
  [[0.3476, 32.5825], [-25.9692, 32.5732]],
  [[0.3476, 32.5825], [-26.2041, 28.0473]],
];

// ═══════════════════════════════════════════════════════════
// MARKER ICONS — High-visibility pulsing
// ═══════════════════════════════════════════════════════════

const hubIcon = divIcon({
  className: 'no-default-icon',
  html: `
    <div style="position:relative;width:60px;height:60px;">
      <span style="
        position:absolute;top:50%;left:50%;
        width:20px;height:20px;border-radius:50%;
        border:3px solid rgba(239,68,68,1);
        transform:translate(-50%,-50%);
        animation:hubPulse 1.2s ease-out infinite;
        box-shadow:0 0 14px rgba(239,68,68,0.8);
      "></span>
      <span style="
        position:absolute;top:50%;left:50%;
        width:20px;height:20px;border-radius:50%;
        border:3px solid rgba(239,68,68,1);
        transform:translate(-50%,-50%);
        animation:hubPulse 1.2s ease-out infinite;
        animation-delay:0.4s;
        box-shadow:0 0 14px rgba(239,68,68,0.8);
      "></span>
      <span style="
        position:absolute;top:50%;left:50%;
        width:20px;height:20px;border-radius:50%;
        border:3px solid rgba(239,68,68,1);
        transform:translate(-50%,-50%);
        animation:hubPulse 1.2s ease-out infinite;
        animation-delay:0.8s;
        box-shadow:0 0 14px rgba(239,68,68,0.8);
      "></span>
      <span style="
        position:absolute;top:50%;left:50%;
        width:16px;height:16px;border-radius:50%;
        background:#EF4444;
        border:3px solid #ffffff;
        transform:translate(-50%,-50%);
        box-shadow:0 0 14px rgba(239,68,68,1), 0 0 30px rgba(239,68,68,0.7);
        z-index:3;
        animation:corePulse 1.2s ease-in-out infinite;
      "></span>
    </div>
  `,
  iconSize: [60, 60],
  iconAnchor: [30, 30],
});

const cityIconMd = divIcon({
  className: 'no-default-icon',
  html: `
    <div style="position:relative;width:36px;height:36px;">
      <span style="
        position:absolute;top:50%;left:50%;
        width:14px;height:14px;border-radius:50%;
        border:2.5px solid rgba(232,93,4,1);
        transform:translate(-50%,-50%);
        animation:cityPulse 1.4s ease-out infinite;
        box-shadow:0 0 10px rgba(232,93,4,0.8);
      "></span>
      <span style="
        position:absolute;top:50%;left:50%;
        width:14px;height:14px;border-radius:50%;
        border:2.5px solid rgba(232,93,4,1);
        transform:translate(-50%,-50%);
        animation:cityPulse 1.4s ease-out infinite;
        animation-delay:0.5s;
        box-shadow:0 0 10px rgba(232,93,4,0.8);
      "></span>
      <span style="
        position:absolute;top:50%;left:50%;
        width:11px;height:11px;border-radius:50%;
        background:#E85D04;
        border:2.5px solid #ffffff;
        transform:translate(-50%,-50%);
        box-shadow:0 0 10px rgba(232,93,4,1);
        z-index:3;
      "></span>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const cityIconSm = divIcon({
  className: 'no-default-icon',
  html: `
    <div style="position:relative;width:24px;height:24px;">
      <span style="
        position:absolute;top:50%;left:50%;
        width:10px;height:10px;border-radius:50%;
        border:2px solid rgba(245,158,11,1);
        transform:translate(-50%,-50%);
        animation:cityPulse 1.5s ease-out infinite;
      "></span>
      <span style="
        position:absolute;top:50%;left:50%;
        width:8px;height:8px;border-radius:50%;
        background:#F59E0B;
        border:2px solid #ffffff;
        transform:translate(-50%,-50%);
        box-shadow:0 0 7px rgba(245,158,11,1);
        z-index:3;
      "></span>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// ─── Main Component ────────────────────────────────────────
export default function ServicesMap() {
  const routePaths = ROUTES.map(([a, b]) => curvedPath(a, b, 60, 0.12));

  return (
    <div className="absolute inset-0 z-0 opacity-80" style={{ minHeight: 400 }}>
      <MapContainer
        center={[5, 20]}
        zoom={3}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%', background: '#0a0a0a' }}
      >
        {/* ─── Satellite imagery ──────────────────────────── */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution=""
          maxZoom={19}
        />

        {/* ─── Country borders overlay (subtle) ───────────── */}
        <TileLayer
          url="https://stamen-tiles.a.ssl.fastly.net/toner-lines/{z}/{x}/{y}.png"
          attribution=""
          opacity={0.35}
        />

        {/* Route lines */}
        {routePaths.map((p, i) => (
          <Polyline
            key={`route-${i}`}
            positions={p}
            pathOptions={{
              color: '#E85D04',
              weight: 1.8,
              opacity: 0.85,
              dashArray: '1 7',
              lineCap: 'round',
              lineJoin: 'round',
            }}
            interactive={false}
          />
        ))}

        {/* City markers */}
        {LOCATIONS.map((loc) => {
          const icon = loc.isHub
            ? hubIcon
            : loc.size === 'sm'
            ? cityIconSm
            : cityIconMd;
          return (
            <Marker
              key={loc.city}
              position={[loc.lat, loc.lng]}
              icon={icon}
              interactive={false}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
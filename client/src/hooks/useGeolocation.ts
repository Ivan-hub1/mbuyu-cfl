import { useState, useCallback } from 'react';

interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface UseGeolocationReturn {
  position: GeoPosition | null;
  loading: boolean;
  error: string | null;
  getCurrentPosition: () => Promise<GeoPosition>;
  clearError: () => void;
}

/**
 * Real device geolocation. No manual override.
 * Requires HTTPS in production (works on localhost for dev).
 */
export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentPosition = useCallback((): Promise<GeoPosition> => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        const msg = 'Geolocation is not supported by this browser.';
        setError(msg);
        reject(new Error(msg));
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const result: GeoPosition = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          };
          setPosition(result);
          setLoading(false);
          resolve(result);
        },
        (err) => {
          let msg = 'Unable to get your location.';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              msg =
                'Location access denied. Please enable location permissions in your browser settings and try again.';
              break;
            case err.POSITION_UNAVAILABLE:
              msg = 'Location information is unavailable. Check your GPS signal.';
              break;
            case err.TIMEOUT:
              msg = 'Location request timed out. Please try again.';
              break;
          }
          setError(msg);
          setLoading(false);
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { position, loading, error, getCurrentPosition, clearError };
}
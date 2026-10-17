import { useCallback } from 'react';
import api from '../lib/api';

interface GeoResult {
  name: string;
  details?: {
    city: string | null;
    county: string | null;
    state: string | null;
    country: string | null;
    fullAddress: string | null;
  } | null;
  fallback?: boolean;
  cached?: boolean;
}

/**
 * Reverse geocodes a lat/lng into a human-readable place name
 * via our backend proxy (which uses Nominatim).
 * Falls back to "lat, lng" string if the backend can't resolve.
 */
export function useReverseGeocode() {
  const reverse = useCallback(
    async (lat: number, lng: number): Promise<string> => {
      try {
        const { data } = await api.get<GeoResult>('/geocode/reverse', {
          params: { lat, lng },
        });
        return data.name;
      } catch (err) {
        console.warn('[reverse geocode] failed', err);
        return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      }
    },
    []
  );

  return { reverse };
}
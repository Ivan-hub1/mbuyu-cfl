import api from './api';
import type {
  Vehicle,
  Checklist,
  ChecklistFormData,
  MaintenanceTicket,
  Journey,
  StartJourneyData,
  JourneyEventData,
} from '../types/fleet';
import type { TransferPayload, ShipmentTransferRecord } from '../types/transfers';

// ═══════════════════════════════════════════
// VEHICLES
// ═══════════════════════════════════════════

export const vehiclesApi = {
  list: async (): Promise<Vehicle[]> => {
    const { data } = await api.get('/vehicles');
    return data;
  },
  available: async (): Promise<Vehicle[]> => {
    const { data } = await api.get('/vehicles/available');
    return data;
  },
  get: async (id: string): Promise<Vehicle> => {
    const { data } = await api.get(`/vehicles/${id}`);
    return data;
  },
  create: async (payload: {
    plate: string;
    type: string;
    capacity?: string;
    notes?: string;
  }): Promise<Vehicle> => {
    const { data } = await api.post('/vehicles', payload);
    return data;
  },
  update: async (
    id: string,
    payload: Partial<{
      plate: string;
      type: string;
      capacity: string;
      notes: string;
      status: string;
    }>
  ): Promise<Vehicle> => {
    const { data } = await api.patch(`/vehicles/${id}`, payload);
    return data;
  },
  remove: async (id: string): Promise<{ ok: true }> => {
    const { data } = await api.delete(`/vehicles/${id}`);
    return data;
  },
};

// ═══════════════════════════════════════════
// CHECKLISTS
// ═══════════════════════════════════════════

export const checklistsApi = {
  submit: async (payload: ChecklistFormData): Promise<Checklist> => {
    const { data } = await api.post('/checklists', payload);
    return data;
  },
  mine: async (): Promise<Checklist[]> => {
    const { data } = await api.get('/checklists/mine');
    return data;
  },
  list: async (status?: string): Promise<Checklist[]> => {
    const url = status ? `/checklists?status=${status}` : '/checklists';
    const { data } = await api.get(url);
    return data;
  },
  get: async (id: string): Promise<Checklist> => {
    const { data } = await api.get(`/checklists/${id}`);
    return data;
  },
};

// ═══════════════════════════════════════════
// MAINTENANCE
// ═══════════════════════════════════════════

export const maintenanceApi = {
  queue: async (status?: string): Promise<MaintenanceTicket[]> => {
    const url = status ? `/maintenance?status=${status}` : '/maintenance';
    const { data } = await api.get(url);
    return data;
  },
  mine: async (): Promise<MaintenanceTicket[]> => {
    const { data } = await api.get('/maintenance/mine');
    return data;
  },
  get: async (id: string): Promise<MaintenanceTicket> => {
    const { data } = await api.get(`/maintenance/${id}`);
    return data;
  },
  start: async (id: string): Promise<MaintenanceTicket> => {
    const { data } = await api.patch(`/maintenance/${id}/start`, {});
    return data;
  },
  uploadBeforePhoto: async (id: string, photo: string) => {
    const { data } = await api.patch(`/maintenance/${id}/photo-before`, {
      photo,
    });
    return data;
  },
  uploadAfterPhoto: async (id: string, photo: string) => {
    const { data } = await api.patch(`/maintenance/${id}/photo-after`, {
      photo,
    });
    return data;
  },
  resolve: async (
    id: string,
    resolutionNote: string
  ): Promise<MaintenanceTicket> => {
    const { data } = await api.patch(`/maintenance/${id}/resolve`, {
      resolutionNote,
    });
    return data;
  },
};

// ═══════════════════════════════════════════
// JOURNEYS — payload types
// ═══════════════════════════════════════════

export interface IncidentPayload extends JourneyEventData {
  type: 'INCIDENT';
  incidentReason: string;
  incidentSeverity: string;
  incidentDescription?: string;
}

export interface UpdatePayload {
  type: 'UPDATE';
  lat: number;
  lng: number;
  locationName?: string;
  note: string;
}

export interface ResumePayload {
  type: 'RESUMED';
  lat: number;
  lng: number;
  locationName?: string;
  note?: string;
}

export interface JourneyStats {
  totalKm: number;
  durationHours: number;
  avgSpeedKmh: number;
  checkpoints: number;
  stops: number;
  incidents: number;
  updates: number;
  eventCount: number;
}

export interface LiveJourney {
  id: string;
  status: string;
  isPaused: boolean;
  startedAt: string | null;
  driver: { id: string; name: string; email: string; phone: string | null };
  vehicle: { id: string; plate: string; type: string };
  shipment: {
    id: string;
    trackingNumber: string;
    customerName: string;
    destinationCity: string;
    destinationCountry: string;
    originCity: string;
    originCountry: string;
  } | null;
  lastEvent: {
    type: string;
    lat: number;
    lng: number;
    locationName: string | null;
    note: string | null;
    createdAt: string;
  } | null;
  stats: JourneyStats | null;
}

// ═══════════════════════════════════════════
// JOURNEYS — API
// ═══════════════════════════════════════════

export const journeysApi = {
  start: async (payload: StartJourneyData): Promise<Journey> => {
    const { data } = await api.post('/journeys', payload);
    return data;
  },

  postEvent: async (
    journeyId: string,
    payload: JourneyEventData | IncidentPayload | UpdatePayload | ResumePayload
  ) => {
    const { data } = await api.post(`/journeys/${journeyId}/events`, payload);
    return data;
  },

  transfer: async (
    journeyId: string,
    payload: TransferPayload
  ): Promise<{
    transfer: ShipmentTransferRecord;
    oldJourneyId: string;
    newJourneyId: string;
    message: string;
  }> => {
    const { data } = await api.post(`/journeys/${journeyId}/transfer`, payload);
    return data;
  },

  stats: async (journeyId: string): Promise<JourneyStats> => {
    const { data } = await api.get(`/journeys/${journeyId}/stats`);
    return data;
  },

  mine: async (): Promise<Journey[]> => {
    const { data } = await api.get('/journeys/mine');
    return data;
  },

  active: async (): Promise<Journey[]> => {
    const { data } = await api.get('/journeys/active');
    return data;
  },

  live: async (): Promise<LiveJourney[]> => {
    const { data } = await api.get('/journeys/live');
    return data;
  },

  list: async (filters?: {
    status?: string;
    driverId?: string;
  }): Promise<Journey[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.driverId) params.set('driverId', filters.driverId);
    const url = params.toString() ? `/journeys?${params}` : '/journeys';
    const { data } = await api.get(url);
    return data;
  },

  get: async (id: string): Promise<Journey> => {
    const { data } = await api.get(`/journeys/${id}`);
    return data;
  },

  timeline: async (id: string) => {
    const { data } = await api.get(`/journeys/${id}/timeline`);
    return data;
  },
};

// ═══════════════════════════════════════════
// GEOCODE
// ═══════════════════════════════════════════

export const geocodeApi = {
  reverse: async (lat: number, lng: number) => {
    const { data } = await api.get('/geocode/reverse', {
      params: { lat, lng },
    });
    return data;
  },
};
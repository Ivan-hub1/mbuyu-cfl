import api from './api';
import type { TransferPayload, ShipmentTransferRecord } from '../types/transfers';

export const transfersApi = {
  /** POST /api/journeys/:id/transfer — initiate transfer */
  initiate: async (
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

  /** GET /api/transfers — list all transfers */
  list: async (shipmentId?: string): Promise<ShipmentTransferRecord[]> => {
    const url = shipmentId
      ? `/transfers?shipmentId=${shipmentId}`
      : '/transfers';
    const { data } = await api.get(url);
    return data;
  },

  /** GET /api/transfers/:id */
  get: async (id: string): Promise<ShipmentTransferRecord> => {
    const { data } = await api.get(`/transfers/${id}`);
    return data;
  },

  /** GET /api/transfers/shipment/:shipmentId */
  forShipment: async (
    shipmentId: string
  ): Promise<ShipmentTransferRecord[]> => {
    const { data } = await api.get(`/transfers/shipment/${shipmentId}`);
    return data;
  },
};
import type { OrderStatus } from '../../types';

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Order Received',
  ASSIGNED: 'Driver Assigned',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  CUSTOMS: 'Customs Clearance',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

interface Event {
  id: string;
  status: OrderStatus;
  note?: string;
  lat?: number;
  lng?: number;
  createdAt: string;
}

export default function TrackingTimeline({ events }: { events: Event[] }) {
  return (
    <ol className="relative border-l-2 border-brand-black-muted ml-3">
      {events.map((e, i) => (
        <li key={e.id} className="mb-8 ml-6">
          <span
            className={`absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full ring-4 ring-brand-black ${
              i === events.length - 1 ? 'bg-brand-orange' : 'bg-brand-black-muted'
            }`}
          />
          <div className="flex items-center justify-between">
            <h4 className={`font-semibold ${i === events.length - 1 ? 'text-brand-orange' : ''}`}>
              {STATUS_LABEL[e.status]}
            </h4>
            <time className="text-xs text-gray-500">
              {new Date(e.createdAt).toLocaleString()}
            </time>
          </div>
          {e.note && <p className="text-sm text-gray-400 mt-1">{e.note}</p>}
        </li>
      ))}
    </ol>
  );
}
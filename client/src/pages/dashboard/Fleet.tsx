import { useState } from 'react';
import Navbar from '../../components/layout/Navbar';

interface Vehicle {
  id: string;
  plate: string;
  type: 'Truck' | 'Van' | 'Trailer' | 'Pickup';
  driver: string;
  status: 'Available' | 'On Trip' | 'Maintenance';
  location: string;
  capacity: string;
}

const MOCK_VEHICLES: Vehicle[] = [
  { id: '1', plate: 'UBG 123A', type: 'Truck',   driver: 'John Ssembatya', status: 'On Trip',     location: 'Kampala → Mombasa', capacity: '20 Tonnes' },
  { id: '2', plate: 'UBG 456B', type: 'Trailer', driver: 'Mary Nakato',    status: 'Available',   location: 'Kampala Yard',      capacity: '30 Tonnes' },
  { id: '3', plate: 'UBG 789C', type: 'Van',     driver: 'Peter Okello',   status: 'Maintenance', location: 'Workshop',          capacity: '3 Tonnes'  },
  { id: '4', plate: 'UBG 321D', type: 'Pickup',  driver: 'Unassigned',     status: 'Available',   location: 'Kampala Yard',      capacity: '1 Tonne'   },
];

const STATUS_STYLE: Record<Vehicle['status'], string> = {
  'Available':   'bg-green-500/10 text-green-400 border-green-500/30',
  'On Trip':     'bg-brand-orange/10 text-brand-orange border-brand-orange/30',
  'Maintenance': 'bg-red-500/10 text-red-400 border-red-500/30',
};

export default function Fleet() {
  const [filter, setFilter] = useState<'All' | Vehicle['status']>('All');
  const vehicles = filter === 'All'
    ? MOCK_VEHICLES
    : MOCK_VEHICLES.filter((v) => v.status === filter);

  const stats = {
    total: MOCK_VEHICLES.length,
    available: MOCK_VEHICLES.filter((v) => v.status === 'Available').length,
    onTrip: MOCK_VEHICLES.filter((v) => v.status === 'On Trip').length,
    maintenance: MOCK_VEHICLES.filter((v) => v.status === 'Maintenance').length,
  };

  return (
    <div className="min-h-screen bg-brand-black">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Fleet Management</h1>
            <p className="text-gray-400 mt-1">Monitor and manage your vehicles in real time.</p>
          </div>
          <button className="btn-primary">+ Add Vehicle</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card"><p className="text-gray-400 text-sm">Total Fleet</p><p className="text-3xl font-bold text-white mt-1">{stats.total}</p></div>
          <div className="card"><p className="text-gray-400 text-sm">Available</p><p className="text-3xl font-bold text-green-400 mt-1">{stats.available}</p></div>
          <div className="card"><p className="text-gray-400 text-sm">On Trip</p><p className="text-3xl font-bold text-brand-orange mt-1">{stats.onTrip}</p></div>
          <div className="card"><p className="text-gray-400 text-sm">Maintenance</p><p className="text-3xl font-bold text-red-400 mt-1">{stats.maintenance}</p></div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {(['All', 'Available', 'On Trip', 'Maintenance'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? 'bg-brand-orange text-white'
                  : 'bg-brand-black-soft text-gray-400 hover:text-white border border-brand-black-muted'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Vehicles Table */}
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-brand-black-muted/50">
              <tr className="text-left text-xs uppercase text-gray-400">
                <th className="px-6 py-3">Plate</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Driver</th>
                <th className="px-6 py-3">Capacity</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-t border-brand-black-muted hover:bg-brand-black-muted/30 transition">
                  <td className="px-6 py-4 font-mono font-semibold text-white">{v.plate}</td>
                  <td className="px-6 py-4 text-gray-300">{v.type}</td>
                  <td className="px-6 py-4 text-gray-300">{v.driver}</td>
                  <td className="px-6 py-4 text-gray-400">{v.capacity}</td>
                  <td className="px-6 py-4 text-gray-400">{v.location}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_STYLE[v.status]}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-brand-orange hover:underline text-sm">Manage</button>
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No vehicles match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
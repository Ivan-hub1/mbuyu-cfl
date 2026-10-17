import Navbar from '../../components/layout/Navbar';
import { useAuthStore } from '../../store/authStore';

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}</h1>
        <p className="text-gray-400 mb-8">Track your shipments and manage your quotes.</p>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-sm font-semibold text-brand-orange uppercase mb-3">Active Shipments</h3>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold text-brand-orange uppercase mb-3">Pending Quotes</h3>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold text-brand-orange uppercase mb-3">Delivered</h3>
            <p className="text-3xl font-bold">0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import SEO from '../../components/seo/SEO';
import AdminOverview from './AdminOverview';
import AdminQuotes from './AdminQuotes';
import StaffManagement from './StaffManagement';
import Shipments from './Shipments';

export default function AdminDashboard() {
  const [tab, setTab] = useState<'overview' | 'quotes' | 'shipments' | 'staff'>(
    'overview'
  );

  return (
    <div className="min-h-screen">
      <SEO title="Admin Dashboard" description="Mbuyu CFL admin panel." />
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex gap-2 mb-8 border-b border-brand-black-muted overflow-x-auto">
          <TabButton
            active={tab === 'overview'}
            onClick={() => setTab('overview')}
          >
            Overview
          </TabButton>
          <TabButton active={tab === 'quotes'} onClick={() => setTab('quotes')}>
            Quote Requests
          </TabButton>
          <TabButton
            active={tab === 'shipments'}
            onClick={() => setTab('shipments')}
          >
            Shipments
          </TabButton>
          <TabButton active={tab === 'staff'} onClick={() => setTab('staff')}>
            Staff Management
          </TabButton>
        </div>

        {tab === 'overview' && <AdminOverview />}
        {tab === 'quotes' && <AdminQuotes />}
        {tab === 'shipments' && <Shipments />}
        {tab === 'staff' && <StaffManagement />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap ${
        active
          ? 'border-brand-orange text-brand-orange'
          : 'border-transparent text-gray-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
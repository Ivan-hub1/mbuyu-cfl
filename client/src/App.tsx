import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import PublicLayout from './components/layout/PublicLayout';
import Home from './pages/public/Home';
import Track from './pages/public/Track';
import Quote from './pages/public/Quote';
import Services from './pages/public/Services';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import CompleteRegistration from './pages/auth/CompleteRegistration';

import Dashboard from './pages/dashboard/Dashboard';
import Shipments from './pages/dashboard/Shipments';
import Quotes from './pages/dashboard/Quotes';
import Users from './pages/dashboard/Users';
import Vehicles from './pages/dashboard/Vehicles';
import FleetLive from './pages/dashboard/FleetLive';
import Maintenance from './pages/dashboard/Maintenance';
import MyShipments from './pages/dashboard/MyShipments';
import MyQuotes from './pages/dashboard/MyQuotes';
import Statements from './pages/dashboard/Statements';
import StatementDetail from './pages/dashboard/StatementDetail';
import MyStatements from './pages/dashboard/MyStatements';
import Transfers from './pages/dashboard/Transfers';
import Fleet from './pages/dashboard/Fleet';

import DriverWelcome from './pages/driver/DriverWelcome';
import DriverShipments from './pages/driver/DriverShipments';
import ChecklistForm from './pages/driver/ChecklistForm';
import DriverJourney from './pages/driver/DriverJourney';
import ShipmentJourneyFlow from './pages/driver/ShipmentJourneyFlow';

import { useAuthStore } from './store/authStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/track" element={<Track />} />
          <Route path="/track/:code" element={<Track />} />
          <Route path="/quote" element={<Quote />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/complete" element={<CompleteRegistration />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route path="shipments" element={<Shipments />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="users" element={<Users />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="fleet-live" element={<FleetLive />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="my-shipments" element={<MyShipments />} />
          <Route path="my-quotes" element={<MyQuotes />} />
          <Route path="statements" element={<Statements />} />
          <Route path="statements/:email" element={<StatementDetail />} />
          <Route path="my-statements" element={<MyStatements />} />
          <Route path="transfers" element={<Transfers />} />
        </Route>

        <Route
          path="/fleet"
          element={
            <ProtectedRoute>
              <Fleet />
            </ProtectedRoute>
          }
        />

        <Route path="/driver/welcome" element={<ProtectedRoute><DriverWelcome /></ProtectedRoute>} />
        <Route path="/driver/shipments" element={<ProtectedRoute><DriverShipments /></ProtectedRoute>} />
        <Route path="/driver/checklist" element={<ProtectedRoute><ChecklistForm /></ProtectedRoute>} />
        <Route path="/driver/shipment/:id/start" element={<ProtectedRoute><ShipmentJourneyFlow /></ProtectedRoute>} />
        <Route path="/driver/journey" element={<ProtectedRoute><DriverJourney /></ProtectedRoute>} />
        <Route path="/driver/journey/:id" element={<ProtectedRoute><DriverJourney /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
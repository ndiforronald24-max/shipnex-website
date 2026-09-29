import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import TrackingPage from './pages/TrackingPage';
import PetTrackingPage from './pages/PetTrackingPage';
import ServicesPage from './pages/ServicesPage';
import OfficesPage from './pages/OfficesPage';
import FAQPage from './pages/FAQPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/admin/Dashboard';
import AdminShipmentsPage from './pages/admin/Shipments';
import AdminCreateShipmentPage from './pages/admin/CreateShipment';
import AdminShipmentDetailPage from './pages/admin/ShipmentDetail';
import AdminUpdateShipmentPage from './pages/admin/UpdateShipment';
import AdminTrackingUpdatesPage from './pages/admin/TrackingUpdates';
import AdminCustomersPage from './pages/admin/Customers';
import AdminPetShipmentsPage from './pages/admin/PetShipments';
import AdminOfficesPage from './pages/admin/Offices';
import AdminVehiclesPage from './pages/admin/Vehicles';
import AdminStaffPage from './pages/admin/Staff';
import AdminNotificationsPage from './pages/admin/Notifications';
import AdminDocumentsPage from './pages/admin/Documents';
import AdminReportsPage from './pages/admin/Reports';
import AdminSettingsPage from './pages/admin/Settings';
import AdminAuditLogsPage from './pages/admin/AuditLogs';
import { getRole, ROLES } from './utils/auth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('authToken');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

/** Blocks staff pages from non-authorized roles (backend enforces this too). */
function RoleRoute({ permission, children }: { permission: string; children: React.ReactNode }) {
  const role = getRole();
  const allowed: Record<string, string[]> = {
    auditLogsView: [ROLES.SuperAdmin, ROLES.OperationsManager, ROLES.ReadOnly],
    staffView: [ROLES.SuperAdmin, ROLES.OperationsManager],
    settingsView: [ROLES.SuperAdmin],
    reportsView: [ROLES.SuperAdmin, ROLES.OperationsManager, ROLES.Finance, ROLES.ReadOnly],
  };
  return (allowed[permission] ?? []).includes(role) ? <>{children}</> : <Navigate to="/admin" replace />;
}


import AirFreightPage from './pages/services/AirFreightPage';
import SeaFreightPage from './pages/services/SeaFreightPage';
import RoadFreightPage from './pages/services/RoadFreightPage';
import ExpressShippingPage from './pages/services/ExpressShippingPage';
import VehicleShippingPage from './pages/services/VehicleShippingPage';
import PetTransportPage from './pages/services/PetTransportPage';

/** Outlet wrapper for admin pages rendered inside AdminLayout. */
function AdminOutlet() {
  return <Outlet />;
}

/** 404 page for unknown public URLs. */
function NotFound() {
  return (
    <section className="py-24 text-center">
      <p className="text-6xl font-bold text-[#ff6f00] mb-4">404</p>
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h1>
      <p className="text-gray-500 mb-8">The page you are looking for does not exist or has been moved.</p>
      <Link to="/" className="inline-flex items-center px-6 py-3 bg-[#ff6f00] text-white rounded-lg font-semibold hover:bg-[#e65100] transition-colors">Back to Home</Link>
    </section>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* ---------- Admin portal (own layout, auth required) ---------- */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout><AdminOutlet /></AdminLayout>
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboardPage />} />
          <Route path="shipments" element={<AdminShipmentsPage />} />
          <Route path="shipments/create" element={<AdminCreateShipmentPage />} />
          <Route path="shipments/:id" element={<AdminShipmentDetailPage />} />
          <Route path="shipments/:id/update" element={<AdminUpdateShipmentPage />} />
          <Route path="tracking-updates" element={<AdminTrackingUpdatesPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="pet-shipments" element={<AdminPetShipmentsPage />} />
          <Route path="offices" element={<AdminOfficesPage />} />
          <Route path="vehicles" element={<AdminVehiclesPage />} />
          <Route path="staff" element={<RoleRoute permission="staffView"><AdminStaffPage /></RoleRoute>} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="documents" element={<AdminDocumentsPage />} />
          <Route path="reports" element={<RoleRoute permission="reportsView"><AdminReportsPage /></RoleRoute>} />
          <Route path="settings" element={<RoleRoute permission="settingsView"><AdminSettingsPage /></RoleRoute>} />
          <Route path="audit-logs" element={<RoleRoute permission="auditLogsView"><AdminAuditLogsPage /></RoleRoute>} />
        </Route>

        {/* ---------- Public site ---------- */}
        <Route path="*" element={
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/services/air-freight" element={<AirFreightPage />} />
                <Route path="/services/sea-freight" element={<SeaFreightPage />} />
                <Route path="/services/road-freight" element={<RoadFreightPage />} />
                <Route path="/services/express-shipping" element={<ExpressShippingPage />} />
                <Route path="/services/vehicle-shipping" element={<VehicleShippingPage />} />
                <Route path="/services/pet-live-animal" element={<PetTransportPage />} />
                <Route path="/track" element={<TrackingPage />} />
                <Route path="/track/pet" element={<PetTrackingPage />} />
                <Route path="/offices" element={<OfficesPage />} />
                <Route path="/faqs" element={<FAQPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;


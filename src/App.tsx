import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import PortalProtectedRoute from './components/PortalProtectedRoute';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import OrgChartPage from './pages/OrgChartPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminLayoutPage from './pages/admin/AdminLayoutPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminMembersPage from './pages/admin/AdminMembersPage';
import AdminCommissionsPage from './pages/admin/AdminCommissionsPage';
import AdminTenantsPage from './pages/admin/AdminTenantsPage';
import AdminAccountsPage from './pages/admin/AdminAccountsPage';
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage';
import AdminLogsPage from './pages/admin/AdminLogsPage';
import PortalLoginPage from './pages/portal/PortalLoginPage';
import PortalLayoutPage from './pages/portal/PortalLayoutPage';
import PortalDashboardPage from './pages/portal/PortalDashboardPage';
import PortalTasksPage from './pages/portal/PortalTasksPage';
import PortalMembersPage from './pages/portal/PortalMembersPage';
import PortalCommissionsPage from './pages/portal/PortalCommissionsPage';
import PortalAnnouncementsPage from './pages/portal/PortalAnnouncementsPage';
import PortalSettingsPage from './pages/portal/PortalSettingsPage';

export default function App() {
  return (
    <Routes>
      {/* Super admin routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <AdminLayoutPage />
          </AdminProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="members" element={<AdminMembersPage />} />
        <Route path="commissions" element={<AdminCommissionsPage />} />
        <Route path="tenants" element={<AdminTenantsPage />} />
        <Route path="accounts" element={<AdminAccountsPage />} />
        <Route path="announcements" element={<AdminAnnouncementsPage />} />
        <Route path="logs" element={<AdminLogsPage />} />
      </Route>

      {/* Tenant portal routes */}
      <Route path="/portal/login" element={<PortalLoginPage />} />
      <Route
        path="/portal/:id"
        element={
          <PortalProtectedRoute>
            <PortalLayoutPage />
          </PortalProtectedRoute>
        }
      >
        <Route path="dashboard" element={<PortalDashboardPage />} />
        <Route path="tasks" element={<PortalTasksPage />} />
        <Route path="members" element={<PortalMembersPage />} />
        <Route path="commissions" element={<PortalCommissionsPage />} />
        <Route path="announcements" element={<PortalAnnouncementsPage />} />
        <Route path="settings" element={<PortalSettingsPage />} />
      </Route>

      {/* Agent-facing routes */}
      <Route
        path="/*"
        element={
          <div className="min-h-screen flex flex-col bg-white text-gray-900">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute><DashboardPage /></ProtectedRoute>
                } />
                <Route path="/org" element={
                  <ProtectedRoute><OrgChartPage /></ProtectedRoute>
                } />
              </Routes>
            </main>
            <Footer />
          </div>
        }
      />
    </Routes>
  );
}

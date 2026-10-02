import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, PlusCircle, Activity, Users, PawPrint,
  Building2, Truck, UserCog, Bell, FileText, BarChart3, Settings,
  ScrollText, LogOut, Menu, X, ChevronDown
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { getAuthUser, clearAuthUser, can, type Permission } from '../utils/auth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  perm: Permission;
  exact?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  { label: 'Overview', items: [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard' as Permission, exact: true },
  ]},
  { label: 'Operations', items: [
    { path: '/admin/shipments', label: 'Shipments', icon: Package, perm: 'shipmentsView' as Permission },
    { path: '/admin/shipments/create', label: 'Create Shipment', icon: PlusCircle, perm: 'shipmentsCreate' as Permission },
    { path: '/admin/tracking-updates', label: 'Tracking Updates', icon: Activity, perm: 'shipmentsView' as Permission },
    { path: '/admin/pet-shipments', label: 'Pet Shipments', icon: PawPrint, perm: 'petsView' as Permission },
  ]},
  { label: 'Management', items: [
    { path: '/admin/customers', label: 'Customers', icon: Users, perm: 'customersView' as Permission },
    { path: '/admin/offices', label: 'Offices', icon: Building2, perm: 'officesView' as Permission },
    { path: '/admin/vehicles', label: 'Vehicles', icon: Truck, perm: 'vehiclesView' as Permission },
    { path: '/admin/staff', label: 'Staff', icon: UserCog, perm: 'staffView' as Permission },
  ]},
  { label: 'Data', items: [
    { path: '/admin/notifications', label: 'Notifications', icon: Bell, perm: 'notificationsView' as Permission },
    { path: '/admin/documents', label: 'Documents', icon: FileText, perm: 'documentsView' as Permission },
    { path: '/admin/reports', label: 'Reports', icon: BarChart3, perm: 'reportsView' as Permission },
    { path: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText, perm: 'auditLogsView' as Permission },
  ]},
  { label: 'System', items: [
    { path: '/admin/settings', label: 'Settings', icon: Settings, perm: 'settingsView' as Permission },
  ]},
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = getAuthUser();

  const handleLogout = () => {
    apiClient.clearToken();
    clearAuthUser();
    navigate('/login');
  };

  const isActive = (path: string, exact?: boolean) => {
    if (exact || path === '/admin') return location.pathname === '/admin';
    return location.pathname === path || (location.pathname + '/').startsWith(path + '/');
  };

  const visibleSections = navSections
    .map((section) => ({ ...section, items: section.items.filter((item) => can(item.perm)) }))
    .filter((section) => section.items.length > 0);

  const roleColors: Record<string, string> = {
    SuperAdmin: 'bg-red-500/20 text-red-300 border-red-400/30',
    OperationsManager: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    ReadOnly: 'bg-gray-500/20 text-gray-300 border-gray-400/30',
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 h-screen w-72 lg:w-64 bg-[#1a237e] text-white flex flex-col z-50 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 flex-shrink-0">
          <Link to="/admin" className="min-w-0">
            <img
              src="/brand/shipnexaro-wordmark-light.png"
              alt="ShipNexaro"
              width={720}
              height={147}
              className="h-7 w-auto object-contain"
            />
            <p className="text-[10px] text-white/50 leading-none mt-1">Admin Portal</p>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {visibleSections.map((section) => (
            <div key={section.label} className="mb-4">
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold px-3 mb-2">{section.label}</p>
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all ${
                    isActive(item.path, item.exact) ? 'bg-[#ff6f00] text-white shadow-lg shadow-orange-500/20' : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/10 p-3 flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 bg-gradient-to-br from-[#ff6f00] to-[#ff8f00] rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user?.firstName?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user?.firstName ?? 'Admin'}</p>
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border ${roleColors[user?.role ?? ''] ?? 'bg-white/10 text-white/70 border-white/20'}`}>
                {user?.role ?? 'Staff'}
              </span>
            </div>
            <button onClick={handleLogout} title="Logout" className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600">
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-500 hidden sm:inline">Signed in as <span className="font-medium text-gray-700">{user?.email ?? 'admin'}</span></span>
            <span className="text-sm text-gray-500 sm:hidden">ShipNexaro Admin</span>
          </div>

          <div className="relative">
            <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-[#ff6f00] to-[#ff8f00] rounded-lg flex items-center justify-center text-white text-sm font-bold">
                {user?.firstName?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user?.firstName ?? 'Admin'}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.firstName ?? 'Admin'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-[#fff3e0] text-[#e65100] font-medium">{user?.role}</span>
                  </div>
                  <Link to="/admin/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

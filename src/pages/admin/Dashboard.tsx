import { useState, useEffect, useCallback } from 'react';
import { Package, Truck, CheckCircle, AlertTriangle, PawPrint, Clock, MapPin, Users, Building2, Bell, TrendingUp } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { statusLabel, statusBadgeClass } from '../../utils/auth';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [allShipments, setAllShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [adminStats, allShipments] = await Promise.all([
        apiClient.getAdminStats(),
        apiClient.getAllShipments(),
      ]);
      setStats(adminStats);
      // Stats span the FULL list; only the recent-shipments table is sliced.
      const list = Array.isArray(allShipments) ? allShipments : allShipments?.data ?? [];
      setAllShipments(list);
      setShipments(list.slice().sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#ff6f00] border-t-transparent rounded-full animate-spin"></div></div>;

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
  );

  // Real status breakdown computed from the FULL live shipment list (not just the 8 recent rows).
  const byStatus = allShipments.reduce((acc: Record<string, number>, s: any) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  const statCards = [
    { label: 'Total Shipments', value: stats?.totalShipments ?? 0, icon: Package, light: 'bg-blue-50 text-blue-600' },
    { label: 'In Transit', value: byStatus['InTransit'] ?? 0, icon: Truck, light: 'bg-indigo-50 text-indigo-600' },
    { label: 'Out for Delivery', value: byStatus['OutForDelivery'] ?? 0, icon: MapPin, light: 'bg-amber-50 text-amber-600' },
    { label: 'Delivered', value: byStatus['Delivered'] ?? 0, icon: CheckCircle, light: 'bg-green-50 text-green-600' },
    { label: 'Delayed', value: byStatus['Delayed'] ?? 0, icon: Clock, light: 'bg-red-50 text-red-600' },
    { label: 'Exceptions', value: byStatus['Exception'] ?? 0, icon: AlertTriangle, light: 'bg-orange-50 text-orange-600' },
    { label: 'Pet Shipments', value: stats?.totalPetShipments ?? 0, icon: PawPrint, light: 'bg-purple-50 text-purple-600' },
  ];

  const secondaryCards = [
    { label: 'Customers', value: stats?.totalCustomers ?? 0, icon: Users },
    { label: 'Offices', value: stats?.totalOffices ?? 0, icon: Building2 },
    { label: 'Vehicles', value: stats?.totalVehicles ?? 0, icon: Truck },
    { label: 'Unread Notifications', value: stats?.unreadNotifications ?? 0, icon: Bell },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your logistics operations</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.light} flex items-center justify-center`}><s.icon className="w-5 h-5" /></div>
              <span className="text-2xl font-bold text-gray-900">{s.value}</span>
            </div>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {secondaryCards.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center flex-shrink-0"><s.icon className="w-4 h-4" /></div>
            <div>
              <p className="text-lg font-bold text-gray-900 leading-none">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Shipments</h2><TrendingUp className="w-4 h-4 text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full"><thead className="bg-gray-50/80"><tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tracking</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Route</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {shipments.length === 0 ? (<tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No shipments found</td></tr>) :
            shipments.map((s: any) => (
              <tr key={s.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-3.5 text-sm font-medium text-gray-900"><Link to={`/admin/shipments/${s.id}`} className="hover:text-[#ff6f00]">{s.trackingNumber}</Link></td>
                <td className="px-6 py-3.5 text-sm text-gray-600">{s.receiverName ?? s.senderName ?? '—'}</td>
                <td className="px-6 py-3.5 text-sm text-gray-600">{s.origin} → {s.destination}</td>
                <td className="px-6 py-3.5"><span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${statusBadgeClass(s.status)}`}>{statusLabel(s.status)}</span></td>
                <td className="px-6 py-3.5 text-sm text-gray-400">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
        <div className="px-6 py-3 border-t border-gray-100">
          <Link to="/admin/shipments" className="text-sm text-[#ff6f00] font-medium hover:underline">View all shipments →</Link>
        </div>
      </div>
    </div>
  );
}

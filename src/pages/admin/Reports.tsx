import { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { statusLabel } from '../../utils/auth';

export default function AdminReports() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try { const r = await apiClient.getAllShipments(); setShipments(Array.isArray(r) ? r : r?.data ?? []); }
    catch (e: any) { setError(e?.response?.data?.message || 'Failed to load report data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const report = useMemo(() => {
    const byStatus: Record<string, number> = {};
    const byService: Record<string, number> = {};
    const byDestination: Record<string, number> = {};
    const byMonth: Record<string, number> = {};
    let totalWeight = 0;
    for (const s of shipments) {
      byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
      const svc = s.serviceType || 'Unknown';
      byService[svc] = (byService[svc] ?? 0) + 1;
      const dest = s.destination || 'Unknown';
      byDestination[dest] = (byDestination[dest] ?? 0) + 1;
      const month = s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 7) : 'Unknown';
      byMonth[month] = (byMonth[month] ?? 0) + 1;
      totalWeight += s.weight ?? 0;
    }
    const topDestinations = Object.entries(byDestination).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const months = Object.keys(byMonth).sort().slice(-6);
    return { byStatus, byService, topDestinations, months: months.map(m => [m, byMonth[m]]), totalWeight };
  }, [shipments]);

  const exportCsv = () => {
    const header = 'TrackingNumber,Customer,Origin,Destination,Status,ServiceType,Weight,CreatedAt\n';
    const rows = shipments.map((s: any) =>
      [s.trackingNumber, s.receiverName ?? s.senderName ?? '', s.origin, s.destination, s.status, s.serviceType, s.weight, s.createdAt]
        .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `shipnex-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#ff6f00] border-t-transparent rounded-full animate-spin"></div></div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>;

  const maxStatus = Math.max(1, ...Object.values(report.byStatus));
  const maxMonth = Math.max(1, ...report.months.map(([, c]) => c as number));

  return (<div>
    <div className="flex items-center justify-between mb-6">
      <div><h1 className="text-2xl font-bold">Reports</h1><p className="text-gray-500 text-sm">{shipments.length} shipments analysed · avg weight {shipments.length ? (report.totalWeight / shipments.length).toFixed(1) : 0} kg</p></div>
      <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#ff6f00] to-[#ff8f00] text-white rounded-xl text-sm font-medium"><Download className="w-4 h-4"/>Export CSV</button>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-gray-400"/>Shipments by Status</h2>
        <div className="space-y-3">
          {Object.entries(report.byStatus).map(([status, count]) => (
            <div key={status}>
              <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">{statusLabel(status)}</span><span className="font-medium text-gray-900">{count as number}</span></div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#ff6f00] rounded-full" style={{ width: `${((count as number) / maxStatus) * 100}%` }}/></div>
            </div>
          ))}
          {Object.keys(report.byStatus).length === 0 && <p className="text-gray-400 text-sm">No data</p>}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-gray-400"/>Shipments by Service Type</h2>
        <div className="space-y-3">
          {Object.entries(report.byService).map(([svc, count]) => (
            <div key={svc} className="flex justify-between text-sm border-b border-gray-50 pb-2"><span className="text-gray-600">{svc}</span><span className="font-medium text-gray-900">{count as number}</span></div>
          ))}
          {Object.keys(report.byService).length === 0 && <p className="text-gray-400 text-sm">No data</p>}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-gray-400"/>Top Destinations</h2>
        <div className="space-y-3">
          {report.topDestinations.map(([dest, count]) => (
            <div key={dest} className="flex justify-between text-sm border-b border-gray-50 pb-2"><span className="text-gray-600">{dest}</span><span className="font-medium text-gray-900">{count}</span></div>
          ))}
          {report.topDestinations.length === 0 && <p className="text-gray-400 text-sm">No data</p>}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-gray-400"/>Monthly Volume (last 6 months)</h2>
        <div className="flex items-end gap-3 h-40">
          {report.months.map(([month, count]) => (
            <div key={month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-medium text-gray-700">{count as number}</span>
              <div className="w-full bg-[#ff6f00] rounded-t-lg" style={{ height: `${((count as number) / maxMonth) * 100}%`, minHeight: 4 }}/>
              <span className="text-[10px] text-gray-400">{month}</span>
            </div>
          ))}
          {report.months.length === 0 && <p className="text-gray-400 text-sm">No data</p>}
        </div>
      </div>
    </div>
  </div>);
}

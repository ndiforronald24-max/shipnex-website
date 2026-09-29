import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, Clock3, XCircle, RotateCcw, Eye, Search, RefreshCw } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { can } from '../../utils/auth';

const MAX_RETRIES = 3;

interface LogRow {
  id: string;
  notificationId: string;
  channel: string;
  recipient: string;
  status: string;
  retryCount: number;
  template: string;
  createdAt: string;
  sentAt?: string | null;
}

interface Detail extends LogRow {
  subject?: string | null;
  messageId?: string | null;
  failureReason?: string | null;
  shipmentId?: string | null;
  shipmentTrackingNumber?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  petShipmentId?: string | null;
  petShipmentTrackingNumber?: string | null;
}

interface Stats { total: number; sent: number; pending: number; failed: number; retried: number; }

const statusStyle: Record<string, string> = {
  Sent: 'bg-green-100 text-green-700',
  Pending: 'bg-amber-100 text-amber-700',
  Failed: 'bg-red-100 text-red-700',
  Delivered: 'bg-blue-100 text-blue-700',
};

function Row({ k, v, danger }: { k: string; v: string; danger?: boolean }) {
  return (
    <div className="flex gap-3">
      <dt className="w-32 flex-shrink-0 text-gray-400">{k}</dt>
      <dd className={`flex-1 break-words ${danger ? 'text-red-600' : 'text-gray-800'}`}>{v}</dd>
    </div>
  );
}

export default function AdminNotifications() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<LogRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);
  const canRetry = can('notificationsManage');
  const pageSize = 20;

  const statusesParam = useMemo(
    () => (statusFilter.length ? statusFilter.join(',') : undefined),
    [statusFilter]);

  const fetchStats = async () => {
    try {
      const s = await apiClient.get('/notification-logs/stats');
      setStats(s as Stats);
    } catch { /* stats are best-effort */ }
  };

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('pageNumber', String(page));
      params.append('pageSize', String(pageSize));
      if (statusesParam) params.append('statuses', statusesParam);
      if (search) params.append('search', search);
      const r: any = await apiClient.get(`/notification-logs?${params.toString()}`);
      const rows: LogRow[] = r?.items ?? r?.data?.items ?? (Array.isArray(r) ? r : []);
      setItems(rows);
      setTotalCount(r?.totalCount ?? r?.data?.totalCount ?? rows.length);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load notification logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchLogs(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, statusesParam, search]);

  const toggleStatus = (s: string) => {
    setPage(1);
    setStatusFilter(prev => (prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]));
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const d = await apiClient.get(`/notification-logs/${id}`);
      setDetail(d as Detail);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load notification detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const retry = async (id: string) => {
    if (!canRetry) return;
    setRetrying(id);
    setBanner('');
    setError('');
    try {
      await apiClient.patch(`/notification-logs/${id}/retry`, {});
      setBanner('Retry queued - the notification will be re-sent.');
      await fetchStats();
      await fetchLogs();
      if (detail?.id === id) await openDetail(id);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Retry failed. Max retries may be reached.');
    } finally {
      setRetrying(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const cards = stats ? [
    { label: 'Total notifications', value: stats.total, icon: Bell, cls: 'text-gray-700 bg-gray-100' },
    { label: 'Sent', value: stats.sent, icon: CheckCircle2, cls: 'text-green-700 bg-green-100' },
    { label: 'Pending', value: stats.pending, icon: Clock3, cls: 'text-amber-700 bg-amber-100' },
    { label: 'Failed', value: stats.failed, icon: XCircle, cls: 'text-red-700 bg-red-100' },
    { label: 'Retried', value: stats.retried, icon: RotateCcw, cls: 'text-blue-700 bg-blue-100' },
  ] : [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-gray-500 text-sm">Email delivery dashboard - retry capped at {MAX_RETRIES}</p>
        </div>
        <button onClick={() => { fetchStats(); fetchLogs(); }} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 self-start">
          <RefreshCw className="w-4 h-4" />Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2">
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${c.cls}`}><c.icon className="w-4 h-4" /></span>
              <span className="text-2xl font-bold">{c.value}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{c.label}</p>
          </div>
        ))}
      </div>

      {banner && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">{banner}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="flex gap-2 flex-wrap">
          {['Sent', 'Pending', 'Failed'].map(s => (
            <button key={s} onClick={() => toggleStatus(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border ${statusFilter.includes(s) ? 'bg-[#1a237e] text-white border-[#1a237e]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s}
            </button>
          ))}
        </div>
        <form className="flex gap-2 flex-1" onSubmit={e => { e.preventDefault(); setPage(1); setSearch(searchInput.trim()); }}>
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search tracking number, email, notification type..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#ff6f00]" />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-[#1a237e] text-white rounded-xl text-sm font-medium">Search</button>
        </form>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">Notification</th>
                <th className="px-4 py-3 font-medium">Shipment</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Recipient</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Sent</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400"><div className="w-8 h-8 border-4 border-[#ff6f00] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No notification logs match this filter.</td></tr>}
              {!loading && items.map(n => {
                const retryable = n.status === 'Failed' && n.retryCount < MAX_RETRIES;
                return (
                  <tr key={n.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{n.template}</p>
                      <p className="text-xs text-gray-400 font-mono truncate max-w-[180px]">{n.notificationId}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">-</td>
                    <td className="px-4 py-3 text-gray-600">-</td>
                    <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]">{n.recipient}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${statusStyle[n.status] ?? 'bg-gray-100 text-gray-600'}`}>{n.status}</span>
                      {n.retryCount > 0 && <span className="ml-1 text-[11px] text-gray-400">x{n.retryCount}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(n.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{n.sentAt ? new Date(n.sentAt).toLocaleString() : '-'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => openDetail(n.id)} title="View details" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 inline-block"><Eye className="w-4 h-4" /></button>
                      {canRetry && (
                        <button onClick={() => retry(n.id)} disabled={!retryable || retrying === n.id}
                          title={retryable ? `Retry (attempt ${n.retryCount + 1} of ${MAX_RETRIES})` : 'Not retryable'}
                          className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 inline-block disabled:opacity-30 disabled:cursor-not-allowed">
                          <RotateCcw className={`w-4 h-4 ${retrying === n.id ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>{totalCount} total - page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetail(null)} />
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl p-6 max-h-[85vh] overflow-y-auto">
            {detailLoading && <p className="text-sm text-gray-400 text-center py-8">Loading details...</p>}
            {detail && (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{detail.template}</h3>
                    <p className="text-xs text-gray-400 font-mono">{detail.notificationId}</p>
                  </div>
                  <button onClick={() => setDetail(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">X</button>
                </div>
                <dl className="space-y-2.5 text-sm">
                  <Row k="Shipment" v={detail.shipmentTrackingNumber ?? '-'} />
                  <Row k="Customer" v={detail.customerName ?? '-'} />
                  <Row k="Recipient" v={detail.recipient} />
                  <Row k="Status" v={`${detail.status} (retries ${detail.retryCount})`} />
                  <Row k="Created" v={new Date(detail.createdAt).toLocaleString()} />
                  <Row k="Sent" v={detail.sentAt ? new Date(detail.sentAt).toLocaleString() : '-'} />
                  {detail.failureReason && <Row k="Failure reason" v={detail.failureReason} danger />}
                </dl>
                <p className="text-xs text-gray-400 mt-4">Email body is not displayed here.</p>
                <div className="flex gap-2 mt-5">
                  {canRetry && detail.status === 'Failed' && detail.retryCount < MAX_RETRIES && (
                    <button onClick={() => retry(detail.id)} disabled={retrying === detail.id}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#ff6f00] text-white rounded-xl text-sm font-medium disabled:opacity-50">
                      <RotateCcw className={`w-4 h-4 ${retrying === detail.id ? 'animate-spin' : ''}`} />
                      Retry (attempt {detail.retryCount + 1} of {MAX_RETRIES})
                    </button>
                  )}
                  <button onClick={() => setDetail(null)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



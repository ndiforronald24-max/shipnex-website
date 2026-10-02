import { useState, useEffect, useCallback } from 'react';
import { Lock } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    try { const r = await apiClient.getAuditLogs(200); setLogs(Array.isArray(r) ? r : r?.data ?? []); }
    catch (e: any) { setError(e?.response?.data?.message || 'Failed to load audit logs'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Audit logs are strictly read-only — no edit or delete actions exist here by design.
  const filtered = logs.filter((l: any) => !search ||
    [l.action, l.actionType, l.entityType, l.entityId, l.userId].some((v: any) => v?.toLowerCase?.().includes(search.toLowerCase())));

  const typeColor = (t: string) => ({
    Create: 'bg-green-100 text-green-700', Update: 'bg-blue-100 text-blue-700',
    Delete: 'bg-red-100 text-red-700', StatusChange: 'bg-amber-100 text-amber-700',
    Login: 'bg-purple-100 text-purple-700', Logout: 'bg-gray-100 text-gray-600',
  } as Record<string, string>)[t] ?? 'bg-gray-100 text-gray-600';

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#ff6f00] border-t-transparent rounded-full animate-spin"></div></div>;

  return (<div>
    <div className="flex items-center justify-between mb-6">
      <div><h1 className="text-2xl font-bold">Audit Logs</h1><p className="text-gray-500 text-sm">{filtered.length} entries — immutable, read-only record</p></div>
      <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg"><Lock className="w-3.5 h-3.5"/>Read-only</div>
    </div>
    {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <input placeholder="Search actions, entity types..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full max-w-sm px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#ff6f00] outline-none"/>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]"><thead className="bg-gray-50/80"><tr>
          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Timestamp</th>
          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Entity</th>
          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Entity ID</th>
          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
        </tr></thead><tbody className="divide-y divide-gray-50">
          {filtered.length === 0 ? <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">No audit entries found</td></tr> :
          filtered.map((l: any) => (<tr key={l.id} className="hover:bg-gray-50/50">
            <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
            <td className="px-5 py-3 text-sm font-medium text-gray-900">{l.action}</td>
            <td className="px-5 py-3"><span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${typeColor(l.actionType)}`}>{l.actionType}</span></td>
            <td className="px-5 py-3 text-sm text-gray-600">{l.entityType}</td>
            <td className="px-5 py-3 text-xs text-gray-400 font-mono">{l.entityId ?? '—'}</td>
            <td className="px-5 py-3 text-xs text-gray-400 font-mono">{l.userId ?? 'system'}</td>
          </tr>))}
        </tbody></table>
      </div>
    </div>
  </div>);
}

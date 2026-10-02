import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search, Eye, FileText, MapPin, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { statusLabel, statusBadgeClass, ALL_STATUSES, can } from '../../utils/auth';
import { Link } from 'react-router-dom';

type SortKey = 'trackingNumber' | 'customer' | 'status' | 'origin' | 'destination' | 'estimatedDelivery' | 'lastUpdated';

/**
 * Module scope on purpose. Declared inside AdminShipments, this got a new identity
 * on every render, so React tore down and rebuilt all ten header cells each time -
 * losing the button focus after a sort click.
 */
function Th({ label, k, sortKey, onSort }: {
  label: string; k?: SortKey; sortKey?: SortKey; onSort?: (k: SortKey) => void;
}) {
  return (
    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">
      {k && sortKey && onSort ? (
        <button onClick={() => onSort(k)} className={`flex items-center gap-1 hover:text-gray-700 ${sortKey === k ? 'text-[#ff6f00]' : ''}`}>
          {label}<ArrowUpDown className="w-3 h-3" />
        </button>
      ) : label}
    </th>
  );
}

export default function AdminShipments() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('lastUpdated');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const fetchData = useCallback(async () => {
    try { const r = await apiClient.getAllShipments(); setShipments(Array.isArray(r) ? r : r?.data ?? []); }
    catch (e: any) { setError(e?.response?.data?.message || 'Failed to load shipments'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const customerOf = (s: any) => s.receiverName || s.senderName || '—';
  const updatedOf = (s: any) => s.lastUpdated || s.updatedAt || s.createdAt;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = shipments.filter((s: any) => {
      const matchQ = !q || [s.trackingNumber, s.receiverName, s.senderName, s.origin, s.destination, s.currentLocation]
        .some((v: any) => v?.toLowerCase().includes(q));
      return matchQ && (!filter || s.status === filter);
    });
    const dir = sortAsc ? 1 : -1;
    return list.sort((a: any, b: any) => {
      let av: any, bv: any;
      if (sortKey === 'lastUpdated') { av = new Date(updatedOf(a)).getTime() || 0; bv = new Date(updatedOf(b)).getTime() || 0; }
      else if (sortKey === 'estimatedDelivery') { av = a.estimatedDelivery ? new Date(a.estimatedDelivery).getTime() : 0; bv = b.estimatedDelivery ? new Date(b.estimatedDelivery).getTime() : 0; }
      else if (sortKey === 'customer') { av = String(customerOf(a)).toLowerCase(); bv = String(customerOf(b)).toLowerCase(); }
      else { av = String(a[sortKey] ?? '').toLowerCase(); bv = String(b[sortKey] ?? '').toLowerCase(); }
      if (av < bv) return -1 * dir; if (av > bv) return 1 * dir; return 0;
    });
  }, [shipments, search, filter, sortKey, sortAsc]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const rows = filtered.slice((page - 1) * perPage, page * perPage);

  const sortBy = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
    setPage(1);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#ff6f00] border-t-transparent rounded-full animate-spin"></div></div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>;

  return (<div>
    <div className="flex items-center justify-between mb-6">
      <div><h1 className="text-2xl font-bold">Shipments</h1><p className="text-gray-500 text-sm">{filtered.length} shipments</p></div>
      {can('shipmentsCreate') && (
        <Link to="/admin/shipments/create" className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#ff6f00] to-[#ff8f00] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"><Plus className="w-4 h-4"/>New Shipment</Link>
      )}
    </div>
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/><input placeholder="Search tracking, customer, route..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#ff6f00] outline-none"/></div>
        <select value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-white">
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]"><thead className="bg-gray-50/80"><tr>
        <Th label="Tracking Number" k="trackingNumber" sortKey={sortKey} onSort={sortBy} />
        <Th label="Customer" k="customer" sortKey={sortKey} onSort={sortBy} />
        <Th label="Type" />
        <Th label="Origin" k="origin" sortKey={sortKey} onSort={sortBy} />
        <Th label="Destination" k="destination" sortKey={sortKey} onSort={sortBy} />
        <Th label="Status" k="status" sortKey={sortKey} onSort={sortBy} />
        <Th label="Current Location" />
        <Th label="Est. Delivery" k="estimatedDelivery" sortKey={sortKey} onSort={sortBy} />
        <Th label="Last Updated" k="lastUpdated" sortKey={sortKey} onSort={sortBy} />
        <Th label="Actions" />
      </tr></thead><tbody className="divide-y divide-gray-50">
        {rows.length===0?<tr><td colSpan={10} className="px-5 py-12 text-center text-gray-400">No shipments match your search</td></tr>:
        rows.map((s:any)=><tr key={s.id} className="hover:bg-gray-50/50">
          <td className="px-5 py-3 text-sm font-medium"><Link to={`/admin/shipments/${s.id}`} className="hover:text-[#ff6f00]">{s.trackingNumber}</Link></td>
          <td className="px-5 py-3 text-sm text-gray-600">{customerOf(s)}</td>
          <td className="px-5 py-3 text-sm text-gray-600">{s.shipmentType ?? s.serviceType ?? '—'}</td>
          <td className="px-5 py-3 text-sm text-gray-600">{s.origin}</td>
          <td className="px-5 py-3 text-sm text-gray-600">{s.destination}</td>
          <td className="px-5 py-3">{can('shipmentsUpdate') ? (
            <Link to={`/admin/shipments/${s.id}/update`} className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full hover:opacity-80 ${statusBadgeClass(s.status)}`}>{statusLabel(s.status)}</Link>
          ) : <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${statusBadgeClass(s.status)}`}>{statusLabel(s.status)}</span>}</td>
          <td className="px-5 py-3 text-sm text-gray-600">{s.currentLocation || '—'}</td>
          <td className="px-5 py-3 text-sm text-gray-600">{s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString() : '—'}</td>
          <td className="px-5 py-3 text-sm text-gray-400">{updatedOf(s) ? new Date(updatedOf(s)).toLocaleDateString() : '—'}</td>
          <td className="px-5 py-3"><div className="flex gap-1">
            <Link to={`/admin/shipments/${s.id}`} title="View" className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Eye className="w-4 h-4"/></Link>
            {can('shipmentsUpdate') && <Link to={`/admin/shipments/${s.id}/update`} title="Update" className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500"><MapPin className="w-4 h-4"/></Link>}
            <Link to={`/admin/shipments/${s.id}?tab=documents`} title="Documents" className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-500"><FileText className="w-4 h-4"/></Link>
          </div></td>
        </tr>)}
      </tbody></table>
      </div>
      {pages>1&&<div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
        <p className="text-sm text-gray-500">{(page-1)*perPage+1}-{Math.min(page*perPage,filtered.length)} of {filtered.length}</p>
        <div className="flex gap-1">
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="p-2 rounded-lg border disabled:opacity-50"><ChevronLeft className="w-4 h-4"/></button>
          {Array.from({length:Math.min(pages,7)},(_,i)=>{
            const p = pages<=7 ? i+1 : (page<=4 ? i+1 : (page>=pages-3 ? pages-6+i : page-3+i));
            return <button key={p} onClick={()=>setPage(p)} className={`px-3 py-1.5 text-sm rounded-lg ${page===p?'bg-[#ff6f00] text-white':'border hover:bg-gray-50'}`}>{p}</button>;
          })}
          <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages} className="p-2 rounded-lg border disabled:opacity-50"><ChevronRight className="w-4 h-4"/></button>
        </div>
      </div>}
    </div>
  </div>);
}

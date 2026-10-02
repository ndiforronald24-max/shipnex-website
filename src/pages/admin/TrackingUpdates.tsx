import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Activity, Package, PawPrint, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { statusLabel } from '../../utils/auth';

interface TrackingRow {
  key: string;
  kind: 'shipment' | 'pet';
  trackingNumber: string;
  route: string;
  status: string;
  location: string;
  time: string;
  link: string;
}

export default function AdminTrackingUpdates() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 15;

  useEffect(() => {
    Promise.all([
      apiClient.getAllShipments().catch(() => []),
      apiClient.getAllPets().catch(() => []),
    ]).then(([s, p]: any[]) => {
      setShipments(Array.isArray(s) ? s : s?.data ?? []);
      setPets(Array.isArray(p) ? p : p?.data ?? []);
    }).catch((e: any) => setError(e?.response?.data?.message || 'Failed to load tracking updates'))
      .finally(() => setLoading(false));
  }, []);

  const rows: TrackingRow[] = useMemo(() => {
    const out: TrackingRow[] = [];
    for (const s of shipments) {
      const events = Array.isArray(s.events) ? s.events : [];
      if (events.length === 0) {
        out.push({
          key: `s-${s.id}-created`, kind: 'shipment', trackingNumber: s.trackingNumber,
          route: `${s.origin ?? ''} → ${s.destination ?? ''}`, status: s.status,
          location: s.currentLocation || '—', time: s.createdAt,
          link: `/admin/shipments/${s.id}`,
        });
      } else {
        for (const [ei, e] of events.entries()) {
          out.push({
            // Index is the last resort, not Math.random(): a random key changes on
            // every render, so React cannot match the row and remounts it.
            key: `s-${s.id}-${e.timestamp ?? e.eventTime ?? ei}`,
            kind: 'shipment', trackingNumber: s.trackingNumber,
            route: `${s.origin ?? ''} → ${s.destination ?? ''}`,
            status: e.status ?? s.status,
            location: e.location ?? e.locationName ?? '—',
            time: e.timestamp ?? e.eventTime ?? s.createdAt,
            link: `/admin/shipments/${s.id}`,
          });
        }
      }
    }
    for (const p of pets) {
      const events = Array.isArray(p.careEvents) ? p.careEvents : [];
      if (events.length === 0) {
        out.push({
          key: `p-${p.id}-created`, kind: 'pet', trackingNumber: p.trackingNumber,
          route: `${p.origin ?? ''} → ${p.destination ?? ''}`,
          status: p.journeyStatus ?? p.status ?? '—',
          location: p.currentLocationName || '—', time: p.createdAt,
          link: '/admin/pet-shipments',
        });
      } else {
        for (const [ei, e] of events.entries()) {
          out.push({
            key: `p-${p.id}-${e.eventTime ?? e.id ?? ei}`,
            kind: 'pet', trackingNumber: p.trackingNumber,
            route: `${p.origin ?? ''} → ${p.destination ?? ''}`,
            status: e.careStatus ?? e.eventType ?? p.journeyStatus ?? '—',
            location: e.locationName ?? '—', time: e.eventTime ?? p.createdAt,
            link: '/admin/pet-shipments',
          });
        }
      }
    }
    const q = search.toLowerCase();
    return out
      .filter((r) => (!kind || r.kind === kind) && (!q || [r.trackingNumber, r.route, r.location, r.status].some((v) => v?.toLowerCase().includes(q))))
      .sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());
  }, [shipments, pets, search, kind]);

  const pages = Math.max(1, Math.ceil(rows.length / perPage));
  const pageRows = rows.slice((page - 1) * perPage, page * perPage);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#ff6f00] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div>
      <Link to="/admin" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft className="w-4 h-4" />Back to dashboard</Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Activity className="w-6 h-6 text-[#ff6f00]" />Tracking Updates</h1>
        <p className="text-gray-500 text-sm mt-1">Latest tracking and pet-care events across all shipments · {rows.length} events</p>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search tracking #, route, location…" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#ff6f00]" />
          </div>
          <select value={kind} onChange={(e) => { setKind(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-white">
            <option value="">All types</option>
            <option value="shipment">Shipments</option>
            <option value="pet">Pet shipments</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tracking #</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Route</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pageRows.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">No tracking events found</td></tr>}
              {pageRows.map((r) => (
                <tr key={r.key} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${r.kind === 'pet' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {r.kind === 'pet' ? <PawPrint className="w-3 h-3" /> : <Package className="w-3 h-3" />}{r.kind === 'pet' ? 'Pet' : 'Shipment'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm font-medium"><Link to={r.link} className="hover:text-[#ff6f00]">{r.trackingNumber}</Link></td>
                  <td className="px-5 py-3 text-sm text-gray-600">{r.route}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{statusLabel(r.status)}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{r.location}</td>
                  <td className="px-5 py-3 text-sm text-gray-400">{r.time ? new Date(r.time).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">{(page - 1) * perPage + 1}-{Math.min(page * perPage, rows.length)} of {rows.length}</p>
            <div className="flex gap-1 items-center">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
              <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {pages}</span>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="p-2 rounded-lg border disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

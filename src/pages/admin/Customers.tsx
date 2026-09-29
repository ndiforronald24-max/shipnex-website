import { useState, useEffect } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { can } from '../../utils/auth';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const manage = can('customersManage');

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => { try { const r = await apiClient.getAllCustomers(); setCustomers(r.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } };
  const del = async (id: string) => { if (!confirm('Delete?')) return; try { await apiClient.deleteCustomer(id); fetchData(); } catch (e) { console.error(e); } };
  const filtered = customers.filter((c: any) => !search || `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#ff6f00] border-t-transparent rounded-full animate-spin"></div></div>;

  return (<div>
    <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold">Customers</h1><p className="text-gray-500 text-sm">{customers.length} total</p></div></div>
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="p-4 border-b border-gray-100"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/><input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"/></div></div>
      <table className="w-full"><thead className="bg-gray-50/80"><tr><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>{manage && <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>}</tr></thead>
      <tbody className="divide-y divide-gray-50">{filtered.length===0?<tr><td colSpan={4} className="px-5 py-12 text-center text-gray-400">No customers</td></tr>:filtered.map((c:any)=><tr key={c.id} className="hover:bg-gray-50/50"><td className="px-5 py-3 text-sm font-medium">{c.firstName} {c.lastName}</td><td className="px-5 py-3 text-sm text-gray-600">{c.email}</td><td className="px-5 py-3 text-sm text-gray-600">{c.phone??'—'}</td>{manage && <td className="px-5 py-3"><button onClick={()=>del(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4"/></button></td>}</tr>)}</tbody></table>
    </div></div>);
}

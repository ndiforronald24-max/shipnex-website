import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export default function AdminPetShipments() {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => { try { const r = await apiClient.getAllPets(); setPets(Array.isArray(r) ? r : r.data ?? []); } catch (e) { console.error(e); } finally { setLoading(false); } };
  const del = async (id: string) => { if (!confirm('Delete?')) return; try { await apiClient.deletePetShipment(id); fetchData(); } catch (e) { console.error(e); } };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#ff6f00] border-t-transparent rounded-full animate-spin"></div></div>;

  return (<div>
    <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold">Pet Shipments</h1><p className="text-gray-500 text-sm">{pets.length} total</p></div></div>
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full"><thead className="bg-gray-50/80"><tr><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tracking</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pet</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Route</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th></tr></thead>
      <tbody className="divide-y divide-gray-50">{pets.length===0?<tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">No pet shipments</td></tr>:pets.map((p:any)=><tr key={p.id} className="hover:bg-gray-50/50"><td className="px-5 py-3 text-sm font-medium">{p.trackingNumber}</td><td className="px-5 py-3 text-sm"><span className="font-medium">{p.petName}</span> <span className="text-gray-400">({p.petType})</span></td><td className="px-5 py-3 text-sm text-gray-600">{p.origin} → {p.destination}</td><td className="px-5 py-3"><span className="inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">{p.journeyStatus ?? p.status}</span></td><td className="px-5 py-3"><button onClick={()=>del(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4"/></button></td></tr>)}</tbody></table>
    </div></div>);
}

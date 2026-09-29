import { useState, useEffect } from 'react';
import { Truck, Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { can } from '../../utils/auth';

const VEHICLE_TYPES = ['Truck', 'Van', 'ContainerTruck', 'AirCargo', 'CargoShip', 'Trailer'];
const VEHICLE_STATUSES = ['Available', 'InUse', 'Maintenance'];

const emptyVehicle = { vin: '', licensePlate: '', vehicleType: 'Truck', make: '', model: '', year: '', driverName: '', driverPhone: '', status: 'Available', capacityWeight: '', currentLocation: '' };

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const manage = can('vehiclesManage');

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    try { const r = await apiClient.getAllVehicles(); setVehicles(Array.isArray(r) ? r : r?.data ?? []); }
    catch (e: any) { setError(e?.response?.data?.message || 'Failed to load vehicles'); }
    finally { setLoading(false); }
  };

  const save = async () => {
    try {
      const payload: Record<string, unknown> = { ...editing, year: editing.year ? parseInt(editing.year, 10) : undefined, capacityWeight: editing.capacityWeight ? parseInt(editing.capacityWeight, 10) : undefined };
      if (editing.id) await apiClient.updateVehicle(editing.id, payload);
      else await apiClient.createVehicle(payload);
      setEditing(null); fetchData();
    } catch (e: any) { alert(e?.response?.data?.message || 'Save failed'); }
  };

  const statusColor = (s: string) => ({ Available: 'bg-green-100 text-green-700', InUse: 'bg-blue-100 text-blue-700', Maintenance: 'bg-amber-100 text-amber-700' } as Record<string, string>)[s] ?? 'bg-gray-100 text-gray-600';

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#ff6f00] border-t-transparent rounded-full animate-spin"></div></div>;

  return (<div>
    <div className="flex items-center justify-between mb-6">
      <div><h1 className="text-2xl font-bold">Vehicles</h1><p className="text-gray-500 text-sm">{vehicles.length} in fleet</p></div>
      {manage && <button onClick={()=>setEditing({...emptyVehicle})} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#ff6f00] to-[#ff8f00] text-white rounded-xl text-sm font-medium"><Plus className="w-4 h-4"/>Add Vehicle</button>}
    </div>
    {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]"><thead className="bg-gray-50/80"><tr>
          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vehicle</th>
          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Driver</th>
          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
          {manage && <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>}
        </tr></thead><tbody className="divide-y divide-gray-50">
          {vehicles.length === 0 ? <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">No vehicles registered</td></tr> :
          vehicles.map((v: any) => (<tr key={v.id} className="hover:bg-gray-50/50">
            <td className="px-5 py-3"><p className="text-sm font-medium text-gray-900">{v.make} {v.model} {v.year ? `(${v.year})` : ''}</p><p className="text-xs text-gray-400">{v.licensePlate} · {v.vin}</p></td>
            <td className="px-5 py-3 text-sm text-gray-600">{v.vehicleType}</td>
            <td className="px-5 py-3 text-sm text-gray-600">{v.driverName || '—'}<p className="text-xs text-gray-400">{v.driverPhone || ''}</p></td>
            <td className="px-5 py-3"><span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${statusColor(v.status)}`}>{v.status}</span></td>
            <td className="px-5 py-3 text-sm text-gray-600">{v.currentLocation || '—'}</td>
            {manage && <td className="px-5 py-3"><div className="flex gap-1">
              <button onClick={()=>setEditing({...v, year: v.year ?? '', capacityWeight: v.capacityWeight ?? ''})} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Pencil className="w-4 h-4"/></button>
              <button onClick={async ()=>{ if(!confirm('Delete this vehicle?')) return; try { await apiClient.deleteVehicle(v.id); fetchData(); } catch(e: any){ alert(e?.response?.data?.message || 'Delete failed'); } }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4"/></button>
            </div></td>}
          </tr>))}
        </tbody></table>
      </div>
    </div>

    {editing && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={()=>setEditing(null)}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2"><Truck className="w-5 h-5 text-[#ff6f00]"/>{editing.id ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
            <button onClick={()=>setEditing(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5"/></button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <VField label="License Plate" value={editing.licensePlate} onChange={(v:string)=>setEditing({...editing, licensePlate:v})}/>
            <VField label="VIN" value={editing.vin} onChange={(v:string)=>setEditing({...editing, vin:v})}/>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={editing.vehicleType} onChange={e=>setEditing({...editing, vehicleType:e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-white">{VEHICLE_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={editing.status} onChange={e=>setEditing({...editing, status:e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-white">{VEHICLE_STATUSES.map(t=><option key={t}>{t}</option>)}</select></div>
            <VField label="Make" value={editing.make} onChange={(v:string)=>setEditing({...editing, make:v})}/>
            <VField label="Model" value={editing.model} onChange={(v:string)=>setEditing({...editing, model:v})}/>
            <VField label="Year" type="number" value={editing.year} onChange={(v:string)=>setEditing({...editing, year:v})}/>
            <VField label="Capacity Weight (kg)" type="number" value={editing.capacityWeight} onChange={(v:string)=>setEditing({...editing, capacityWeight:v})}/>
            <VField label="Driver Name" value={editing.driverName} onChange={(v:string)=>setEditing({...editing, driverName:v})}/>
            <VField label="Driver Phone" value={editing.driverPhone} onChange={(v:string)=>setEditing({...editing, driverPhone:v})}/>
            <div className="md:col-span-2"><VField label="Current Location" value={editing.currentLocation} onChange={(v:string)=>setEditing({...editing, currentLocation:v})}/></div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={()=>setEditing(null)} className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl">Cancel</button>
            <button onClick={save} className="flex items-center gap-2 px-5 py-2.5 bg-[#ff6f00] text-white rounded-xl text-sm font-medium"><Save className="w-4 h-4"/>Save</button>
          </div>
        </div>
      </div>
    )}
  </div>);
}

function VField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (<div><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input type={type} value={value ?? ''} onChange={e=>onChange(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#ff6f00]"/></div>);
}

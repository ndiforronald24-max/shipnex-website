import { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Mail, Clock, Plus, Edit2, Trash2, X, Save, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import type { OfficeResponse, CreateOfficeRequest } from '../../types';

const emptyOffice: CreateOfficeRequest = { name: '', code: '', address: '', city: '', state: '', country: '', region: '', postalCode: '', latitude: undefined, longitude: undefined, phone: '', email: '', openingHours: '', managerName: '', managerPhone: '', type: 'Hub' };

export default function AdminOffices() {
  const [offices, setOffices] = useState<OfficeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingOffice, setEditingOffice] = useState<OfficeResponse | null>(null);
  const [formData, setFormData] = useState<CreateOfficeRequest>(emptyOffice);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try { const r = await apiClient.getAllOffices(); setOffices(Array.isArray(r) ? r : r?.data ?? []); }
    catch (e: any) { setError(e?.response?.data?.message || 'Failed to load offices'); }
    finally { setLoading(false); }
  };

  const handleCreate = () => { setEditingOffice(null); setFormData(emptyOffice); setShowForm(true); };

  const handleEdit = (office: OfficeResponse) => {
    setEditingOffice(office);
    setFormData({ name: office.name, code: office.code, address: office.address, city: office.city || '', state: office.state || '', country: office.country || '', region: office.region || '', postalCode: office.postalCode || '', latitude: office.latitude, longitude: office.longitude, phone: office.phone || '', email: office.email || '', openingHours: office.openingHours || '', managerName: office.managerName || '', managerPhone: office.managerPhone || '', type: office.type });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code || !formData.address) { setError('Name, code, and address are required'); return; }
    setSaving(true); setError('');
    try {
      if (editingOffice) { await apiClient.updateOffice(editingOffice.id, { ...formData }); }
      else { await apiClient.createOffice(formData); }
      setShowForm(false); setEditingOffice(null); setFormData(emptyOffice); await fetchData();
    } catch (e: any) { setError(e?.response?.data?.message || 'Failed to save office'); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id: string) => { try { await apiClient.deactivateOffice(id); await fetchData(); } catch (e: any) { setError(e?.response?.data?.message || 'Failed to deactivate office'); } };
  const handleDelete = async (id: string) => { try { await apiClient.deleteOffice(id); setDeleteConfirm(null); await fetchData(); } catch (e: any) { setError(e?.response?.data?.message || 'Failed to delete office'); } };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#ff6f00] border-t-transparent rounded-full animate-spin"></div></div>;

  return (<div>
    <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold">Offices</h1><p className="text-gray-500 text-sm">{offices.length} offices worldwide</p></div><button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#ff6f00] text-white rounded-xl hover:bg-[#e65100] text-sm font-medium"><Plus className="w-4 h-4" /> Add Office</button></div>
    {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
    {showForm && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"><div className="p-6 border-b border-gray-100 flex items-center justify-between"><h2 className="text-xl font-bold">{editingOffice ? 'Edit Office' : 'Create Office'}</h2><button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div><div className="p-6 space-y-4"><div className="grid md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff6f00] outline-none" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Code *</label><input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff6f00] outline-none" /></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Address *</label><input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff6f00] outline-none" /></div><div className="grid md:grid-cols-3 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff6f00] outline-none" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">State</label><input type="text" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff6f00] outline-none" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label><input type="text" value={formData.postalCode} onChange={e => setFormData({ ...formData, postalCode: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff6f00] outline-none" /></div></div></div><div className="p-6 border-t border-gray-100 flex justify-end gap-3"><button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button><button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-[#ff6f00] text-white rounded-xl hover:bg-[#e65100] disabled:opacity-50"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}</button></div></div></div>)}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {offices.length === 0 && !error && <p className="text-gray-400 col-span-full text-center py-12">No offices configured yet. Click "Add Office" to create one.</p>}
      {offices.map(o => (
        <div key={o.id} className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-shadow ${!o.isActive ? 'opacity-60 border-gray-200' : 'border-gray-100'}`}>
          <div className="flex items-start justify-between mb-3"><div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Building2 className="w-5 h-5" /></div><div className="flex items-center gap-2"><span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${o.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{o.isActive ? 'Active' : 'Inactive'}</span><span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">{o.type || 'Hub'}</span></div></div>
          <h3 className="font-semibold text-gray-900">{o.name}</h3><p className="text-xs text-gray-400 mb-3">Code: {o.code} | Region: {o.region || 'N/A'}</p>
          <div className="space-y-1.5 text-sm text-gray-600"><p className="flex items-start gap-2"><MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />{o.address}{o.city ? `, ${o.city}` : ''}{o.country ? `, ${o.country}` : ''}</p>{o.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" />{o.phone}</p>}{o.email && <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" />{o.email}</p>}{o.openingHours && <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" />{o.openingHours}</p>}</div>
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50"><button onClick={() => handleEdit(o)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><Edit2 className="w-3 h-3" /> Edit</button><button onClick={() => handleDeactivate(o.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100">{o.isActive ? <><EyeOff className="w-3 h-3" /> Deactivate</> : <><Eye className="w-3 h-3" /> Activate</>}</button><button onClick={() => setDeleteConfirm(o.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><Trash2 className="w-3 h-3" /> Delete</button></div>
        </div>
      ))}
    </div>
    {deleteConfirm && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm"><h3 className="text-lg font-bold mb-2">Delete Office?</h3><p className="text-gray-500 text-sm mb-4">This action cannot be undone.</p><div className="flex justify-end gap-3"><button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-gray-600">Cancel</button><button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700">Delete</button></div></div></div>)}
  </div>);
}

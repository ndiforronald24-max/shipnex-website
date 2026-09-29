import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { apiClient } from '../services/apiClient';

export default function AdminShipments() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    senderName: '', senderAddress: '', receiverName: '', receiverAddress: '',
    origin: '', destination: '', weight: '', serviceType: 'Standard'
  });

  useEffect(() => { fetchShipments(); }, []);

  const fetchShipments = async () => {
    try {
      const res = await apiClient.getAllShipments();
      setShipments(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createShipment({ ...form, weight: parseFloat(form.weight) });
      setShowForm(false);
      setForm({ senderName: '', senderAddress: '', receiverName: '', receiverAddress: '', origin: '', destination: '', weight: '', serviceType: 'Standard' });
      fetchShipments();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this shipment?')) return;
    try { await apiClient.deleteShipment(id); fetchShipments(); }
    catch (err) { console.error(err); }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Manage Shipments</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-[#ff6f00] text-white rounded-lg hover:bg-[#e65100]">
          <Plus className="w-4 h-4" /> New Shipment
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <input placeholder="Sender Name" value={form.senderName} onChange={e => setForm({...form, senderName: e.target.value})} required className="px-4 py-2 border rounded-lg" />
            <input placeholder="Sender Address" value={form.senderAddress} onChange={e => setForm({...form, senderAddress: e.target.value})} required className="px-4 py-2 border rounded-lg" />
            <input placeholder="Receiver Name" value={form.receiverName} onChange={e => setForm({...form, receiverName: e.target.value})} required className="px-4 py-2 border rounded-lg" />
            <input placeholder="Receiver Address" value={form.receiverAddress} onChange={e => setForm({...form, receiverAddress: e.target.value})} required className="px-4 py-2 border rounded-lg" />
            <input placeholder="Origin" value={form.origin} onChange={e => setForm({...form, origin: e.target.value})} required className="px-4 py-2 border rounded-lg" />
            <input placeholder="Destination" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} required className="px-4 py-2 border rounded-lg" />
            <input type="number" step="0.1" placeholder="Weight (kg)" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} required className="px-4 py-2 border rounded-lg" />
            <select value={form.serviceType} onChange={e => setForm({...form, serviceType: e.target.value})} className="px-4 py-2 border rounded-lg">
              <option>Standard</option><option>Express</option>
            </select>
          </div>
          <button type="submit" className="mt-4 px-6 py-2 bg-[#1a237e] text-white rounded-lg hover:bg-[#0d47a1]">Create Shipment</button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sender</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receiver</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {shipments.map((s: any) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{s.trackingNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{s.senderName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{s.receiverName}</td>
                <td className="px-6 py-4"><span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">{s.status}</span></td>
                <td className="px-6 py-4"><button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

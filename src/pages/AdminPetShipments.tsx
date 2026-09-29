import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { apiClient } from '../services/apiClient';

export default function AdminPetShipments() {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPets(); }, []);

  const fetchPets = async () => {
    try {
      const res = await apiClient.getAllPets();
      setPets(Array.isArray(res) ? res : res.data ?? []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pet shipment?')) return;
    try { await apiClient.deletePetShipment(id); fetchPets(); }
    catch (err) { console.error(err); }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Manage Pet Shipments</h1>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pet</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pets.map((p: any) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{p.trackingNumber}</td>
                <td className="px-6 py-4 text-sm">{p.petName} <span className="text-gray-400">({p.petType})</span></td>
                <td className="px-6 py-4 text-sm text-gray-600">{p.ownerName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{p.origin} → {p.destination}</td>
                <td className="px-6 py-4"><span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">{p.journeyStatus ?? p.status}</span></td>
                <td className="px-6 py-4"><button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

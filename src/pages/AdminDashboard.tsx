import { useState, useEffect } from 'react';
import { Package, Users, PawPrint, TrendingUp } from 'lucide-react';
import { apiClient } from '../services/apiClient';

export default function AdminDashboard() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [s, c, p] = await Promise.all([
        apiClient.getAllShipments(),
        apiClient.getAllCustomers(),
        apiClient.getAllPets(),
      ]);
      setShipments(s.data);
      setCustomers(c.data);
      setPets(p.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  const stats = [
    { label: 'Total Shipments', value: shipments.length, icon: Package, color: 'bg-blue-500' },
    { label: 'Customers', value: customers.length, icon: Users, color: 'bg-green-500' },
    { label: 'Pet Shipments', value: pets.length, icon: PawPrint, color: 'bg-purple-500' },
    { label: 'In Transit', value: shipments.filter((s: any) => s.status === 'In Transit').length, icon: TrendingUp, color: 'bg-orange-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="font-semibold text-lg">Recent Shipments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receiver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {shipments.slice(0, 5).map((shipment: any) => (
                <tr key={shipment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{shipment.trackingNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{shipment.receiverName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{shipment.destination}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${shipment.status === 'Delivered' ? 'bg-green-100 text-green-700' : shipment.status === 'In Transit' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {shipment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

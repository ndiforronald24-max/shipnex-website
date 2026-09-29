import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, MapPin, ArrowLeft, FileText } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { ALL_STATUSES, statusLabel, can } from '../../utils/auth';
import ShipmentMap from '../../components/Map';

const numOrUndefined = (v: string): number | undefined => {
  const t = v.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
};

export default function UpdateShipment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ status: 'InTransit', locationName: '', latitude: '', longitude: '', description: '', eventTime: '' });
  const [shipment, setShipment] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const authorized = can('shipmentsUpdate');

  useEffect(() => {
    apiClient.getShipment(id!).then((s: any) => setShipment(s?.data ?? s)).catch(() => setShipment(null));
  }, [id]);

  const update = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(''); setSuccess('');
    try {
      const lat = numOrUndefined(form.latitude);
      const lng = numOrUndefined(form.longitude);
      // Backend: updates shipment, creates tracking event, updates location, writes audit log, triggers notifications
      await apiClient.addTrackingEvent(id!, {
        status: form.status,
        locationName: form.locationName,
        latitude: lat,
        longitude: lng,
        description: form.description || undefined,
        eventTime: form.eventTime ? new Date(form.eventTime).toISOString() : undefined,
      });
      setSuccess('Tracking update saved. Shipment, tracking event, location, audit log and notifications were processed by the backend.');
      setForm(p => ({ ...p, description: '' }));
      setShipment((prev: any) => prev ? {
        ...prev,
        status: form.status,
        currentLocation: form.locationName,
        currentLatitude: lat ?? prev.currentLatitude,
        currentLongitude: lng ?? prev.currentLongitude,
      } : prev);
    } catch (err: any) { setError(err?.response?.data?.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  if (!authorized) return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">Your role is not authorized to update shipments. Contact a SuperAdmin.</div>
  );

  return (<div>
    <button onClick={()=>navigate(shipment ? `/admin/shipments/${id}` : '/admin/shipments')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft className="w-4 h-4"/>Back</button>
    <h1 className="text-2xl font-bold mb-1">Update Shipment</h1>
    {shipment && <p className="text-gray-500 text-sm mb-6"><span className="font-medium text-gray-700">{shipment.trackingNumber}</span> · {shipment.origin} → {shipment.destination} · Current: {shipment.currentLocation || '—'}</p>}
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl">
      {error&&<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
      {success&&<div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">{success}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
        <select value={form.status} onChange={e=>update('status',e.target.value)} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-white">
          {ALL_STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Current Location <span className="text-red-500">*</span></label>
        <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/><input value={form.locationName} onChange={e=>update('locationName',e.target.value)} placeholder="e.g. Chicago, IL - Sorting Facility" required className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"/></div></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Latitude (optional)</label><input value={form.latitude} onChange={e=>update('latitude',e.target.value)} placeholder="41.8781" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"/></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Longitude (optional)</label><input value={form.longitude} onChange={e=>update('longitude',e.target.value)} placeholder="-87.6298" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"/></div>
        </div>
        <p className="text-xs text-gray-400 -mt-2">Tip: right-click a spot in <a href="https://www.google.com/maps" target="_blank" rel="noreferrer" className="text-[#ff6f00] hover:underline">Google Maps</a> to copy coordinates.</p>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Event Time (defaults to now)</label><input type="datetime-local" value={form.eventTime} onChange={e=>update('eventTime',e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"/></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Tracking Description</label><textarea value={form.description} onChange={e=>update('description',e.target.value)} rows={3} placeholder="e.g. Package scanned at sorting facility" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none resize-none"/></div>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <ShipmentMap
            origin={{ lat: Number(shipment.originLatitude ?? 0) || 0, lng: Number(shipment.originLongitude ?? 0) || 0, name: shipment.origin || 'Origin' }}
            destination={{ lat: Number(shipment?.destinationLatitude ?? 0) || 0, lng: Number(shipment?.destinationLongitude ?? 0) || 0, name: shipment?.destination || 'Destination' }}
          />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#ff6f00] to-[#ff8f00] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"><Save className="w-4 h-4"/>{saving?'Saving...':'Save Update'}</button>
          {id && <button type="button" onClick={()=>navigate(`/admin/shipments/${id}?tab=documents`)} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"><FileText className="w-4 h-4"/>Manage Documents</button>}
        </div>
      </form>
      {shipment && <div className="mt-6">
        <p className="text-sm font-medium text-gray-700 mb-1.5">Shipment route map</p>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <ShipmentMap
            origin={{ lat: Number(shipment.originLatitude ?? 0) || 0, lng: Number(shipment.originLongitude ?? 0) || 0, name: shipment.origin || 'Origin' }}
            destination={{ lat: Number(shipment.destinationLatitude ?? 0) || 0, lng: Number(shipment.destinationLongitude ?? 0) || 0, name: shipment.destination || 'Destination' }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Stored origin/destination from the database. Use the coordinates above to record the latest reported location. No continuous GPS tracking is claimed.</p>
      </div>}
    </div>
  </div>);
}

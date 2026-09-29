import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, FileText, Clock, Package, Eye, EyeOff, Trash2, Plus } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { statusLabel, statusBadgeClass, can } from '../../utils/auth';

export default function ShipmentDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [shipment, setShipment] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [tab, setTab] = useState<'overview' | 'documents'>((searchParams.get('tab') as 'documents') ?? 'overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDocForm, setShowDocForm] = useState(false);
  const manageDocs = can('documentsManage');

  useEffect(() => {
    Promise.all([
      apiClient.getShipment(id!),
      apiClient.getShipmentDocuments(id!).catch(() => []),
    ]).then(([s, d]: any[]) => {
      setShipment(s?.data ?? s);
      setDocs(Array.isArray(d) ? d : d?.data ?? []);
    }).catch((e: any) => setError(e?.response?.data?.message || 'Failed to load shipment'))
      .finally(() => setLoading(false));
  }, [id]);

  const refreshDocs = () => apiClient.getShipmentDocuments(id!).then((d: any) => setDocs(Array.isArray(d) ? d : d?.data ?? [])).catch(() => {});

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#ff6f00] border-t-transparent rounded-full animate-spin"></div></div>;
  if (error || !shipment) return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error || 'Shipment not found'}</div>;

  const events = (shipment.events ?? []).slice().reverse();

  return (<div>
    <Link to="/admin/shipments" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft className="w-4 h-4"/>Back to shipments</Link>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{shipment.trackingNumber}</h1>
        <p className="text-gray-500 text-sm mt-1">{shipment.origin} → {shipment.destination}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${statusBadgeClass(shipment.status)}`}>{statusLabel(shipment.status)}</span>
        {can('shipmentsUpdate') && <Link to={`/admin/shipments/${id}/update`} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#ff6f00] to-[#ff8f00] text-white rounded-xl text-sm font-medium hover:shadow-lg"><MapPin className="w-4 h-4"/>Update</Link>}
      </div>
    </div>

    <div className="flex gap-1 mb-6 bg-white border border-gray-100 rounded-xl p-1 w-fit">
      <button onClick={()=>setTab('overview')} className={`px-4 py-2 text-sm font-medium rounded-lg ${tab==='overview'?'bg-[#ff6f00] text-white':'text-gray-600 hover:bg-gray-50'}`}>Overview</button>
      <button onClick={()=>{setTab('documents'); refreshDocs();}} className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-1.5 ${tab==='documents'?'bg-[#ff6f00] text-white':'text-gray-600 hover:bg-gray-50'}`}><FileText className="w-4 h-4"/>Documents ({docs.length})</button>
    </div>

    {tab === 'overview' && (<>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <InfoCard title="Customer" rows={[['Receiver', shipment.receiverName], ['Sender', shipment.senderName], ['Address', shipment.receiverAddress]]} />
        <InfoCard title="Shipment" rows={[['Service', shipment.serviceType], ['Reference', shipment.referenceNumber || '—'], ['Weight', `${shipment.weight} kg`], ['Pieces', shipment.numberOfPieces]]} />
        <InfoCard title="Delivery" rows={[['Current Location', shipment.currentLocation || '—'], ['Est. Delivery', shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString() : '—'], ['Created', new Date(shipment.createdAt).toLocaleString()]]} />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400"/>Tracking History</h2>
        {events.length === 0 ? <p className="text-gray-400 text-sm">No tracking events yet</p> : (
          <div className="space-y-0">
            {events.map((e: any, i: number) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-[#ff6f00]' : 'bg-gray-300'}`} />
                  {i < events.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
                </div>
                <div className="pb-6">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusBadgeClass(e.status)}`}>{statusLabel(e.status)}</span>
                    <span className="text-xs text-gray-400">{new Date(e.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 mt-1">{e.location}</p>
                  {e.description && <p className="text-sm text-gray-500">{e.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>)}

    {tab === 'documents' && (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Documents</h2>
          {manageDocs && <button onClick={()=>setShowDocForm(!showDocForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff6f00] text-white rounded-lg text-sm font-medium"><Plus className="w-4 h-4"/>Add</button>}
        </div>
        {showDocForm && manageDocs && (
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <DocUpload shipmentId={id!} onDone={()=>{setShowDocForm(false); refreshDocs();}} />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]"><thead className="bg-gray-50/80"><tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Document #</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">File</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer Visible</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
          </tr></thead><tbody className="divide-y divide-gray-50">
            {docs.length === 0 ? <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">No documents attached</td></tr> :
            docs.map((d: any) => (<tr key={d.id} className="hover:bg-gray-50/50">
              <td className="px-6 py-3 text-sm font-medium text-gray-900">{d.documentNumber}</td>
              <td className="px-6 py-3 text-sm text-gray-600">{d.documentType}</td>
              <td className="px-6 py-3 text-sm"><a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{d.fileName}</a></td>
              <td className="px-6 py-3">{d.customerVisible ? <Eye className="w-4 h-4 text-green-500"/> : <EyeOff className="w-4 h-4 text-gray-400"/>}</td>
              <td className="px-6 py-3"><div className="flex gap-1">
                {manageDocs && <button title="Toggle visibility" onClick={async ()=>{ await apiClient.updateDocumentVisibility(d.id, !d.customerVisible); refreshDocs(); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500">{d.customerVisible ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>}
                {manageDocs && <button title="Delete" onClick={async ()=>{ if(!confirm('Delete this document?')) return; await apiClient.deleteDocument(d.id); refreshDocs(); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4"/></button>}
              </div></td>
            </tr>))}
          </tbody></table>
        </div>
      </div>
    )}
  </div>);
}

function InfoCard({ title, rows }: { title: string; rows: [string, any][] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-gray-400"/>{title}</h3>
      <dl className="space-y-2">{rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-2 text-sm"><dt className="text-gray-500">{k}</dt><dd className="text-gray-800 font-medium text-right">{v ?? '—'}</dd></div>
      ))}</dl>
    </div>
  );
}

function DocUpload({ shipmentId, onDone }: { shipmentId: string; onDone: () => void }) {
  const [d, setD] = useState({ documentType: 'Invoice', fileName: '', fileUrl: '', description: '', customerVisible: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  return (<div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 max-w-2xl">
    {error && <p className="text-sm text-red-600">{error}</p>}
    <div className="grid md:grid-cols-2 gap-3">
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select value={d.documentType} onChange={e=>setD({...d, documentType:e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-white">
          {['Invoice','PackingList','BillOfLading','CustomsDeclaration','HealthCertificate','VaccinationRecord','Other'].map(t=><option key={t}>{t}</option>)}
        </select></div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">File name</label>
        <input value={d.fileName} onChange={e=>setD({...d, fileName:e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"/></div>
    </div>
    <div><label className="block text-sm font-medium text-gray-700 mb-1">File URL</label>
      <input value={d.fileUrl} onChange={e=>setD({...d, fileUrl:e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"/></div>
    <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={d.customerVisible} onChange={e=>setD({...d, customerVisible:e.target.checked})}/>Visible to customer on tracking page</label>
    <div className="flex gap-2">
      <button disabled={saving || !d.fileName || !d.fileUrl} onClick={async ()=>{ setSaving(true); setError(''); try { await apiClient.createDocument({ shipmentId, ...d, contentType: 'application/octet-stream', fileSize: 0 }); onDone(); } catch(e: any){ setError(e?.response?.data?.message || 'Upload failed'); } finally { setSaving(false); } }} className="px-4 py-2 text-sm bg-[#ff6f00] text-white rounded-xl font-medium disabled:opacity-50">Save Document</button>
      <button onClick={onDone} className="px-4 py-2 text-sm border border-gray-200 rounded-xl">Cancel</button>
    </div>
  </div>);
}

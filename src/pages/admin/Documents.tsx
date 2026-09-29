import { useEffect, useState } from 'react';
import { FileText, Search, Download, Eye, EyeOff, Trash2, Plus, X } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { can } from '../../utils/auth';

export default function AdminDocuments() {
  const [shipmentId, setShipmentId] = useState('');
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const manage = can('documentsManage');

  const fetchDocs = async (id: string) => {
    if (!id.trim()) { setError('Enter a shipment ID (GUID) first.'); return; }
    setLoading(true); setError(''); setSearched(true);
    try {
      const r = await apiClient.getShipmentDocuments(id.trim());
      setDocs(Array.isArray(r) ? r : r?.data ?? []);
    } catch (e: any) { setError(e?.response?.data?.message || 'Failed to load documents'); setDocs([]); }
    finally { setLoading(false); }
  };

  const refresh = () => fetchDocs(shipmentId);

  /** Opens a document through a short-lived signed access URL (private storage). */
  const openSecure = async (d: any) => {
    setError('');
    try {
      const r: any = await apiClient.getDocumentAccessUrl(d.id, 300);
      const url = r?.url ?? r?.Url;
      if (url) window.open(url, '_blank', 'noopener');
      else setError('Could not create a secure access link.');
    } catch (e: any) { setError(e?.response?.data?.message || 'Could not create a secure access link.'); }
  };

  return (<div>
    <div className="mb-6"><h1 className="text-2xl font-bold">Documents</h1><p className="text-gray-500 text-sm">Look up a shipment to manage its documents</p></div>
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
        <input value={shipmentId} onChange={e=>setShipmentId(e.target.value)} onKeyDown={e=>e.key==='Enter'&&fetchDocs(shipmentId)} placeholder="Shipment ID (GUID) — copy from the shipments table" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#ff6f00] outline-none"/>
      </div>
      <button onClick={()=>fetchDocs(shipmentId)} className="px-5 py-2.5 bg-[#ff6f00] text-white rounded-xl text-sm font-medium">Find Documents</button>
    </div>
    {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
    {loading && <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-[#ff6f00] border-t-transparent rounded-full animate-spin"></div></div>}
    {!loading && searched && (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{docs.length} document(s)</h2>
          {manage && <button onClick={()=>setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff6f00] text-white rounded-lg text-sm font-medium"><Plus className="w-4 h-4"/>Add Document</button>}
        </div>
        {showAdd && manage && <div className="p-5 border-b border-gray-100 bg-gray-50/50"><DocAdd shipmentId={shipmentId.trim()} onDone={()=>{setShowAdd(false); refresh();}} /></div>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]"><thead className="bg-gray-50/80"><tr>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Document #</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">File</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer Visible</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
          </tr></thead><tbody className="divide-y divide-gray-50">
            {docs.length === 0 ? <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">No documents for this shipment</td></tr> :
            docs.map((d: any) => (<tr key={d.id} className="hover:bg-gray-50/50">
              <td className="px-5 py-3 text-sm font-medium text-gray-900">{d.documentNumber}</td>
              <td className="px-5 py-3 text-sm text-gray-600">{d.documentType}</td>
              <td className="px-5 py-3 text-sm"><button title="Open via temporary secure link" onClick={()=>openSecure(d)} className="text-blue-500 hover:underline flex items-center gap-1"><Download className="w-3.5 h-3.5"/>{d.fileName}</button></td>
              <td className="px-5 py-3">{d.customerVisible ? <Eye className="w-4 h-4 text-green-500"/> : <EyeOff className="w-4 h-4 text-gray-400"/>}</td>
              <td className="px-5 py-3"><div className="flex gap-1">
                {manage && <button title="Toggle visibility" onClick={async ()=>{ await apiClient.updateDocumentVisibility(d.id, !d.customerVisible); refresh(); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500">{d.customerVisible ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>}
                {manage && <button title="Delete" onClick={async ()=>{ if(!confirm('Delete this document?')) return; await apiClient.deleteDocument(d.id); refresh(); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4"/></button>}
              </div></td>
            </tr>))}
          </tbody></table>
        </div>
      </div>
    )}
    {!searched && !loading && (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center"><FileText className="w-12 h-12 text-gray-300 mx-auto mb-4"/><p className="text-gray-400">Enter a shipment ID above to view its documents</p></div>
    )}
  </div>);
}

const FALLBACK_TYPES = ['Invoice', 'PackingList', 'BillOfLading', 'CustomsDeclaration', 'HealthCertificate', 'VaccinationRecord', 'Other'];

function DocAdd({ shipmentId, onDone }: { shipmentId: string; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('Invoice');
  const [description, setDescription] = useState('');
  const [customerVisible, setCustomerVisible] = useState(false);
  const [types, setTypes] = useState<string[]>(FALLBACK_TYPES);
  const [maxSizeMb, setMaxSizeMb] = useState(10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.getDocumentTypes()
      .then((r: any) => {
        if (Array.isArray(r?.types) && r.types.length > 0) setTypes(r.types);
        if (r?.maxFileSizeBytes) setMaxSizeMb(Math.max(1, Math.round(r.maxFileSizeBytes / (1024 * 1024))));
      })
      .catch(() => { /* backend catalogue unavailable — keep the fallback list */ });
  }, []);

  const submit = async () => {
    if (!file) { setError('Choose a file to upload.'); return; }
    setSaving(true); setError('');
    try {
      await apiClient.uploadDocument(file, { shipmentId, documentType, description, customerVisible });
      onDone();
    } catch (e: any) { setError(e?.response?.data?.message || 'Upload failed'); }
    finally { setSaving(false); }
  };

  return (<div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 max-w-2xl">
    <div className="flex items-center justify-between"><h3 className="font-semibold text-sm">Upload Document</h3><button onClick={onDone} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4"/></button></div>
    {error && <p className="text-sm text-red-600">{error}</p>}
    <div className="grid md:grid-cols-2 gap-3">
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select value={documentType} onChange={e=>setDocumentType(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-white">
          {types.map(t=><option key={t} value={t}>{t}</option>)}
        </select></div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">File (max {maxSizeMb} MB)</label>
        <input type="file" onChange={e=>setFile(e.target.files?.[0] ?? null)} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 file:mr-3 file:px-3 file:py-1 file:rounded-lg file:border-0 file:bg-[#fff3e0] file:text-[#e65100] file:text-xs file:font-medium"/></div>
    </div>
    <div><label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
      <input value={description} onChange={e=>setDescription(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"/></div>
    <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={customerVisible} onChange={e=>setCustomerVisible(e.target.checked)}/>Visible to customer on public tracking</label>
    <button disabled={saving || !file} onClick={submit} className="px-4 py-2 text-sm bg-[#ff6f00] text-white rounded-xl font-medium disabled:opacity-50">{saving ? 'Uploading...' : 'Upload Document'}</button>
  </div>);
}

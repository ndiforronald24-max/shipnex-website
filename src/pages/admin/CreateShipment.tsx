import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, User, Package, MapPin, FileText, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

const steps = ['Customer', 'Shipment Type', 'Service', 'Origin', 'Destination', 'Package Details', 'Documents', 'Confirmation'];

const emptyForm = {
  senderName: '', senderAddress: '',
  receiverName: '', receiverAddress: '',
  shipmentType: 'Standard', serviceType: 'Standard',
  origin: '', destination: '',
  weight: '', numberOfPieces: '1', referenceNumber: '', estimatedDelivery: '', notes: '',
};

export default function CreateShipment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [docs, setDocs] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const update = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const submit = async () => {
    setSubmitting(true); setError('');
    try {
      const payload: Record<string, unknown> = {
        senderName: form.senderName, senderAddress: form.senderAddress,
        receiverName: form.receiverName, receiverAddress: form.receiverAddress,
        origin: form.origin, destination: form.destination,
        weight: parseFloat(form.weight) || 0, numberOfPieces: parseInt(form.numberOfPieces, 10) || 1,
        serviceType: form.serviceType, shipmentType: form.shipmentType,
      };
      if (form.referenceNumber) payload.referenceNumber = form.referenceNumber;
      if (form.estimatedDelivery) payload.estimatedDelivery = new Date(form.estimatedDelivery).toISOString();
      if (form.notes) payload.notes = form.notes;
      // All creation goes through the backend API
      const shipment = await apiClient.createShipment(payload);
      const shipmentId = shipment?.id ?? shipment?.data?.id;
      for (const d of docs) {
        try {
          await apiClient.createDocument({ shipmentId, documentType: d.documentType, fileName: d.fileName, fileUrl: d.fileUrl, contentType: d.contentType || 'application/octet-stream', fileSize: d.fileSize || 0, description: d.description, customerVisible: !!d.customerVisible });
        } catch { /* shipment creation must succeed even if a doc upload fails */ }
      }
      navigate(shipmentId ? `/admin/shipments/${shipmentId}` : '/admin/shipments');
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to create shipment'); }
    finally { setSubmitting(false); }
  };

  const Field = ({ label, field, type = 'text', ph = '', required = false }: any) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500"> *</span>}</label>
      <input type={type} value={form[field as keyof typeof form]} onChange={e=>update(field,e.target.value)} placeholder={ph}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#ff6f00] outline-none"/>
    </div>
  );
  const Select = ({ label, field, options }: any) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select value={form[field as keyof typeof form]} onChange={e=>update(field,e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-white">
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
  const stepValid = (): boolean => {
    const f = form as any;
    switch (step) {
      case 0: return !!f.senderName && !!f.senderAddress && !!f.receiverName && !!f.receiverAddress;
      case 3: return !!f.origin;
      case 4: return !!f.destination;
      case 5: return (parseFloat(f.weight) || 0) > 0 && (parseInt(f.numberOfPieces, 10) || 0) >= 1;
      default: return true;
    }
  };
  return (<div>
    <div className="mb-6"><h1 className="text-2xl font-bold">Create Shipment</h1><p className="text-gray-500 text-sm">Step {step+1} of {steps.length}</p></div>
    <div className="flex items-center gap-2 mb-8 flex-wrap">{steps.map((s,i)=><div key={s} className="flex items-center gap-1"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${i<=step?'bg-[#ff6f00] text-white':'bg-gray-200 text-gray-500'}`}>{i<step?<Check className="w-3 h-3"/>:i+1}</div><span className={`text-xs ${i===step?'font-medium':'text-gray-400'}`}>{s}</span></div>)}</div>
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
      {error&&<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
      {step===0&&<div className="grid md:grid-cols-2 gap-4"><h3 className="col-span-2 font-semibold text-sm flex items-center gap-2"><User className="w-4 h-4"/>Sender</h3><Field label="Name" field="senderName" ph="John Doe" required/><Field label="Address" field="senderAddress" ph="123 Main St, City" required/><h3 className="col-span-2 font-semibold text-sm flex items-center gap-2 mt-2"><User className="w-4 h-4"/>Receiver</h3><Field label="Name" field="receiverName" ph="Jane Smith" required/><Field label="Address" field="receiverAddress" ph="456 Oak Ave, City" required/></div>}
      {step===1&&<div className="grid md:grid-cols-2 gap-4"><h3 className="col-span-2 font-semibold text-sm flex items-center gap-2"><Package className="w-4 h-4"/>Shipment Type</h3><Select label="Type" field="shipmentType" options={['Standard','Express','AirFreight','SeaFreight','RoadFreight','VehicleShipping','PetTransport']}/><Field label="Reference Number (optional)" field="referenceNumber" ph="REF-001"/></div>}
      {step===2&&<div className="grid md:grid-cols-2 gap-4"><h3 className="col-span-2 font-semibold text-sm flex items-center gap-2"><Package className="w-4 h-4"/>Service Level</h3><Select label="Service" field="serviceType" options={['Standard','Express','Priority','Economy']}/></div>}
      {step===3&&<div className="grid md:grid-cols-2 gap-4"><h3 className="col-span-2 font-semibold text-sm flex items-center gap-2"><MapPin className="w-4 h-4"/>Origin</h3><Field label="Origin (city, country)" field="origin" ph="New York, USA" required/></div>}
      {step===4&&<div className="grid md:grid-cols-2 gap-4"><h3 className="col-span-2 font-semibold text-sm flex items-center gap-2"><MapPin className="w-4 h-4"/>Destination</h3><Field label="Destination (city, country)" field="destination" ph="Los Angeles, USA" required/></div>}
      {step===5&&<div className="grid md:grid-cols-2 gap-4"><Field label="Weight (kg)" field="weight" type="number" ph="2.5" required/><Field label="Number of Pieces" field="numberOfPieces" type="number" ph="1" required/><Field label="Estimated Delivery (optional)" field="estimatedDelivery" type="date"/><Field label="Notes (optional)" field="notes" ph="Handle with care"/></div>}
      {step===6&&<div className="space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2"><FileText className="w-4 h-4"/>Documents (optional)</h3>
        {docs.map((d,i)=>(<div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 text-sm">
          <FileText className="w-4 h-4 text-gray-400"/><span className="flex-1"><b>{d.documentType}</b> — {d.fileName}</span>
          <button onClick={()=>setDocs(docs.filter((_,j)=>j!==i))} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
        </div>))}
        <DocForm onAdd={(d:any)=>setDocs([...docs,d])}/>
      </div>}
      {step===7&&<div className="space-y-3"><h3 className="font-semibold text-sm">Confirmation</h3><div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
        <p><b>From:</b> {form.senderName} — {form.senderAddress}</p>
        <p><b>To:</b> {form.receiverName} — {form.receiverAddress}</p>
        <p><b>Route:</b> {form.origin} → {form.destination}</p>
        <p><b>Type/Service:</b> {form.shipmentType} / {form.serviceType}</p>
        <p><b>Package:</b> {form.weight} kg, {form.numberOfPieces} piece(s)</p>
        {form.estimatedDelivery&&<p><b>Est. Delivery:</b> {form.estimatedDelivery}</p>}
        <p><b>Documents:</b> {docs.length} attached</p>
      </div></div>}
    </div>
    <div className="flex justify-between">
      <button onClick={()=>step>0?setStep(step-1):navigate('/admin/shipments')} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm"><ArrowLeft className="w-4 h-4"/>{step>0?'Back':'Cancel'}</button>
      {step<steps.length-1?<button onClick={()=>stepValid()&&setStep(step+1)} disabled={!stepValid()} className="flex items-center gap-2 px-5 py-2.5 bg-[#ff6f00] text-white rounded-xl text-sm font-medium disabled:opacity-50">Next<ArrowRight className="w-4 h-4"/></button>:<button onClick={submit} disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"><Check className="w-4 h-4"/>{submitting?'Creating...':'Create Shipment'}</button>}
    </div></div>);
}

function DocForm({ onAdd }: { onAdd: (d: any) => void }) {
  const [open, setOpen] = useState(false);
  const [d, setD] = useState({ documentType: 'Invoice', fileName: '', fileUrl: '', description: '', customerVisible: false });
  if (!open) return <button onClick={()=>setOpen(true)} className="flex items-center gap-2 text-sm text-[#ff6f00] font-medium"><Plus className="w-4 h-4"/>Add document</button>;
  return (<div className="border border-gray-200 rounded-xl p-4 space-y-3">
    <div className="grid md:grid-cols-2 gap-3">
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select value={d.documentType} onChange={e=>setD({...d, documentType:e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-white">
          {['Invoice','PackingList','BillOfLading','CustomsDeclaration','HealthCertificate','VaccinationRecord','Other'].map(t=><option key={t}>{t}</option>)}
        </select></div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">File name</label>
        <input value={d.fileName} onChange={e=>setD({...d, fileName:e.target.value})} placeholder="invoice.pdf" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"/></div>
    </div>
    <div><label className="block text-sm font-medium text-gray-700 mb-1">File URL</label>
      <input value={d.fileUrl} onChange={e=>setD({...d, fileUrl:e.target.value})} placeholder="https://..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"/></div>
    <div className="flex items-center justify-between">
      <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={d.customerVisible} onChange={e=>setD({...d, customerVisible:e.target.checked})}/>Visible to customer</label>
      <div className="flex gap-2">
        <button onClick={()=>setOpen(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-xl">Cancel</button>
        <button onClick={()=>{ if(d.fileName&&d.fileUrl){onAdd(d); setD({documentType:'Invoice',fileName:'',fileUrl:'',description:'',customerVisible:false}); setOpen(false);} }} className="px-4 py-2 text-sm bg-[#ff6f00] text-white rounded-xl font-medium">Add</button>
      </div>
    </div>
  </div>);
}

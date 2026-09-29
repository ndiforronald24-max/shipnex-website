import { UserCog, Mail, ShieldCheck, Database, Server, Save } from 'lucide-react';
import { getAuthUser } from '../../utils/auth';

export default function AdminSettings() {
  const user = getAuthUser();
  const rowsPerPage = localStorage.getItem('adminRowsPerPage') ?? '10';

  const savePref = (v: string) => {
    localStorage.setItem('adminRowsPerPage', v);
    alert('Preference saved locally.');
  };

  return (<div>
    <div className="mb-6"><h1 className="text-2xl font-bold">Settings</h1><p className="text-gray-500 text-sm">Your account and system configuration</p></div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Account */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><UserCog className="w-4 h-4 text-gray-400"/>Account</h2>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 bg-gradient-to-br from-[#ff6f00] to-[#ff8f00] rounded-2xl flex items-center justify-center text-white text-xl font-bold">
            {user?.firstName?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.firstName ?? 'Admin'}</p>
            <p className="text-sm text-gray-500 flex items-center gap-1"><Mail className="w-3.5 h-3.5"/>{user?.email}</p>
          </div>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-gray-50 pb-2"><dt className="text-gray-500">Role</dt>
            <dd className="flex items-center gap-1.5 font-medium text-gray-900"><ShieldCheck className="w-4 h-4 text-green-500"/>{user?.role}</dd></div>
          <div className="flex justify-between border-b border-gray-50 pb-2"><dt className="text-gray-500">User ID</dt><dd className="font-mono text-xs text-gray-600">{user?.id || '—'}</dd></div>
          <div className="flex justify-between border-b border-gray-50 pb-2"><dt className="text-gray-500">Authentication</dt><dd className="font-medium text-gray-900">JWT Bearer token</dd></div>
        </dl>
        <p className="text-xs text-gray-400 mt-4">Profile fields (name, phone, password) are managed server-side. Role changes are restricted to SuperAdmin and every change is written to the audit log.</p>
      </div>

      {/* System */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Server className="w-4 h-4 text-gray-400"/>System</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-gray-50 pb-2"><dt className="text-gray-500">API Endpoint</dt><dd className="font-mono text-xs text-gray-600">{(import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api'}</dd></div>
          <div className="flex justify-between border-b border-gray-50 pb-2"><dt className="text-gray-500">Connection</dt>
            <dd className="font-medium text-green-600 flex items-center gap-1.5"><Database className="w-4 h-4"/>Connected</dd></div>
        </dl>
        <div className="mt-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Rows per page (tables)</label>
          <div className="flex gap-2">
            <select defaultValue={rowsPerPage} id="rowsPref" className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-white">
              {['10', '25', '50'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <button onClick={()=>{ const el = document.getElementById('rowsPref') as HTMLSelectElement; savePref(el.value); }} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#ff6f00] text-white rounded-xl text-sm font-medium"><Save className="w-4 h-4"/>Save</button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4">Contact your SuperAdmin for API-level configuration (database provider, JWT settings, SMTP) — these are set via environment variables on the server.</p>
      </div>
    </div>
  </div>);
}

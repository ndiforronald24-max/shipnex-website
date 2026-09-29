import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldOff, Check, X } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { can, getAuthUser, ROLES } from '../../utils/auth';

const STAFF_ROLES = [ROLES.SuperAdmin, ROLES.OperationsManager, ROLES.ShipmentStaff, ROLES.PetOperations, ROLES.CustomerSupport, ROLES.Finance, ROLES.ReadOnly, ROLES.Customer];

export default function AdminStaff() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const manage = can('staffManage'); // SuperAdmin only — backend enforces this too
  const me = getAuthUser();

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    try { const r = await apiClient.getStaff(); setUsers(Array.isArray(r) ? r : r?.data ?? []); }
    catch (e: any) { setError(e?.response?.data?.message || 'Failed to load staff'); }
    finally { setLoading(false); }
  };

  const saveUser = async (u: any) => {
    try {
      await apiClient.updateStaff(u.id, { role: u.role, isActive: u.isActive });
      setSavedId(u.id); setTimeout(()=>setSavedId(null), 2000);
    } catch (e: any) { alert(e?.response?.data?.message || 'Update failed — your role may not allow staff changes.'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#ff6f00] border-t-transparent rounded-full animate-spin"></div></div>;

  return (<div>
    <div className="mb-6">
      <h1 className="text-2xl font-bold">Staff</h1>
      <p className="text-gray-500 text-sm">{users.length} accounts{manage ? ' · role changes are audited' : ' · view only (role changes require SuperAdmin)'}</p>
    </div>
    {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px]"><thead className="bg-gray-50/80"><tr>
          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Last Login</th>
          {manage && <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>}
        </tr></thead><tbody className="divide-y divide-gray-50">
          {users.length === 0 ? <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">No staff accounts found</td></tr> :
          users.map((u: any) => (<tr key={u.id} className="hover:bg-gray-50/50">
            <td className="px-5 py-3 text-sm font-medium text-gray-900">{u.firstName} {u.lastName}{me?.id === u.id && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-[#fff3e0] text-[#e65100] rounded-full">You</span>}</td>
            <td className="px-5 py-3 text-sm text-gray-600">{u.email}</td>
            <td className="px-5 py-3">{manage ? (
              <select value={u.role} onChange={e=>{ const next = users.map(x => x.id === u.id ? { ...x, role: e.target.value } : x); setUsers(next); }} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none bg-white">
                {STAFF_ROLES.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            ) : <span className="inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">{u.role}</span>}</td>
            <td className="px-5 py-3">{manage ? (
              <button onClick={()=>{ const next = users.map(x => x.id === u.id ? { ...x, isActive: !x.isActive } : x); setUsers(next); }} className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {u.isActive ? <Check className="w-3 h-3"/> : <X className="w-3 h-3"/>}{u.isActive ? 'Active' : 'Disabled'}
              </button>
            ) : <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{u.isActive ? 'Active' : 'Disabled'}</span>}</td>
            <td className="px-5 py-3 text-sm text-gray-400">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}</td>
            {manage && <td className="px-5 py-3">
              <button onClick={()=>saveUser(users.find(x=>x.id===u.id)!)} disabled={savedId===u.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff6f00] text-white rounded-lg text-xs font-medium disabled:opacity-60">
                {savedId===u.id ? <><Check className="w-3 h-3"/>Saved</> : <><ShieldCheck className="w-3 h-3"/>Save</>}
              </button>
            </td>}
          </tr>))}
        </tbody></table>
      </div>
    </div>
    <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-4"><ShieldOff className="w-3.5 h-3.5"/>The backend rejects unauthorized staff changes with 403 — this UI only hides what the API enforces.</p>
  </div>);
}

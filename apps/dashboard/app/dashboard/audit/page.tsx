'use client';
import { useState, useEffect, useCallback } from 'react';
import { Shield, Search, RefreshCw } from 'lucide-react';
import { api, Api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

interface LogEntry { id:string; action:string; entity?:string; entityId?:string; ipAddress?:string; createdAt:string; user?:{username:string;email:string}; details?: Record<string,unknown> }

const actionColor: Record<string, string> = {
  AUTH_LOGIN:'text-emerald-400', AUTH_LOGOUT:'text-slate-400', AUTH_FAILED:'text-red-400',
  VPN_CONNECT:'text-blue-400', VPN_DISCONNECT:'text-slate-400', VPN_CREATE:'text-cyan-400',
  USER_CREATE:'text-emerald-400', USER_DELETE:'text-red-400', USER_SUSPEND:'text-amber-400',
  SERVER_CREATE:'text-cyan-400', SERVER_DELETE:'text-red-400', SERVER_UPDATE:'text-blue-400',
};

export default function AuditPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const r=await api.get('/audit?limit=100'); setLogs(r.data??[]); } catch{}finally{setLoading(false);}
  },[]);

  useEffect(()=>{load();},[load]);

  const filtered = logs.filter(l => !search || l.action.includes(search.toUpperCase()) || l.user?.username?.includes(search) || l.ipAddress?.includes(search));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold text-[#F1F5F9]">Audit Logs</h1><p className="text-sm text-[#64748B]">{filtered.length} entrées</p></div>
          <button onClick={load} className="p-2 rounded-lg bg-[#0F1629] border border-[#1E2D45] text-[#64748B] hover:text-[#F1F5F9] transition-colors"><RefreshCw className="w-4 h-4"/></button>
        </div>

        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]"/><input className="input pl-9 w-full max-w-md" placeholder="Rechercher action, utilisateur, IP…" value={search} onChange={e=>setSearch(e.target.value)}/></div>

        {loading ? <div className="card animate-pulse h-64 bg-[#0A0F1C]"/> : (
          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead><tr className="border-b border-[#1E2D45]">
                {['Action','Utilisateur','Entité','IP','Date'].map(h=><th key={h} className="text-left text-xs font-semibold text-[#64748B] px-4 py-3">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-[#1E2D45]">
                {filtered.map(l=>(
                  <tr key={l.id} className="hover:bg-[#060D1A] transition-colors">
                    <td className="px-4 py-2.5"><span className={`text-xs font-mono font-semibold ${actionColor[l.action]??'text-slate-400'}`}>{l.action}</span></td>
                    <td className="px-4 py-2.5 text-xs text-[#94A3B8]">{l.user?.username??'—'}</td>
                    <td className="px-4 py-2.5 text-xs text-[#64748B]">{l.entity??'—'}{l.entityId?` #${l.entityId.slice(-6)}`:''}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-[#64748B]">{l.ipAddress??'—'}</td>
                    <td className="px-4 py-2.5 text-xs text-[#64748B]">{new Date(l.createdAt).toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length===0&&<div className="flex flex-col items-center py-12"><Shield className="w-10 h-10 text-[#1E2D45] mb-3"/><p className="text-sm text-[#64748B]">Aucun log trouvé</p></div>}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

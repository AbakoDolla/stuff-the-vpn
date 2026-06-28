'use client';
import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

interface Ticket { id:string; subject:string; status:string; priority:string; createdAt:string; author?:{username:string}; replies?:{body:string}[] }
const statusIcon: Record<string, React.ReactNode> = {
  OPEN: <AlertCircle className="w-3.5 h-3.5 text-blue-400" />,
  IN_PROGRESS: <Clock className="w-3.5 h-3.5 text-amber-400" />,
  RESOLVED: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
  CLOSED: <XCircle className="w-3.5 h-3.5 text-slate-500" />,
};
const priorityColor: Record<string, string> = { LOW:'text-slate-400', MEDIUM:'text-blue-400', HIGH:'text-amber-400', URGENT:'text-red-400' };

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ subject:'', body:'', priority:'MEDIUM' });

  const load = async () => { try { const r=await api.get('/tickets'); setTickets(r.data.data); } catch{}finally{setLoading(false);} };
  useEffect(()=>{load();},[]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/tickets', form); setShowModal(false); setForm({subject:'',body:'',priority:'MEDIUM'}); await load(); }
    catch(err: unknown){alert((err as {response?:{data?:{message?:string}}})?.response?.data?.message??'Erreur');}
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold text-[#F1F5F9]">Support Tickets</h1><p className="text-sm text-[#64748B]">{tickets.filter(t=>t.status==='OPEN').length} tickets ouverts</p></div>
          <button onClick={()=>setShowModal(true)} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"><Plus className="w-4 h-4"/>Nouveau ticket</button>
        </div>

        {loading ? <div className="space-y-3">{[...Array(5)].map((_,i)=><div key={i} className="card animate-pulse h-16 bg-[#0A0F1C]"/>)}</div>
        : tickets.length===0 ? <div className="card flex flex-col items-center py-16"><MessageSquare className="w-12 h-12 text-[#1E2D45] mb-4"/><p className="text-[#64748B] text-sm">Aucun ticket</p></div>
        : (
          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead><tr className="border-b border-[#1E2D45]">
                {['Sujet','Priorité','Statut','Auteur','Date'].map(h=><th key={h} className="text-left text-xs font-semibold text-[#64748B] px-4 py-3">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-[#1E2D45]">
                {tickets.map(t=>(
                  <tr key={t.id} className="hover:bg-[#060D1A] transition-colors">
                    <td className="px-4 py-3 text-sm text-[#F1F5F9]">{t.subject}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-semibold ${priorityColor[t.priority]??'text-slate-400'}`}>{t.priority}</span></td>
                    <td className="px-4 py-3"><span className="flex items-center gap-1.5 text-xs">{statusIcon[t.status]}{t.status}</span></td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">{t.author?.username??'—'}</td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal&&(
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-lg">
              <h2 className="text-lg font-bold text-[#F1F5F9] mb-6">Nouveau ticket</h2>
              <form onSubmit={create} className="space-y-4">
                <div><label className="label">Sujet</label><input className="input" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} required/></div>
                <div><label className="label">Priorité</label>
                  <select className="input" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
                    {['LOW','MEDIUM','HIGH','URGENT'].map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
                <div><label className="label">Description</label><textarea className="input h-32 resize-none" value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))} required/></div>
                <div className="flex gap-3"><button type="button" onClick={()=>setShowModal(false)} className="flex-1 py-2 rounded-lg border border-[#1E2D45] text-[#64748B] text-sm">Annuler</button><button type="submit" className="flex-1 btn-primary py-2 text-sm">Envoyer</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

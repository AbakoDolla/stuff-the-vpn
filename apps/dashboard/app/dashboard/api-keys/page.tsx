'use client';
import { useState, useEffect } from 'react';
import { Key, Plus, Eye, EyeOff, Trash2, Copy } from 'lucide-react';
import { api, Api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

interface ApiKeyData { id:string; name:string; keyPrefix:string; isActive:boolean; lastUsedAt?:string; createdAt:string; rawKey?:string }

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [revealed, setRevealed] = useState<ApiKeyData | null>(null);

  const load = async () => { 
    try {
      const r = await Api.getSettings();
      setKeys((r.data as ApiKeyData[]) ?? []);
    } catch {} 
    finally { setLoading(false); } 
  };
  useEffect(()=>{load();},[]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try { 
      const r = await api.post('/api-keys',{name}); 
      setRevealed((r.data as any).data); 
      setShowModal(false); 
      setName(''); 
      await load(); 
    }
    catch(err: unknown){alert((err as {response?:{data?:{message?:string}}})?.response?.data?.message??'Erreur');}
  };

  const revoke = async (id: string) => {
    if(!confirm('Révoquer cette clé ?'))return;
    try{await api.delete(`/api-keys/${id}`);await load();}catch{}
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold text-[#F1F5F9]">Clés API</h1><p className="text-sm text-[#64748B]">{keys.filter(k=>k.isActive).length} clés actives</p></div>
          <button onClick={()=>setShowModal(true)} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"><Plus className="w-4 h-4"/>Nouvelle clé</button>
        </div>

        {revealed&&(
          <div className="card border border-emerald-500/30 bg-emerald-500/5">
            <p className="text-sm font-semibold text-emerald-400 mb-2">✓ Clé créée — Copiez-la maintenant, elle ne sera plus affichée</p>
            <div className="flex items-center gap-2 bg-[#060D1A] rounded-lg px-3 py-2">
              <code className="flex-1 text-xs text-emerald-300 font-mono break-all">{revealed.rawKey}</code>
              <button onClick={()=>{navigator.clipboard.writeText(revealed.rawKey??'');}} className="p-1 text-emerald-400 hover:text-emerald-300"><Copy className="w-4 h-4"/></button>
            </div>
            <button onClick={()=>setRevealed(null)} className="mt-3 text-xs text-[#64748B] hover:text-[#94A3B8]">Fermer</button>
          </div>
        )}

        {loading ? <div className="card animate-pulse h-32 bg-[#0A0F1C]"/> : (
          <div className="card overflow-hidden p-0">
            {keys.length===0 ? (
              <div className="flex flex-col items-center py-12"><Key className="w-10 h-10 text-[#1E2D45] mb-3"/><p className="text-sm text-[#64748B]">Aucune clé API</p></div>
            ) : (
              <table className="w-full">
                <thead><tr className="border-b border-[#1E2D45]">{['Nom','Préfixe','Statut','Dernière utilisation','Date'].map(h=><th key={h} className="text-left text-xs font-semibold text-[#64748B] px-4 py-3">{h}</th>)}<th className="px-4 py-3"/></tr></thead>
                <tbody className="divide-y divide-[#1E2D45]">
                  {keys.map(k=>(
                    <tr key={k.id} className="hover:bg-[#060D1A]">
                      <td className="px-4 py-3 text-sm text-[#F1F5F9]">{k.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#94A3B8]">{k.keyPrefix}…</td>
                      <td className="px-4 py-3"><span className={`text-xs font-semibold ${k.isActive?'text-emerald-400':'text-red-400'}`}>{k.isActive?'ACTIVE':'REVOKED'}</span></td>
                      <td className="px-4 py-3 text-xs text-[#64748B]">{k.lastUsedAt?new Date(k.lastUsedAt).toLocaleDateString('fr-FR'):'Jamais'}</td>
                      <td className="px-4 py-3 text-xs text-[#64748B]">{new Date(k.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3">{k.isActive&&<button onClick={()=>revoke(k.id)} className="p-1 text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4"/></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {showModal&&(
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-md">
              <h2 className="text-lg font-bold text-[#F1F5F9] mb-4">Nouvelle clé API</h2>
              <form onSubmit={create} className="space-y-4">
                <div><label className="label">Nom de la clé</label><input className="input" placeholder="ex: Mobile App, Monitoring…" value={name} onChange={e=>setName(e.target.value)} required/></div>
                <div className="flex gap-3"><button type="button" onClick={()=>setShowModal(false)} className="flex-1 py-2 rounded-lg border border-[#1E2D45] text-[#64748B] text-sm">Annuler</button><button type="submit" className="flex-1 btn-primary py-2 text-sm">Créer</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

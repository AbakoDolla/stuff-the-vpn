'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { DataTable } from '@/components/DataTable';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { UserPlus, RefreshCw, DollarSign, TrendingUp } from 'lucide-react';

  interface Reseller { id:string;name:string;balance:number;commission:number;createdAt:string;user?:{username:string;email:string}; }

  export default function ResellersPage() {
    const [resellers, setResellers] = useState<Reseller[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ username:'',email:'',password:'',name:'',commission:10 });

    const load = useCallback(async()=>{
      setLoading(true);
      try { const r=await api.get('/resellers'); const arr=Array.isArray(r.data.data)?r.data.data:r.data.data?.items||r.data||[]; setResellers(arr); }
      catch { setResellers([]); } finally { setLoading(false); }
    },[]);
    useEffect(()=>{load();},[load]);

    async function handleCreate(e:React.FormEvent){ e.preventDefault();setCreating(true);
      try{await api.post('/resellers',form);setShowCreate(false);await load();}
      catch(err:unknown){alert((err as {response?:{data?:{message?:string}}})?.response?.data?.message||'Erreur');}
      finally{setCreating(false);}
    }

    const totalBalance = resellers.reduce((s,r)=>s+r.balance,0);
    const avgCommission = resellers.length ? resellers.reduce((s,r)=>s+r.commission,0)/resellers.length : 0;

    const cols = [
      {key:'name',label:'Revendeur',render:(r:Reseller)=>(
        <div>
          <div className="font-medium text-[#F1F5F9]">{r.name}</div>
          <div className="text-xs text-[#64748B]">{r.user?.email||'—'}</div>
        </div>
      )},
      {key:'balance',label:'Solde',render:(r:Reseller)=>(
        <span className="font-mono text-emerald-400 font-medium">{r.balance.toFixed(2)} €</span>
      )},
      {key:'commission',label:'Commission',render:(r:Reseller)=>(
        <span className="badge-info">{r.commission}%</span>
      )},
      {key:'createdAt',label:'Inscrit le',render:(r:Reseller)=><span className="text-xs text-[#64748B]">{formatDate(r.createdAt)}</span>},
    ];

    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div><h1 className="text-xl font-bold text-[#F1F5F9]">Revendeurs</h1><p className="text-sm text-[#64748B]">{resellers.length} revendeurs actifs</p></div>
            <div className="flex gap-2">
              <button onClick={load} className="btn-ghost"><RefreshCw className="w-4 h-4"/></button>
              <button onClick={()=>setShowCreate(true)} className="btn-primary flex items-center gap-1.5"><UserPlus className="w-4 h-4"/>Ajouter</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {label:'Total revendeurs',val:resellers.length,icon:UserPlus,color:'text-[#0099FF]'},
              {label:'Solde cumulé',val:`${totalBalance.toFixed(2)} €`,icon:DollarSign,color:'text-emerald-400'},
              {label:'Commission moy.',val:`${avgCommission.toFixed(1)}%`,icon:TrendingUp,color:'text-amber-400'},
            ].map(s=>(
              <div key={s.label} className="card flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#0F1629] border border-[#1E2D45] flex items-center justify-center"><s.icon className={`w-5 h-5 ${s.color}`}/></div>
                <div><div className="text-xl font-bold text-[#F1F5F9]">{s.val}</div><div className="text-xs text-[#64748B]">{s.label}</div></div>
              </div>
            ))}
          </div>
          <DataTable columns={cols} data={resellers} loading={loading} searchable searchKeys={['name']} emptyMessage="Aucun revendeur"/>
          {showCreate&&(
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <div className="bg-[#0F1629] border border-[#1E2D45] rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2D45]">
                  <h3 className="font-semibold text-[#F1F5F9]">Ajouter un revendeur</h3>
                  <button onClick={()=>setShowCreate(false)} className="text-[#64748B] text-xl">×</button>
                </div>
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-[#94A3B8] mb-1 block">Nom</label><input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/></div>
                    <div><label className="text-xs text-[#94A3B8] mb-1 block">Nom d'utilisateur</label><input className="input" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} required/></div>
                  </div>
                  <div><label className="text-xs text-[#94A3B8] mb-1 block">Email</label><input type="email" className="input" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required/></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-[#94A3B8] mb-1 block">Mot de passe</label><input type="password" className="input" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required/></div>
                    <div><label className="text-xs text-[#94A3B8] mb-1 block">Commission %</label><input type="number" className="input" value={form.commission} onChange={e=>setForm(f=>({...f,commission:+e.target.value}))} min={0} max={100}/></div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={()=>setShowCreate(false)} className="btn-ghost flex-1">Annuler</button>
                    <button type="submit" className="btn-primary flex-1" disabled={creating}>{creating?'Ajout...':'Ajouter'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }
'use client';
import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, RefreshCw, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

interface Payment { id:string; amount:number; currency:string; status:string; method:string; createdAt:string; user?:{username:string}; plan?:{name:string} }
const statusColor: Record<string,string> = { PENDING:'text-amber-400', COMPLETED:'text-emerald-400', FAILED:'text-red-400', REFUNDED:'text-purple-400' };

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => { try{const r=await api.get('/payments');setPayments(r.data.data??[]);}catch{}finally{setLoading(false);} };
  useEffect(()=>{load();},[]);

  const total = payments.filter(p=>p.status==='COMPLETED').reduce((acc,p)=>acc+p.amount,0);
  const pending = payments.filter(p=>p.status==='PENDING').reduce((acc,p)=>acc+p.amount,0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold text-[#F1F5F9]">Paiements</h1><p className="text-sm text-[#64748B]">{payments.length} transactions</p></div>
          <button onClick={load} className="p-2 rounded-lg bg-[#0F1629] border border-[#1E2D45] text-[#64748B] hover:text-[#F1F5F9]"><RefreshCw className="w-4 h-4"/></button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            {icon:DollarSign,label:'Revenus totaux',value:`$${total.toFixed(2)}`,color:'text-emerald-400'},
            {icon:TrendingUp,label:'En attente',value:`$${pending.toFixed(2)}`,color:'text-amber-400'},
            {icon:Plus,label:'Transactions',value:payments.length,color:'text-blue-400'},
          ].map(({icon:Icon,label,value,color})=>(
            <div key={label} className="card flex items-center gap-4">
              <div className={`p-2.5 rounded-xl bg-[#060D1A] ${color}`}><Icon className="w-5 h-5"/></div>
              <div><p className="text-xs text-[#64748B]">{label}</p><p className={`text-xl font-bold ${color}`}>{value}</p></div>
            </div>
          ))}
        </div>

        {loading ? <div className="card animate-pulse h-64 bg-[#0A0F1C]"/> : (
          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead><tr className="border-b border-[#1E2D45]">
                {['Utilisateur','Forfait','Montant','Méthode','Statut','Date'].map(h=><th key={h} className="text-left text-xs font-semibold text-[#64748B] px-4 py-3">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-[#1E2D45]">
                {payments.map(p=>(
                  <tr key={p.id} className="hover:bg-[#060D1A]">
                    <td className="px-4 py-3 text-sm text-[#F1F5F9]">{p.user?.username??'—'}</td>
                    <td className="px-4 py-3 text-xs text-[#94A3B8]">{p.plan?.name??'—'}</td>
                    <td className="px-4 py-3 text-sm font-bold text-[#F1F5F9]">${p.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">{p.method}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-semibold ${statusColor[p.status]??'text-slate-400'}`}>{p.status}</span></td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">{new Date(p.createdAt).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payments.length===0&&<div className="flex flex-col items-center py-12"><DollarSign className="w-10 h-10 text-[#1E2D45] mb-3"/><p className="text-sm text-[#64748B]">Aucun paiement</p></div>}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

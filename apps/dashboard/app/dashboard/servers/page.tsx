'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';
import { Plus, Server, RefreshCw, Trash2, ToggleLeft, ToggleRight, Globe } from 'lucide-react';

const PROTOCOLS = ['SSH','VLESS','VLESS_REALITY','VMESS','TROJAN','WIREGUARD','OPENVPN','SHADOWSOCKS'];
const STATUS_COLORS: Record<string, string> = {
  ONLINE:'badge-green', OFFLINE:'badge-red', UNKNOWN:'badge-yellow', MAINTENANCE:'badge-yellow'
};

interface Server {
  id:string; name:string; country:string; city?:string; flag?:string;
  ip:string; port:number; protocol:string; status:string;
  isEnabled:boolean; isPremium:boolean; activeConns?:number;
  cpuPercent?:number; ramPercent?:number; downloadMbps?:number; uploadMbps?:number;
}

const INIT = {
  name:'', country:'', city:'', flag:'', ip:'', port:443, protocol:'VLESS',
  isEnabled:true, isPremium:false,
  uuid:'', network:'tcp', tls:false, sni:'', path:'',
  sshUser:'', sshPassword:'',
};

export default function ServersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INIT);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['servers'],
    queryFn: () => api.get('/servers').then(r => r.data),
    refetchInterval: 15_000,
  });

  const createMut = useMutation({
    mutationFn: (body: typeof INIT) => api.post('/servers', body),
    onSuccess: () => { toast.success('Serveur créé'); qc.invalidateQueries({queryKey:['servers']}); setShowForm(false); setForm(INIT); },
    onError: () => toast.error('Erreur création'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/servers/${id}`),
    onSuccess: () => { toast.success('Serveur supprimé'); qc.invalidateQueries({queryKey:['servers']}); },
    onError: () => toast.error('Erreur suppression'),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.patch(`/servers/${id}`, { isEnabled: enabled }),
    onSuccess: () => qc.invalidateQueries({queryKey:['servers']}),
  });

  const servers: Server[] = data?.data ?? [];
  const F = (k: string, v: unknown) => setForm(p => ({...p, [k]: v}));
  const isSSH = form.protocol.startsWith('SSH');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Serveurs</h1>
            <p className="text-sm text-[#64748B]">{servers.length} serveurs configurés</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => refetch()} className="btn-ghost flex items-center gap-1.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-xs">
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="card space-y-4">
            <h2 className="font-semibold text-sm">Nouveau serveur</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ['Nom','name','text','Ex: France #1'],
                ['Pays','country','text','France'],
                ['Ville','city','text','Paris'],
                ['Flag','flag','text','🇫🇷'],
                ['IP','ip','text','1.2.3.4'],
                ['Port','port','number','443'],
              ].map(([label, key, type, ph]) => (
                <div key={String(key)}>
                  <label className="text-xs text-[#94A3B8] mb-1 block">{label}</label>
                  <input className="input" type={String(type)} placeholder={String(ph)}
                    value={String((form as Record<string, unknown>)[String(key)] ?? '')}
                    onChange={e => F(String(key), type === 'number' ? Number(e.target.value) : e.target.value)} />
                </div>
              ))}
              <div>
                <label className="text-xs text-[#94A3B8] mb-1 block">Protocole</label>
                <select className="input" value={form.protocol} onChange={e => F('protocol', e.target.value)}>
                  {PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {!isSSH && <>
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1 block">UUID</label>
                  <input className="input" placeholder="uuid..." value={form.uuid} onChange={e => F('uuid', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1 block">SNI</label>
                  <input className="input" placeholder="sni..." value={form.sni} onChange={e => F('sni', e.target.value)} />
                </div>
              </>}
              {isSSH && <>
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1 block">User SSH</label>
                  <input className="input" value={form.sshUser} onChange={e => F('sshUser', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1 block">Password SSH</label>
                  <input className="input" type="password" value={form.sshPassword} onChange={e => F('sshPassword', e.target.value)} />
                </div>
              </>}
              <div className="flex items-center gap-4 col-span-2">
                {[['isPremium','Premium'],['isEnabled','Actif']].map(([k, l]) => (
                  <label key={String(k)} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={!!(form as Record<string,unknown>)[String(k)]}
                      onChange={e => F(String(k), e.target.checked)} />
                    {l}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="btn-ghost text-xs">Annuler</button>
              <button onClick={() => createMut.mutate(form)} disabled={createMut.isPending}
                className="btn-primary text-xs">
                {createMut.isPending ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse"/>)}</div>
        ) : servers.length === 0 ? (
          <div className="card flex flex-col items-center py-12 text-[#64748B]">
            <Server className="w-10 h-10 mb-3 opacity-30"/>
            <p className="font-medium">Aucun serveur</p>
          </div>
        ) : (
          <div className="space-y-3">
            {servers.map(s => (
              <div key={s.id} className="card flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.status==='ONLINE'?'bg-emerald-400':s.status==='OFFLINE'?'bg-red-400':'bg-yellow-400'}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{s.flag} {s.name}</p>
                      <span className={`badge ${STATUS_COLORS[s.status]??'badge-gray'} text-[10px]`}>{s.status}</span>
                      {s.isPremium && <span className="badge badge-yellow text-[10px]">Premium</span>}
                    </div>
                    <p className="text-xs text-[#64748B]">{s.protocol} · {s.ip}:{s.port} · {s.country} {s.city?`· ${s.city}`:''}</p>
                    {(s.cpuPercent!=null||s.activeConns!=null) && (
                      <p className="text-[10px] text-[#475569] mt-0.5">
                        {s.activeConns!=null?`${s.activeConns} conn.`:''}
                        {s.cpuPercent!=null?` · CPU:${s.cpuPercent.toFixed(0)}%`:''}
                        {s.ramPercent!=null?` · RAM:${s.ramPercent.toFixed(0)}%`:''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleMut.mutate({id:s.id, enabled:!s.isEnabled})}
                    className={`transition-colors ${s.isEnabled?'text-emerald-400':'text-[#475569]'}`} title={s.isEnabled?'Désactiver':'Activer'}>
                    {s.isEnabled ? <ToggleRight className="w-5 h-5"/> : <ToggleLeft className="w-5 h-5"/>}
                  </button>
                  <button onClick={() => {if(confirm('Supprimer ?')) deleteMut.mutate(s.id);}}
                    className="btn-danger p-1.5">
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

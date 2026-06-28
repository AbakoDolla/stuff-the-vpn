'use client';
import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Wifi, WifiOff, Server, Globe, Activity, Cpu, HardDrive, Trash2, Edit, Play } from 'lucide-react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

interface ServerData {
  id: string; name: string; country: string; city?: string; flag?: string; ip: string; port: number;
  protocol: string; status: string; cpuPercent?: number; ramPercent?: number; diskPercent?: number;
  activeConns?: number; lastPingMs?: number; isEnabled: boolean; isPremium: boolean;
}

const statusColor: Record<string, string> = {
  ONLINE: 'text-emerald-400', OFFLINE: 'text-red-400', MAINTENANCE: 'text-amber-400', UNKNOWN: 'text-slate-500',
};
const protocolColor: Record<string, string> = {
  VLESS: 'bg-blue-500/10 text-blue-400', VMESS: 'bg-purple-500/10 text-purple-400',
  TROJAN: 'bg-amber-500/10 text-amber-400', SSH: 'bg-emerald-500/10 text-emerald-400',
  WIREGUARD: 'bg-cyan-500/10 text-cyan-400', OPENVPN: 'bg-orange-500/10 text-orange-400',
  SHADOWSOCKS: 'bg-rose-500/10 text-rose-400', REALITY: 'bg-indigo-500/10 text-indigo-400',
};

export default function ServersPage() {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:'', country:'', city:'', ip:'', port:'443', protocol:'VLESS', isEnabled:true, isPremium:false });

  const load = async () => {
    try { const r = await api.get('/servers'); setServers(r.data.data); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const ping = async (id: string) => {
    setPinging(id);
    try { await api.post(`/servers/${id}/ping`); await load(); }
    catch { } finally { setPinging(null); }
  };

  const deleteServer = async (id: string) => {
    if (!confirm('Supprimer ce serveur ?')) return;
    try { await api.delete(`/servers/${id}`); await load(); } catch { }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/servers', { ...form, port: Number(form.port) }); setShowModal(false); await load(); }
    catch (err: unknown) { alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur'); }
  };

  const onlineCount = servers.filter(s => s.status === 'ONLINE').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#F1F5F9]">Serveurs VPN</h1>
            <p className="text-sm text-[#64748B]">{onlineCount}/{servers.length} en ligne</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-2 rounded-lg bg-[#0F1629] border border-[#1E2D45] text-[#64748B] hover:text-[#F1F5F9] transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
              <Plus className="w-4 h-4" /> Nouveau serveur
            </button>
          </div>
        </div>

        {/* Server cards grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse h-48 bg-[#0A0F1C]" />
            ))}
          </div>
        ) : servers.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <Server className="w-12 h-12 text-[#1E2D45] mb-4" />
            <p className="text-[#64748B] text-sm">Aucun serveur configuré</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4 px-4 py-2 text-sm">Ajouter un serveur</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {servers.map((s) => (
              <div key={s.id} className="card relative overflow-hidden group">
                {/* Glow effect when online */}
                {s.status === 'ONLINE' && (
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                )}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{s.flag || '🌐'}</div>
                    <div>
                      <h3 className="font-semibold text-[#F1F5F9] text-sm">{s.name}</h3>
                      <p className="text-xs text-[#64748B]">{s.country}{s.city ? ` · ${s.city}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-xs font-medium ${statusColor[s.status] ?? 'text-slate-500'}`}>
                      {s.status === 'ONLINE' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                      {s.status}
                    </span>
                  </div>
                </div>

                {/* Protocol + IP */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${protocolColor[s.protocol] ?? 'bg-slate-500/10 text-slate-400'}`}>
                    {s.protocol}
                  </span>
                  <span className="text-xs text-[#64748B] font-mono">{s.ip}:{s.port}</span>
                  {s.isPremium && <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">PREMIUM</span>}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { icon: Cpu, label: 'CPU', value: s.cpuPercent != null ? `${s.cpuPercent.toFixed(0)}%` : '—' },
                    { icon: Activity, label: 'RAM', value: s.ramPercent != null ? `${s.ramPercent.toFixed(0)}%` : '—' },
                    { icon: HardDrive, label: 'Disk', value: s.diskPercent != null ? `${s.diskPercent.toFixed(0)}%` : '—' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-[#060D1A] rounded-lg p-2 text-center">
                      <Icon className="w-3 h-3 text-[#64748B] mx-auto mb-1" />
                      <div className="text-xs font-bold text-[#F1F5F9]">{value}</div>
                      <div className="text-[10px] text-[#64748B]">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => ping(s.id)} disabled={pinging === s.id}
                    className="flex-1 py-1.5 text-xs rounded-lg bg-[#0099FF]/10 text-[#0099FF] border border-[#0099FF]/20 hover:bg-[#0099FF]/20 transition-colors flex items-center justify-center gap-1 disabled:opacity-50">
                    <Play className="w-3 h-3" /> {pinging === s.id ? 'Ping…' : 'Ping'}
                  </button>
                  <button className="p-1.5 rounded-lg bg-[#0F1629] border border-[#1E2D45] text-[#64748B] hover:text-[#F1F5F9] transition-colors">
                    <Edit className="w-3 h-3" />
                  </button>
                  <button onClick={() => deleteServer(s.id)}
                    className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                {s.lastPingMs != null && (
                  <div className="mt-2 text-[10px] text-[#64748B]">Dernière réponse: {s.lastPingMs}ms</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-lg">
              <h2 className="text-lg font-bold text-[#F1F5F9] mb-6">Nouveau serveur</h2>
              <form onSubmit={create} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Nom</label><input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required /></div>
                  <div><label className="label">Protocole</label>
                    <select className="input" value={form.protocol} onChange={e=>setForm(f=>({...f,protocol:e.target.value}))}>
                      {['VLESS','VMESS','TROJAN','SSH','WIREGUARD','OPENVPN','SHADOWSOCKS','REALITY'].map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div><label className="label">Pays</label><input className="input" value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))} required /></div>
                  <div><label className="label">Ville</label><input className="input" value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} /></div>
                  <div><label className="label">IP / Hôte</label><input className="input font-mono" value={form.ip} onChange={e=>setForm(f=>({...f,ip:e.target.value}))} required /></div>
                  <div><label className="label">Port</label><input className="input" type="number" value={form.port} onChange={e=>setForm(f=>({...f,port:e.target.value}))} required /></div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-[#94A3B8]">
                    <input type="checkbox" checked={form.isPremium} onChange={e=>setForm(f=>({...f,isPremium:e.target.checked}))} className="rounded" /> Premium
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[#94A3B8]">
                    <input type="checkbox" checked={form.isEnabled} onChange={e=>setForm(f=>({...f,isEnabled:e.target.checked}))} className="rounded" /> Activé
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg border border-[#1E2D45] text-[#64748B] hover:text-[#F1F5F9] text-sm transition-colors">Annuler</button>
                  <button type="submit" className="flex-1 btn-primary py-2 text-sm">Créer</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

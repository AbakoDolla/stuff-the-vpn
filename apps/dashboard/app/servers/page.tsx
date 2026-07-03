'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { DataTable } from '@/components/DataTable';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Plus, RefreshCw, Trash2, ToggleLeft, ToggleRight, Server, Eye, X } from 'lucide-react';

interface Inbound {
  id: string; protocol: string; host: string; port: number;
  path?: string; sni?: string; remark: string; enabled: boolean; createdAt: string;
}

const PROTOCOL_COLORS: Record<string,string> = {
  VLESS:'badge-active', VMESS:'badge-info', TROJAN:'badge-warning',
  SHADOWSOCKS:'badge-warning', SSH:'badge-inactive'
};

export default function ServersPage() {
  const [inbounds, setInbounds] = useState<Inbound[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [testConfig, setTestConfig] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [form, setForm] = useState({ protocol: 'VLESS', host: '', port: 443, path: '', sni: '', remark: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/inbounds');
      const arr = Array.isArray(r.data.data) ? r.data.data : r.data.data?.items || r.data || [];
      setInbounds(arr);
    } catch { setInbounds([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function toggleEnabled(i: Inbound) {
    try { await api.patch(`/inbounds/${i.id}`, { enabled: !i.enabled }); await load(); }
    catch { alert('Erreur'); }
  }
  async function deleteInbound(i: Inbound) {
    if (!confirm(`Supprimer ${i.remark} ?`)) return;
    try { await api.delete(`/inbounds/${i.id}`); await load(); }
    catch { alert('Erreur suppression'); }
  }
  async function testVpnConfig() {
    setTestLoading(true); setTestConfig(null);
    try {
      const r = await api.get('/vpn/my-config');
      const cfg = r.data.data;
      const text = typeof cfg === 'string' ? cfg : JSON.stringify(cfg, null, 2);
      setTestConfig(text);
    } catch (err: unknown) {
      setTestConfig('Erreur: ' + ((err as {response?:{data?:{message?:string}}})?.response?.data?.message || 'Impossible de récupérer la config'));
    } finally { setTestLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setCreating(true);
    try { await api.post('/inbounds', form); setShowCreate(false); await load(); }
    catch (err: unknown) { alert((err as {response?:{data?:{message?:string}}})?.response?.data?.message || 'Erreur'); }
    finally { setCreating(false); }
  }

  const cols = [
    { key: 'remark', label: 'Nom', render: (i: Inbound) => (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${i.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
        <span className="font-medium text-[#F1F5F9]">{i.remark}</span>
      </div>
    )},
    { key: 'protocol', label: 'Protocole', render: (i: Inbound) => <span className={PROTOCOL_COLORS[i.protocol] || 'badge-info'}>{i.protocol}</span> },
    { key: 'host', label: 'Hôte', render: (i: Inbound) => <code className="text-xs font-mono text-[#94A3B8] bg-[#0F1629] px-2 py-0.5 rounded">{i.host}:{i.port}</code> },
    { key: 'path', label: 'Path', render: (i: Inbound) => <span className="text-sm text-[#64748B]">{i.path || '—'}</span> },
    { key: 'enabled', label: 'État', render: (i: Inbound) => (
      <span className={i.enabled ? 'badge-active' : 'badge-inactive'}>{i.enabled ? 'Actif' : 'Inactif'}</span>
    )},
    { key: 'createdAt', label: 'Créé', render: (i: Inbound) => <span className="text-xs text-[#64748B]">{formatDate(i.createdAt)}</span> },
  ];

  const active = inbounds.filter(i => i.enabled).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#F1F5F9]">Serveurs & Inbounds</h1>
            <p className="text-sm text-[#64748B]">{active}/{inbounds.length} actifs</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="btn-ghost"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={testVpnConfig} className="btn-ghost flex items-center gap-1.5" disabled={testLoading}>
              <Eye className="w-4 h-4" />{testLoading ? 'Chargement...' : 'Tester config'}
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5">
              <Plus className="w-4 h-4" />Ajouter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {['VLESS','VMESS','TROJAN','SHADOWSOCKS','SSH'].map(proto => {
            const count = inbounds.filter(i => i.protocol === proto).length;
            return (
              <div key={proto} className="card p-4 text-center">
                <Server className="w-5 h-5 mx-auto mb-2 text-[#0099FF]" />
                <div className="text-xl font-bold text-[#F1F5F9]">{count}</div>
                <div className="text-xs text-[#64748B]">{proto}</div>
              </div>
            );
          })}
        </div>

        <DataTable
          columns={cols}
          data={inbounds}
          loading={loading}
          searchable
          searchKeys={['remark','host','protocol']}
          emptyMessage="Aucun serveur configuré"
          actions={(i: Inbound) => (
            <div className="flex items-center gap-1">
              <button onClick={() => toggleEnabled(i)} className={`p-1.5 rounded-lg hover:bg-[#1E2D45] ${i.enabled ? 'text-emerald-400' : 'text-[#64748B]'}`}>
                {i.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              </button>
              <button onClick={() => deleteInbound(i)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        />
      </div>

      {/* Create inbound modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1629] border border-[#1E2D45] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2D45]">
              <h3 className="font-semibold text-[#F1F5F9]">Ajouter un inbound</h3>
              <button onClick={() => setShowCreate(false)} className="text-[#64748B] text-xl">×</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1 block">Protocole</label>
                  <select className="input" value={form.protocol} onChange={e => setForm(f=>({...f,protocol:e.target.value}))}>
                    {['VLESS','VMESS','TROJAN','SHADOWSOCKS','SSH'].map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1 block">Port</label>
                  <input type="number" className="input" value={form.port} onChange={e=>setForm(f=>({...f,port:+e.target.value}))} required />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1 block">Hôte</label>
                <input className="input" placeholder="example.com" value={form.host} onChange={e=>setForm(f=>({...f,host:e.target.value}))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1 block">Path</label>
                  <input className="input" placeholder="/ws" value={form.path} onChange={e=>setForm(f=>({...f,path:e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1 block">SNI</label>
                  <input className="input" placeholder="sni.example.com" value={form.sni} onChange={e=>setForm(f=>({...f,sni:e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1 block">Remarque</label>
                <input className="input" placeholder="Serveur Paris 1" value={form.remark} onChange={e=>setForm(f=>({...f,remark:e.target.value}))} required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowCreate(false)} className="btn-ghost flex-1">Annuler</button>
                <button type="submit" className="btn-primary flex-1" disabled={creating}>{creating?'Ajout...':'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VPN config test modal */}
      {testConfig !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1629] border border-[#1E2D45] rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2D45]">
              <h3 className="font-semibold text-[#F1F5F9]">Config VPN générée</h3>
              <button onClick={() => setTestConfig(null)} className="text-[#64748B] hover:text-[#F1F5F9]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <pre className="text-xs font-mono text-[#94A3B8] bg-[#0A0F1E] p-4 rounded-xl overflow-auto max-h-80 whitespace-pre-wrap break-all">{testConfig}</pre>
              <button onClick={() => { navigator.clipboard.writeText(testConfig!); }} className="mt-3 btn-ghost text-sm">Copier</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DataTable from '@/components/DataTable';
import { api, Api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Plus, RefreshCw, Copy, Check, ShieldOff, Key } from 'lucide-react';

interface License {
  id: string;
  token: string;
  status: string;
  dataLimitGB: number;
  dataUsedGB: number;
  deviceLimit: number;
  expireAt: string | null;
  createdAt: string;
  user?: { username: string; email: string } | null;
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({ dataLimitGB: 30, deviceLimit: 1, durationDays: 30, count: 1 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await Api.getLicenses();
      setLicenses((r.data as License[]) ?? []);
    } catch { setLicenses([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/licenses/generate', form);
      setShowCreate(false);
      await load();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur génération');
    } finally { setCreating(false); }
  }

  async function revoke(l: License) {
    if (!confirm(`Révoquer la license ${l.token} ?`)) return;
    try {
      await api.post('/licenses/revoke', { token: l.token });
      await load();
    } catch { alert('Erreur révocation'); }
  }

  function copyToken(token: string) {
    navigator.clipboard.writeText(token);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  const stats = {
    total: licenses.length,
    active: licenses.filter(l => l.status === 'ACTIVE').length,
    expired: licenses.filter(l => l.status === 'EXPIRED').length,
    revoked: licenses.filter(l => l.status === 'REVOKED').length,
  };

  const columns = [
    {
      key: 'token', label: 'Token',
      render: (l: License) => (
        <div className="flex items-center gap-2">
          <code className="font-mono text-xs text-[#F1F5F9] bg-[#0F1629] px-2 py-0.5 rounded">{l.token}</code>
          <button onClick={() => copyToken(l.token)} className="text-[#64748B] hover:text-[#0099FF]" title="Copier">
            {copied === l.token ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )
    },
    {
      key: 'status', label: 'Statut',
      render: (l: License) => (
        <span className={l.status === 'ACTIVE' ? 'badge-active' : l.status === 'EXPIRED' ? 'badge-warning' : 'badge-inactive'}>
          {l.status}
        </span>
      )
    },
    {
      key: 'data', label: 'Données',
      render: (l: License) => (
        <div className="text-sm">
          <span className="text-[#F1F5F9]">{l.dataUsedGB ?? 0} GB</span>
          <span className="text-[#64748B]"> / {l.dataLimitGB} GB</span>
        </div>
      )
    },
    { key: 'deviceLimit', label: 'Appareils', render: (l: License) => <span className="text-sm text-[#94A3B8]">{l.deviceLimit}</span> },
    {
      key: 'expireAt', label: 'Expire le',
      render: (l: License) => <span className="text-xs text-[#64748B]">{l.expireAt ? formatDate(l.expireAt) : '—'}</span>
    },
    {
      key: 'user', label: 'Utilisateur',
      render: (l: License) => <span className="text-sm text-[#94A3B8]">{l.user?.username || '—'}</span>
    },
    { key: 'createdAt', label: 'Créée le', render: (l: License) => <span className="text-xs text-[#64748B]">{formatDate(l.createdAt)}</span> },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#F1F5F9]">Licenses</h1>
            <p className="text-sm text-[#64748B]">{stats.total} licenses — {stats.active} actives</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="btn-ghost flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5"><Plus className="w-4 h-4" />Générer</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', val: stats.total, cls: 'badge-info' },
            { label: 'Actives', val: stats.active, cls: 'badge-active' },
            { label: 'Expirées', val: stats.expired, cls: 'badge-warning' },
            { label: 'Révoquées', val: stats.revoked, cls: 'badge-inactive' },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <div className="text-2xl font-bold text-[#F1F5F9]">{s.val}</div>
              <div className="text-xs text-[#64748B] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={licenses}
          loading={loading}
          searchable
          searchKeys={['token', 'status']}
          emptyMessage="Aucune license générée"
          actions={(l: License) => (
            l.status === 'ACTIVE' ? (
              <button onClick={() => revoke(l)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400" title="Révoquer">
                <ShieldOff className="w-3.5 h-3.5" />
              </button>
            ) : null
          )}
        />

        {/* Modal création */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-[#0F1629] border border-[#1E2D45] rounded-2xl w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2D45]">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#0099FF]" />
                  <h3 className="font-semibold text-[#F1F5F9]">Générer des licenses</h3>
                </div>
                <button onClick={() => setShowCreate(false)} className="text-[#64748B] hover:text-[#F1F5F9] text-xl">×</button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1 block">Nombre de licenses</label>
                  <input type="number" className="input" value={form.count} onChange={e => setForm(f => ({ ...f, count: +e.target.value }))} min={1} max={50} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1 block">Quota (GB)</label>
                    <input type="number" className="input" value={form.dataLimitGB} onChange={e => setForm(f => ({ ...f, dataLimitGB: +e.target.value }))} min={1} />
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1 block">Durée (jours)</label>
                    <input type="number" className="input" value={form.durationDays} onChange={e => setForm(f => ({ ...f, durationDays: +e.target.value }))} min={1} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1 block">Limite appareils</label>
                  <input type="number" className="input" value={form.deviceLimit} onChange={e => setForm(f => ({ ...f, deviceLimit: +e.target.value }))} min={1} max={10} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Annuler</button>
                  <button type="submit" className="btn-primary flex-1" disabled={creating}>
                    {creating ? 'Génération...' : 'Générer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

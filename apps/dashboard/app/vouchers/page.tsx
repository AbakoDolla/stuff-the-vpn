'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DataTable from '@/components/DataTable';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Plus, RefreshCw, Trash2, Download, Copy, Check } from 'lucide-react';

  interface Voucher {
    id: string; code: string; quotaGB: number; durationDay: number;
    status: string; createdAt: string; usedAt: string | null;
    user?: { username: string; email: string } | null;
  }

  export default function VouchersPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [form, setForm] = useState({ count: 1, quotaGB: 10, durationDay: 30 });

    const load = useCallback(async () => {
      setLoading(true);
      try {
        const r = await api.get('/vouchers');
        const arr = Array.isArray(r.data.data) ? r.data.data : r.data.data?.items || r.data || [];
        setVouchers(arr);
      } catch { setVouchers([]); }
      finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    async function handleCreate(e: React.FormEvent) {
      e.preventDefault(); setCreating(true);
      try {
        if (form.count === 1) {
          await api.post('/vouchers', { quotaGB: form.quotaGB, durationDay: form.durationDay });
        } else {
          await api.post('/admin/bulk-generate', { count: form.count, quotaGB: form.quotaGB, durationDay: form.durationDay });
        }
        setShowCreate(false);
        await load();
      } catch (err: unknown) {
        alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur création');
      } finally { setCreating(false); }
    }

    async function deleteVoucher(v: Voucher) {
      if (!confirm(`Supprimer le voucher ${v.code} ?`)) return;
      try {
        await api.delete(`/vouchers/${v.id}`);
        await load();
      } catch { alert('Erreur suppression'); }
    }

    function copyCode(code: string) {
      navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    }

    function exportCSV() {
      const rows = vouchers.map(v => [v.code, v.quotaGB + 'GB', v.durationDay + 'j', v.status, v.createdAt].join(','));
      const csv = ['Code,Quota,Durée,Statut,Créé le', ...rows].join('\n');
      const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv);
      a.download = 'vouchers.csv'; a.click();
    }

    const stats = {
      total: vouchers.length,
      active: vouchers.filter(v => v.status === 'ACTIVE').length,
      used: vouchers.filter(v => v.status === 'USED').length,
      expired: vouchers.filter(v => v.status === 'EXPIRED').length,
    };

    const columns = [
      {
        key: 'code', label: 'Code',
        render: (v: Voucher) => (
          <div className="flex items-center gap-2">
            <code className="font-mono text-sm text-[#F1F5F9] bg-[#0F1629] px-2 py-0.5 rounded">{v.code}</code>
            <button onClick={() => copyCode(v.code)} className="text-[#64748B] hover:text-[#0099FF]">
              {copied === v.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )
      },
      { key: 'quotaGB', label: 'Quota', render: (v: Voucher) => <span className="text-sm text-[#94A3B8]">{v.quotaGB} GB</span> },
      { key: 'durationDay', label: 'Durée', render: (v: Voucher) => <span className="text-sm text-[#94A3B8]">{v.durationDay} jours</span> },
      {
        key: 'status', label: 'Statut',
        render: (v: Voucher) => (
          <span className={v.status === 'ACTIVE' ? 'badge-active' : v.status === 'USED' ? 'badge-info' : 'badge-inactive'}>
            {v.status}
          </span>
        )
      },
      {
        key: 'user', label: 'Utilisateur',
        render: (v: Voucher) => <span className="text-sm text-[#94A3B8]">{v.user?.username || '—'}</span>
      },
      { key: 'createdAt', label: 'Créé le', render: (v: Voucher) => <span className="text-xs text-[#64748B]">{formatDate(v.createdAt)}</span> },
    ];

    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#F1F5F9]">Vouchers</h1>
              <p className="text-sm text-[#64748B]">{stats.total} vouchers — {stats.active} actifs</p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="btn-ghost flex items-center gap-1.5"><Download className="w-4 h-4" />Export CSV</button>
              <button onClick={load} className="btn-ghost flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /></button>
              <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5"><Plus className="w-4 h-4" />Générer</button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total', val: stats.total, cls: 'badge-info' },
              { label: 'Actifs', val: stats.active, cls: 'badge-active' },
              { label: 'Utilisés', val: stats.used, cls: 'badge-warning' },
              { label: 'Expirés', val: stats.expired, cls: 'badge-inactive' },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <div className="text-2xl font-bold text-[#F1F5F9]">{s.val}</div>
                <div className="text-xs text-[#64748B] mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <DataTable
            columns={columns}
            data={vouchers}
            loading={loading}
            searchable
            searchKeys={['code', 'status']}
            emptyMessage="Aucun voucher généré"
            actions={(v: Voucher) => (
              <button onClick={() => deleteVoucher(v)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400" title="Supprimer">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          />

          {showCreate && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <div className="bg-[#0F1629] border border-[#1E2D45] rounded-2xl w-full max-w-sm shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2D45]">
                  <h3 className="font-semibold text-[#F1F5F9]">Générer des vouchers</h3>
                  <button onClick={() => setShowCreate(false)} className="text-[#64748B] hover:text-[#F1F5F9] text-xl">×</button>
                </div>
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1 block">Nombre de vouchers</label>
                    <input type="number" className="input" value={form.count} onChange={e => setForm(f => ({ ...f, count: +e.target.value }))} min={1} max={100} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1 block">Quota (GB)</label>
                      <input type="number" className="input" value={form.quotaGB} onChange={e => setForm(f => ({ ...f, quotaGB: +e.target.value }))} min={1} />
                    </div>
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1 block">Durée (jours)</label>
                      <input type="number" className="input" value={form.durationDay} onChange={e => setForm(f => ({ ...f, durationDay: +e.target.value }))} min={1} />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Annuler</button>
                    <button type="submit" className="btn-primary flex-1" disabled={creating}>{creating ? 'Génération...' : 'Générer'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }
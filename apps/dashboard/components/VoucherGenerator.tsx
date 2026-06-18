'use client';
  import { useState } from 'react';
  import { api } from '@/lib/api';
  import { Ticket, Copy, Check, Loader2 } from 'lucide-react';

  interface GeneratedVoucher { id: string; code: string; quotaGB: number; durationDay: number; }

  export default function VoucherGenerator({ onGenerated }: { onGenerated?: () => void }) {
    const [count, setCount] = useState(1);
    const [quota, setQuota] = useState(10);
    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<GeneratedVoucher[]>([]);
    const [copied, setCopied] = useState<string | null>(null);

    async function generate() {
      setLoading(true);
      try {
        let vouchers: GeneratedVoucher[] = [];
        if (count === 1) {
          const r = await api.post('/vouchers', { quotaGB: quota, durationDay: days });
          vouchers = [r.data.data];
        } else {
          const r = await api.post('/admin/bulk-generate', { count, quotaGB: quota, durationDay: days });
          vouchers = r.data.data || [];
        }
        setResult(vouchers);
        onGenerated?.();
      } catch (err: unknown) {
        alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur');
      } finally { setLoading(false); }
    }

    function copy(code: string) {
      navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    }

    function copyAll() {
      navigator.clipboard.writeText(result.map(v => v.code).join('\n'));
      setCopied('all');
      setTimeout(() => setCopied(null), 2000);
    }

    return (
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-[#F1F5F9] flex items-center gap-2">
          <Ticket className="w-4 h-4 text-[#0099FF]" /> Générateur de vouchers rapide
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-[#94A3B8] mb-1 block">Nombre</label>
            <input type="number" className="input" value={count} onChange={e => setCount(+e.target.value)} min={1} max={50} /></div>
          <div><label className="text-xs text-[#94A3B8] mb-1 block">Quota GB</label>
            <input type="number" className="input" value={quota} onChange={e => setQuota(+e.target.value)} min={1} /></div>
          <div><label className="text-xs text-[#94A3B8] mb-1 block">Durée (j)</label>
            <input type="number" className="input" value={days} onChange={e => setDays(+e.target.value)} min={1} /></div>
        </div>
        <button onClick={generate} disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
          {loading ? 'Génération...' : `Générer ${count} voucher${count > 1 ? 's' : ''}`}
        </button>
        {result.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-400 font-medium">{result.length} voucher(s) généré(s)</span>
              {result.length > 1 && (
                <button onClick={copyAll} className="text-xs text-[#0099FF] hover:text-[#00D4FF] flex items-center gap-1">
                  {copied === 'all' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Tout copier
                </button>
              )}
            </div>
            <div className="bg-[#0F1629] rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
              {result.map(v => (
                <div key={v.id} className="flex items-center justify-between group">
                  <code className="font-mono text-xs text-[#F1F5F9]">{v.code}</code>
                  <button onClick={() => copy(v.code)} className="text-[#64748B] hover:text-[#0099FF] opacity-0 group-hover:opacity-100 transition-opacity">
                    {copied === v.code ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
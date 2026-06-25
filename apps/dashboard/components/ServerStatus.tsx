'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

  interface StatusItem { name: string; ok: boolean; latency?: number }

  export default function ServerStatus() {
    const [items, setItems] = useState<StatusItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      async function check() {
        const start = Date.now();
        try {
          await api.get('/health');
          const latency = Date.now() - start;
          setItems([
            { name: 'API Backend', ok: true, latency },
            { name: 'Base de données', ok: true },
            { name: 'V2Ray Service', ok: true },
          ]);
        } catch {
          setItems([
            { name: 'API Backend', ok: false },
            { name: 'Base de données', ok: false },
            { name: 'V2Ray Service', ok: false },
          ]);
        } finally { setLoading(false); }
      }
      check();
      const interval = setInterval(check, 30000);
      return () => clearInterval(interval);
    }, []);

    if (loading) return (
      <div className="flex items-center gap-2 text-xs text-[#64748B]">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Vérification...
      </div>
    );

    return (
      <div className="flex items-center gap-3">
        {items.map(item => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs">
            {item.ok
              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              : <XCircle className="w-3.5 h-3.5 text-red-400" />}
            <span className={item.ok ? 'text-[#94A3B8]' : 'text-red-400'}>{item.name}</span>
            {item.latency && <span className="text-[#64748B]">({item.latency}ms)</span>}
          </div>
        ))}
      </div>
    );
  }
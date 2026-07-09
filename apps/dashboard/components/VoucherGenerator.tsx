'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, RefreshCw, Key, Clock, Database, Smartphone, Loader2 } from 'lucide-react';
import { Api } from '@/lib/api';

type VoucherResult = { code: string; [k: string]: unknown };

export function VoucherGenerator() {
  const [vouchers, setVouchers] = useState<VoucherResult[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState('30');
  const [quota, setQuota] = useState('50');
  const [maxDevices, setMaxDevices] = useState('1');
  const [count, setCount] = useState('1');

  const generateVouchers = async () => {
    setLoading(true);
    setError(null);
    setVouchers([]);
    try {
      const result = await Api.createVouchers({
        durationDay: Number(duration),
        quotaGB:     Number(quota) || 9999,
        count:       Number(count),
      });
      const arr = Array.isArray(result) ? result : [result];
      setVouchers(arr as VoucherResult[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Key size={18} className="text-primary" />
        <h3 className="text-sm font-semibold text-gray-200">Générateur de licences</h3>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
            <Clock size={12} className="inline mr-1" />
            Durée (jours)
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="input-field text-sm py-2"
          >
            <option value="7">7 jours</option>
            <option value="15">15 jours</option>
            <option value="30">30 jours</option>
            <option value="60">60 jours</option>
            <option value="90">90 jours</option>
            <option value="365">1 an</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
            <Database size={12} className="inline mr-1" />
            Quota (GB)
          </label>
          <select
            value={quota}
            onChange={(e) => setQuota(e.target.value)}
            className="input-field text-sm py-2"
          >
            <option value="10">10 GB</option>
            <option value="25">25 GB</option>
            <option value="50">50 GB</option>
            <option value="100">100 GB</option>
            <option value="250">250 GB</option>
            <option value="0">Illimité</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
            <Smartphone size={12} className="inline mr-1" />
            Appareils max
          </label>
          <select
            value={maxDevices}
            onChange={(e) => setMaxDevices(e.target.value)}
            className="input-field text-sm py-2"
          >
            <option value="1">1 appareil</option>
            <option value="2">2 appareils</option>
            <option value="3">3 appareils</option>
            <option value="5">5 appareils</option>
            <option value="10">10 appareils</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
            Quantité
          </label>
          <select
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="input-field text-sm py-2"
          >
            {[1,2,5,10,20,50].map(n => (
              <option key={n} value={String(n)}>{n} voucher{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={generateVouchers}
        disabled={loading}
        className="btn-primary w-full mb-4 flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading
          ? <><Loader2 size={16} className="animate-spin" />Génération en cours…</>
          : <><RefreshCw size={16} />Générer {count} licence{Number(count) > 1 ? 's' : ''}</>}
      </button>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {vouchers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">
              {vouchers.length} licence{vouchers.length > 1 ? 's' : ''} générée{vouchers.length > 1 ? 's' : ''}
            </p>
            {vouchers.map((v, i) => (
              <div key={i} className="glass-card p-3 flex items-center gap-2">
                <code className="flex-1 px-3 py-1.5 bg-dark-100 border border-surface-light rounded-lg text-sm font-mono text-primary text-center tracking-wider truncate">
                  {v.code ?? String(i + 1)}
                </code>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => copyToClipboard(v.code ?? '')}
                  className="p-2 rounded-lg bg-surface hover:bg-surface-hover text-gray-400 hover:text-white transition-all shrink-0"
                >
                  {copied === v.code
                    ? <Check size={16} className="text-green-400" />
                    : <Copy size={16} />}
                </motion.button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

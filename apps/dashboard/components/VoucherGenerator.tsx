'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, RefreshCw, Key, Clock, Database, Smartphone } from 'lucide-react';

export function VoucherGenerator() {
  const [voucher, setVoucher] = useState('');
  const [copied, setCopied] = useState(false);
  const [duration, setDuration] = useState('30');
  const [quota, setQuota] = useState('50');
  const [maxDevices, setMaxDevices] = useState('1');

  const generateVoucher = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    );
    setVoucher(`SXB-${segments.join('-')}`);
    setCopied(false);
  };

  const copyToClipboard = async () => {
    if (!voucher) return;
    await navigator.clipboard.writeText(voucher);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Key size={18} className="text-primary" />
        <h3 className="text-sm font-semibold text-gray-200">Générateur de licences</h3>
      </div>

      {/* Options */}
      <div className="grid grid-cols-3 gap-3 mb-6">
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
      </div>

      {/* Generate button */}
      <button onClick={generateVoucher} className="btn-primary w-full mb-4 flex items-center justify-center gap-2">
        <RefreshCw size={16} className={voucher ? '' : 'animate-spin'} />
        {voucher ? 'Régénérer une licence' : 'Générer une licence'}
      </button>

      {/* Result */}
      <AnimatePresence>
        {voucher && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="glass-card p-4 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-gray-500 uppercase">Licence générée</span>
              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                <span>{duration}j</span>
                <span>•</span>
                <span>{quota === '0' ? '∞' : quota}GB</span>
                <span>•</span>
                <span>{maxDevices} app.</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-dark-100 border border-surface-light rounded-lg text-sm font-mono text-primary text-center tracking-wider">
                {voucher}
              </code>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyToClipboard}
                className="p-2 rounded-lg bg-surface hover:bg-surface-hover text-gray-400 hover:text-white transition-all"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
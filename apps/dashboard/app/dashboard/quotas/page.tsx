'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HardDrive, AlertCircle, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

interface Quota {
  id: string;
  userId: string;
  deviceId?: string;
  totalGB: number;
  usedGB: number;
  remainingGB: number;
  policy: 'SUSPEND' | 'THROTTLE' | 'NOTIFY';
  resetAt?: Date;
  percentage: number;
  isExhausted: boolean;
  user?: { id: string; email: string; phone: string; name: string };
  device?: { id: string; deviceId: string; deviceName: string };
}

export default function QuotasPage() {
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchQuotas();
  }, [filter]);

  const fetchQuotas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await Api.getQuotas({ limit: 100 });
      setQuotas(data.quotas || data || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des quotas');
    } finally {
      setLoading(false);
    }
  };

  const resetQuota = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser ce quota ?')) return;
    try {
      await Api.resetQuota(id);
      fetchQuotas();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la réinitialisation');
    }
  };

  const addQuota = async (userId: string, totalGB: number) => {
    try {
      await Api.createQuota({ userId, totalGB, policy: 'SUSPEND' });
      fetchQuotas();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création du quota');
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const formatGB = (gb: number) => {
    if (gb >= 1024) return `${(gb / 1024).toFixed(2)} TB`;
    return `${gb.toFixed(2)} GB`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const filteredQuotas = quotas.filter((q) => {
    if (filter === 'EXHAUSTED') return q.isExhausted;
    if (filter === 'WARNING') return q.percentage >= 75 && q.percentage < 100;
    return true;
  });

  return (
    <DashboardLayout>
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestion des Quotas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Suivez et gérez les quotas de données des utilisateurs
          </p>
        </div>
        <button
          onClick={fetchQuotas}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Actualiser
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-200 rounded-xl p-4 border border-surface-light">
          <p className="text-gray-400 text-sm">Total Quotas</p>
          <p className="text-2xl font-bold text-white">{quotas.length}</p>
        </div>
        <div className="bg-dark-200 rounded-xl p-4 border border-surface-light">
          <p className="text-gray-400 text-sm">Données Totales</p>
          <p className="text-2xl font-bold text-white">
            {formatGB(quotas.reduce((sum, q) => sum + q.totalGB, 0))}
          </p>
        </div>
        <div className="bg-dark-200 rounded-xl p-4 border border-surface-light">
          <p className="text-gray-400 text-sm">Utilisées</p>
          <p className="text-2xl font-bold text-white">
            {formatGB(quotas.reduce((sum, q) => sum + q.usedGB, 0))}
          </p>
        </div>
        <div className="bg-dark-200 rounded-xl p-4 border border-surface-light">
          <p className="text-gray-400 text-sm">Quotas Épuisés</p>
          <p className="text-2xl font-bold text-red-400">
            {quotas.filter((q) => q.isExhausted).length}
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex items-center gap-2">
        {['ALL', 'WARNING', 'EXHAUSTED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === status
                ? 'bg-primary text-white'
                : 'bg-dark-200 text-gray-400 hover:bg-dark-300'
            }`}
          >
            {status === 'ALL' ? 'Tous' : status === 'WARNING' ? 'En avertissement' : 'Épuisés'}
          </button>
        ))}
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div variants={itemVariants} className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-400" />
          <p className="text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Quotas List */}
      <motion.div variants={itemVariants}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredQuotas.length === 0 ? (
          <div className="bg-dark-200 rounded-xl p-12 text-center">
            <HardDrive size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">Aucun quota trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQuotas.map((quota) => (
              <div
                key={quota.id}
                className="bg-dark-200 rounded-xl border border-surface-light p-4"
              >
                {/* User Info */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-white">
                      {quota.user?.name || quota.user?.email || quota.user?.phone || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {quota.device?.deviceName || quota.device?.deviceId || 'Quota global'}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    quota.policy === 'SUSPEND' ? 'bg-red-500/10 text-red-400' :
                    quota.policy === 'THROTTLE' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-blue-500/10 text-blue-400'
                  }`}>
                    {quota.policy}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">{formatGB(quota.usedGB)}</span>
                    <span className="text-gray-400">{formatGB(quota.totalGB)}</span>
                  </div>
                  <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(quota.percentage)} transition-all`}
                      style={{ width: `${Math.min(quota.percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-gray-500">Utilisé</p>
                    <p className="text-white font-medium">{formatGB(quota.usedGB)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Restant</p>
                    <p className="text-white font-medium">{formatGB(quota.remainingGB)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">%</p>
                    <p className={`font-medium ${quota.percentage >= 100 ? 'text-red-400' : 'text-white'}`}>
                      {quota.percentage}%
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-surface-light flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {quota.resetAt ? `Reset: ${new Date(quota.resetAt).toLocaleDateString()}` : 'Pas de reset'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => resetQuota(quota.id)}
                      className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors"
                      title="Réinitialiser"
                    >
                      <RefreshCw size={14} className="text-primary" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
    </DashboardLayout>
  );
}

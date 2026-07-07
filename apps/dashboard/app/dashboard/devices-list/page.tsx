'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Shield, ShieldOff, Trash2, History, AlertCircle, RefreshCw } from 'lucide-react';
import { Api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

interface Device {
  id: string;
  deviceId: string;
  deviceName?: string;
  brand?: string;
  model?: string;
  osVersion?: string;
  appVersion?: string;
  publicIp?: string;
  country?: string;
  status: 'ACTIVE' | 'DISABLED' | 'BLOCKED' | 'PENDING';
  firstActivatedAt?: Date;
  lastSyncAt?: Date;
  connectionCount: number;
  isCompromised: boolean;
  lastSeenAt?: Date;
  lastIp?: string;
  user?: { id: string; email?: string; phone?: string; name?: string };
  _count?: { syncLogs: number };
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDevices();
  }, [filter, search]);

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { limit: 100 };
      if (filter !== 'ALL') params.status = filter;
      if (search) params.search = search;
      const data = await Api.getDevices(params);
      setDevices(data.devices || data || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des appareils');
    } finally {
      setLoading(false);
    }
  };

  const updateDeviceStatus = async (id: string, status: string) => {
    try {
      await Api.updateDevice(id, { status });
      fetchDevices();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const blockDevice = async (id: string) => {
    const reason = prompt('Raison du blocage (optionnel):');
    try {
      await Api.blockDevice(id, reason || undefined);
      fetchDevices();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du blocage');
    }
  };

  const deleteDevice = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet appareil ?')) return;
    try {
      await Api.deleteDevice(id);
      fetchDevices();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (status: string, isCompromised: boolean) => {
    if (isCompromised) {
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
      DISABLED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      BLOCKED: 'bg-red-500/10 text-red-400 border-red-500/20',
      PENDING: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    return `text-xs font-medium px-2 py-0.5 rounded-full border ${styles[status] || styles.PENDING}`;
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <h1 className="text-2xl font-bold text-white">Appareils</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez les appareils enregistrés et leurs activations
          </p>
        </div>
        <button
          onClick={fetchDevices}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Actualiser
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-200 rounded-xl p-4 border border-surface-light">
          <p className="text-gray-400 text-sm">Total Appareils</p>
          <p className="text-2xl font-bold text-white">{devices.length}</p>
        </div>
        <div className="bg-dark-200 rounded-xl p-4 border border-surface-light">
          <p className="text-gray-400 text-sm">Actifs</p>
          <p className="text-2xl font-bold text-green-400">
            {devices.filter((d) => d.status === 'ACTIVE').length}
          </p>
        </div>
        <div className="bg-dark-200 rounded-xl p-4 border border-surface-light">
          <p className="text-gray-400 text-sm">Désactivés</p>
          <p className="text-2xl font-bold text-yellow-400">
            {devices.filter((d) => d.status === 'DISABLED').length}
          </p>
        </div>
        <div className="bg-dark-200 rounded-xl p-4 border border-surface-light">
          <p className="text-gray-400 text-sm">Bloqués</p>
          <p className="text-2xl font-bold text-red-400">
            {devices.filter((d) => d.status === 'BLOCKED' || d.isCompromised).length}
          </p>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par ID, nom, marque..."
            className="w-full bg-dark-200 border border-surface-light rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          {['ALL', 'ACTIVE', 'DISABLED', 'BLOCKED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === status
                  ? 'bg-primary text-white'
                  : 'bg-dark-200 text-gray-400 hover:bg-dark-300'
              }`}
            >
              {status === 'ALL' ? 'Tous' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div variants={itemVariants} className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-400" />
          <p className="text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Devices List */}
      <motion.div variants={itemVariants}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : devices.length === 0 ? (
          <div className="bg-dark-200 rounded-xl p-12 text-center">
            <Smartphone size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">Aucun appareil trouvé</p>
          </div>
        ) : (
          <div className="bg-dark-200 rounded-xl border border-surface-light overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-light">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Appareil</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Utilisateur</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Statut</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Dernière Synchro</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Connexions</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device.id} className="border-b border-surface-light/50 hover:bg-dark-300/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Smartphone size={20} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {device.deviceName || device.model || 'Appareil inconnu'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {device.brand} {device.model && `• ${device.model}`}
                          </p>
                          <p className="text-xs text-gray-600 font-mono">
                            {device.deviceId.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-white">
                          {device.user?.name || device.user?.email || device.user?.phone || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">{device.country || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={getStatusBadge(device.status, device.isCompromised)}>
                        {device.isCompromised && <ShieldOff size={12} className="inline mr-1" />}
                        {device.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-400">
                        {formatDate(device.lastSyncAt)}
                      </p>
                      <p className="text-xs text-gray-600">{device.lastIp || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white">{device.connectionCount}</p>
                      <p className="text-xs text-gray-500">{device._count?.syncLogs || 0} syncs</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {device.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => updateDeviceStatus(device.id, 'DISABLED')}
                              className="p-2 hover:bg-yellow-500/10 rounded-lg transition-colors"
                              title="Désactiver"
                            >
                              <Shield size={16} className="text-yellow-400" />
                            </button>
                            <button
                              onClick={() => blockDevice(device.id)}
                              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Bloquer"
                            >
                              <ShieldOff size={16} className="text-red-400" />
                            </button>
                          </>
                        )}
                        {device.status === 'DISABLED' && (
                          <button
                            onClick={() => updateDeviceStatus(device.id, 'ACTIVE')}
                            className="p-2 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Réactiver"
                          >
                            <Shield size={16} className="text-green-400" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteDevice(device.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
    </DashboardLayout>
  );
}

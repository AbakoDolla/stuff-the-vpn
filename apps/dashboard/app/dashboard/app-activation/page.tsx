'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Check, X, Settings, RefreshCw, Clock, Database, Shield, AlertCircle, Plus, Copy, Key } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/hooks/useLanguage';

interface DeviceActivation {
  id: string;
  deviceId: string;
  deviceName?: string;
  brand?: string;
  model?: string;
  osVersion?: string;
  appVersion?: string;
  publicIp?: string;
  country?: string;
  status: 'ACTIVE' | 'PENDING' | 'DISABLED';
  activationCode: string;
  quotaMB: string;
  quotaUsedMB: string;
  vpnConfig?: string;
  configVersion: number;
  createdAt: string;
  approvedAt?: string;
  tokenExpiresAt?: string;
}

export default function AppActivationPage() {
  const { tr } = useLanguage();
  const [devices, setDevices] = useState<DeviceActivation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [approving, setApproving] = useState<string | null>(null);
  const [quotaModal, setQuotaModal] = useState<{ device: DeviceActivation; quota: string; days: string } | null>(null);
  const [createModal, setCreateModal] = useState<{ deviceId: string; deviceName: string; quotaMB: string; days: string } | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [creatingDevice, setCreatingDevice] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, [filter]);

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = filter !== 'ALL' ? `?status=${filter}` : '';
      const result = await apiFetch<{ devices: DeviceActivation[] }>(`/mobile-device${queryParams}`);
      setDevices(result.devices || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const createAndGenerateToken = async () => {
    if (!createModal?.deviceId.trim()) {
      alert('Veuillez entrer un ID de appareil');
      return;
    }
    setCreatingDevice(true);
    try {
      const result = await apiFetch<{ device: DeviceActivation; loginToken: string }>('/mobile-device', {
        method: 'POST',
        body: JSON.stringify({
          deviceId: createModal.deviceId.trim(),
          deviceName: createModal.deviceName.trim() || createModal.deviceId.trim(),
          quotaMB: parseInt(createModal.quota) || 0,
          expiresInDays: parseInt(createModal.days) || 30,
        }),
      });
      setGeneratedToken(result.loginToken);
      await fetchDevices();
      setCreateModal(null);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création');
    } finally {
      setCreatingDevice(false);
    }
  };

  const approveDevice = async (deviceId: string, quotaMB: number = 0, days: number = 30) => {
    setApproving(deviceId);
    try {
      const result = await apiFetch<{ loginToken: string }>(`/mobile-device/${deviceId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ quotaMB, expiresInDays: days }),
      });
      if (result.loginToken) {
        setGeneratedToken(result.loginToken);
      }
      await fetchDevices();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'approbation');
    } finally {
      setApproving(null);
      setQuotaModal(null);
    }
  };

  const rejectDevice = async (deviceId: string) => {
    if (!confirm('Voulez-vous vraiment rejeter cet appareil ?')) return;
    try {
      await apiFetch(`/mobile-device/${deviceId}/reject`, { method: 'POST' });
      await fetchDevices();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du rejet');
    }
  };

  const updateQuota = async () => {
    if (!quotaModal) return;
    try {
      await apiFetch(`/mobile-device/${quotaModal.device.deviceId}/quota`, {
        method: 'PATCH',
        body: JSON.stringify({ quotaMB: parseInt(quotaModal.quota) || 0 }),
      });
      await fetchDevices();
      setQuotaModal(null);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour du quota');
    }
  };

  const revokeDevice = async (deviceId: string) => {
    if (!confirm('Voulez-vous vraiment révoquer l\'accès de cet appareil ?')) return;
    try {
      await apiFetch(`/mobile-device/${deviceId}/revoke`, { method: 'POST' });
      await fetchDevices();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la révocation');
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    alert('Token copié !');
  };

  const filteredDevices = devices.filter(d => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        d.deviceId.toLowerCase().includes(searchLower) ||
        d.deviceName?.toLowerCase().includes(searchLower) ||
        d.brand?.toLowerCase().includes(searchLower) ||
        d.model?.toLowerCase().includes(searchLower) ||
        d.activationCode.includes(search)
      );
    }
    return true;
  });

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatQuota = (mb: string) => {
    const value = parseInt(mb) || 0;
    if (value === 0) return 'Illimité';
    if (value >= 1000) return `${(value / 1000).toFixed(1)} GB`;
    return `${value} MB`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
      PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      DISABLED: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return `text-xs font-medium px-2 py-0.5 rounded-full border ${styles[status] || styles.PENDING}`;
  };

  const pendingCount = devices.filter(d => d.status === 'PENDING').length;
  const activeCount = devices.filter(d => d.status === 'ACTIVE').length;

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Activation App Mobile</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérez les appareils en attente d&apos;activation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDevices}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Actualiser
            </button>
            <button
              onClick={() => setCreateModal({ deviceId: '', deviceName: '', quotaMB: '0', days: '30' })}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              Créer Appareil
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-200 rounded-xl p-4 border border-surface-light">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-yellow-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">En attente</p>
                <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-dark-200 rounded-xl p-4 border border-surface-light">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Check size={20} className="text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Approuvés</p>
                <p className="text-2xl font-bold text-green-400">{activeCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-dark-200 rounded-xl p-4 border border-surface-light">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Smartphone size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-white">{devices.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Device ID Entry */}
        <div className="bg-dark-200 rounded-xl p-4 border border-surface-light">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Ajouter un appareil manuellement</h3>
          <div className="flex gap-3">
            <input
              type="text"
              id="manual-device-id"
              placeholder="Entrez l'ID de l'appareil (ex: UTAS34.82-126-4)"
              className="flex-1 bg-dark-300 border border-surface-light rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.currentTarget;
                  const deviceId = input.value.trim();
                  if (deviceId) {
                    setSearch(deviceId);
                    input.value = '';
                  }
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.getElementById('manual-device-id') as HTMLInputElement;
                const deviceId = input?.value.trim();
                if (deviceId) {
                  setSearch(deviceId);
                  if (input) input.value = '';
                }
              }}
              className="btn-primary px-4"
            >
              Rechercher
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Utilisez le code d&apos;activation SXB-XXXXXX ou l&apos;ID de l&apos;appareil pour rechercher
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par ID, nom, marque ou code d'activation..."
              className="w-full bg-dark-200 border border-surface-light rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            {['ALL', 'PENDING', 'ACTIVE', 'DISABLED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === status
                    ? 'bg-primary text-white'
                    : 'bg-dark-200 text-gray-400 hover:bg-dark-300'
                }`}
              >
                {status === 'ALL' ? 'Tous' : status === 'PENDING' ? 'En attente' : status === 'ACTIVE' ? 'Approuvés' : 'Rejetés'}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Devices List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="bg-dark-200 rounded-xl p-12 text-center">
            <Smartphone size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">Aucun appareil trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDevices.map((device) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-dark-200 rounded-xl border border-surface-light overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 border-b border-surface-light">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Smartphone size={24} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {device.deviceName || device.model || 'Appareil inconnu'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {device.brand} {device.model && `• ${device.model}`}
                        </p>
                      </div>
                    </div>
                    <span className={getStatusBadge(device.status)}>
                      {device.status === 'PENDING' ? 'En attente' : device.status === 'ACTIVE' ? 'Approuvé' : 'Rejeté'}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Code d&apos;activation</span>
                    <span className="font-mono text-primary font-bold">{device.activationCode}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">OS</span>
                    <span className="text-white">{device.osVersion || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">App Version</span>
                    <span className="text-white">{device.appVersion || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Quota</span>
                    <span className="text-white">{formatQuota(device.quotaMB)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Utilisé</span>
                    <span className="text-yellow-400">{formatQuota(device.quotaUsedMB)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Inscrit le</span>
                    <span className="text-gray-400">{formatDate(device.createdAt)}</span>
                  </div>
                  {device.tokenExpiresAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Expire le</span>
                      <span className="text-gray-400">{formatDate(device.tokenExpiresAt)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 bg-dark-300/50 border-t border-surface-light">
                  {device.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuotaModal({ device, quota: device.quotaMB, days: '30' })}
                        className="flex-1 btn-primary flex items-center justify-center gap-2"
                      >
                        <Check size={16} />
                        Approuver
                      </button>
                      <button
                        onClick={() => rejectDevice(device.deviceId)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <X size={16} className="text-red-400" />
                      </button>
                    </div>
                  )}
                  {device.status === 'ACTIVE' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuotaModal({ device, quota: device.quotaMB, days: '30' })}
                        className="flex-1 btn-secondary flex items-center justify-center gap-2"
                      >
                        <Database size={16} />
                        Modifier Quota
                      </button>
                      <button
                        onClick={() => revokeDevice(device.deviceId)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Shield size={16} className="text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quota Modal */}
      {quotaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-200 rounded-xl border border-surface-light w-full max-w-md p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">Approuver l&apos;appareil</h2>
            <p className="text-gray-400 mb-4">
              {quotaModal.device.deviceName || quotaModal.device.model || 'Cet appareil'}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Quota de données (MB)</label>
                <input
                  type="number"
                  value={quotaModal.quota}
                  onChange={(e) => setQuotaModal({ ...quotaModal, quota: e.target.value })}
                  placeholder="0 = illimité"
                  className="w-full bg-dark-300 border border-surface-light rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-gray-500 mt-1">0 = données illimitées</p>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Durée de validity (jours)</label>
                <input
                  type="number"
                  value={quotaModal.days}
                  onChange={(e) => setQuotaModal({ ...quotaModal, days: e.target.value })}
                  placeholder="30"
                  className="w-full bg-dark-300 border border-surface-light rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setQuotaModal(null)}
                className="flex-1 btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={() => approveDevice(
                  quotaModal.device.deviceId,
                  parseInt(quotaModal.quota) || 0,
                  parseInt(quotaModal.days) || 30
                )}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <Check size={16} />
                Approuver
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Device Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-200 rounded-xl border border-surface-light w-full max-w-md p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Smartphone size={24} className="text-primary" />
              Créer un nouvel appareil
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">ID de l&apos;appareil *</label>
                <input
                  type="text"
                  value={createModal.deviceId}
                  onChange={(e) => setCreateModal({ ...createModal, deviceId: e.target.value })}
                  placeholder="ex: UTAS34.82-126-4"
                  className="w-full bg-dark-300 border border-surface-light rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nom de l&apos;appareil</label>
                <input
                  type="text"
                  value={createModal.deviceName}
                  onChange={(e) => setCreateModal({ ...createModal, deviceName: e.target.value })}
                  placeholder="ex: Mon Téléphone"
                  className="w-full bg-dark-300 border border-surface-light rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Quota (MB)</label>
                <input
                  type="number"
                  value={createModal.quotaMB}
                  onChange={(e) => setCreateModal({ ...createModal, quotaMB: e.target.value })}
                  placeholder="0 = illimité"
                  className="w-full bg-dark-300 border border-surface-light rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-gray-500 mt-1">0 = données illimitées</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Durée (jours)</label>
                <input
                  type="number"
                  value={createModal.days}
                  onChange={(e) => setCreateModal({ ...createModal, days: e.target.value })}
                  placeholder="30"
                  className="w-full bg-dark-300 border border-surface-light rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setCreateModal(null)}
                className="flex-1 btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={createAndGenerateToken}
                disabled={creatingDevice}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                {creatingDevice ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Key size={16} />
                )}
                Créer et Générer Token
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Token Display Modal */}
      {generatedToken && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-200 rounded-xl border border-surface-light w-full max-w-lg p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Key size={24} className="text-green-400" />
              Token généré avec succès !
            </h3>
            <p className="text-gray-400 mb-4">
              Copiez ce token et partagez-le avec l&apos;utilisateur pour activer son application mobile.
            </p>
            <div className="bg-dark-300 rounded-lg p-4 border border-surface-light">
              <code className="text-green-400 text-sm break-all">{generatedToken}</code>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setGeneratedToken(null)}
                className="flex-1 btn-secondary"
              >
                Fermer
              </button>
              <button
                onClick={() => copyToken(generatedToken)}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <Copy size={16} />
                Copier le Token
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}

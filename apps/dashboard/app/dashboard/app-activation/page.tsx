'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Check, X, RefreshCw, Plus, Copy, Key, HardDrive, Trash2, RefreshCcw, Eye, EyeOff } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/hooks/useLanguage';

interface Device {
  id: string;
  deviceId: string;
  deviceName?: string;
  brand?: string;
  model?: string;
  osVersion?: string;
  appVersion?: string;
  status: 'ACTIVE' | 'PENDING' | 'DISABLED' | 'SUSPENDED';
  quotaMB?: number;
  quotaUsedMB?: number;
  configVersion?: number;
  createdAt: string;
  lastSeenAt?: string;
  accessToken?: string;
}

export default function DevicesPage() {
  const { tr } = useLanguage();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState<{ deviceId: string; code: string } | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState<{ device: Device } | null>(null);
  const [newDeviceId, setNewDeviceId] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [quotaGB, setQuotaGB] = useState('10');
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
  }, [filter]);

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = filter !== 'ALL' ? `?status=${filter}` : '';
      const result = await apiFetch<{ devices: Device[] }>(`/mobile-device${queryParams}`);
      setDevices(result.devices || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const registerDevice = async () => {
    if (!newDeviceId.trim()) {
      alert('Veuillez entrer un ID de appareil');
      return;
    }
    setSubmitting(true);
    try {
      const result = await apiFetch<{ device: Device; activationCode: string }>('/mobile-device', {
        method: 'POST',
        body: JSON.stringify({
          deviceId: newDeviceId.trim(),
          deviceName: newDeviceName.trim() || newDeviceId.trim(),
        }),
      });
      setShowAddModal(false);
      setShowCodeModal({ deviceId: result.device.deviceId, code: result.activationCode });
      setNewDeviceId('');
      setNewDeviceName('');
      await fetchDevices();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setSubmitting(false);
    }
  };

  const generateCode = async (deviceId: string) => {
    try {
      const result = await apiFetch<{ activationCode: string }>(`/mobile-device/${deviceId}/code`, {
        method: 'POST',
      });
      setShowCodeModal({ deviceId, code: result.activationCode });
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la génération du code');
    }
  };

  const updateQuota = async () => {
    if (!showQuotaModal) return;
    setSubmitting(true);
    try {
      await apiFetch(`/mobile-device/${showQuotaModal.device.deviceId}/quota`, {
        method: 'PATCH',
        body: JSON.stringify({ quotaMB: Math.floor(parseFloat(quotaGB) * 1024) }),
      });
      setShowQuotaModal(null);
      await fetchDevices();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour du quota');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDeviceStatus = async (device: Device) => {
    const action = device.status === 'ACTIVE' ? 'suspend' : 'reactivate';
    const confirmMsg = device.status === 'ACTIVE' 
      ? 'Voulez-vous vraiment suspendre cet appareil ?' 
      : 'Voulez-vous vraiment réactiver cet appareil ?';
    if (!confirm(confirmMsg)) return;
    try {
      await apiFetch(`/mobile-device/${device.deviceId}/${action}`, { method: 'POST' });
      await fetchDevices();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour du statut');
    }
  };

  const deleteDevice = async (deviceId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cet appareil ?')) return;
    try {
      await apiFetch(`/mobile-device/${deviceId}`, { method: 'DELETE' });
      await fetchDevices();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatQuota = (mb?: number) => {
    if (!mb || mb <= 0) return '∞';
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
      PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      DISABLED: 'bg-red-500/10 text-red-400 border-red-500/20',
      SUSPENDED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    return `text-xs font-medium px-2 py-0.5 rounded-full border ${styles[status] || styles.PENDING}`;
  };

  const filteredDevices = devices.filter(d => {
    if (search) {
      const s = search.toLowerCase();
      return d.deviceId.toLowerCase().includes(s) ||
        d.deviceName?.toLowerCase().includes(s) ||
        d.brand?.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Appareils</h1>
            <p className="text-sm text-gray-400 mt-1">Gérez les appareils et leurs codes d&apos;activation</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
            Nouvel Appareil
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: devices.length, color: 'blue' },
            { label: 'Actifs', value: devices.filter(d => d.status === 'ACTIVE').length, color: 'green' },
            { label: 'En attente', value: devices.filter(d => d.status === 'PENDING').length, color: 'yellow' },
            { label: 'Suspendus', value: devices.filter(d => d.status === 'SUSPENDED' || d.status === 'DISABLED').length, color: 'red' },
          ].map((stat) => (
            <div key={stat.label} className="bg-dark-50 rounded-xl p-4 border border-white/5">
              <p className="text-xs text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 text-${stat.color}-400`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher par ID, nom, marque..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 bg-dark-50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-dark-50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tous</option>
            <option value="ACTIVE">Actifs</option>
            <option value="PENDING">En attente</option>
            <option value="SUSPENDED">Suspendus</option>
          </select>
          <button
            onClick={fetchDevices}
            className="p-2 bg-dark-50 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {/* Devices List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
            {error}
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="bg-dark-50 rounded-xl p-8 border border-white/5 text-center">
            <Smartphone size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">Aucun appareil trouvé</p>
          </div>
        ) : (
          <div className="bg-dark-50 rounded-xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Appareil</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Statut</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Quota</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Dernière connexion</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.map((device) => (
                    <tr key={device.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Smartphone size={20} className="text-blue-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{device.deviceName || device.deviceId}</p>
                            <p className="text-xs text-gray-500 font-mono">{device.deviceId}</p>
                            {device.brand && <p className="text-xs text-gray-500">{device.brand} {device.model}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={getStatusBadge(device.status)}>{device.status}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <HardDrive size={14} className="text-gray-500" />
                          <span className="text-gray-300">
                            {formatQuota(device.quotaUsedMB)} / {formatQuota(device.quotaMB)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-400">
                        {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => generateCode(device.deviceId)}
                            className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                            title="Générer code"
                          >
                            <Key size={16} />
                          </button>
                          <button
                            onClick={() => setShowQuotaModal({ device })}
                            className="p-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                            title="Configurer quota"
                          >
                            <HardDrive size={16} />
                          </button>
                          <button
                            onClick={() => toggleDeviceStatus(device)}
                            className={`p-2 rounded-lg transition-colors ${
                              device.status === 'ACTIVE'
                                ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                                : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                            }`}
                            title={device.status === 'ACTIVE' ? 'Suspendre' : 'Réactiver'}
                          >
                            {device.status === 'ACTIVE' ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => deleteDevice(device.deviceId)}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Device Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-dark-50 rounded-2xl border border-white/10 w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-white mb-4">Nouvel Appareil</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">ID de l&apos;appareil *</label>
                    <input
                      type="text"
                      value={newDeviceId}
                      onChange={(e) => setNewDeviceId(e.target.value)}
                      placeholder="Ex: UTAS34.82-126-4"
                      className="w-full px-4 py-2 bg-dark border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Entrez l&apos;ID affiché sur l&apos;app mobile</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Nom (optionnel)</label>
                    <input
                      type="text"
                      value={newDeviceName}
                      onChange={(e) => setNewDeviceName(e.target.value)}
                      placeholder="Ex: Samsung Galaxy S21"
                      className="w-full px-4 py-2 bg-dark border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 bg-dark border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={registerDevice}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Inscription...' : 'Inscrire'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Activation Code Modal */}
      <AnimatePresence>
        {showCodeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCodeModal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-dark-50 rounded-2xl border border-white/10 w-full max-w-md p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-green-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Code d&apos;Activation</h2>
                  <p className="text-sm text-gray-400">Partagez ce code avec l&apos;utilisateur de l&apos;appareil</p>
                </div>
                
                <div className="bg-dark rounded-xl p-4 mb-6">
                  <p className="text-xs text-gray-500 mb-2">Appareil</p>
                  <p className="text-white font-mono">{showCodeModal.deviceId}</p>
                </div>
                
                <div className="bg-dark rounded-xl p-4 mb-6">
                  <p className="text-xs text-gray-500 mb-2">Code d&apos;activation</p>
                  <div className="flex items-center gap-3">
                    <p className="text-2xl font-bold text-blue-400 font-mono tracking-wider flex-1">
                      {showCodeModal.code}
                    </p>
                    <button
                      onClick={() => copyToClipboard(showCodeModal.code, showCodeModal.code)}
                      className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                    >
                      {copiedCode === showCodeModal.code ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowCodeModal(null)}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quota Modal */}
      <AnimatePresence>
        {showQuotaModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuotaModal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-dark-50 rounded-2xl border border-white/10 w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-white mb-4">Configurer le Quota</h2>
                <div className="bg-dark rounded-xl p-4 mb-4">
                  <p className="text-xs text-gray-500 mb-1">Appareil</p>
                  <p className="text-white font-mono">{showQuotaModal.device.deviceId}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Quota (GB)</label>
                  <input
                    type="number"
                    value={quotaGB}
                    onChange={(e) => setQuotaGB(e.target.value)}
                    min="0"
                    step="0.5"
                    className="w-full px-4 py-2 bg-dark border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = illimité</p>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowQuotaModal(null)}
                    className="flex-1 px-4 py-2 bg-dark border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={updateQuota}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

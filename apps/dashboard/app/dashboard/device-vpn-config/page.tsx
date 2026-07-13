'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, Server, Key, Shield, Clock, Globe, 
  Plus, Trash2, RefreshCw, Check, X, Copy, Eye, EyeOff,
  Wifi, Lock, AlertCircle, Download
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/hooks/useLanguage';

interface VpnProfile {
  id: string;
  name: string;
  protocol: string;
  serverHost: string;
  serverPort: number;
  serverCountry: string;
  serverFlag: string;
}

interface DeviceVpnConfig {
  id: string;
  deviceId: string;
  configName: string;
  protocol: string;
  serverHost: string;
  serverPort: number;
  serverCountry: string;
  serverFlag: string;
  configVersion: number;
  validUntil?: string;
  syncedAt?: string;
  isActive: boolean;
  assignedAt: string;
}

interface Device {
  id: string;
  deviceId: string;
  deviceName?: string;
  brand?: string;
  model?: string;
  status: string;
}

const PROTOCOLS = ['VLESS', 'VMess', 'Trojan', 'WireGuard', 'Shadowsocks'];

export default function DeviceVpnConfigPage() {
  const { tr } = useLanguage();
  const [devices, setDevices] = useState<Device[]>([]);
  const [profiles, setProfiles] = useState<VpnProfile[]>([]);
  const [configs, setConfigs] = useState<DeviceVpnConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [formData, setFormData] = useState({
    configName: '',
    protocol: 'VLESS',
    serverHost: '',
    serverPort: 443,
    serverCountry: 'France',
    serverFlag: '🇫🇷',
    configData: JSON.stringify({
      uuid: '',
      path: '/vless',
      sni: '',
      tls: true,
    }, null, 2),
    validDays: 30,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [devicesRes, profilesRes, configsRes] = await Promise.all([
        apiFetch<{ devices: Device[] }>('/mobile-device?status=ACTIVE'),
        apiFetch<{ profiles: any[] }>('/vpn-profiles'),
        apiFetch<{ configs: DeviceVpnConfig[] }>('/admin/device-vpn-config?'),
      ]);
      setDevices(devicesRes.devices || []);
      setProfiles(profilesRes.profiles || []);
      setConfigs(configsRes.configs || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDevice || !formData.configName || !formData.serverHost) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const configData = JSON.parse(formData.configData);
      const validUntil = formData.validDays > 0 
        ? new Date(Date.now() + formData.validDays * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      await apiFetch('/admin/device-vpn-config', {
        method: 'POST',
        body: JSON.stringify({
          deviceId: selectedDevice,
          configName: formData.configName,
          protocol: formData.protocol,
          serverHost: formData.serverHost,
          serverPort: formData.serverPort,
          serverCountry: formData.serverCountry,
          serverFlag: formData.serverFlag,
          configData,
          validUntil,
        }),
      });

      setShowModal(false);
      setSelectedDevice('');
      setFormData({
        configName: '',
        protocol: 'VLESS',
        serverHost: '',
        serverPort: 443,
        serverCountry: 'France',
        serverFlag: '🇫🇷',
        configData: JSON.stringify({ uuid: '', path: '/vless', sni: '', tls: true }, null, 2),
        validDays: 30,
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'assignation');
    }
  };

  const handleDelete = async (configId: string) => {
    if (!confirm('Supprimer cette configuration ?')) return;
    try {
      await apiFetch(`/admin/device-vpn-config/${configId}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleInvalidate = async (configId: string) => {
    try {
      await apiFetch(`/admin/device-vpn-config/${configId}/invalidate`, { method: 'POST' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'invalidation');
    }
  };

  const getProtocolIcon = (protocol: string) => {
    switch (protocol) {
      case 'VLESS': return <Shield className="w-4 h-4" />;
      case 'VMess': return <Globe className="w-4 h-4" />;
      case 'Trojan': return <Lock className="w-4 h-4" />;
      case 'WireGuard': return <Wifi className="w-4 h-4" />;
      default: return <Key className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (config: DeviceVpnConfig) => {
    const isExpired = config.validUntil && new Date(config.validUntil) < new Date();
    if (!config.isActive) {
      return <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Inactif</span>;
    }
    if (isExpired) {
      return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Expiré</span>;
    }
    return <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Actif</span>;
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Configurations VPN des Appareils</h1>
            <p className="text-gray-400 mt-1">Assignez des configurations VPN cryptées aux appareils</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouvelle Configuration
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{devices.length}</p>
                <p className="text-xs text-gray-400">Appareils Actifs</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Server className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{configs.filter(c => c.isActive).length}</p>
                <p className="text-xs text-gray-400">Configs Actives</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{profiles.length}</p>
                <p className="text-xs text-gray-400">Profils VPN</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Download className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {configs.filter(c => c.syncedAt).length}
                </p>
                <p className="text-xs text-gray-400">Configs Sync</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Configs List */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Appareil</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Configuration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Serveur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Version</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Dernière Sync</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      Chargement...
                    </td>
                  </tr>
                ) : configs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      Aucune configuration. Créez-en une nouvelle.
                    </td>
                  </tr>
                ) : (
                  configs.map((config) => (
                    <tr key={config.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Smartphone className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-white">{config.deviceId.slice(0, 8)}...</p>
                            <p className="text-xs text-gray-500">{config.deviceId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getProtocolIcon(config.protocol)}
                          <span className="text-sm text-white">{config.configName}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{config.protocol}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span>{config.serverFlag}</span>
                          <span className="text-sm text-white">{config.serverCountry}</span>
                        </div>
                        <p className="text-xs text-gray-500">{config.serverHost}:{config.serverPort}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-300">v{config.configVersion}</span>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(config)}
                        {config.validUntil && (
                          <p className="text-xs text-gray-500 mt-1">
                            Expire: {new Date(config.validUntil).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {config.syncedAt ? (
                          <span className="text-sm text-green-400">
                            {new Date(config.syncedAt).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-sm text-yellow-400">Jamais</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleInvalidate(config.id)}
                            className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                            title="Forcer resynchro"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(config.id)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-700">
                  <h2 className="text-xl font-bold text-white">Nouvelle Configuration VPN</h2>
                  <p className="text-gray-400 mt-1">Assignez une configuration cryptée à un appareil</p>
                </div>

                <div className="p-6 space-y-4">
                  {/* Device Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Appareil</label>
                    <select
                      value={selectedDevice}
                      onChange={(e) => setSelectedDevice(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Sélectionner un appareil...</option>
                      {devices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.deviceName || device.deviceId.slice(0, 8)} ({device.brand || 'Unknown'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Config Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nom de la configuration</label>
                    <input
                      type="text"
                      value={formData.configName}
                      onChange={(e) => setFormData({ ...formData, configName: e.target.value })}
                      placeholder="Ex: France Premium"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Protocol */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Protocole</label>
                    <select
                      value={formData.protocol}
                      onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {PROTOCOLS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Server Info */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Host du serveur</label>
                      <input
                        type="text"
                        value={formData.serverHost}
                        onChange={(e) => setFormData({ ...formData, serverHost: e.target.value })}
                        placeholder="vpn.example.com"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Port</label>
                      <input
                        type="number"
                        value={formData.serverPort}
                        onChange={(e) => setFormData({ ...formData, serverPort: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Country */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Pays</label>
                      <input
                        type="text"
                        value={formData.serverCountry}
                        onChange={(e) => setFormData({ ...formData, serverCountry: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Drapeau</label>
                      <input
                        type="text"
                        value={formData.serverFlag}
                        onChange={(e) => setFormData({ ...formData, serverFlag: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Config Data (JSON) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Données de configuration (JSON crypté)
                    </label>
                    <textarea
                      value={formData.configData}
                      onChange={(e) => setFormData({ ...formData, configData: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ces données seront chiffrées (AES-256-GCM) avant d&apos;être stockées
                    </p>
                  </div>

                  {/* Validity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Validité (jours, 0 = illimité)
                    </label>
                    <input
                      type="number"
                      value={formData.validDays}
                      onChange={(e) => setFormData({ ...formData, validDays: parseInt(e.target.value) || 0 })}
                      min={0}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Assigner la Configuration
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Copy, Check, X, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { Api } from '@/lib/api';
import { useLanguage } from '@/hooks/useLanguage';
import DashboardLayout from '@/components/DashboardLayout';

interface Token {
  id: string;
  token: string;
  deviceId: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date;
  usedByDevice?: string;
  admin: { email: string };
  parsedExpiresAt?: Date;
  reused?: boolean;
}

export default function TokensPage() {
  const { tr } = useLanguage();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [showGenerator, setShowGenerator] = useState(false);
  const [newToken, setNewToken] = useState<Token | null>(null);
  const [deviceIdInput, setDeviceIdInput] = useState('');

  useEffect(() => {
    fetchTokens();
  }, [filter]);

  const fetchTokens = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { limit: 100 };
      if (filter !== 'ALL') params.status = filter;
      const result = await Api.getTokens(params);
      setTokens(result.data || []);
    } catch (err: any) {
      setError(err.message || tr.errorLoading);
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async () => {
    if (!deviceIdInput.trim()) {
      alert(tr.enterDeviceId);
      return;
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(deviceIdInput)) {
      alert(tr.invalidUuid);
      return;
    }

    try {
      const token = await Api.generateToken(deviceIdInput);
      setNewToken(token);
      setDeviceIdInput('');
      fetchTokens();
    } catch (err: any) {
      alert(err.message || tr.errorCreating);
    }
  };

  const revokeToken = async (id: string) => {
    if (!confirm(tr.revokeToken)) return;
    try {
      await Api.revokeToken(id);
      fetchTokens();
    } catch (err: any) {
      alert(err.message || tr.errorRevoking);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
      USED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      EXPIRED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      REVOKED: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return `text-xs font-medium px-2 py-0.5 rounded-full border ${styles[status as keyof typeof styles] || styles.ACTIVE}`;
  };

  const formatDate = (date: Date | string) => {
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
          <h1 className="text-2xl font-bold text-white">{tr.activationTokens}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {tr.generateToken}
          </p>
        </div>
        <button
          onClick={() => setShowGenerator(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Key size={18} />
          {tr.generate}
        </button>
      </motion.div>

      {/* Token Generator Modal */}
      {showGenerator && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowGenerator(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-dark-100 border border-surface-light rounded-xl p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-white mb-4">{tr.generateToken}</h2>
            
            {newToken ? (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <p className="text-green-400 text-sm mb-2">{tr.tokenGenerated}</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-dark-200 rounded px-3 py-2 text-sm text-gray-300 break-all">
                      {newToken.token}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newToken.token, newToken.id)}
                      className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                    >
                      {copiedId === newToken.id ? (
                        <Check size={18} className="text-green-400" />
                      ) : (
                        <Copy size={18} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  <p>• {tr.deviceId}: <span className="text-white font-mono">{newToken.deviceId}</span></p>
                  <p>• {tr.expiresAt}: {formatDate(newToken.parsedExpiresAt || newToken.expiresAt)}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setNewToken(null); setDeviceIdInput(''); }}
                    className="flex-1 btn-secondary"
                  >
                    {tr.generate}
                  </button>
                  <button
                    onClick={() => { setShowGenerator(false); setNewToken(null); }}
                    className="flex-1 btn-primary"
                  >
                    {tr.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {tr.deviceUuid}
                  </label>
                  <input
                    type="text"
                    value={deviceIdInput}
                    onChange={(e) => setDeviceIdInput(e.target.value)}
                    placeholder={tr.deviceUuidPlaceholder}
                    className="w-full bg-dark-200 border border-surface-light rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {tr.deviceUuidHelp}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowGenerator(false)}
                    className="flex-1 btn-secondary"
                  >
                    {tr.cancel}
                  </button>
                  <button
                    onClick={generateToken}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    <Key size={18} />
                    {tr.generate}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex items-center gap-2">
        {['ALL', 'ACTIVE', 'USED', 'EXPIRED', 'REVOKED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === status
                ? 'bg-primary text-white'
                : 'bg-dark-200 text-gray-400 hover:bg-dark-300'
            }`}
          >
            {status === 'ALL' ? tr.allTokens : status.charAt(0) + status.slice(1).toLowerCase()}
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

      {/* Tokens List */}
      <motion.div variants={itemVariants}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tokens.length === 0 ? (
          <div className="bg-dark-200 rounded-xl p-12 text-center">
            <Key size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">{tr.noTokensFound}</p>
          </div>
        ) : (
          <div className="bg-dark-200 rounded-xl border border-surface-light overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-light">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Token</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">{tr.deviceId}</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">{tr.status}</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">{tr.expiresAt}</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">{tr.createdBy}</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">{tr.actions}</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => (
                  <tr key={token.id} className="border-b border-surface-light/50 hover:bg-dark-300/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-gray-300 font-mono max-w-[150px] truncate">
                          {token.token}
                        </code>
                        <button
                          onClick={() => copyToClipboard(token.token, token.id)}
                          className="p-1 hover:bg-dark-300 rounded transition-colors"
                        >
                          {copiedId === token.id ? (
                            <Check size={14} className="text-green-400" />
                          ) : (
                            <Copy size={14} className="text-gray-500" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400 font-mono">
                        {token.deviceId.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={getStatusBadge(token.status)}>
                        {token.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock size={14} />
                        {formatDate(token.parsedExpiresAt || token.expiresAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">
                        {token.admin?.email}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {token.status === 'ACTIVE' && (
                          <button
                            onClick={() => revokeToken(token.id)}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                            title={tr.delete}
                          >
                            <X size={16} className="text-red-400" />
                          </button>
                        )}
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

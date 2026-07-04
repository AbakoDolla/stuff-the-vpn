'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, Smartphone, HardDrive, Activity, TrendingUp, TrendingDown,
  RefreshCw, Shield, Clock, AlertTriangle, CheckCircle, UserPlus,
  Key, Zap,
} from 'lucide-react';
import { Api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

function StatCard({
  title, value, sub, icon: Icon, color, loading,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'orange';
  loading?: boolean;
}) {
  const colors = {
    blue:   { bg: 'from-blue-500/10 to-blue-600/5',   icon: 'text-blue-400',   border: 'border-blue-500/20' },
    green:  { bg: 'from-green-500/10 to-green-600/5', icon: 'text-green-400',  border: 'border-green-500/20' },
    purple: { bg: 'from-purple-500/10 to-purple-600/5',icon: 'text-purple-400',border: 'border-purple-500/20' },
    orange: { bg: 'from-orange-500/10 to-orange-600/5',icon: 'text-orange-400',border: 'border-orange-500/20' },
  }[color];

  return (
    <div className={`card bg-gradient-to-br ${colors.bg} border ${colors.border} p-5`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-white leading-tight">{value}</p>
          )}
          {sub && !loading && (
            <p className="text-xs text-gray-500 mt-1">{sub}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl bg-white/5 ${colors.icon} shrink-0`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ action }: { action: string }) {
  if (action.includes('LOGIN'))    return <CheckCircle size={14} className="text-green-400" />;
  if (action.includes('CREATE'))   return <UserPlus size={14} className="text-blue-400" />;
  if (action.includes('DELETE'))   return <AlertTriangle size={14} className="text-red-400" />;
  if (action.includes('BLOCK'))    return <Shield size={14} className="text-orange-400" />;
  if (action.includes('TOKEN'))    return <Key size={14} className="text-purple-400" />;
  if (action.includes('QUOTA'))    return <HardDrive size={14} className="text-cyan-400" />;
  return <Activity size={14} className="text-gray-400" />;
}

function formatAction(action: string): string {
  const map: Record<string, string> = {
    USER_LOGIN:     'Connexion utilisateur',
    USER_CREATE:    'Utilisateur créé',
    USER_DELETE:    'Utilisateur supprimé',
    USER_SUSPEND:   'Utilisateur suspendu',
    DEVICE_BLOCK:   'Appareil bloqué',
    DEVICE_CREATE:  'Appareil activé',
    TOKEN_GENERATE: 'Token généré',
    TOKEN_REVOKE:   'Token révoqué',
    QUOTA_UPDATE:   'Quota mis à jour',
    LICENSE_CREATE: 'Licence créée',
    INBOUND_CREATE: 'Inbound créé',
  };
  return map[action] ?? action.replace(/_/g, ' ').toLowerCase();
}

function formatGB(gb: number): string {
  if (gb === 0) return '0 GB';
  if (gb >= 1000) return `${(gb / 1000).toFixed(2)} TB`;
  return `${gb.toFixed(2)} GB`;
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => Api.getStats(),
    refetchInterval: 60_000,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users-recent'],
    queryFn: () => Api.getUsers({ limit: 8, page: 1 }),
    refetchInterval: 60_000,
  });

  const isLoading = statsLoading;
  const users = usersData?.users ?? usersData ?? [];
  const recentActivities: Array<{ action: string; userId?: string; createdAt: string; details?: Record<string, unknown> }> =
    (stats as { recentActivities?: Array<{ action: string; userId?: string; createdAt: string; details?: Record<string, unknown> }> })?.recentActivities ?? [];
  const topUsers: Array<{ id: string; username?: string; email?: string; quotaUsedGB: number; quotaRemainingGB: number }> =
    (stats as { topUsers?: Array<{ id: string; username?: string; email?: string; quotaUsedGB: number; quotaRemainingGB: number }> })?.topUsers ?? [];

  const s = stats as Record<string, unknown> | undefined;
  const totalUsers    = (s?.users as { total?: number })?.total ?? (s?.totalUsers as number) ?? 0;
  const activeUsers   = (s?.users as { active?: number })?.active ?? (s?.activeUsers as number) ?? 0;
  const totalDevices  = (s?.devices as { total?: number })?.total ?? 0;
  const activeDevices = (s?.devices as { active?: number })?.active ?? 0;
  const totalBandGB   = (s?.bandwidth as { totalGB?: number })?.totalGB ?? 0;
  const todayBandGB   = (s?.bandwidth as { todayGB?: number })?.todayGB ?? 0;
  const activeLic     = (s?.licenses as { active?: number })?.active ?? (s?.activeLicenses as number) ?? 0;

  return (
    <DashboardLayout>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">

        {/* Header */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Tableau de bord</h1>
            <p className="text-xs text-gray-500 mt-0.5">Vue d&apos;ensemble du système SXB VPN</p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all text-xs"
          >
            <RefreshCw size={13} />
            Actualiser
          </button>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Utilisateurs actifs"
            value={isLoading ? '—' : activeUsers.toLocaleString('fr-FR')}
            sub={isLoading ? '' : `${totalUsers.toLocaleString('fr-FR')} au total`}
            icon={Users}
            color="blue"
            loading={isLoading}
          />
          <StatCard
            title="Appareils enregistrés"
            value={isLoading ? '—' : totalDevices.toLocaleString('fr-FR')}
            sub={isLoading ? '' : `${activeDevices} actifs`}
            icon={Smartphone}
            color="green"
            loading={isLoading}
          />
          <StatCard
            title="Données utilisées (total)"
            value={isLoading ? '—' : formatGB(totalBandGB)}
            sub={isLoading ? '' : `Aujourd'hui : ${formatGB(todayBandGB)}`}
            icon={HardDrive}
            color="purple"
            loading={isLoading}
          />
          <StatCard
            title="Licences actives"
            value={isLoading ? '—' : activeLic.toLocaleString('fr-FR')}
            sub={isLoading ? '' : 'Appareils autorisés'}
            icon={Shield}
            color="orange"
            loading={isLoading}
          />
        </motion.div>

        {/* Middle row: Recent Users + Activities + Top Users */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Recent Users Table */}
          <div className="lg:col-span-2 card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-200">Utilisateurs récents</h2>
              <a href="/dashboard/users" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                Voir tout →
              </a>
            </div>
            {usersLoading ? (
              <div className="space-y-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-500">
                <Users size={32} className="mb-2 opacity-30" />
                <p className="text-sm">Aucun utilisateur</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-white/5">
                    <th className="text-left py-2 font-medium">Utilisateur</th>
                    <th className="text-left py-2 font-medium hidden md:table-cell">Quota</th>
                    <th className="text-left py-2 font-medium">Statut</th>
                    <th className="text-left py-2 font-medium hidden lg:table-cell">Expire</th>
                  </tr>
                </thead>
                <tbody>
                  {(users as Array<{ id: string; username?: string; email?: string; phone?: string; status: string; quotaUsedGB: number; quotaRemainingGB: number; expireAt?: string }>).map((u) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                            {(u.username ?? u.email ?? '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-200 text-xs">{u.username ?? '—'}</p>
                            <p className="text-gray-500 text-[10px]">{u.email ?? u.phone ?? ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 hidden md:table-cell">
                        <p className="text-gray-300">{u.quotaUsedGB.toFixed(1)} GB</p>
                        <p className="text-gray-500 text-[10px]">{u.quotaRemainingGB.toFixed(1)} GB restants</p>
                      </td>
                      <td className="py-2.5">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          u.status === 'ACTIVE'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {u.status === 'ACTIVE' ? 'Actif' : u.status}
                        </span>
                      </td>
                      <td className="py-2.5 hidden lg:table-cell text-gray-500 text-[10px]">
                        {u.expireAt ? new Date(u.expireAt).toLocaleDateString('fr-FR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent Activities */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-200">Activités récentes</h2>
              <a href="/dashboard/audit" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                Voir tout →
              </a>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />)}
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-500">
                <Activity size={28} className="mb-2 opacity-30" />
                <p className="text-xs">Aucune activité récente</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentActivities.slice(0, 8).map((act, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="mt-0.5 p-1.5 rounded-lg bg-white/5 shrink-0">
                      <ActivityIcon action={act.action} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-300 font-medium truncate">{formatAction(act.action)}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={9} className="text-gray-600" />
                        <p className="text-[10px] text-gray-500">
                          {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Bottom row: System Status + Top Users */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* System Status */}
          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-gray-200">État du système</h2>
            <div className="space-y-2">
              {[
                { label: 'Backend API', ok: true },
                { label: 'Base de données', ok: true },
                {
                  label: 'V2Ray / Xray',
                  ok: (s?.v2ray as { reachable?: boolean })?.reachable ?? false,
                  sub: (s?.v2ray as { activeConnections?: number })?.activeConnections
                    ? `${(s?.v2ray as { activeConnections?: number }).activeConnections} connexions actives`
                    : 'Hors ligne ou non configuré',
                },
                {
                  label: 'Inbounds actifs',
                  ok: ((s?.inbounds as { active?: number })?.active ?? 0) > 0,
                  sub: `${(s?.inbounds as { active?: number })?.active ?? 0} / ${(s?.inbounds as { total?: number })?.total ?? 0}`,
                },
              ].map((svc) => (
                <div key={svc.label} className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${svc.ok ? 'bg-green-400' : 'bg-red-400'}`} />
                    <div>
                      <p className="text-xs text-gray-300 font-medium">{svc.label}</p>
                      {svc.sub && <p className="text-[10px] text-gray-500">{svc.sub}</p>}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    svc.ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {svc.ok ? 'Opérationnel' : 'Hors ligne'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Users by consumption */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-200">Top consommateurs</h2>
              <a href="/dashboard/users" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                Voir tout →
              </a>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />)}
              </div>
            ) : topUsers.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-500">
                <Zap size={28} className="mb-2 opacity-30" />
                <p className="text-xs">Aucune donnée de consommation</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topUsers.map((u, i) => {
                  const total = u.quotaUsedGB + u.quotaRemainingGB;
                  const pct = total > 0 ? Math.min(100, Math.round((u.quotaUsedGB / total) * 100)) : 0;
                  return (
                    <div key={u.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 font-mono w-4">{i + 1}</span>
                          <span className="text-gray-300 font-medium">{u.username ?? u.email ?? 'Utilisateur'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">{u.quotaUsedGB.toFixed(1)} GB</span>
                          {pct > 80 ? <TrendingUp size={12} className="text-red-400" /> : <TrendingDown size={12} className="text-green-400" />}
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-orange-500' : 'bg-blue-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

      </motion.div>
    </DashboardLayout>
  );
}

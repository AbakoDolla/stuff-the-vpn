'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, Smartphone, HardDrive, Activity, TrendingUp, TrendingDown,
  RefreshCw, Shield, Clock, AlertTriangle, CheckCircle, UserPlus,
  Key, Zap,
} from 'lucide-react';
import { Api } from '@/lib/api';
import { useLanguage } from '@/hooks/useLanguage';
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
    blue:   { bg: 'from-blue-600/5 to-blue-500/0',   icon: 'text-blue-400',   border: 'border-blue-500/30', iconBg: 'bg-blue-500/10' },
    green:  { bg: 'from-green-600/5 to-green-500/0', icon: 'text-green-400',  border: 'border-green-500/30', iconBg: 'bg-green-500/10' },
    purple: { bg: 'from-purple-600/5 to-purple-500/0',icon: 'text-purple-400',border: 'border-purple-500/30', iconBg: 'bg-purple-500/10' },
    orange: { bg: 'from-orange-600/5 to-orange-500/0',icon: 'text-orange-400',border: 'border-orange-500/30', iconBg: 'bg-orange-500/10' },
  }[color];

  return (
    <motion.div 
      variants={item}
      className={`group relative overflow-hidden card bg-gradient-to-br ${colors.bg} border ${colors.border} p-6 hover:border-${color}-500/50 transition-all duration-300`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">{title}</p>
          {loading ? (
            <div className="h-8 w-32 bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-white leading-tight">{value}</p>
          )}
          {sub && !loading && (
            <p className="text-xs text-gray-500 mt-2.5">{sub}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colors.iconBg} ${colors.icon} shrink-0 transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={24} />
        </div>
      </div>
    </motion.div>
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

function formatAction(action: string, tr: Record<string, string>): string {
  const map: Record<string, string> = {
    USER_LOGIN:     'userLogin',
    USER_CREATE:    'userCreated',
    USER_DELETE:    'userDeleted',
    USER_SUSPEND:   'userSuspended',
    DEVICE_BLOCK:   'deviceBlocked',
    DEVICE_CREATE:  'deviceCreated',
    TOKEN_GENERATE: 'tokenGeneratedAction',
    TOKEN_REVOKE:   'tokenRevoked',
    QUOTA_UPDATE:   'quotaUpdated',
    LICENSE_CREATE: 'licenseCreated',
    INBOUND_CREATE: 'inboundCreated',
  };
  const key = map[action];
  return key ? (tr[key] ?? action.replace(/_/g, ' ').toLowerCase()) : action.replace(/_/g, ' ').toLowerCase();
}

function formatGB(gb: number): string {
  if (gb === 0) return '0 GB';
  if (gb >= 1000) return `${(gb / 1000).toFixed(2)} TB`;
  return `${gb.toFixed(2)} GB`;
}

export default function DashboardPage() {
  const { tr } = useLanguage();
  
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
            <h1 className="text-xl font-bold text-white">{tr.dashboard}</h1>
            <p className="text-xs text-gray-500 mt-0.5">{tr.systemOverview}</p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all text-xs"
          >
            <RefreshCw size={13} />
            {tr.refresh}
          </button>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={tr.activeUsers}
            value={isLoading ? '—' : activeUsers.toLocaleString('fr-FR')}
            sub={isLoading ? '' : `${totalUsers.toLocaleString('fr-FR')} ${tr.totalUsers}`}
            icon={Users}
            color="blue"
            loading={isLoading}
          />
          <StatCard
            title={tr.registeredDevices}
            value={isLoading ? '—' : totalDevices.toLocaleString('fr-FR')}
            sub={isLoading ? '' : `${activeDevices} ${tr.active}`}
            icon={Smartphone}
            color="green"
            loading={isLoading}
          />
          <StatCard
            title={tr.dataUsed}
            value={isLoading ? '—' : formatGB(totalBandGB)}
            sub={isLoading ? '' : `${tr.todayData} ${formatGB(todayBandGB)}`}
            icon={HardDrive}
            color="purple"
            loading={isLoading}
          />
          <StatCard
            title={tr.activeLicenses}
            value={isLoading ? '—' : activeLic.toLocaleString('fr-FR')}
            sub={isLoading ? '' : tr.authorizedDevices}
            icon={Shield}
            color="orange"
            loading={isLoading}
          />
        </motion.div>

        {/* Middle row: Recent Users + Activities + Top Users */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Recent Users Table */}
          <motion.div variants={item} className="lg:col-span-2 card space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div>
                <h2 className="text-sm font-bold text-white">{tr.recentUsers}</h2>
                <p className="text-xs text-gray-500 mt-1">Derniers utilisateurs enregistrés</p>
              </div>
              <a href="/dashboard/users" className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20">
                {tr.viewAll} →
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
                <p className="text-sm">{tr.noUsersFound}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-white/10">
                      <th className="text-left py-3 px-4 font-semibold">{tr.username}</th>
                      <th className="text-left py-3 px-4 font-semibold hidden md:table-cell">{tr.quota}</th>
                      <th className="text-left py-3 px-4 font-semibold">{tr.status}</th>
                      <th className="text-left py-3 px-4 font-semibold hidden lg:table-cell">{tr.expireAt}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(users as Array<{ id: string; username?: string; email?: string; phone?: string; status: string; quotaUsedGB: number; quotaRemainingGB: number; expireAt?: string }>).map((u) => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                              {(u.username ?? u.email ?? '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-100 text-xs">{u.username ?? '—'}</p>
                              <p className="text-gray-500 text-[11px]">{u.email ?? u.phone ?? ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 hidden md:table-cell">
                          <p className="text-gray-200 font-medium">{u.quotaUsedGB.toFixed(1)} {tr.gb}</p>
                          <p className="text-gray-500 text-[11px]">{u.quotaRemainingGB.toFixed(1)} {tr.gb} {tr.quotaRemaining}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 ${
                            u.status === 'ACTIVE'
                              ? 'bg-green-500/10 text-green-400 border-green-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`} />
                            {u.status === 'ACTIVE' ? tr.active : u.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 hidden lg:table-cell text-gray-500 text-[11px]">
                          {u.expireAt ? new Date(u.expireAt).toLocaleDateString('fr-FR') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Top Users by consumption */}
          <motion.div variants={item} className="card space-y-4">
            <div className="pb-4 border-b border-white/5">
              <h2 className="text-sm font-bold text-white">Top utilisateurs</h2>
              <p className="text-xs text-gray-500 mt-1">Consommation de données</p>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />)}
              </div>
            ) : topUsers.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-500">
                <Zap size={32} className="mb-3 opacity-40" />
                <p className="text-xs">{tr.noData}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topUsers.map((u, i) => {
                  const total = u.quotaUsedGB + u.quotaRemainingGB;
                  const pct = total > 0 ? Math.min(100, Math.round((u.quotaUsedGB / total) * 100)) : 0;
                  const getColor = () => {
                    if (pct > 80) return 'from-red-500 to-red-600';
                    if (pct > 50) return 'from-orange-500 to-orange-600';
                    return 'from-blue-500 to-blue-600';
                  };
                  return (
                    <div key={u.id} className="space-y-2 p-3 rounded-lg bg-white/3 hover:bg-white/5 transition-colors duration-200">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="text-gray-500 font-bold text-sm w-5">{i + 1}</span>
                          <span className="text-gray-200 font-semibold">{u.username ?? u.email ?? 'User'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300 font-medium">{u.quotaUsedGB.toFixed(1)} GB</span>
                          {pct > 80 ? <TrendingUp size={14} className="text-red-400" /> : <TrendingDown size={14} className="text-green-400" />}
                        </div>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all bg-gradient-to-r ${getColor()}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
              <a href="/dashboard/audit" className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20">
                {tr.viewAll} →
              </a>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />)}
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-500">
                <Activity size={32} className="mb-3 opacity-40" />
                <p className="text-xs">{tr.noRecentActivity}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivities.slice(0, 8).map((act, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors duration-200 group">
                    <div className="mt-0.5 p-2 rounded-lg bg-white/5 group-hover:bg-white/10 shrink-0 transition-colors">
                      <ActivityIcon action={act.action} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-200 font-medium truncate">{formatAction(act.action, tr)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={11} className="text-gray-600 shrink-0" />
                        <p className="text-[10px] text-gray-500">
                          {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

        {/* Bottom row: System Status + Top Users */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* System Status */}
          <motion.div variants={item} className="card space-y-4">
            <div className="pb-4 border-b border-white/5">
              <h2 className="text-sm font-bold text-white">{tr.systemStatus}</h2>
              <p className="text-xs text-gray-500 mt-1">Santé des services critiques</p>
            </div>
            <div className="space-y-2">
              {[
                { label: 'backendApi', ok: true },
                { label: 'database', ok: true },
                {
                  label: 'v2ray',
                  ok: (s?.v2ray as { reachable?: boolean })?.reachable ?? false,
                  sub: (s?.v2ray as { activeConnections?: number })?.activeConnections
                    ? `${(s?.v2ray as { activeConnections?: number }).activeConnections} ${tr.activeConnections}`
                    : tr.noActiveInbounds,
                },
                {
                  label: 'activeInbounds',
                  ok: ((s?.inbounds as { active?: number })?.active ?? 0) > 0,
                  sub: `${(s?.inbounds as { active?: number })?.active ?? 0} / ${(s?.inbounds as { total?: number })?.total ?? 0}`,
                },
              ].map((svc) => (
                <div key={svc.label} className="flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:border-opacity-100" style={{
                  backgroundColor: svc.ok ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                  borderColor: svc.ok ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                }}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${svc.ok ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-xs text-gray-200 font-medium">{tr[svc.label as keyof typeof tr] ?? svc.label}</p>
                      {svc.sub && <p className="text-[11px] text-gray-500 mt-0.5">{svc.sub}</p>}
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                    svc.ok ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                  }`}>
                    {svc.ok ? tr.operational : tr.offline}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Users by consumption */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-200">{tr.recentUsers}</h2>
              <a href="/dashboard/users" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                {tr.viewAll}
              </a>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />)}
              </div>
            ) : topUsers.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-500">
                <Zap size={28} className="mb-2 opacity-30" />
                <p className="text-xs">{tr.noData}</p>
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
                          <span className="text-gray-300 font-medium">{u.username ?? u.email ?? 'User'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">{u.quotaUsedGB.toFixed(1)} {tr.gb}</span>
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

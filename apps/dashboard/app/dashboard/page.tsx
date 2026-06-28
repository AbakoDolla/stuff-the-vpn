'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Users, Server, Ticket, CreditCard, TrendingUp,
  Activity, Shield, Wifi, AlertCircle, RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface StatsData {
  totalUsers: number;
  activeUsers: number;
  totalServers: number;
  onlineServers: number;
  totalVouchers: number;
  activeVouchers: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

function StatCard({
  label, value, sub, icon: Icon, color, trend
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; trend?: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#64748B] font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
          {sub && <p className="text-xs text-[#64748B] mt-0.5">{sub}</p>}
        </div>
        <div className="p-2.5 rounded-xl" style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          <span className="text-xs text-emerald-400">{trend}</span>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users?limit=1&status=ACTIVE').then(r => r.data),
    refetchInterval: 30_000,
  });

  const { data: serversData, isLoading: loadingServers } = useQuery({
    queryKey: ['servers'],
    queryFn: () => api.get('/servers').then(r => r.data),
    refetchInterval: 15_000,
  });

  const { data: vouchersData } = useQuery({
    queryKey: ['vouchers-stats'],
    queryFn: () => api.get('/vouchers?limit=1000').then(r => r.data),
    refetchInterval: 60_000,
  });

  const { data: auditData } = useQuery({
    queryKey: ['audit-recent'],
    queryFn: () => api.get('/audit?limit=8').then(r => r.data),
    refetchInterval: 30_000,
  });

  const users    = usersData?.data ?? [];
  const servers  = serversData?.data ?? [];
  const vouchers = vouchersData?.data ?? [];

  const onlineServers   = servers.filter((s: { status: string }) => s.status === 'ONLINE').length;
  const activeVouchers  = vouchers.filter((v: { status: string }) => v.status === 'ACTIVE').length;
  const usedVouchers    = vouchers.filter((v: { status: string }) => v.status === 'USED').length;

  const isLoading = loadingUsers || loadingServers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Vue d&apos;ensemble</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Tableau de bord SxBVPN</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="btn-ghost flex items-center gap-2 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualiser
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Utilisateurs"
          value={isLoading ? '...' : usersData?.meta?.total ?? users.length}
          sub={`${usersData?.meta?.totalActive ?? 0} actifs`}
          icon={Users}
          color="#6366F1"
          trend="+12% ce mois"
        />
        <StatCard
          label="Serveurs"
          value={servers.length}
          sub={`${onlineServers} en ligne`}
          icon={Server}
          color={onlineServers === servers.length ? '#10B981' : '#F59E0B'}
        />
        <StatCard
          label="Vouchers actifs"
          value={activeVouchers}
          sub={`${usedVouchers} utilisés`}
          icon={Ticket}
          color="#8B5CF6"
        />
        <StatCard
          label="Connexions live"
          value="—"
          sub="Via Socket.IO"
          icon={Activity}
          color="#06B6D4"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Servers status */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Server className="w-4 h-4 text-[#6366F1]" />
              Serveurs ({servers.length})
            </h2>
          </div>
          {loadingServers ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}
            </div>
          ) : servers.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-[#64748B]">
              <Server className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">Aucun serveur configuré</p>
            </div>
          ) : (
            <div className="space-y-2">
              {servers.slice(0, 6).map((s: { id: string; name?: string; remark?: string; status?: string; protocol?: string; ip?: string; host?: string; country?: string; flag?: string; activeConns?: number; cpuPercent?: number }) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${s.status === 'ONLINE' ? 'bg-emerald-400' : s.status === 'OFFLINE' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                    <div>
                      <p className="text-sm font-medium">{s.name ?? s.remark ?? 'Serveur'}</p>
                      <p className="text-xs text-[#64748B]">{s.protocol} · {s.ip ?? s.host} · {s.country ?? ''} {s.flag ?? ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${s.status === 'ONLINE' ? 'badge-green' : s.status === 'OFFLINE' ? 'badge-red' : 'badge-yellow'}`}>
                      {s.status ?? 'UNKNOWN'}
                    </span>
                    {s.activeConns !== undefined && (
                      <p className="text-xs text-[#64748B] mt-1">{s.activeConns} conn.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-[#6366F1]" />
            Activité récente
          </h2>
          {!auditData?.data?.length ? (
            <div className="flex flex-col items-center py-8 text-[#64748B]">
              <Activity className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">Aucune activité</p>
            </div>
          ) : (
            <div className="space-y-3">
              {auditData.data.map((log: { id: string; action: string; createdAt: string; user?: { username: string } }) => (
                <div key={log.id} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{log.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-[#64748B]">
                      {log.user?.username ?? 'Système'} · {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick status row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-[#64748B]">Chiffrement</p>
            <p className="text-sm font-medium">AES-256-GCM ✓</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Wifi className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-[#64748B]">Protocoles</p>
            <p className="text-sm font-medium">VLESS · VMESS · SSH · WG</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <CreditCard className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-[#64748B]">Vouchers dispo</p>
            <p className="text-sm font-medium">{activeVouchers} actifs</p>
          </div>
        </div>
      </div>
    </div>
  );
}

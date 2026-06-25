'use client';
import { useState, useEffect } from 'react';
import { Users, Ticket, Server, AlertTriangle, Clock, Database, Key } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import { relativeTime } from '@/lib/utils';

interface Stats {
  totalUsers: number; activeUsers: number; suspendedUsers: number;
  totalVouchers: number; usedVouchers: number; activeVouchers: number;
  totalLicenses: number; activeLicenses: number;
  totalPlans: number; activePlans: number;
  totalInbounds: number; activeInbounds: number;
  recentUsers: { username: string; email: string; createdAt: string; status: string }[];
}

const USAGE_MOCK = [
  { hour: '00h', up: 12, down: 45 }, { hour: '04h', up: 8, down: 32 },
  { hour: '08h', up: 35, down: 120 }, { hour: '12h', up: 62, down: 220 },
  { hour: '16h', up: 80, down: 310 }, { hour: '20h', up: 55, down: 190 },
  { hour: '23h', up: 30, down: 105 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Un seul appel à GET /api/admin/stats
        const r = await api.get('/admin/stats');
        setStats(r.data.data);
      } catch {
        /* stats reste null */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pieData = stats ? [
    { name: 'Actifs', value: stats.activeUsers, color: '#10B981' },
    { name: 'Suspendus', value: stats.suspendedUsers, color: '#EF4444' },
    { name: 'Inactifs', value: Math.max(0, stats.totalUsers - stats.activeUsers - stats.suspendedUsers), color: '#64748B' },
  ] : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#F1F5F9]">Tableau de bord</h1>
            <p className="text-sm text-[#64748B]">Vue d&apos;ensemble de la plateforme SxBVPN</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <Clock className="w-3.5 h-3.5" />
            Mis à jour {relativeTime(new Date().toISOString())}
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Utilisateurs totaux" value={loading ? '—' : stats?.totalUsers ?? 0} subtitle={`${stats?.activeUsers ?? 0} actifs`} icon={Users} color="blue" />
          <StatsCard title="Vouchers actifs" value={loading ? '—' : stats?.activeVouchers ?? 0} subtitle={`${stats?.usedVouchers ?? 0} utilisés`} icon={Ticket} color="green" />
          <StatsCard title="Serveurs actifs" value={loading ? '—' : `${stats?.activeInbounds ?? 0}/${stats?.totalInbounds ?? 0}`} subtitle="Inbounds en ligne" icon={Server} color="amber" />
          <StatsCard title="Licenses actives" value={loading ? '—' : stats?.activeLicenses ?? 0} subtitle={`${stats?.totalLicenses ?? 0} total`} icon={Key} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Trafic réseau (données simulées) */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#F1F5F9]">Trafic réseau (24h)</h2>
              <div className="flex items-center gap-3">
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">Données simulées</span>
                <div className="flex gap-3 text-xs text-[#64748B]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#0099FF] inline-block" />Upload</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00D4FF] inline-block" />Download</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={USAGE_MOCK}>
                <defs>
                  <linearGradient id="gUp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0099FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0099FF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
                <XAxis dataKey="hour" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#141C2E', border: '1px solid #1E2D45', borderRadius: 8, color: '#F1F5F9' }} />
                <Area type="monotone" dataKey="up" stroke="#0099FF" fill="url(#gUp)" strokeWidth={2} name="Upload MB" />
                <Area type="monotone" dataKey="down" stroke="#00D4FF" fill="url(#gDown)" strokeWidth={2} name="Download MB" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart statut utilisateurs */}
          <div className="card">
            <h2 className="text-sm font-semibold text-[#F1F5F9] mb-4">Statut utilisateurs</h2>
            {loading || (stats?.totalUsers ?? 0) === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-[#64748B] text-sm">Aucune donnée</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#141C2E', border: '1px solid #1E2D45', borderRadius: 8, color: '#F1F5F9' }} />
                  <Legend formatter={(v) => <span style={{ color: '#94A3B8', fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Derniers utilisateurs */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#F1F5F9]">Derniers utilisateurs inscrits</h2>
            <a href="/users" className="text-xs text-[#0099FF] hover:text-[#00D4FF] transition-colors">Voir tous →</a>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1E2D45] animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3.5 bg-[#1E2D45] rounded animate-pulse w-1/4" />
                    <div className="h-3 bg-[#1E2D45] rounded animate-pulse w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (stats?.recentUsers || []).length === 0 ? (
            <p className="text-sm text-[#64748B]">Aucun utilisateur récent</p>
          ) : (
            <div className="space-y-2">
              {(stats?.recentUsers || []).map((u, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#0F1629] transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0099FF] to-[#00D4FF] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {u.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F1F5F9] truncate">{u.username}</p>
                    <p className="text-xs text-[#64748B] truncate">{u.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>{u.status}</span>
                  <span className="text-xs text-[#64748B] whitespace-nowrap">{relativeTime(u.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* État des services et alertes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card">
            <h2 className="text-sm font-semibold text-[#F1F5F9] mb-3">État des services</h2>
            <div className="space-y-2">
              {[
                { name: 'API Backend', ok: true },
                { name: 'Base de données', ok: true },
                { name: 'V2Ray', ok: (stats?.activeInbounds ?? 0) > 0 },
              ].map(s => (
                <div key={s.name} className="flex items-center justify-between">
                  <span className="text-sm text-[#94A3B8]">{s.name}</span>
                  {s.ok
                    ? <span className="badge-active"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Online</span>
                    : <span className="badge-inactive"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />Offline</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h2 className="text-sm font-semibold text-[#F1F5F9] mb-3">Résumé des ressources</h2>
            <div className="space-y-2">
              {[
                { label: 'Plans actifs', val: `${stats?.activePlans ?? 0} / ${stats?.totalPlans ?? 0}` },
                { label: 'Licenses actives', val: `${stats?.activeLicenses ?? 0} / ${stats?.totalLicenses ?? 0}` },
                { label: 'Inbounds actifs', val: `${stats?.activeInbounds ?? 0} / ${stats?.totalInbounds ?? 0}` },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-[#94A3B8]">{item.label}</span>
                  <span className="text-sm font-mono text-[#F1F5F9]">{loading ? '—' : item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

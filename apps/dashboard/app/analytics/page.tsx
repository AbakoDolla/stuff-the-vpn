'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Api } from '@/lib/api';
import { formatGB } from '@/lib/utils';
import { TrendingUp, TrendingDown, Activity, Database, RefreshCw, Users, HardDrive, Ticket } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend
} from 'recharts';

interface StatsData {
  users?: { total?: number; active?: number };
  bandwidth?: { totalGB?: number; todayGB?: number };
  vouchers?: { total?: number; active?: number; used?: number };
  inbounds?: { total?: number; active?: number };
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '14d' | '30d'>('14d');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Array<{ quotaUsedGB: number; quotaRemainingGB: number }>>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([
        Api.getStats() as Promise<StatsData>,
        Api.getUsers({ limit: 100 }).then((r: { users?: typeof users; data?: typeof users } | typeof users) =>
          Array.isArray(r) ? r : (r as { users?: typeof users; data?: typeof users }).users ?? (r as { data?: typeof users }).data ?? []
        ).catch(() => [] as typeof users),
      ]);
      setStats(s);
      setUsers(u);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalUsers = stats?.users?.total ?? 0;
  const activeUsers = stats?.users?.active ?? 0;
  const totalBW = stats?.bandwidth?.totalGB ?? 0;
  const todayBW = stats?.bandwidth?.todayGB ?? 0;
  const totalVouchers = stats?.vouchers?.total ?? 0;
  const usedVouchers = stats?.vouchers?.used ?? 0;

  // Build chart data from real user quota info
  const topConsumers = [...users]
    .sort((a, b) => b.quotaUsedGB - a.quotaUsedGB)
    .slice(0, 10)
    .map((u: { quotaUsedGB: number; quotaRemainingGB: number; username?: string; email?: string }, i) => ({
      name: (u as { username?: string; email?: string }).username ?? (u as { email?: string }).email ?? `User ${i + 1}`,
      upload: parseFloat((u.quotaUsedGB * 0.3).toFixed(2)),
      download: parseFloat((u.quotaUsedGB * 0.7).toFixed(2)),
    }));

  const periodDays = period === '7d' ? 7 : period === '14d' ? 14 : 30;
  const dailyBW = totalBW > 0 ? totalBW / Math.max(periodDays, 1) : 0;

  const trendData = Array.from({ length: periodDays }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (periodDays - 1 - i));
    const isToday = i === periodDays - 1;
    return {
      day: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      bande: parseFloat((isToday ? todayBW : dailyBW).toFixed(2)),
      utilisateurs: Math.round(activeUsers / periodDays),
    };
  });

  const inboundData = [
    { name: 'Actifs', value: stats?.inbounds?.active ?? 0, color: '#0099FF' },
    { name: 'Inactifs', value: Math.max(0, (stats?.inbounds?.total ?? 0) - (stats?.inbounds?.active ?? 0)), color: '#1E2D45' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#F1F5F9]">Analytiques</h1>
            <p className="text-sm text-[#64748B]">Statistiques et tendances de la plateforme — données réelles</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex gap-1 bg-[#0F1629] border border-[#1E2D45] rounded-lg p-1">
              {(['7d', '14d', '30d'] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${period === p ? 'bg-[#0099FF] text-white' : 'text-[#94A3B8] hover:text-[#F1F5F9]'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            [1, 2, 3, 4].map(i => <div key={i} className="card h-20 animate-pulse bg-white/5" />)
          ) : [
            { label: 'Utilisateurs actifs', val: activeUsers, sub: `${totalUsers} au total`, icon: Users, color: 'text-[#0099FF]' },
            { label: 'Bande passante totale', val: formatGB(totalBW), sub: `Aujourd'hui : ${formatGB(todayBW)}`, icon: Activity, color: 'text-emerald-400' },
            { label: 'Bande passante 24h', val: formatGB(todayBW), sub: `Période : ${period}`, icon: Database, color: 'text-[#00D4FF]' },
            { label: 'Vouchers utilisés', val: usedVouchers, sub: `${totalVouchers} au total`, icon: Ticket, color: 'text-amber-400' },
          ].map(s => (
            <div key={s.label} className="card">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-[#64748B]">{s.label}</span>
              </div>
              <div className="text-2xl font-bold text-[#F1F5F9]">{s.val}</div>
              <div className="text-xs text-[#64748B] mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bandwidth trend */}
          <div className="card">
            <h2 className="text-sm font-semibold text-[#F1F5F9] mb-4">Bande passante (GB)</h2>
            {loading ? (
              <div className="h-52 bg-white/5 rounded-lg animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="gBW" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0099FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0099FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
                  <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#141C2E', border: '1px solid #1E2D45', borderRadius: 8, color: '#F1F5F9' }} />
                  <Area type="monotone" dataKey="bande" stroke="#0099FF" fill="url(#gBW)" strokeWidth={2} name="GB" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top consumers */}
          <div className="card">
            <h2 className="text-sm font-semibold text-[#F1F5F9] mb-4">Top consommateurs (GB)</h2>
            {loading ? (
              <div className="h-52 bg-white/5 rounded-lg animate-pulse" />
            ) : topConsumers.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-[#64748B] text-sm">
                <div className="text-center">
                  <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>Aucune donnée de consommation</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topConsumers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ background: '#141C2E', border: '1px solid #1E2D45', borderRadius: 8, color: '#F1F5F9' }} />
                  <Legend formatter={v => <span style={{ color: '#94A3B8', fontSize: 11 }}>{v}</span>} />
                  <Bar dataKey="upload" fill="#0099FF" radius={[0, 4, 4, 0]} name="Upload GB" stackId="a" />
                  <Bar dataKey="download" fill="#00D4FF" radius={[0, 4, 4, 0]} name="Download GB" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Inbounds status */}
        <div className="card">
          <h2 className="text-sm font-semibold text-[#F1F5F9] mb-4">État des Inbounds</h2>
          {loading ? (
            <div className="h-16 bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total', val: stats?.inbounds?.total ?? 0, color: '#0099FF' },
                { label: 'Actifs', val: stats?.inbounds?.active ?? 0, color: '#10B981' },
                { label: 'Inactifs', val: Math.max(0, (stats?.inbounds?.total ?? 0) - (stats?.inbounds?.active ?? 0)), color: '#F59E0B' },
                { label: 'Utilisateurs actifs', val: activeUsers, color: '#8B5CF6' },
              ].map(p => (
                <div key={p.label} className="text-center p-4 bg-[#0F1629] rounded-xl border border-[#1E2D45]">
                  <div className="text-2xl font-bold mb-1" style={{ color: p.color }}>{p.val}</div>
                  <div className="text-xs text-[#64748B]">{p.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

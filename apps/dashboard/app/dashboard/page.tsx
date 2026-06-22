'use client';
  import { Users, Ticket, Server, Clock, Database } from 'lucide-react';
  import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
  } from 'recharts';

  interface Stats {
    totalUsers: number; activeUsers: number; suspendedUsers: number;
    totalVouchers: number; usedVouchers: number; activeVouchers: number;
    totalPlans: number; activePlans: number;
    totalInbounds: number; activeInbounds: number;
    recentUsers: { username: string; email: string; createdAt: string }[];
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
          const [usersR, vouchersR, plansR, inboundsR] = await Promise.allSettled([
            api.get('/users?limit=5&sort=createdAt:desc'),
            api.get('/vouchers?limit=1000'),
            api.get('/plans'),
            api.get('/inbounds'),
          ]);
          const users = usersR.status === 'fulfilled' ? usersR.value.data : { data: [] };
          const vouchers = vouchersR.status === 'fulfilled' ? vouchersR.value.data : { data: [] };
          const plans = plansR.status === 'fulfilled' ? plansR.value.data : { data: [] };
          const inbounds = inboundsR.status === 'fulfilled' ? inboundsR.value.data : { data: [] };

          const usersArr = Array.isArray(users.data) ? users.data : users.data?.items || [];
          const vouchersArr = Array.isArray(vouchers.data) ? vouchers.data : vouchers.data?.items || [];
          const plansArr = Array.isArray(plans.data) ? plans.data : plans.data?.items || [];
          const inboundsArr = Array.isArray(inbounds.data) ? inbounds.data : inbounds.data?.items || [];

          setStats({
            totalUsers: usersArr.length,
            activeUsers: usersArr.filter((u: { status: string }) => u.status === 'ACTIVE').length,
            suspendedUsers: usersArr.filter((u: { status: string }) => u.status === 'SUSPENDED').length,
            totalVouchers: vouchersArr.length,
            usedVouchers: vouchersArr.filter((v: { status: string }) => v.status === 'USED').length,
            activeVouchers: vouchersArr.filter((v: { status: string }) => v.status === 'ACTIVE').length,
            totalPlans: plansArr.length,
            activePlans: plansArr.filter((p: { active: boolean }) => p.active).length,
            totalInbounds: inboundsArr.length,
            activeInbounds: inboundsArr.filter((i: { enabled: boolean }) => i.enabled).length,
            recentUsers: usersArr.slice(0, 5),
          });
        } catch { /* use null stats */ }
        finally { setLoading(false); }
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#F1F5F9]">Tableau de bord</h1>
              <p className="text-sm text-[#64748B]">Vue d'ensemble de la plateforme SxBVPN</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <Clock className="w-3.5 h-3.5" />
              Mis à jour {relativeTime(new Date().toISOString())}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Utilisateurs totaux" value={loading ? '—' : stats?.totalUsers ?? 0} subtitle={`${stats?.activeUsers ?? 0} actifs`} icon={Users} color="blue" />
            <StatsCard title="Vouchers actifs" value={loading ? '—' : stats?.activeVouchers ?? 0} subtitle={`${stats?.usedVouchers ?? 0} utilisés`} icon={Ticket} color="green" />
            <StatsCard title="Serveurs actifs" value={loading ? '—' : `${stats?.activeInbounds ?? 0}/${stats?.totalInbounds ?? 0}`} subtitle="Inbounds en ligne" icon={Server} color="amber" />
            <StatsCard title="Plans disponibles" value={loading ? '—' : stats?.activePlans ?? 0} subtitle="Plans actifs" icon={Database} color="purple" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Traffic Chart */}
            <div className="lg:col-span-2 card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[#F1F5F9]">Trafic réseau (24h)</h2>
                <div className="flex gap-3 text-xs text-[#64748B]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#0099FF] inline-block" />Upload</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00D4FF] inline-block" />Download</span>
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

            {/* User Status Pie */}
            <div className="card">
              <h2 className="text-sm font-semibold text-[#F1F5F9] mb-4">Statut utilisateurs</h2>
              {loading || stats?.totalUsers === 0 ? (
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

          {/* Recent Users */}
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
                    <span className="text-xs text-[#64748B] whitespace-nowrap">{relativeTime(u.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card">
              <h2 className="text-sm font-semibold text-[#F1F5F9] mb-3">État des services</h2>
              <div className="space-y-2">
                {[
                  { name: 'API Backend', ok: true },
                  { name: 'Base de données', ok: true },
                  { name: 'V2Ray', ok: true },
                  { name: 'SSH Server', ok: false },
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
              <h2 className="text-sm font-semibold text-[#F1F5F9] mb-3">Alertes système</h2>
              <div className="space-y-2">
                {[
                  { msg: 'SSH Server hors ligne', level: 'error' },
                  { msg: 'Quota global à 85%', level: 'warning' },
                ].map((a, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${a.level === 'error' ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                    <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${a.level === 'error' ? 'text-red-400' : 'text-amber-400'}`} />
                    <span className={`text-xs ${a.level === 'error' ? 'text-red-400' : 'text-amber-400'}`}>{a.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
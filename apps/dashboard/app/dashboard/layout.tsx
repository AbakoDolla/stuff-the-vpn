'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getStoredUser, clearAuth } from '@/lib/auth';
import {
  LayoutDashboard, Server, Users, Ticket, CreditCard,
  BarChart3, Settings, LogOut, Shield, ChevronRight,
  Menu, X, Layers, UserCog, Bell, Globe
} from 'lucide-react';
import { toast } from 'sonner';

const NAV_ITEMS = [
  { href: '/dashboard',            icon: LayoutDashboard, label: 'Vue d\'ensemble',  group: 'main' },
  { href: '/dashboard/servers',    icon: Server,           label: 'Serveurs',         group: 'main' },
  { href: '/dashboard/users',      icon: Users,            label: 'Utilisateurs',     group: 'main' },
  { href: '/dashboard/vouchers',   icon: Ticket,           label: 'Vouchers',         group: 'main' },
  { href: '/dashboard/plans',      icon: CreditCard,       label: 'Forfaits',         group: 'main' },
  { href: '/dashboard/templates',  icon: Layers,           label: 'Templates VPN',    group: 'vpn'  },
  { href: '/dashboard/inbounds',   icon: Globe,            label: 'Inbounds',         group: 'vpn'  },
  { href: '/dashboard/resellers',  icon: UserCog,          label: 'Revendeurs',       group: 'biz'  },
  { href: '/dashboard/analytics',  icon: BarChart3,        label: 'Analytiques',      group: 'biz'  },
  { href: '/dashboard/settings',   icon: Settings,         label: 'Paramètres',       group: 'sys'  },
];

const GROUP_LABELS: Record<string, string> = {
  main: 'Général',
  vpn:  'VPN',
  biz:  'Business',
  sys:  'Système',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) { router.replace('/login'); return; }
    setUser(stored);
  }, [router]);

  function handleLogout() {
    clearAuth();
    toast.success('Déconnecté');
    router.replace('/login');
  }

  const grouped = NAV_ITEMS.reduce<Record<string, typeof NAV_ITEMS>>((acc, item) => {
    acc[item.group] = [...(acc[item.group] ?? []), item];
    return acc;
  }, {});

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`flex flex-col h-full ${mobile ? 'w-full' : 'w-60'}`}
      style={{ background: 'rgba(7,11,24,0.95)', borderRight: '1px solid rgba(99,102,241,0.12)' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'rgba(99,102,241,0.12)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <Shield className="w-4 h-4 text-[#6366F1]" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none">SxB VPN</p>
          <p className="text-xs text-[#64748B] mt-0.5">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#475569] px-3 mb-1">
              {GROUP_LABELS[group]}
            </p>
            <div className="space-y-0.5">
              {items.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                return (
                  <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
                    className={`nav-item ${isActive ? 'active' : ''}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t" style={{ borderColor: 'rgba(99,102,241,0.12)' }}>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
            {user?.username?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{user?.username ?? 'Admin'}</p>
            <p className="text-[10px] text-[#64748B] truncate">{user?.role}</p>
          </div>
          <button onClick={handleLogout} className="text-[#64748B] hover:text-red-400 transition-colors" title="Déconnexion">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 z-10">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ background: 'rgba(7,11,24,0.8)', borderColor: 'rgba(99,102,241,0.12)', backdropFilter: 'blur(12px)' }}>
          <button className="md:hidden text-[#64748B]" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative text-[#64748B] hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

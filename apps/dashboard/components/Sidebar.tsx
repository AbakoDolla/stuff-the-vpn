'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Key, Smartphone, Server,
  FileText, Settings, ChevronLeft, LogOut,
  HardDrive, Globe, Shield, BarChart2, CreditCard, MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { clearAuth } from '@/lib/auth';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Tableau de bord', icon: <LayoutDashboard size={18} />, href: '/dashboard' },
  { label: 'Utilisateurs',    icon: <Users size={18} />,           href: '/dashboard/users' },
  { label: 'Appareils',       icon: <Smartphone size={18} />,      href: '/dashboard/devices-list' },
  { label: 'Tokens',          icon: <Key size={18} />,             href: '/dashboard/tokens' },
  { label: 'Quotas & Données',icon: <HardDrive size={18} />,       href: '/dashboard/quotas' },
  { label: 'Inbounds VPN',    icon: <Globe size={18} />,           href: '/dashboard/inbounds' },
  { label: 'Profils VPN',     icon: <Shield size={18} />,          href: '/dashboard/vpn' },
  { label: 'Serveurs',        icon: <Server size={18} />,          href: '/dashboard/servers' },
  { label: 'Journaux',        icon: <FileText size={18} />,        href: '/dashboard/audit' },
  { label: 'Paiements',       icon: <CreditCard size={18} />,      href: '/dashboard/payments' },
  { label: 'Tickets',         icon: <MessageSquare size={18} />,   href: '/dashboard/tickets' },
  { label: 'Statistiques',    icon: <BarChart2 size={18} />,       href: '/dashboard/audit' },
  { label: 'Paramètres',      icon: <Settings size={18} />,        href: '/dashboard/settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <motion.aside
      layout
      className={`fixed left-0 top-0 h-screen bg-[#0A0F1E]/95 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[220px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/5">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="logo-expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 min-w-0"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg shadow-blue-500/30 shrink-0">
                <Image src="/logo.png" alt="SXB VPN" width={32} height={32} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-white leading-tight">SXB VPN</h1>
                <p className="text-[10px] text-gray-500 leading-tight">Control Center</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="logo-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex justify-center"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg shadow-blue-500/30">
                <Image src="/logo.png" alt="SXB VPN" width={32} height={32} className="w-full h-full object-cover" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-gray-500 hover:text-white shrink-0"
        >
          <ChevronLeft
            size={14}
            className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link key={item.label} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-blue-500/10 border border-blue-500/20 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className={`shrink-0 ${isActive ? 'text-blue-400' : ''}`}>{item.icon}</div>
                {!collapsed && (
                  <span className="text-[13px] font-medium truncate">{item.label}</span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 w-0.5 h-4 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-r-full"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
        >
          <LogOut size={18} />
          {!collapsed && <span className="text-[13px] font-medium">Déconnexion</span>}
        </button>
      </div>
    </motion.aside>
  );
}

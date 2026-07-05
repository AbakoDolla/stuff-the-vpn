'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Key, Smartphone, Server,
  FileText, Settings, LogOut, HardDrive, Globe,
  Shield, BarChart2, CreditCard, MessageSquare, X,
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
  { label: 'Tokens / Licences',icon: <Key size={18} />,            href: '/dashboard/tokens' },
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

interface SidebarProps {
  isOpen: boolean;
  currentPath: string;
  onClose: () => void;
}

export function Sidebar({ isOpen, currentPath, onClose }: SidebarProps) {
  const pathname = currentPath;
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg shadow-blue-500/30 shrink-0">
            <Image src="/logo.png" alt="SXB VPN" width={32} height={32} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">SXB VPN</h1>
            <p className="text-[10px] text-gray-500 leading-tight">Control Center</p>
          </div>
        </div>
        {/* Close button — visible on mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Fermer le menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link key={item.label} href={item.href} onClick={onClose}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-blue-500/10 border border-blue-500/20 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className={`shrink-0 ${isActive ? 'text-blue-400' : ''}`}>{item.icon}</div>
                <span className="text-[13px] font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 w-0.5 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-r-full"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-white/5 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
        >
          <LogOut size={18} />
          <span className="text-[13px] font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar (always visible ≥ lg) ── */}
      <aside className="hidden lg:flex flex-col w-[220px] shrink-0 bg-[#0A0F1E]/95 backdrop-blur-xl border-r border-white/5 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar (drawer + overlay) ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={onClose}
            />
            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="lg:hidden fixed left-0 top-0 h-full w-[260px] bg-[#0A0F1E] border-r border-white/5 z-50"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

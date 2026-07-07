'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Key, Smartphone, Server,
  FileText, Settings, LogOut, HardDrive, Globe,
  Shield, BarChart2, CreditCard, MessageSquare, X,
  Ticket, Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { clearAuth } from '@/lib/auth';
import { useLanguage } from '@/hooks/useLanguage';

interface NavItem {
  labelKey: string;
  icon: React.ReactNode;
  href: string;
  section?: string;
}

const getNavItems = (tr: Record<string, string>): NavItem[] => [
  // Vue d'ensemble
  { labelKey: 'dashboard', icon: <LayoutDashboard size={18} />, href: '/dashboard', section: 'overview' },
  { labelKey: 'analytics', icon: <BarChart2 size={18} />, href: '/analytics', section: 'overview' },

  // Utilisateurs & Accès
  { labelKey: 'users', icon: <Users size={18} />, href: '/dashboard/users', section: 'users' },
  { labelKey: 'devices', icon: <Smartphone size={18} />, href: '/dashboard/devices-list', section: 'users' },
  { labelKey: 'tokens', icon: <Key size={18} />, href: '/dashboard/tokens', section: 'users' },
  { labelKey: 'quotas', icon: <HardDrive size={18} />, href: '/dashboard/quotas', section: 'users' },

  // VPN
  { labelKey: 'inbounds', icon: <Globe size={18} />, href: '/dashboard/inbounds', section: 'vpn' },
  { labelKey: 'vpnProfiles', icon: <Shield size={18} />, href: '/dashboard/vpn', section: 'vpn' },
  { labelKey: 'servers', icon: <Server size={18} />, href: '/dashboard/servers', section: 'vpn' },

  // Commercial
  { labelKey: 'licenses', icon: <Key size={18} />, href: '/licenses', section: 'commercial' },
  { labelKey: 'vouchers', icon: <Ticket size={18} />, href: '/vouchers', section: 'commercial' },
  { labelKey: 'payments', icon: <CreditCard size={18} />, href: '/dashboard/payments', section: 'commercial' },

  // Admin
  { labelKey: 'tickets', icon: <MessageSquare size={18} />, href: '/dashboard/tickets', section: 'admin' },
  { labelKey: 'audit', icon: <FileText size={18} />, href: '/dashboard/audit', section: 'admin' },
  { labelKey: 'settings', icon: <Settings size={18} />, href: '/dashboard/settings', section: 'admin' },
];

const sectionLabels: Record<string, Record<string, string>> = {
  fr: {
    overview: 'Vue d\'ensemble',
    users: 'Utilisateurs',
    vpn: 'VPN',
    commercial: 'Commercial',
    admin: 'Administration',
  },
  en: {
    overview: 'Overview',
    users: 'Users',
    vpn: 'VPN',
    commercial: 'Commercial',
    admin: 'Administration',
  },
};

interface SidebarProps {
  isOpen: boolean;
  currentPath: string;
  onClose: () => void;
}

export function Sidebar({ isOpen, currentPath, onClose }: SidebarProps) {
  const pathname = currentPath;
  const router = useRouter();
  const { lang, tr } = useLanguage();
  const navItems = getNavItems(tr);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  // Group nav items by section
  const sections = [...new Set(navItems.map(i => i.section))];

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
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Fermer le menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin">
        {sections.map(section => {
          const items = navItems.filter(i => i.section === section);
          return (
            <div key={section}>
              <p className="px-2 mb-1 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                {sectionLabels[lang]?.[section!] ?? section}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  return (
                    <Link key={item.labelKey} href={item.href} onClick={onClose}>
                      <motion.div
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-blue-500/10 border border-blue-500/20 text-white'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <span className={isActive ? 'text-blue-400' : ''}>{item.icon}</span>
                        <span className="text-sm font-medium">{tr[item.labelKey] ?? item.labelKey}</span>
                        {isActive && (
                          <motion.div
                            layoutId="active-indicator"
                            className="absolute right-2 w-1.5 h-1.5 rounded-full bg-blue-400"
                          />
                        )}
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/5 shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-150 border border-transparent hover:border-red-500/10"
        >
          <LogOut size={16} />
          <span className="text-sm font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-56 xl:w-60 lg:flex-col lg:fixed lg:inset-y-0 lg:z-30 bg-dark-50/80 backdrop-blur-xl border-r border-white/5">
        <SidebarContent />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-72 z-50 bg-dark-50 border-r border-white/5 lg:hidden"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;

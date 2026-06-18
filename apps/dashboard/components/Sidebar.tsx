'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Key,
  Smartphone,
  Server,
  Activity,
  FileText,
  DollarSign,
  HelpCircle,
  Settings,
  ChevronLeft,
  LogOut,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  badgeColor?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
  { label: 'Utilisateurs', icon: <Users size={20} />, href: '/users' },
  { label: 'Revendeurs', icon: <UserPlus size={20} />, href: '/resellers' },
  { label: 'Licences', icon: <Key size={20} />, href: '/licenses', badge: '24', badgeColor: 'bg-accent' },
  { label: 'Appareils', icon: <Smartphone size={20} />, href: '/devices' },
  { label: 'Serveurs', icon: <Server size={20} />, href: '/servers', badge: '12', badgeColor: 'bg-primary' },
  { label: 'Traffic', icon: <Activity size={20} />, href: '/traffic' },
  { label: 'Logs', icon: <FileText size={20} />, href: '/logs' },
  { label: 'Revenus', icon: <DollarSign size={20} />, href: '/revenue' },
  { label: 'Support', icon: <HelpCircle size={20} />, href: '/support' },
  { label: 'Paramètres', icon: <Settings size={20} />, href: '/settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <motion.aside
      layout
      className={`fixed left-0 top-0 h-screen bg-dark-200/80 backdrop-blur-xl border-r border-surface-light z-50 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-surface-light">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="logo-expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold gradient-text">Stuff VPN</h1>
                <p className="text-[10px] text-gray-500">Administration</p>
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
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors text-gray-400 hover:text-white"
        >
          <ChevronLeft
            size={18}
            className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-surface-hover'
                }`}
              >
                <div className={`${isActive ? 'text-primary' : ''}`}>{item.icon}</div>
                
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}

                {/* Tooltip when collapsed */}
                {collapsed && item.badge && (
                  <span
                    className={`absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[8px] font-bold rounded-full text-white ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}

                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-r-full"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-surface-light">
        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200">
          <LogOut size={20} />
          {!collapsed && <span className="text-sm font-medium">Déconnexion</span>}
        </button>
      </div>
    </motion.aside>
  );
}
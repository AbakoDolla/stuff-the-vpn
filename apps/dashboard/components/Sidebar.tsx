'use client';
import Image from 'next/image';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Ticket, Server, BarChart3, ShoppingBag, Settings,
  ChevronRight, X, Key, DollarSign, MessageSquare, Shield, Bell, Wifi
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { label: 'Tableau de bord', href: '/dashboard',           icon: LayoutDashboard },
  { label: 'Utilisateurs',    href: '/dashboard/users',     icon: Users },
  { label: 'Serveurs VPN',    href: '/dashboard/servers',   icon: Server },
  { label: 'Profils VPN',     href: '/dashboard/vpn',       icon: Wifi },
  { label: 'Vouchers',        href: '/dashboard/vouchers',  icon: Ticket },
  { label: 'Licenses',        href: '/dashboard/licenses',  icon: Key },
  { label: 'Paiements',       href: '/dashboard/payments',  icon: DollarSign },
  { label: 'Support',         href: '/dashboard/tickets',   icon: MessageSquare },
  { label: 'Revendeurs',      href: '/dashboard/resellers', icon: ShoppingBag },
  { label: 'Analytiques',     href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Clés API',        href: '/dashboard/api-keys',  icon: Key },
  { label: 'Audit Logs',      href: '/dashboard/audit',     icon: Shield },
  { label: 'Notifications',   href: '/dashboard/notifications', icon: Bell },
  { label: 'Paramètres',      href: '/dashboard/settings',  icon: Settings },
];

interface SidebarProps { isOpen: boolean; currentPath: string; onClose: () => void; }

export default function Sidebar({ isOpen, currentPath, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={onClose} />}

      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-30 flex flex-col w-64 bg-[#0A0F1E] border-r border-[#1E2D45] transition-transform duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2D45]">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="SxB VPN Logo" width={32} height={32} className="rounded-lg shadow-md shadow-[#0099FF]/30" />
            <div>
              <div className="text-sm font-bold text-[#F1F5F9]">SxBVPN</div>
              <div className="text-[10px] text-[#64748B]">Admin Panel</div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-[#64748B] hover:text-[#F1F5F9]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = currentPath === href || (href !== '/dashboard' && currentPath.startsWith(href + '/'));
            return (
              <Link key={href} href={href} className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group',
                active
                  ? 'bg-[#0099FF]/10 text-[#0099FF] border border-[#0099FF]/20'
                  : 'text-[#94A3B8] hover:bg-[#141C2E] hover:text-[#F1F5F9]'
              )}>
                <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-[#0099FF]' : 'text-[#64748B] group-hover:text-[#94A3B8]')} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3 h-3" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-[#1E2D45]">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#141C2E]">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-[#64748B]">API connectée</span>
          </div>
        </div>
      </aside>
    </>
  );
}

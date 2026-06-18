'use client';
  import { useState } from 'react';
  import { Menu, Bell, LogOut, ChevronDown, User, RefreshCw } from 'lucide-react';

  interface TopbarProps {
    user: { username: string; email: string; role: string };
    onMenuToggle: () => void;
    onLogout: () => void;
  }

  export default function Topbar({ user, onMenuToggle, onLogout }: TopbarProps) {
    const [dropOpen, setDropOpen] = useState(false);

    return (
      <header className="h-14 flex items-center justify-between px-6 bg-[#0A0F1E] border-b border-[#1E2D45] sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onMenuToggle} className="text-[#64748B] hover:text-[#F1F5F9] transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:flex items-center gap-2 bg-[#0F1629] border border-[#1E2D45] rounded-lg px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-[#94A3B8]">Système opérationnel</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="relative p-2 text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#141C2E] rounded-lg transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#0099FF] rounded-full" />
          </button>
          <button className="p-2 text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#141C2E] rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropOpen(!dropOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#141C2E] hover:bg-[#1E2D45] border border-[#1E2D45] rounded-lg transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0099FF] to-[#00D4FF] flex items-center justify-center">
                <User className="w-3 h-3 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-medium text-[#F1F5F9]">{user.username}</div>
                <div className="text-[10px] text-[#64748B]">{user.role}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
            </button>
            {dropOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#141C2E] border border-[#1E2D45] rounded-xl shadow-xl z-20 overflow-hidden">
                  <div className="px-3 py-2 border-b border-[#1E2D45]">
                    <p className="text-xs font-medium text-[#F1F5F9]">{user.username}</p>
                    <p className="text-[10px] text-[#64748B]">{user.email}</p>
                  </div>
                  <div className="p-1">
                    <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    );
  }
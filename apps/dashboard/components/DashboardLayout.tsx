'use client';
import { useState, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getStoredUser, clearAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ username: string; email: string; role: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      clearAuth();
      router.replace('/login');
      return;
    }

    api.get('/auth/me')
      .then((res) => {
        const raw = res.data as { data?: { username?: string; email?: string; role?: string }; username?: string; email?: string; role?: string };
        const u = raw.data ?? raw;
        setUser({
          username: u.username ?? stored.username,
          email:    u.email    ?? stored.email,
          role:     u.role     ?? stored.role,
        });
      })
      .catch(() => {
        clearAuth();
        router.replace('/login');
      })
      .finally(() => setChecking(false));
  }, [router]);

  function handleLogout() {
    clearAuth();
    router.replace('/login');
  }

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (checking || !user) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-xs">Vérification de la session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#020817] overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} currentPath={pathname} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        <Topbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} onLogout={handleLogout} />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

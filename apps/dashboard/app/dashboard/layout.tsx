'use client';
import { useState, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getStoredUser, clearAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Providers } from '@/components/Providers';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ username: string; email: string; role: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      clearAuth();
      router.replace('/login');
      return;
    }

    api.get('/auth/me')
      .then((res) => {
        const u = res.data?.data ?? res.data;
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

  if (checking || !user) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#0099FF] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#64748B] text-xs">Vérification de la session…</p>
        </div>
      </div>
    );
  }

  return (
    <Providers>
      <div className="min-h-screen flex bg-[#020817]">
        <Sidebar isOpen={sidebarOpen} currentPath={pathname} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} onLogout={handleLogout} />
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </Providers>
  );
}

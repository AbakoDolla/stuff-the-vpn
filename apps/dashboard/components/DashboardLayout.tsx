'use client';
import { useState, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getStoredUser, clearAuth } from '@/lib/auth';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

  export default function DashboardLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<{ username: string; email: string; role: string } | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
      const stored = getStoredUser();
      if (!stored) {
        router.push('/login');
      } else {
        setUser(stored);
      }
    }, [router]);

    function handleLogout() {
      clearAuth();
      router.push('/login');
    }

    if (!user) {
      return (
        <div className="min-h-screen bg-[#020817] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#0099FF] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    return (
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
    );
  }
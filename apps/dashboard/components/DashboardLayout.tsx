'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { getStoredUser, clearAuth } from '@/lib/auth';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ username?: string; email?: string; role?: string } | undefined>();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-dark">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        currentPath={pathname ?? ''}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content — offset for desktop sidebar */}
      <div className="lg:pl-56 xl:pl-60 flex flex-col min-h-screen">
        {/* Topbar */}
        <Topbar
          user={user}
          onMenuToggle={() => setSidebarOpen(prev => !prev)}
          onLogout={handleLogout}
        />

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 max-w-screen-2xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

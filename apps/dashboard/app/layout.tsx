import type { Metadata } from 'next';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stuff The VPN — Administration',
  description: 'Tableau de bord administrateur — Plateforme SaaS VPN multi-revendeurs',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-dark text-gray-100">
        <Sidebar />
        <div className="pl-64 transition-all duration-300">
          <Topbar />
          <main className="p-6 min-h-[calc(100vh-4rem)]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
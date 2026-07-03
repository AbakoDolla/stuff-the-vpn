import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stuff The VPN — Administration',
  description: 'Tableau de bord administrateur — Plateforme SaaS VPN multi-revendeurs',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-[#020817] text-gray-100">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
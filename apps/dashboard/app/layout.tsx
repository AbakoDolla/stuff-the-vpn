import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'SxBVPN — Dashboard Admin',
  description: 'Tableau de bord administration SxBVPN',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen bg-[#020817] text-[#F1F5F9] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

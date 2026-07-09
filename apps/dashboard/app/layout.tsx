import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stuff The VPN — Administration',
  description: 'Tableau de bord administrateur — SXB VPN',
};

// Each page manages its own layout (DashboardLayout wraps dashboard pages).
// The root layout is intentionally minimal to avoid rendering the sidebar
// on non-dashboard pages like /login.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-dark text-gray-100 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

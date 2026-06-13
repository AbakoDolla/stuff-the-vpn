/**
 * layout.tsx
 * Layout racine de l'application Next.js.
 * Configure les providers globaux (auth, theme, notifications).
 * 
 * TODO (Phase 4): Ajouter Sidebar, Topbar, AuthProvider, ThemeProvider.
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stuff The VPN — Administration',
  description: 'Tableau de bord administrateur — Plateforme SaaS VPN',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

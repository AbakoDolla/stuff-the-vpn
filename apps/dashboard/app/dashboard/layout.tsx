/**
 * app/dashboard/layout.tsx
 *
 * Passthrough — le vrai layout (Sidebar + Topbar + auth guard) est géré
 * par le composant DashboardLayout dans components/DashboardLayout.tsx.
 * Les pages enfants wrappent elles-mêmes <DashboardLayout>.
 */
export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

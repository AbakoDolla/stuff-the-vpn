/**
 * app/dashboard/layout.tsx
 * Layout wrapping dashboard pages — uses DashboardLayout per-page.
 * Root layout (app/layout.tsx) already provides Providers/QueryClient,
 * so we do NOT re-wrap here.
 */
export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

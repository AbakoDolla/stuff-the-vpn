/**
 * app/dashboard/layout.tsx
 *
 * Layout du dashboard avec Providers pour React Query.
 */
import { Providers } from '@/components/Providers';

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}

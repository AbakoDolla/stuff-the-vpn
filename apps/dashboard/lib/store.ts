import { create } from 'zustand';
import { type Role } from './auth';

interface User {
  id: string;
  username?: string | null;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  role: Role;
  status: string;
  permissions: string[];
  resellerId?: string | null;
  deviceLimit?: number;
  quotaUsedGB?: number;
  quotaRemainingGB?: number;
  expireAt?: string | null;
  createdAt: string;
}

interface DashboardStore {
  user: User | null;
  token: string | null;
  sidebarOpen: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  toggleSidebar: () => void;
  logout: () => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  user: null,
  token: null,
  sidebarOpen: true,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  logout: () => {
    document.cookie = 'stv_token=; path=/; max-age=0';
    localStorage.removeItem('sxb_token');
    localStorage.removeItem('sxb_user');
    set({ user: null, token: null });
  },
}));

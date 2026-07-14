import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
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
    set({ user: null, token: null });
  },
}));

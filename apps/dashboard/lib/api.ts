import axios from 'axios';

// Utilise la variable d'env en premier (déployé), sinon /api (dev avec proxy Next.js)
const BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sxb_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('sxb_token');
      localStorage.removeItem('sxb_user');
      document.cookie = 'stv_token=; path=/; max-age=0; SameSite=Lax';
      setTimeout(() => { window.location.replace('/login'); }, 50);
    }
    return Promise.reject(err);
  }
);

export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

export async function fetchDashboardStats() {
  const [usersR, vouchersR, plansR, inboundsR, serversR] = await Promise.allSettled([
    api.get('/users?limit=1000'),
    api.get('/vouchers?limit=1000'),
    api.get('/plans'),
    api.get('/inbounds'),
    api.get('/servers'),
  ]);
  return {
    users:    usersR.status    === 'fulfilled' ? usersR.value.data    : { data: [] },
    vouchers: vouchersR.status === 'fulfilled' ? vouchersR.value.data : { data: [] },
    plans:    plansR.status    === 'fulfilled' ? plansR.value.data    : { data: [] },
    inbounds: inboundsR.status === 'fulfilled' ? inboundsR.value.data : { data: [] },
    servers:  serversR.status  === 'fulfilled' ? serversR.value.data  : { data: [] },
  };
}

export const endpoints = {
  users:     { list: '/users',     create: '/users',     update: (id: string) => `/users/${id}`,     delete: (id: string) => `/users/${id}` },
  vouchers:  { list: '/vouchers',  create: '/vouchers',  delete: (id: string) => `/vouchers/${id}` },
  plans:     { list: '/plans',     create: '/plans',     update: (id: string) => `/plans/${id}`,     delete: (id: string) => `/plans/${id}` },
  inbounds:  { list: '/inbounds',  create: '/inbounds',  update: (id: string) => `/inbounds/${id}`,  delete: (id: string) => `/inbounds/${id}` },
  servers:   { list: '/servers',   create: '/servers',   update: (id: string) => `/servers/${id}`,   delete: (id: string) => `/servers/${id}` },
  resellers: { list: '/resellers', create: '/resellers' },
  usage:     { list: '/usage',     user: (id: string) => `/usage/${id}` },
  templates: { list: '/vpn-templates', create: '/vpn-templates', update: (id: string) => `/vpn-templates/${id}`, delete: (id: string) => `/vpn-templates/${id}` },
};

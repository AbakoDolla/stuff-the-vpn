import axios from 'axios';

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  export const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: false,
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
        window.location.href = '/login';
      }
      return Promise.reject(err);
    }
  );

  export async function login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  }

  export async function fetchStats() {
    const [usersR, vouchersR, plansR, inboundsR] = await Promise.allSettled([
      api.get('/users?limit=1000'),
      api.get('/vouchers?limit=1000'),
      api.get('/plans'),
      api.get('/inbounds'),
    ]);
    return {
      users: usersR.status === 'fulfilled' ? usersR.value.data : { data: [] },
      vouchers: vouchersR.status === 'fulfilled' ? vouchersR.value.data : { data: [] },
      plans: plansR.status === 'fulfilled' ? plansR.value.data : { data: [] },
      inbounds: inboundsR.status === 'fulfilled' ? inboundsR.value.data : { data: [] },
    };
  }

  export const endpoints = {
    users: { list: '/users', create: '/users', update: (id: string) => `/users/${id}`, delete: (id: string) => `/users/${id}` },
    vouchers: { list: '/vouchers', create: '/vouchers', delete: (id: string) => `/vouchers/${id}` },
    plans: { list: '/plans', create: '/plans', update: (id: string) => `/plans/${id}`, delete: (id: string) => `/plans/${id}` },
    inbounds: { list: '/inbounds', create: '/inbounds', update: (id: string) => `/inbounds/${id}`, delete: (id: string) => `/inbounds/${id}` },
    resellers: { list: '/resellers', create: '/resellers' },
    usage: { list: '/usage', user: (id: string) => `/usage/${id}` },
  };
  
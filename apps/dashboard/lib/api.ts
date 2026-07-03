"use client";

// Type definitions
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// NEXT_PUBLIC_API_URL = "http://IP/api" — do NOT add /api again
const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/+$/, "");

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("stv_token");
}

// Axios-like API for backward compatibility
const axiosInstance = {
  get: async (path: string) => ({ data: await apiFetch(path) }),
  post: async (path: string, body?: any) => ({ data: await apiFetch(path, { method: "POST", body: JSON.stringify(body) }) }),
  patch: async (path: string, body?: any) => ({ data: await apiFetch(path, { method: "PATCH", body: JSON.stringify(body) }) }),
  put: async (path: string, body?: any) => ({ data: await apiFetch(path, { method: "PUT", body: JSON.stringify(body) }) }),
  delete: async (path: string) => ({ data: await apiFetch(path, { method: "DELETE" }) }),
};

export const api = axiosInstance;

// Endpoint constants
export const endpoints = {
  AUTH_ME: "/auth/me",
  AUTH_LOGIN: "/auth/login",
  ADMIN_STATS: "/admin/stats",
  USERS: "/users",
  USER: (id: string) => `/users/${id}`,
  DEVICES: "/devices",
  DEVICE: (id: string) => `/devices/${id}`,
  TOKENS: "/tokens",
  TOKEN_GENERATE: "/tokens/generate",
  QUOTAS: "/quotas",
  LICENSES: "/licenses",
  SERVERS: "/servers",
  INBOUNDS: "/inbounds",
  VOUCHERS: "/vouchers",
  AUDIT: "/audit",
  PAYMENTS: "/payments",
  VPN_PROFILES: "/vpn-profiles",
  SETTINGS: "/settings",
};

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}) {
  const url = `${BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...init, headers, credentials: "include" });

  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !json.success) {
    throw new Error(json.error || json.message || "API error");
  }
  return json.data as T;
}

export const Api = {
  // Auth
  getMe: () => apiFetch<{ id: string; email: string; name: string; role: string }>("/auth/me"),
  
  // Dashboard stats
  getStats: () => apiFetch<{
    totalUsers: number;
    activeUsers: number;
    totalDevices: number;
    activeDevices: number;
    totalLicenses: number;
    activeLicenses: number;
    totalTraffic: number;
    totalRevenue: number;
  }>("/admin/stats"),
  
  // Servers
  getServers: () => apiFetch<any[]>("/servers"),
  
  // Users
  getUsers: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    return apiFetch<{ users: any[]; total: number }>(`/users?${query}`);
  },
  createUser: (data: any) => apiFetch<any>("/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) => apiFetch<any>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteUser: (id: string) => apiFetch<void>(`/users/${id}`, { method: "DELETE" }),
  
  // Devices
  getDevices: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    return apiFetch<{ devices: any[]; total: number }>(`/devices?${query}`);
  },
  getDevice: (id: string) => apiFetch<any>(`/devices/${id}`),
  updateDevice: (id: string, data: any) => apiFetch<any>(`/devices/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteDevice: (id: string) => apiFetch<void>(`/devices/${id}`, { method: "DELETE" }),
  blockDevice: (id: string, reason?: string) => apiFetch<any>(`/devices/${id}/block`, { method: "POST", body: JSON.stringify({ reason }) }),
  
  // Tokens
  getTokens: (params?: { page?: number; limit?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.status) query.set("status", params.status);
    return apiFetch<{ tokens: any[]; total: number }>(`/tokens?${query}`);
  },
  generateToken: (deviceId: string) => apiFetch<any>("/tokens/generate", { method: "POST", body: JSON.stringify({ deviceId }) }),
  revokeToken: (id: string) => apiFetch<any>(`/tokens/revoke/${id}`, { method: "POST" }),
  deleteToken: (id: string) => apiFetch<void>(`/tokens/${id}`, { method: "DELETE" }),
  
  // Quotas
  getQuotas: (params?: { page?: number; limit?: number; userId?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.userId) query.set("userId", params.userId);
    return apiFetch<{ quotas: any[]; total: number }>(`/quotas?${query}`);
  },
  getQuota: (id: string) => apiFetch<any>(`/quotas/${id}`),
  createQuota: (data: any) => apiFetch<any>("/quotas", { method: "POST", body: JSON.stringify(data) }),
  updateQuota: (id: string, data: any) => apiFetch<any>(`/quotas/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  resetQuota: (id: string, newTotalGB?: number) => apiFetch<any>(`/quotas/${id}/reset`, { method: "POST", body: JSON.stringify({ newTotalGB }) }),
  deleteQuota: (id: string) => apiFetch<void>(`/quotas/${id}`, { method: "DELETE" }),
  
  // Licenses
  getLicenses: (params?: { page?: number; limit?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.status) query.set("status", params.status);
    return apiFetch<{ licenses: any[]; total: number }>(`/licenses?${query}`);
  },
  
  // VPN Profiles
  getProfiles: () => apiFetch<any[]>("/vpn-profiles"),
  createProfile: (data: any) => apiFetch<any>("/vpn-profiles", { method: "POST", body: JSON.stringify(data) }),
  updateProfile: (id: string, data: any) => apiFetch<any>(`/vpn-profiles/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  publishProfile: (id: string) => apiFetch<any>(`/vpn-profiles/${id}/publish`, { method: "POST" }),
  
  // Audit logs
  getAuditLogs: (params?: { page?: number; limit?: number; action?: string; from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.action) query.set("action", params.action);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    return apiFetch<{ logs: any[]; total: number }>(`/audit?${query}`);
  },
  
  // Usage
  getUsage: (params?: { from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    return apiFetch<any>(`/usage?${query}`);
  },
  
  // Revenue
  getRevenue: (params?: { from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    return apiFetch<any>(`/payments?${query}`);
  },
};

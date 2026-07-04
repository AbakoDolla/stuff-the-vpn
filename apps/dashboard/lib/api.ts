"use client";

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/+$/, "");

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("stv_token");
}

// ── Axios-compatible fetch wrapper ────────────────────────────────────────────
// Pages that import `api` use it like: api.get('/path').then(r => r.data)
// This wrapper returns { data: responseJson } so it works drop-in.

type AxiosLike = {
  get:    (path: string, config?: { params?: Record<string, string | number | boolean> }) => Promise<{ data: unknown }>;
  post:   (path: string, body?: unknown) => Promise<{ data: unknown }>;
  put:    (path: string, body?: unknown) => Promise<{ data: unknown }>;
  patch:  (path: string, body?: unknown) => Promise<{ data: unknown }>;
  delete: (path: string) => Promise<{ data: unknown }>;
};

async function _request(method: string, path: string, body?: unknown, params?: Record<string, string | number | boolean>): Promise<{ data: unknown }> {
  let url = `${BASE}${path}`;
  if (params) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) q.set(k, String(v));
    url += `?${q}`;
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("stv_token");
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  const json = await res.json() as { data?: unknown; [k: string]: unknown };
  if (!res.ok) {
    const err = new Error((json.message as string) ?? (json.error as string) ?? "API error") as Error & { response?: { data?: unknown } };
    err.response = { data: json };
    throw err;
  }

  return { data: json };
}

export const api: AxiosLike = {
  get:    (path, config) => _request("GET",    path, undefined, config?.params as Record<string, string | number | boolean> | undefined),
  post:   (path, body)   => _request("POST",   path, body),
  put:    (path, body)   => _request("PUT",    path, body),
  patch:  (path, body)   => _request("PATCH",  path, body),
  delete: (path)         => _request("DELETE", path),
};

export const endpoints = {
  inbounds: {
    list:                "/inbounds",
    create:              "/inbounds",
    update: (id: string) => `/inbounds/${id}`,
    delete: (id: string) => `/inbounds/${id}`,
    toggle: (id: string) => `/inbounds/${id}/toggle`,
  },
  vpnTemplates: {
    list:                "/vpn-templates",
    create:              "/vpn-templates",
    update: (id: string) => `/vpn-templates/${id}`,
    delete: (id: string) => `/vpn-templates/${id}`,
    publish: (id: string) => `/vpn-templates/${id}/publish`,
  },
};

// ── Typed fetch helper (apiFetch) used by Api.* below ────────────────────────
export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...init, headers });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("stv_token");
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  const json = await res.json() as { success?: boolean; data?: T; error?: string; message?: string };
  if (!res.ok || json.success === false) {
    throw new Error(json.error ?? json.message ?? "API error");
  }
  return (json.data ?? json) as T;
}

// ── Typed API surface ─────────────────────────────────────────────────────────
export const Api = {
  getMe:    () => apiFetch<{ id: string; email: string; username: string; role: string }>("/auth/me"),
  getStats: () => apiFetch<Record<string, unknown>>("/admin/stats"),
  getServers: () => apiFetch<unknown[]>("/servers"),

  getUsers: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.page)   q.set("page",   String(params.page));
    if (params?.limit)  q.set("limit",  String(params.limit));
    if (params?.status) q.set("status", params.status);
    if (params?.search) q.set("search", params.search);
    return apiFetch<{ users: unknown[]; total: number } | unknown[]>(`/users?${q}`);
  },
  createUser: (data: unknown) => apiFetch<unknown>("/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id: string, data: unknown) => apiFetch<unknown>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteUser: (id: string) => apiFetch<void>(`/users/${id}`, { method: "DELETE" }),

  getDevices: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.page)   q.set("page",   String(params.page));
    if (params?.limit)  q.set("limit",  String(params.limit));
    if (params?.status) q.set("status", params.status);
    if (params?.search) q.set("search", params.search);
    return apiFetch<{ devices: unknown[]; total: number }>(`/devices?${q}`);
  },
  getDevice:    (id: string) => apiFetch<unknown>(`/devices/${id}`),
  updateDevice: (id: string, data: unknown) => apiFetch<unknown>(`/devices/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteDevice: (id: string) => apiFetch<void>(`/devices/${id}`, { method: "DELETE" }),
  blockDevice:  (id: string, reason?: string) =>
    apiFetch<unknown>(`/devices/${id}/block`, { method: "POST", body: JSON.stringify({ reason }) }),

  getTokens: (params?: { page?: number; limit?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page)   q.set("page",   String(params.page));
    if (params?.limit)  q.set("limit",  String(params.limit));
    if (params?.status) q.set("status", params.status);
    return apiFetch<{ tokens: unknown[]; total: number }>(`/tokens?${q}`);
  },
  generateToken: (data: unknown) => apiFetch<unknown>("/tokens/generate", { method: "POST", body: JSON.stringify(data) }),
  revokeToken:   (id: string) => apiFetch<unknown>(`/tokens/revoke/${id}`, { method: "POST" }),
  deleteToken:   (id: string) => apiFetch<void>(`/tokens/${id}`, { method: "DELETE" }),

  getQuotas: (params?: { page?: number; limit?: number; userId?: string }) => {
    const q = new URLSearchParams();
    if (params?.page)   q.set("page",   String(params.page));
    if (params?.limit)  q.set("limit",  String(params.limit));
    if (params?.userId) q.set("userId", params.userId);
    return apiFetch<{ quotas: unknown[]; total: number }>(`/quotas?${q}`);
  },
  getQuota:    (id: string) => apiFetch<unknown>(`/quotas/${id}`),
  createQuota: (data: unknown) => apiFetch<unknown>("/quotas", { method: "POST", body: JSON.stringify(data) }),
  updateQuota: (id: string, data: unknown) => apiFetch<unknown>(`/quotas/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  resetQuota:  (id: string, newTotalGB?: number) =>
    apiFetch<unknown>(`/quotas/${id}/reset`, { method: "POST", body: JSON.stringify({ newTotalGB }) }),
  deleteQuota: (id: string) => apiFetch<void>(`/quotas/${id}`, { method: "DELETE" }),

  getLicenses: (params?: { page?: number; limit?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page)   q.set("page",   String(params.page));
    if (params?.limit)  q.set("limit",  String(params.limit));
    if (params?.status) q.set("status", params.status);
    return apiFetch<{ licenses: unknown[]; total: number }>(`/licenses?${q}`);
  },
  createLicense: (data: unknown) => apiFetch<unknown>("/licenses", { method: "POST", body: JSON.stringify(data) }),
  revokeLicense: (id: string) => apiFetch<unknown>(`/licenses/${id}/revoke`, { method: "POST" }),
  deleteLicense: (id: string) => apiFetch<void>(`/licenses/${id}`, { method: "DELETE" }),

  getAuditLogs: (params?: { page?: number; limit?: number; action?: string }) => {
    const q = new URLSearchParams();
    if (params?.page)   q.set("page",   String(params.page));
    if (params?.limit)  q.set("limit",  String(params.limit));
    if (params?.action) q.set("action", params.action);
    return apiFetch<{ logs: unknown[]; total: number }>(`/audit?${q}`);
  },

  getUsage: (params?: { from?: string; to?: string; userId?: string }) => {
    const q = new URLSearchParams();
    if (params?.from)   q.set("from",   params.from);
    if (params?.to)     q.set("to",     params.to);
    if (params?.userId) q.set("userId", params.userId);
    return apiFetch<unknown>(`/usage?${q}`);
  },

  getRevenue: (params?: { from?: string; to?: string }) => {
    const q = new URLSearchParams();
    if (params?.from) q.set("from", params.from);
    if (params?.to)   q.set("to",   params.to);
    return apiFetch<unknown>(`/payments?${q}`);
  },

  getProfiles:    () => apiFetch<unknown[]>("/vpn-profiles"),
  createProfile:  (data: unknown) => apiFetch<unknown>("/vpn-profiles", { method: "POST", body: JSON.stringify(data) }),
  updateProfile:  (id: string, data: unknown) => apiFetch<unknown>(`/vpn-profiles/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  publishProfile: (id: string) => apiFetch<unknown>(`/vpn-profiles/${id}/publish`, { method: "POST" }),
  deleteProfile:  (id: string) => apiFetch<void>(`/vpn-profiles/${id}`, { method: "DELETE" }),
};

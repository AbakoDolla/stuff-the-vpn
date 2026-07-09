"use client";

// Use relative /api path so browser requests go through Next.js proxy routes
// which then forward to the backend (localhost:4000) server-side.
// This avoids CORS issues and works in both dev and production.
function getBase(): string {
  // In production, always use relative path - API routes handle the proxy
  // In development, can use BACKEND_URL if set
  if (process.env.NODE_ENV === 'production') {
    return "/api";
  }
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/+$/, "");
  return "/api";
}

const BASE = getBase();

const TOKEN_KEY = "sxb_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

type AxiosLike = {
  get:    (path: string, config?: { params?: Record<string, string | number | boolean> }) => Promise<{ data: unknown }>;
  post:   (path: string, body?: unknown) => Promise<{ data: unknown }>;
  put:    (path: string, body?: unknown) => Promise<{ data: unknown }>;
  patch:  (path: string, body?: unknown) => Promise<{ data: unknown }>;
  delete: (path: string) => Promise<{ data: unknown }>;
};

async function _request(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string | number | boolean>,
): Promise<{ data: unknown }> {
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
      try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("sxb_user");
        document.cookie = "stv_token=; path=/; max-age=0";
      } catch {
        // Silently fail if localStorage is not available
      }
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  const json = await res.json() as { data?: unknown; [k: string]: unknown };
  if (!res.ok) {
    const err = new Error(
      (json.message as string) ?? (json.error as string) ?? "API error",
    ) as Error & { response?: { data?: unknown } };
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

// ── Typed fetch helper ────────────────────────────────────────────────────────

// API Response wrapper types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
  limit?: number;
  offset?: number;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

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
      try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("sxb_user");
        document.cookie = "stv_token=; path=/; max-age=0";
      } catch {
        // Silently fail if localStorage is not available
      }
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  const json = await res.json() as ApiResponse<T> | { success?: boolean; error?: string; message?: string };
  if (!res.ok || json.success === false) {
    throw new Error((json as any).error ?? (json as any).message ?? "API error");
  }
  return (json as ApiResponse<T>).data as T;
}

// Helper for paginated responses
export async function apiFetchPaginated<T = unknown>(path: string, init: RequestInit = {}): Promise<PaginatedResponse<T>> {
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
      try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("sxb_user");
        document.cookie = "stv_token=; path=/; max-age=0";
      } catch {
        // Silently fail if localStorage is not available
      }
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  const json = await res.json() as ApiResponse<T[]>;
  if (!res.ok || json.success === false) {
    throw new Error(json.message ?? "API error");
  }
  return {
    data: json.data as T[],
    total: json.total ?? 0,
    limit: json.limit ?? 50,
    offset: json.offset ?? 0,
  };
}

// ── Typed API namespace ───────────────────────────────────────────────────────
type Stats = Record<string, unknown>;
type UserRecord = Record<string, unknown>;
type ServerRecord = Record<string, unknown>;
type InboundRecord = Record<string, unknown>;
type VpnTemplateRecord = Record<string, unknown>;
type VpnProfileRecord = Record<string, unknown>;
type QuotaRecord = Record<string, unknown>;
type LicenseRecord = Record<string, unknown>;
type VoucherRecord = Record<string, unknown>;
type TicketRecord = Record<string, unknown>;
type PaymentRecord = Record<string, unknown>;
type NotifRecord = Record<string, unknown>;
type SettingRecord = Record<string, unknown>;
type AuditRecord = Record<string, unknown>;
type TokenRecord = Record<string, unknown>;
type DeviceRecord = Record<string, unknown>;

export const Api = {
  // Stats
  getStats: () => apiFetch<Stats>("/admin/stats"),

  // Users
  getUsers: (p?: { limit?: number; page?: number; search?: string }) =>
    apiFetchPaginated<UserRecord>(
      `/users?${new URLSearchParams(Object.entries(p ?? {}).filter(([,v]) => v != null).map(([k, v]) => [k, String(v)]))}`,
    ),
  getUser:     (id: string)             => apiFetch<UserRecord>(`/users/${id}`),
  createUser:  (data: unknown)          => apiFetch<UserRecord>("/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser:  (id: string, data: unknown) => apiFetch<UserRecord>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteUser:  (id: string)             => apiFetch<void>(`/users/${id}`, { method: "DELETE" }),
  setUserStatus: (id: string, status: string) =>
    apiFetch<UserRecord>(`/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  addQuota:    (id: string, gb: number) => apiFetch<UserRecord>(`/users/${id}/quota`, { method: "PATCH", body: JSON.stringify({ addGB: gb }) }),

  // Servers
  getServers:  ()                       => apiFetchPaginated<ServerRecord>("/servers"),
  createServer: (data: unknown)         => apiFetch<ServerRecord>("/servers", { method: "POST", body: JSON.stringify(data) }),
  updateServer: (id: string, d: unknown)=> apiFetch<ServerRecord>(`/servers/${id}`, { method: "PATCH", body: JSON.stringify(d) }),
  deleteServer: (id: string)            => apiFetch<void>(`/servers/${id}`, { method: "DELETE" }),

  // Inbounds
  getInbounds:  ()                      => apiFetchPaginated<InboundRecord>("/inbounds"),
  createInbound:(data: unknown)         => apiFetch<InboundRecord>("/inbounds", { method: "POST", body: JSON.stringify(data) }),
  updateInbound:(id: string, d: unknown)=> apiFetch<InboundRecord>(`/inbounds/${id}`, { method: "PATCH", body: JSON.stringify(d) }),
  deleteInbound:(id: string)            => apiFetch<void>(`/inbounds/${id}`, { method: "DELETE" }),

  // Quotas
  getQuotas: (params?: { limit?: number; page?: number; search?: string }) =>
    apiFetchPaginated<QuotaRecord>(
      `/quotas?${new URLSearchParams(Object.entries(params ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]))}`,
    ),
  createQuota: (data: unknown)          => apiFetch<QuotaRecord>("/quotas", { method: "POST", body: JSON.stringify(data) }),
  resetQuota:  (id: string, data?: { totalGB?: number }) => apiFetch<QuotaRecord>(`/quotas/${id}/reset`, { method: "POST", body: JSON.stringify(data ?? {}) }),

  // VPN Templates
  getVpnTemplates:   ()                 => apiFetchPaginated<VpnTemplateRecord>("/vpn-templates"),
  createVpnTemplate: (d: unknown)       => apiFetch<VpnTemplateRecord>("/vpn-templates", { method: "POST", body: JSON.stringify(d) }),
  updateVpnTemplate: (id: string, d: unknown) => apiFetch<VpnTemplateRecord>(`/vpn-templates/${id}`, { method: "PATCH", body: JSON.stringify(d) }),
  deleteVpnTemplate: (id: string)       => apiFetch<void>(`/vpn-templates/${id}`, { method: "DELETE" }),

  // VPN Profiles
  getVpnProfiles:  ()                   => apiFetchPaginated<VpnProfileRecord>("/vpn-profiles"),
  createProfile:   (data: unknown)      => apiFetch<VpnProfileRecord>("/vpn-profiles", { method: "POST", body: JSON.stringify(data) }),
  updateProfile:   (id: string, d: unknown) => apiFetch<VpnProfileRecord>(`/vpn-profiles/${id}`, { method: "PATCH", body: JSON.stringify(d) }),
  deleteProfile:   (id: string)         => apiFetch<void>(`/vpn-profiles/${id}`, { method: "DELETE" }),
  publishProfile:  (id: string)         => apiFetch<VpnProfileRecord>(`/vpn-profiles/${id}/publish`, { method: "POST" }),

  // Licenses
  getLicenses:     ()                   => apiFetchPaginated<LicenseRecord>("/licenses"),
  generateLicense: (data: unknown)      => apiFetch<LicenseRecord>("/licenses/generate", { method: "POST", body: JSON.stringify(data) }),
  revokeLicense:   (id: string)         => apiFetch<void>(`/licenses/revoke`, { method: "POST", body: JSON.stringify({ licenseId: id }) }),

  // Vouchers
  getVouchers:     ()                   => apiFetchPaginated<VoucherRecord>("/vouchers"),
  createVouchers:  (data: unknown)      => apiFetch<VoucherRecord[]>("/admin/bulk-generate", { method: "POST", body: JSON.stringify(data) }),
  revokeVoucher:   (id: string)         => apiFetch<void>(`/vouchers/${id}`, { method: "DELETE" }),

  // Tickets
  getTickets:      ()                   => apiFetchPaginated<TicketRecord>("/tickets"),
  updateTicket:    (id: string, d: unknown) => apiFetch<TicketRecord>(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify(d) }),

  // Payments
  getPayments:     ()                   => apiFetchPaginated<PaymentRecord>("/payments"),
  updatePayment:   (id: string, d: unknown) => apiFetch<PaymentRecord>(`/payments/${id}`, { method: "PATCH", body: JSON.stringify(d) }),

  // Notifications
  getNotifications:()                   => apiFetchPaginated<NotifRecord>("/notifications"),
  createNotif:     (d: unknown)         => apiFetch<NotifRecord>("/notifications", { method: "POST", body: JSON.stringify(d) }),
  deleteNotif:     (id: string)         => apiFetch<void>(`/notifications/${id}`, { method: "DELETE" }),

  // Settings
  getSettings:     ()                   => apiFetchPaginated<SettingRecord>("/settings"),
  updateSetting:   (id: string, d: unknown) => apiFetch<SettingRecord>(`/settings/${id}`, { method: "PATCH", body: JSON.stringify(d) }),

  // Audit
  getAuditLogs:    ()                   => apiFetchPaginated<AuditRecord>("/audit"),

  // Tokens (activation tokens for mobile devices)
  getTokens: (p?: { status?: string; limit?: number }) =>
    apiFetchPaginated<TokenRecord>(`/tokens?${new URLSearchParams(Object.entries(p ?? {}).filter(([,v]) => v != null).map(([k,v]) => [k, String(v)]))}`),
  generateToken: (deviceId: string) =>
    apiFetch<TokenRecord>("/tokens/generate", { method: "POST", body: JSON.stringify({ deviceId }) }),
  revokeToken: (id: string) =>
    apiFetch<void>(`/tokens/${id}/revoke`, { method: "POST" }),
  deleteToken: (id: string) =>
    apiFetch<void>(`/tokens/${id}`, { method: "DELETE" }),

  // Devices
  getDevices: (p?: { status?: string; search?: string; limit?: number }) =>
    apiFetchPaginated<DeviceRecord>(`/devices?${new URLSearchParams(Object.entries(p ?? {}).filter(([,v]) => v != null).map(([k,v]) => [k, String(v)]))}`),
  getDevice: (id: string) =>
    apiFetch<DeviceRecord>(`/devices/${id}`),
  updateDevice: (id: string, data: unknown) =>
    apiFetch<DeviceRecord>(`/devices/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  blockDevice: (id: string, reason?: string) =>
    apiFetch<DeviceRecord>(`/devices/${id}/block`, { method: "POST", body: JSON.stringify({ reason }) }),
  deleteDevice: (id: string) =>
    apiFetch<void>(`/devices/${id}`, { method: "DELETE" }),
};

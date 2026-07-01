"use client";

import { ApiResponse } from "@stuff-the-vpn/types";

// NEXT_PUBLIC_API_URL = "http://IP/api" — do NOT add /api again
const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api").replace(/\/+$/, "");

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("stv_token");
}

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
  getMe: () => apiFetch<{ id: string; email: string }>("/auth/me"),
  getServers: () => apiFetch<any[]>("/vpn/servers"),
};

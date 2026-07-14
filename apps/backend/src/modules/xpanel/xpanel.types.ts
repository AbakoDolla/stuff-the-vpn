/**
 * XPanel (X-NET) Integration Module
 * Types and interfaces for X-NET VPN Panel API
 */

export interface XPanelConfig {
  baseUrl: string;
  apiKey: string;
  webBasePath: string;
}

export interface XPanelUser {
  id: number;
  username: string;
  password?: string;
  enable: boolean;
  flow: boolean;
  limitIp: number;
  totalGB: number;
  expire: number; // Unix timestamp
  createdAt: number;
  download: number;
  upload: number;
  email?: string;
  telegramId?: string;
}

export interface XPanelInbound {
  id: string;
  userId?: number;
  up: number;
  down: number;
  total: number;
  remark: string;
  enable: boolean;
  expiryTime: number;
  clientStats?: {
    email: string;
    id: string;
    upload: number;
    download: number;
    reset: number;
  }[];
}

export interface XPanelSubscription {
  id: number;
  token: string;
  username: string;
  packageType: string;
  enable: boolean;
  flow: boolean;
  limitIp: number;
  totalGB: number;
  expire: number;
  remark?: string;
  email?: string;
  telegramId?: string;
  usage: {
    download: number;
    upload: number;
    total: number;
  };
}

export interface XPanelTrafficStats {
  totalDownload: number;
  totalUpload: number;
  totalUsers: number;
  activeUsers: number;
}

export interface CreateUserParams {
  username: string;
  password?: string;
  email?: string;
  packageType: string;
  totalGB?: number;
  expireDays?: number;
  limitIp?: number;
  protocol?: 'vmess' | 'vless' | 'trojan' | 'shadowsocks';
}

export interface UpdateUserParams {
  id: number;
  username?: string;
  password?: string;
  totalGB?: number;
  expireDays?: number;
  limitIp?: number;
  enable?: boolean;
}

export interface XPanelAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

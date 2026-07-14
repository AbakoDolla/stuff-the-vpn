/**
 * XPanel (X-NET) HTTP Client
 * Handles communication with X-NET Panel API
 */

import { env } from "../../config/env.js";
import type {
  XPanelConfig,
  XPanelUser,
  XPanelInbound,
  XPanelSubscription,
  XPanelTrafficStats,
  CreateUserParams,
  UpdateUserParams,
  XPanelAPIResponse,
} from "./xpanel.types.js";

export class XPanelClient {
  private baseUrl: string;
  private apiKey: string;
  private webBasePath: string;

  constructor(config?: Partial<XPanelConfig>) {
    this.baseUrl = config?.baseUrl ?? env.XPANEL_URL ?? "http://localhost:18790";
    this.apiKey = config?.apiKey ?? env.XPANEL_API_KEY ?? "";
    this.webBasePath = config?.webBasePath ?? env.XPANEL_WEB_BASE_PATH ?? "kqUtkMEvgdtx";
  }

  /**
   * Get full API URL
   */
  private getApiUrl(path: string): string {
    return `${this.baseUrl}/${this.webBasePath}/api${path}`;
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, any>
  ): Promise<XPanelAPIResponse<T>> {
    const url = this.getApiUrl(path);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Login to XPanel and get session token
   */
  async login(username: string, password: string): Promise<XPanelAPIResponse<{ token: string }>> {
    return this.request("POST", "/login", { username, password });
  }

  /**
   * Get all users
   */
  async getUsers(): Promise<XPanelAPIResponse<XPanelUser[]>> {
    return this.request("GET", "/users");
  }

  /**
   * Get user by ID
   */
  async getUser(id: number): Promise<XPanelAPIResponse<XPanelUser>> {
    return this.request("GET", `/users/${id}`);
  }

  /**
   * Create new user
   */
  async createUser(params: CreateUserParams): Promise<XPanelAPIResponse<XPanelUser>> {
    return this.request("POST", "/users", params);
  }

  /**
   * Update user
   */
  async updateUser(params: UpdateUserParams): Promise<XPanelAPIResponse<XPanelUser>> {
    return this.request("PUT", `/users/${params.id}`, params);
  }

  /**
   * Delete user
   */
  async deleteUser(id: number): Promise<XPanelAPIResponse<void>> {
    return this.request("DELETE", `/users/${id}`);
  }

  /**
   * Get subscription info
   */
  async getSubscription(token: string): Promise<XPanelAPIResponse<XPanelSubscription>> {
    return this.request("GET", `/subscription/${token}`);
  }

  /**
   * Get subscription link
   */
  async getSubscriptionLink(username: string): Promise<XPanelAPIResponse<{ link: string }>> {
    return this.request("GET", `/subscription/link/${username}`);
  }

  /**
   * Get all inbounds
   */
  async getInbounds(): Promise<XPanelAPIResponse<XPanelInbound[]>> {
    return this.request("GET", "/inbounds");
  }

  /**
   * Get traffic statistics
   */
  async getTrafficStats(): Promise<XPanelAPIResponse<XPanelTrafficStats>> {
    return this.request("GET", "/stats/traffic");
  }

  /**
   * Reset user traffic
   */
  async resetUserTraffic(id: number): Promise<XPanelAPIResponse<void>> {
    return this.request("POST", `/users/${id}/reset-traffic`);
  }

  /**
   * Enable/Disable user
   */
  async toggleUser(id: number, enable: boolean): Promise<XPanelAPIResponse<void>> {
    return this.request("POST", `/users/${id}/${enable ? "enable" : "disable"}`);
  }

  /**
   * Health check - verify XPanel is reachable
   */
  async healthCheck(): Promise<boolean> {
    const response = await this.request("GET", "/health");
    return response.success;
  }
}

// Export singleton instance
let xpanelClient: XPanelClient | null = null;

export function getXPanelClient(): XPanelClient {
  if (!xpanelClient) {
    xpanelClient = new XPanelClient();
  }
  return xpanelClient;
}

export function resetXPanelClient(): void {
  xpanelClient = null;
}

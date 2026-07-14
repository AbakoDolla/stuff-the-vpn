/**
 * XPanel (X-NET) HTTP Client
 * Handles communication with X-NET Panel API
 * 
 * API Base: http://localhost:18790/api/
 * Panel URL: http://localhost:18790/kqUtkMEvgdtx
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
  private jwtToken: string | null = null;

  constructor(config?: Partial<XPanelConfig>) {
    this.baseUrl = config?.baseUrl ?? env.XPANEL_URL ?? "http://localhost:18790";
    this.apiKey = config?.apiKey ?? env.XPANEL_API_KEY ?? "";
    this.webBasePath = config?.webBasePath ?? env.XPANEL_WEB_BASE_PATH ?? "kqUtkMEvgdtx";
  }

  /**
   * Get API URL (without web base path for API calls)
   */
  private getApiUrl(path: string): string {
    return `${this.baseUrl}/api${path}`;
  }

  /**
   * Make API request with JWT authentication
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

    if (this.jwtToken) {
      headers["Authorization"] = `Bearer ${this.jwtToken}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const text = await response.text();
      
      // Try to parse as JSON
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        // If not JSON, check if it's an error
        if (!response.ok) {
          return {
            success: false,
            error: `HTTP ${response.status}: ${text.substring(0, 100)}`,
          };
        }
        return {
          success: true,
          data: text,
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}`,
        };
      }

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
   * Health check - verify XPanel is reachable
   */
  async healthCheck(): Promise<boolean> {
    const response = await this.request<{ status: string }>("GET", "/v1/ping");
    return response.success && response.data?.status === "ok";
  }

  /**
   * Login to XPanel and get JWT token
   */
  async login(username: string, password: string): Promise<XPanelAPIResponse<{ token: string }>> {
    const response = await this.request<{ token: string; message?: string }>("POST", "/v1/auth/login", {
      username,
      password,
    });
    
    if (response.success && response.data?.token) {
      this.jwtToken = response.data.token;
    }
    
    return response;
  }

  /**
   * Get all subscribers (VPN users)
   */
  async getSubscribers(): Promise<XPanelAPIResponse<any[]>> {
    return this.request("GET", "/v1/subscribers");
  }

  /**
   * Get subscriber by username
   */
  async getSubscriber(username: string): Promise<XPanelAPIResponse<any>> {
    return this.request("GET", `/v1/subscribers/${username}`);
  }

  /**
   * Create new subscriber
   */
  async createSubscriber(params: {
    username: string;
    password?: string;
    packageType?: string;
    dataLimit?: number;
    expireDays?: number;
  }): Promise<XPanelAPIResponse<any>> {
    return this.request("POST", "/v1/subscribers", params);
  }

  /**
   * Update subscriber
   */
  async updateSubscriber(
    username: string,
    params: {
      dataLimit?: number;
      expireDays?: number;
      enable?: boolean;
    }
  ): Promise<XPanelAPIResponse<any>> {
    return this.request("PUT", `/v1/subscribers/${username}`, params);
  }

  /**
   * Delete subscriber
   */
  async deleteSubscriber(username: string): Promise<XPanelAPIResponse<void>> {
    return this.request("DELETE", `/v1/subscribers/${username}`);
  }

  /**
   * Get all inbounds
   */
  async getInbounds(): Promise<XPanelAPIResponse<any[]>> {
    return this.request("GET", "/inbounds");
  }

  /**
   * Get traffic statistics
   */
  async getTrafficStats(): Promise<XPanelAPIResponse<XPanelTrafficStats>> {
    return this.request("GET", "/traffic/singbox/summary");
  }

  /**
   * Reset subscriber traffic
   */
  async resetSubscriberTraffic(username: string): Promise<XPanelAPIResponse<void>> {
    return this.request("POST", `/v1/subscribers/${username}/reset-traffic`);
  }

  /**
   * Enable/Disable subscriber
   */
  async toggleSubscriber(username: string, enable: boolean): Promise<XPanelAPIResponse<void>> {
    return this.request("POST", `/v1/subscribers/${username}/${enable ? "enable" : "disable"}`);
  }

  /**
   * Get online users
   */
  async getOnlineUsers(): Promise<XPanelAPIResponse<any[]>> {
    return this.request("GET", "/v1/online-users");
  }

  /**
   * Get realtime traffic
   */
  async getRealtimeTraffic(): Promise<XPanelAPIResponse<any>> {
    return this.request("GET", "/traffic/singbox/realtime");
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

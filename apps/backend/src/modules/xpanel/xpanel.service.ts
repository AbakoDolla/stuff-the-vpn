/**
 * XPanel (X-NET) Service
 * Business logic for SXB VPN integration with X-NET Panel
 */

import { prisma } from "../../prisma/client.js";
import { getXPanelClient, type XPanelClient } from "./xpanel.client.js";
import { env } from "../../config/env.js";

// XPanel admin credentials (from /opt/xnet/.env)
const XPANEL_ADMIN_USER = env.XPANEL_ADMIN_USER ?? "admin";
const XPANEL_ADMIN_PASS = env.XPANEL_ADMIN_PASS ?? "snwTlftZtc5BF1VBrvvC";

/**
 * Generate unique token in format SXB-XXXX-XXXX-XXXX
 */
function generateSXBToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segments = [];
  for (let i = 0; i < 3; i++) {
    let segment = "";
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  return `SXB-${segments.join("-")}`;
}

/**
 * Ensure XPanel client is authenticated
 */
async function ensureAuthenticated(client: XPanelClient): Promise<boolean> {
  try {
    const loginResult = await client.login(XPANEL_ADMIN_USER, XPANEL_ADMIN_PASS);
    return loginResult.success;
  } catch (error) {
    console.error("[XPanel Service] Authentication failed:", error);
    return false;
  }
}

/**
 * Create VPN user in XPanel and sync with SXB database
 */
export async function createVPNUser(params: {
  userId: string;
  username: string;
  email?: string;
  packageType: string;
  quotaGB?: number;
  expireDays?: number;
}): Promise<{
  success: boolean;
  token?: string;
  xpanelUsername?: string;
  error?: string;
}> {
  const client = getXPanelClient();

  // Check if XPanel is reachable
  const health = await client.healthCheck();
  if (!health) {
    return { success: false, error: "XPanel is not reachable" };
  }

  // Authenticate with XPanel
  const authOk = await ensureAuthenticated(client);
  if (!authOk) {
    return { success: false, error: "XPanel authentication failed" };
  }

  // Generate SXB token and XPanel username
  const sxbToken = generateSXBToken();
  const xpanelUsername = `sxb_${params.username.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now() % 100000}`;

  try {
    // Create subscriber in XPanel
    const createResult = await client.createSubscriber({
      username: xpanelUsername,
      password: xpanelUsername, // Use username as initial password
      packageType: params.packageType,
      dataLimit: params.quotaGB ? params.quotaGB * 1024 * 1024 * 1024 : undefined, // Convert GB to bytes
      expireDays: params.expireDays,
    });

    if (!createResult.success) {
      return { success: false, error: createResult.error || "Failed to create subscriber in XPanel" };
    }

    // Create VPN profile in SXB database
    await prisma.vpnProfile.create({
      data: {
        userId: params.userId,
        token: sxbToken,
        xpanelUsername: xpanelUsername,
        protocol: params.packageType as any,
        quotaGB: params.quotaGB ?? 0,
        quotaUsedGB: 0,
        expiresAt: params.expireDays
          ? new Date(Date.now() + params.expireDays * 24 * 60 * 60 * 1000)
          : null,
        status: "ACTIVE",
      },
    });

    return {
      success: true,
      token: sxbToken,
      xpanelUsername,
    };
  } catch (error) {
    console.error("[XPanel Service] createVPNUser error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete VPN user from XPanel and SXB database
 */
export async function deleteVPNUser(params: {
  userId?: string;
  xpanelUsername?: string;
}): Promise<{ success: boolean; error?: string }> {
  const client = getXPanelClient();

  try {
    // Find VPN profile
    const whereClause = params.userId
      ? { userId: params.userId }
      : { xpanelUsername: params.xpanelUsername };

    const profile = await prisma.vpnProfile.findFirst({
      where: whereClause,
    });

    if (!profile) {
      return { success: false, error: "VPN profile not found" };
    }

    // Authenticate with XPanel
    await ensureAuthenticated(client);

    // Delete from XPanel
    if (profile.xpanelUsername) {
      const deleteResult = await client.deleteSubscriber(profile.xpanelUsername);
      if (!deleteResult.success) {
        console.warn("[XPanel Service] Failed to delete subscriber from XPanel:", deleteResult.error);
      }
    }

    // Delete from SXB database
    await prisma.vpnProfile.delete({
      where: { id: profile.id },
    });

    return { success: true };
  } catch (error) {
    console.error("[XPanel Service] deleteVPNUser error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update VPN user in XPanel
 */
export async function updateVPNUser(params: {
  userId?: string;
  xpanelUsername?: string;
  quotaGB?: number;
  expireDays?: number;
  enable?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const client = getXPanelClient();

  try {
    // Find VPN profile
    const whereClause = params.userId
      ? { userId: params.userId }
      : { xpanelUsername: params.xpanelUsername };

    const profile = await prisma.vpnProfile.findFirst({
      where: whereClause,
    });

    if (!profile) {
      return { success: false, error: "VPN profile not found" };
    }

    if (!profile.xpanelUsername) {
      return { success: false, error: "XPanel username not found" };
    }

    // Authenticate with XPanel
    await ensureAuthenticated(client);

    // Update in XPanel
    if (params.enable !== undefined) {
      const toggleResult = await client.toggleSubscriber(profile.xpanelUsername, params.enable);
      if (!toggleResult.success) {
        return { success: false, error: toggleResult.error };
      }
    } else {
      const updateParams: any = {};
      if (params.quotaGB !== undefined) {
        updateParams.dataLimit = params.quotaGB * 1024 * 1024 * 1024; // Convert GB to bytes
      }
      if (params.expireDays !== undefined) {
        updateParams.expireDays = params.expireDays;
      }
      
      if (Object.keys(updateParams).length > 0) {
        const updateResult = await client.updateSubscriber(profile.xpanelUsername, updateParams);
        if (!updateResult.success) {
          return { success: false, error: updateResult.error };
        }
      }
    }

    // Update in SXB database
    await prisma.vpnProfile.update({
      where: { id: profile.id },
      data: {
        quotaGB: params.quotaGB ?? profile.quotaGB,
        expiresAt: params.expireDays
          ? new Date(Date.now() + params.expireDays * 24 * 60 * 60 * 1000)
          : profile.expiresAt,
        status: params.enable === false ? "SUSPENDED" : "ACTIVE",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[XPanel Service] updateVPNUser error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get all VPN users from XPanel
 */
export async function getVPNUsers(): Promise<{
  success: boolean;
  users?: any[];
  error?: string;
}> {
  const client = getXPanelClient();

  try {
    // Authenticate with XPanel
    const authOk = await ensureAuthenticated(client);
    if (!authOk) {
      return { success: false, error: "XPanel authentication failed" };
    }

    const result = await client.getSubscribers();
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, users: result.data };
  } catch (error) {
    console.error("[XPanel Service] getVPNUsers error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get traffic usage for a user
 */
export async function getTrafficUsage(userId: string): Promise<{
  success: boolean;
  usage?: { download: number; upload: number; total: number };
  error?: string;
}> {
  const client = getXPanelClient();

  try {
    const profile = await prisma.vpnProfile.findFirst({
      where: { userId },
    });

    if (!profile || !profile.xpanelUsername) {
      return { success: false, error: "VPN profile not found" };
    }

    // Authenticate with XPanel
    await ensureAuthenticated(client);

    const subscriberResult = await client.getSubscriber(profile.xpanelUsername);
    if (!subscriberResult.success || !subscriberResult.data) {
      return { success: false, error: subscriberResult.error };
    }

    const subscriber = subscriberResult.data;
    return {
      success: true,
      usage: {
        download: subscriber.download ?? 0,
        upload: subscriber.upload ?? 0,
        total: (subscriber.download ?? 0) + (subscriber.upload ?? 0),
      },
    };
  } catch (error) {
    console.error("[XPanel Service] getTrafficUsage error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Sync users between SXB database and XPanel
 */
export async function syncVPNUsers(): Promise<{
  success: boolean;
  synced: number;
  errors: number;
}> {
  const client = getXPanelClient();
  let synced = 0;
  let errors = 0;

  try {
    // Authenticate with XPanel
    const authOk = await ensureAuthenticated(client);
    if (!authOk) {
      console.error("[XPanel Service] XPanel authentication failed");
      return { success: false, synced: 0, errors: 1 };
    }

    // Get all XPanel subscribers
    const subscribersResult = await client.getSubscribers();
    if (!subscribersResult.success || !subscribersResult.data) {
      console.error("[XPanel Service] Failed to get XPanel subscribers:", subscribersResult.error);
      return { success: false, synced: 0, errors: 1 };
    }

    const subscribers = subscribersResult.data as any[];

    // Get all SXB VPN profiles
    const sxbProfiles = await prisma.vpnProfile.findMany();

    // Sync each SXB profile with XPanel
    for (const profile of sxbProfiles) {
      try {
        if (profile.xpanelUsername) {
          const xpanelSubscriber = subscribers.find(
            (s) => s.username === profile.xpanelUsername
          );

          if (xpanelSubscriber) {
            // Update quota used
            await prisma.vpnProfile.update({
              where: { id: profile.id },
              data: {
                quotaUsedGB: Math.round(((xpanelSubscriber.download ?? 0) + (xpanelSubscriber.upload ?? 0)) / 1e9),
              },
            });
            synced++;
          }
        }
      } catch (err) {
        console.error(`[XPanel Service] Error syncing profile ${profile.id}:`, err);
        errors++;
      }
    }

    return { success: true, synced, errors };
  } catch (error) {
    console.error("[XPanel Service] syncVPNUsers error:", error);
    return { success: false, synced, errors };
  }
}

/**
 * Get subscription link for a user
 */
export async function getSubscriptionLink(userId: string): Promise<{
  success: boolean;
  link?: string;
  error?: string;
}> {
  const client = getXPanelClient();

  try {
    const profile = await prisma.vpnProfile.findFirst({
      where: { userId },
    });

    if (!profile || !profile.xpanelUsername) {
      return { success: false, error: "VPN profile not found" };
    }

    // Authenticate with XPanel
    await ensureAuthenticated(client);

    const subscriberResult = await client.getSubscriber(profile.xpanelUsername);
    if (!subscriberResult.success || !subscriberResult.data) {
      return { success: false, error: subscriberResult.error };
    }

    const xpanelBaseUrl = env.XPANEL_URL?.replace(/\/$/, "") ?? "http://localhost:18790";
    const webBasePath = env.XPANEL_WEB_BASE_PATH ?? "kqUtkMEvgdtx";
    const subscriptionLink = `${xpanelBaseUrl}/${webBasePath}/sub/${profile.xpanelUsername}`;

    return { success: true, link: subscriptionLink };
  } catch (error) {
    console.error("[XPanel Service] getSubscriptionLink error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Reset traffic for a VPN user
 */
export async function resetUserTraffic(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const client = getXPanelClient();

  try {
    const profile = await prisma.vpnProfile.findFirst({
      where: { userId },
    });

    if (!profile || !profile.xpanelUsername) {
      return { success: false, error: "VPN profile not found" };
    }

    // Authenticate with XPanel
    await ensureAuthenticated(client);

    const resetResult = await client.resetSubscriberTraffic(profile.xpanelUsername);
    if (!resetResult.success) {
      return { success: false, error: resetResult.error };
    }

    // Reset in SXB database
    await prisma.vpnProfile.update({
      where: { id: profile.id },
      data: { quotaUsedGB: 0 },
    });

    return { success: true };
  } catch (error) {
    console.error("[XPanel Service] resetUserTraffic error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

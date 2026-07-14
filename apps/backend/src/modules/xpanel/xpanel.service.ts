/**
 * XPanel (X-NET) Service
 * Business logic for SXB VPN integration with X-NET Panel
 */

import { prisma } from "../../prisma/client.js";
import { getXPanelClient, type XPanelClient } from "./xpanel.client.js";
import type { CreateUserParams, UpdateUserParams, XPanelUser } from "./xpanel.types.js";
import { env } from "../../config/env.js";

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
  xpanelUserId?: number;
  error?: string;
}> {
  const client = getXPanelClient();

  // Check if XPanel is reachable
  const health = await client.healthCheck();
  if (!health) {
    return { success: false, error: "XPanel is not reachable" };
  }

  // Generate SXB token
  const sxbToken = generateSXBToken();

  try {
    // Create user in XPanel
    const xpanelParams: CreateUserParams = {
      username: `sxb_${params.username}_${Date.now()}`,
      email: params.email,
      packageType: params.packageType,
      totalGB: params.quotaGB,
      expireDays: params.expireDays,
    };

    const createResult = await client.createUser(xpanelParams);

    if (!createResult.success || !createResult.data) {
      return { success: false, error: createResult.error || "Failed to create user in XPanel" };
    }

    const xpanelUser = createResult.data as XPanelUser;

    // Get subscription link from XPanel
    const linkResult = await client.getSubscriptionLink(xpanelUser.username);
    const subscriptionLink = linkResult.success ? linkResult.data?.link : null;

    // Create VPN profile in SXB database
    await prisma.vpnProfile.create({
      data: {
        userId: params.userId,
        token: sxbToken,
        xpanelUserId: xpanelUser.id.toString(),
        username: xpanelUser.username,
        protocol: params.packageType as any,
        quotaGB: params.quotaGB ?? 0,
        quotaUsedGB: 0,
        expiresAt: params.expireDays
          ? new Date(Date.now() + params.expireDays * 24 * 60 * 60 * 1000)
          : null,
        subscriptionLink: subscriptionLink,
        status: "ACTIVE",
      },
    });

    return {
      success: true,
      token: sxbToken,
      xpanelUserId: xpanelUser.id,
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
  xpanelUserId?: string;
}): Promise<{ success: boolean; error?: string }> {
  const client = getXPanelClient();

  try {
    // Find VPN profile
    const whereClause = params.userId
      ? { userId: params.userId }
      : { xpanelUserId: params.xpanelUserId };

    const profile = await prisma.vpnProfile.findFirst({
      where: whereClause,
    });

    if (!profile) {
      return { success: false, error: "VPN profile not found" };
    }

    // Delete from XPanel
    if (profile.xpanelUserId) {
      const deleteResult = await client.deleteUser(parseInt(profile.xpanelUserId, 10));
      if (!deleteResult.success) {
        console.warn("[XPanel Service] Failed to delete user from XPanel:", deleteResult.error);
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
  xpanelUserId?: string;
  quotaGB?: number;
  expireDays?: number;
  enable?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const client = getXPanelClient();

  try {
    // Find VPN profile
    const whereClause = params.userId
      ? { userId: params.userId }
      : { xpanelUserId: params.xpanelUserId };

    const profile = await prisma.vpnProfile.findFirst({
      where: whereClause,
    });

    if (!profile) {
      return { success: false, error: "VPN profile not found" };
    }

    if (!profile.xpanelUserId) {
      return { success: false, error: "XPanel user ID not found" };
    }

    // Update in XPanel
    const updateParams: UpdateUserParams = {
      id: parseInt(profile.xpanelUserId, 10),
      totalGB: params.quotaGB,
      expireDays: params.expireDays,
    };

    if (params.enable !== undefined) {
      const toggleResult = await client.toggleUser(
        parseInt(profile.xpanelUserId, 10),
        params.enable
      );
      if (!toggleResult.success) {
        return { success: false, error: toggleResult.error };
      }
    } else {
      const updateResult = await client.updateUser(updateParams);
      if (!updateResult.success) {
        return { success: false, error: updateResult.error };
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
    const result = await client.getUsers();
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

    if (!profile || !profile.xpanelUserId) {
      return { success: false, error: "VPN profile not found" };
    }

    const userResult = await client.getUser(parseInt(profile.xpanelUserId, 10));
    if (!userResult.success || !userResult.data) {
      return { success: false, error: userResult.error };
    }

    const xpanelUser = userResult.data as XPanelUser;
    return {
      success: true,
      usage: {
        download: xpanelUser.download,
        upload: xpanelUser.upload,
        total: xpanelUser.download + xpanelUser.upload,
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
    // Get all XPanel users
    const xpanelResult = await client.getUsers();
    if (!xpanelResult.success || !xpanelResult.data) {
      console.error("[XPanel Service] Failed to get XPanel users:", xpanelResult.error);
      return { success: false, synced: 0, errors: 1 };
    }

    // Get all SXB VPN profiles
    const sxbProfiles = await prisma.vpnProfile.findMany();

    // Sync each SXB profile with XPanel
    for (const profile of sxbProfiles) {
      try {
        if (profile.xpanelUserId) {
          const xpanelUser = (xpanelResult.data as XPanelUser[]).find(
            (u) => u.id === parseInt(profile.xpanelUserId, 10)
          );

          if (xpanelUser) {
            // Update quota used
            await prisma.vpnProfile.update({
              where: { id: profile.id },
              data: {
                quotaUsedGB: Math.round((xpanelUser.download + xpanelUser.upload) / 1e9),
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
 * Get XPanel subscription link for a user
 */
export async function getSubscriptionLink(userId: string): Promise<{
  success: boolean;
  link?: string;
  error?: string;
}> {
  try {
    const profile = await prisma.vpnProfile.findFirst({
      where: { userId },
    });

    if (!profile || !profile.subscriptionLink) {
      return { success: false, error: "Subscription link not found" };
    }

    return { success: true, link: profile.subscriptionLink };
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

    if (!profile || !profile.xpanelUserId) {
      return { success: false, error: "VPN profile not found" };
    }

    const resetResult = await client.resetUserTraffic(parseInt(profile.xpanelUserId, 10));
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

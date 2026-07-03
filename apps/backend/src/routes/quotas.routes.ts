/**
 * SXB VPN - Quotas Routes
 * 
 * Routes pour la gestion des quotas par l'administrateur.
 */

import { Router } from "express";
import { prisma } from "../prisma/client.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";
import { logAudit } from "../lib/audit.js";

const router = Router();

// Toutes les routes nécessitent une authentification admin
router.use(authenticateAdmin);

/**
 * GET /api/quotas
 * Liste tous les quotas
 */
router.get("/", async (req, res) => {
  try {
    const { userId, deviceId, limit = "50", offset = "0" } = req.query;

    const where: any = {};
    if (userId) where.userId = String(userId);
    if (deviceId) where.deviceId = String(deviceId);

    const [quotas, total] = await Promise.all([
      prisma.quota.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, phone: true, name: true },
          },
          device: {
            select: { id: true, deviceId: true, deviceName: true },
          },
        },
        orderBy: { lastUpdatedAt: "desc" },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.quota.count({ where }),
    ]);

    // Calculer les statistiques
    const quotasWithStats = quotas.map((q) => ({
      ...q,
      percentage: q.totalGB > 0 ? Math.round((q.usedGB / q.totalGB) * 100) : 0,
      isExhausted: q.remainingGB <= 0,
    }));

    res.json({
      success: true,
      data: quotasWithStats,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error("Error listing quotas:", error);
    res.status(500).json({ success: false, error: "Failed to list quotas" });
  }
});

/**
 * GET /api/quotas/:id
 * Détails d'un quota avec historique
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = "100" } = req.query;

    const quota = await prisma.quota.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, phone: true, name: true, status: true },
        },
        device: {
          select: { id: true, deviceId: true, deviceName: true, status: true },
        },
        history: {
          orderBy: { timestamp: "desc" },
          take: Number(limit),
        },
      },
    });

    if (!quota) {
      return res.status(404).json({ success: false, error: "Quota not found" });
    }

    res.json({
      success: true,
      data: {
        ...quota,
        percentage: quota.totalGB > 0 ? Math.round((quota.usedGB / quota.totalGB) * 100) : 0,
        isExhausted: quota.remainingGB <= 0,
      },
    });
  } catch (error) {
    console.error("Error getting quota:", error);
    res.status(500).json({ success: false, error: "Failed to get quota" });
  }
});

/**
 * GET /api/quotas/:id/usage
 * Historique d'utilisation d'un quota
 */
router.get("/:id/usage", async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to, limit = "100" } = req.query;

    const quota = await prisma.quota.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    if (!quota) {
      return res.status(404).json({ success: false, error: "Quota not found" });
    }

    const where: any = { quotaId: id };
    if (from) where.timestamp = { ...where.timestamp, gte: new Date(String(from)) };
    if (to) where.timestamp = { ...where.timestamp, lte: new Date(String(to)) };

    const history = await prisma.quotaHistory.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: Number(limit),
    });

    // Calculer les statistiques
    const totalUpload = history.reduce((sum, h) => sum + h.uploadGB, 0);
    const totalDownload = history.reduce((sum, h) => sum + h.downloadGB, 0);

    res.json({
      success: true,
      data: {
        quota: {
          id: quota.id,
          totalGB: quota.totalGB,
          usedGB: quota.usedGB,
          remainingGB: quota.remainingGB,
          percentage: quota.totalGB > 0 ? Math.round((quota.usedGB / quota.totalGB) * 100) : 0,
        },
        stats: {
          totalHistory: history.length,
          totalUploadGB: totalUpload,
          totalDownloadGB: totalDownload,
          avgPerSession: history.length > 0 ? (totalUpload + totalDownload) / history.length : 0,
        },
        history,
      },
    });
  } catch (error) {
    console.error("Error getting quota usage:", error);
    res.status(500).json({ success: false, error: "Failed to get quota usage" });
  }
});

/**
 * POST /api/quotas
 * Créer un quota
 */
router.post("/", async (req, res) => {
  try {
    const { userId, deviceId, totalGB, policy, resetAt } = req.body;
    const adminId = (req as any).adminId;

    if (!userId || totalGB === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: "userId and totalGB are required" 
      });
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const quota = await prisma.quota.create({
      data: {
        userId,
        deviceId: deviceId || null,
        totalGB,
        usedGB: 0,
        remainingGB: totalGB,
        policy: policy || "SUSPEND",
        resetAt: resetAt ? new Date(resetAt) : null,
      },
    });

    // Mettre à jour le quota de l'utilisateur
    await prisma.user.update({
      where: { id: userId },
      data: {
        quotaRemainingGB: { increment: totalGB },
      },
    });

    await logAudit({
      action: "QUOTA_UPDATE",
      entity: "Quota",
      entityId: quota.id,
      details: { userId, deviceId, totalGB, policy },
      adminId,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: quota });
  } catch (error) {
    console.error("Error creating quota:", error);
    res.status(500).json({ success: false, error: "Failed to create quota" });
  }
});

/**
 * PATCH /api/quotas/:id
 * Modifier un quota
 */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { totalGB, policy, resetAt, addGB } = req.body;
    const adminId = (req as any).adminId;

    const quota = await prisma.quota.findUnique({
      where: { id },
    });

    if (!quota) {
      return res.status(404).json({ success: false, error: "Quota not found" });
    }

    const updateData: any = {};
    const changes: any = {};

    if (totalGB !== undefined) {
      const diff = totalGB - quota.totalGB;
      updateData.totalGB = totalGB;
      updateData.remainingGB = Math.max(0, quota.remainingGB + diff);
      changes.totalGB = { old: quota.totalGB, new: totalGB };
    }

    if (addGB !== undefined && addGB !== 0) {
      updateData.totalGB = quota.totalGB + addGB;
      updateData.remainingGB = quota.remainingGB + addGB;
      changes.addGB = addGB;
    }

    if (policy !== undefined) {
      updateData.policy = policy;
      changes.policy = { old: quota.policy, new: policy };
    }

    if (resetAt !== undefined) {
      updateData.resetAt = resetAt ? new Date(resetAt) : null;
      changes.resetAt = resetAt;
    }

    const updatedQuota = await prisma.quota.update({
      where: { id },
      data: updateData,
    });

    // Mettre à jour le quota de l'utilisateur si changé
    if (addGB !== undefined && addGB !== 0) {
      await prisma.user.update({
        where: { id: quota.userId },
        data: {
          quotaRemainingGB: { increment: addGB },
        },
      });
    }

    await logAudit({
      action: "QUOTA_UPDATE",
      entity: "Quota",
      entityId: id,
      details: { changes, userId: quota.userId },
      adminId,
      ipAddress: req.ip,
    });

    res.json({ 
      success: true, 
      data: {
        ...updatedQuota,
        percentage: updatedQuota.totalGB > 0 ? Math.round((updatedQuota.usedGB / updatedQuota.totalGB) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("Error updating quota:", error);
    res.status(500).json({ success: false, error: "Failed to update quota" });
  }
});

/**
 * POST /api/quotas/:id/reset
 * Réinitialiser un quota
 */
router.post("/:id/reset", async (req, res) => {
  try {
    const { id } = req.params;
    const { newTotalGB } = req.body;
    const adminId = (req as any).adminId;

    const quota = await prisma.quota.findUnique({
      where: { id },
    });

    if (!quota) {
      return res.status(404).json({ success: false, error: "Quota not found" });
    }

    const newTotal = newTotalGB ?? quota.totalGB;

    const updatedQuota = await prisma.quota.update({
      where: { id },
      data: {
        totalGB: newTotal,
        usedGB: 0,
        remainingGB: newTotal,
        lastUpdatedAt: new Date(),
      },
    });

    // Réinitialiser aussi le quota de l'utilisateur
    await prisma.user.update({
      where: { id: quota.userId },
      data: {
        quotaUsedGB: 0,
        quotaRemainingGB: newTotal,
      },
    });

    await logAudit({
      action: "QUOTA_RESET",
      entity: "Quota",
      entityId: id,
      details: { userId: quota.userId, newTotal },
      adminId,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: updatedQuota });
  } catch (error) {
    console.error("Error resetting quota:", error);
    res.status(500).json({ success: false, error: "Failed to reset quota" });
  }
});

/**
 * DELETE /api/quotas/:id
 * Supprimer un quota
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).adminId;

    const quota = await prisma.quota.findUnique({
      where: { id },
    });

    if (!quota) {
      return res.status(404).json({ success: false, error: "Quota not found" });
    }

    // Soustraire du quota utilisateur avant de supprimer
    await prisma.user.update({
      where: { id: quota.userId },
      data: {
        quotaRemainingGB: { decrement: quota.remainingGB },
      },
    });

    await prisma.quota.delete({
      where: { id },
    });

    await logAudit({
      action: "QUOTA_UPDATE",
      entity: "Quota",
      entityId: id,
      details: { action: "deleted", userId: quota.userId },
      adminId,
      ipAddress: req.ip,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting quota:", error);
    res.status(500).json({ success: false, error: "Failed to delete quota" });
  }
});

export default router;

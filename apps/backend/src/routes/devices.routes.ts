/**
 * SXB VPN - Devices Routes
 * 
 * Routes pour la gestion des appareils par l'administrateur.
 */

import { Router } from "express";
import { prisma } from "../prisma/client.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";
import { logAudit } from "../lib/audit.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = Router();

// Toutes les routes nécessitent une authentification admin
router.use(authMiddleware, requireRole("ADMIN", "SUPER_ADMIN"));

/**
 * GET /api/devices
 * Liste tous les appareils
 */
router.get("/", async (req, res) => {
  try {
    const { 
      status, 
      userId, 
      search, 
      limit = "50", 
      offset = "0" 
    } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = String(userId);
    if (search) {
      where.OR = [
        { deviceId: { contains: String(search), mode: "insensitive" } },
        { deviceName: { contains: String(search), mode: "insensitive" } },
        { brand: { contains: String(search), mode: "insensitive" } },
        { model: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const [devices, total] = await Promise.all([
      prisma.device.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, phone: true, name: true },
          },
          activations: {
            orderBy: { activatedAt: "desc" },
            take: 1,
          },
          _count: {
            select: { syncLogs: true },
          },
        },
        orderBy: { lastSeenAt: "desc" },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.device.count({ where }),
    ]);

    sendSuccess(res, {
      data: devices,
      total,
      limit: Number(limit),
      offset: Number(offset),
    }, "Devices listed successfully");
  } catch (error) {
    console.error("Error listing devices:", error);
    sendError(res, "Failed to list devices", 500);
  }
});

/**
 * GET /api/devices/:id
 * Détails d'un appareil
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const device = await prisma.device.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, phone: true, name: true, status: true },
        },
        activations: {
          orderBy: { createdAt: "desc" },
        },
        syncLogs: {
          orderBy: { timestamp: "desc" },
          take: 20,
        },
      },
    });

    if (!device) {
      return sendError(res, "Device not found", 404);
    }

    sendSuccess(res, device, "Device retrieved successfully");
  } catch (error) {
    console.error("Error getting device:", error);
    sendError(res, "Failed to get device", 500);
  }
});

/**
 * GET /api/devices/:id/history
 * Historique d'un appareil
 */
router.get("/:id/history", async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = "50" } = req.query;

    const device = await prisma.device.findUnique({
      where: { id },
    });

    if (!device) {
      return sendError(res, "Device not found", 404);
    }

    const [activations, syncLogs] = await Promise.all([
      prisma.activation.findMany({
        where: { deviceId: device.deviceId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.syncLog.findMany({
        where: { deviceId: device.deviceId },
        orderBy: { timestamp: "desc" },
        take: Number(limit),
      }),
    ]);

    sendSuccess(res, { activations, syncLogs }, "Device history retrieved successfully");
  } catch (error) {
    console.error("Error getting device history:", error);
    sendError(res, "Failed to get device history", 500);
  }
});

/**
 * PATCH /api/devices/:id
 * Modifier un appareil
 */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, deviceName, isCompromised } = req.body;
    const adminId = (req as any).user?.userId;

    const device = await prisma.device.findUnique({
      where: { id },
    });

    if (!device) {
      return sendError(res, "Device not found", 404);
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (deviceName !== undefined) updateData.deviceName = deviceName;
    if (isCompromised !== undefined) updateData.isCompromised = isCompromised;

    const updatedDevice = await prisma.device.update({
      where: { id },
      data: updateData,
    });

    // Logger l'audit
    await logAudit({
      action: status === "BLOCKED" ? "DEVICE_BLOCK" 
            : status === "DISABLED" ? "DEVICE_DISABLE"
            : isCompromised ? "DEVICE_COMPROMISED"
            : "DEVICE_UPDATE",
      entity: "Device",
      entityId: id,
      details: { deviceId: device.deviceId, changes: updateData },
      adminId,
      ipAddress: req.ip,
    });

    sendSuccess(res, updatedDevice, "Device updated successfully");
  } catch (error) {
    console.error("Error updating device:", error);
    sendError(res, "Failed to update device", 500);
  }
});

/**
 * DELETE /api/devices/:id
 * Supprimer un appareil
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user?.userId;

    const device = await prisma.device.findUnique({
      where: { id },
    });

    if (!device) {
      return sendError(res, "Device not found", 404);
    }

    // Supprimer l'appareil (cascade supprimera les relations)
    await prisma.device.delete({
      where: { id },
    });

    await logAudit({
      action: "DEVICE_DELETE",
      entity: "Device",
      entityId: id,
      details: { deviceId: device.deviceId },
      adminId,
      ipAddress: req.ip,
    });

    sendSuccess(res, null, "Device deleted successfully");
  } catch (error) {
    console.error("Error deleting device:", error);
    sendError(res, "Failed to delete device", 500);
  }
});

/**
 * POST /api/devices/:id/block
 * Bloquer un appareil compromis
 */
router.post("/:id/block", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user?.userId;

    const device = await prisma.device.findUnique({
      where: { id },
    });

    if (!device) {
      return sendError(res, "Device not found", 404);
    }

    const updatedDevice = await prisma.device.update({
      where: { id },
      data: {
        status: "BLOCKED",
        isCompromised: true,
      },
    });

    // Révoquer l'activation
    await prisma.activation.updateMany({
      where: { deviceId: device.deviceId },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        reason: reason || "Appareil bloqué par l'administrateur",
      },
    });

    await logAudit({
      action: "DEVICE_BLOCK",
      entity: "Device",
      entityId: id,
      details: { deviceId: device.deviceId, reason },
      adminId,
      ipAddress: req.ip,
    });

    sendSuccess(res, updatedDevice, "Device blocked successfully");
  } catch (error) {
    console.error("Error blocking device:", error);
    sendError(res, "Failed to block device", 500);
  }
});

export default router;

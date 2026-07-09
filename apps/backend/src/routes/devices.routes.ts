/**
 * SXB VPN - Devices Routes
 * 
 * Routes pour la gestion des appareils par l'administrateur.
 */

import { Router } from "express";
import { prisma } from "../prisma/client.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";
import { logAudit } from "../lib/audit.js";

const router = Router();

// Toutes les routes nécessitent une authentification admin
router.use(authenticateAdmin);

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

    res.json({
      success: true,
      data: devices,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error("Error listing devices:", error);
    res.status(500).json({ success: false, error: "Failed to list devices" });
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
      return res.status(404).json({ success: false, error: "Device not found" });
    }

    res.json({ success: true, data: device });
  } catch (error) {
    console.error("Error getting device:", error);
    res.status(500).json({ success: false, error: "Failed to get device" });
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
      return res.status(404).json({ success: false, error: "Device not found" });
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

    res.json({
      success: true,
      data: { activations, syncLogs },
    });
  } catch (error) {
    console.error("Error getting device history:", error);
    res.status(500).json({ success: false, error: "Failed to get device history" });
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
    const adminId = (req as any).adminId;

    const device = await prisma.device.findUnique({
      where: { id },
    });

    if (!device) {
      return res.status(404).json({ success: false, error: "Device not found" });
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

    res.json({ success: true, data: updatedDevice });
  } catch (error) {
    console.error("Error updating device:", error);
    res.status(500).json({ success: false, error: "Failed to update device" });
  }
});

/**
 * DELETE /api/devices/:id
 * Supprimer un appareil
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).adminId;

    const device = await prisma.device.findUnique({
      where: { id },
    });

    if (!device) {
      return res.status(404).json({ success: false, error: "Device not found" });
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

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting device:", error);
    res.status(500).json({ success: false, error: "Failed to delete device" });
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
    const adminId = (req as any).adminId;

    const device = await prisma.device.findUnique({
      where: { id },
    });

    if (!device) {
      return res.status(404).json({ success: false, error: "Device not found" });
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

    res.json({ success: true, data: updatedDevice });
  } catch (error) {
    console.error("Error blocking device:", error);
    res.status(500).json({ success: false, error: "Failed to block device" });
  }
});

export default router;

/**
 * SXB VPN - Tokens Routes
 * 
 * Routes pour la gestion des tokens d'activation par l'administrateur.
 * POST /api/tokens/generate - Générer un token pour un appareil
 * GET  /api/tokens           - Lister tous les tokens
 * POST /api/tokens/revoke/:id - Révoquer un token
 */

import { Router } from "express";
import { prisma } from "../prisma/client.js";
import { generateActivationToken, parseToken } from "../lib/token-generator.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";
import { logAudit } from "../lib/audit.js";

const router = Router();

// Toutes les routes nécessitent une authentification admin
router.use(authenticateAdmin);

/**
 * GET /api/tokens
 * Liste tous les tokens
 */
router.get("/", async (req, res) => {
  try {
    const { status, deviceId, limit = "50", offset = "0" } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (deviceId) where.deviceId = String(deviceId);

    const [tokens, total] = await Promise.all([
      prisma.activationToken.findMany({
        where,
        include: {
          admin: {
            select: { id: true, email: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.activationToken.count({ where }),
    ]);

    // Parser les infos du token pour affichage
    const tokensWithParsedInfo = tokens.map((t) => {
      const parsed = parseToken(t.token);
      return {
        ...t,
        parsedDeviceId: parsed?.deviceId,
        parsedExpiresAt: parsed?.expiresAt,
      };
    });

    res.json({
      success: true,
      data: tokensWithParsedInfo,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error("Error listing tokens:", error);
    res.status(500).json({ success: false, error: "Failed to list tokens" });
  }
});

/**
 * POST /api/tokens/generate
 * Génère un token pour un appareil spécifique
 * Body: { deviceId: string }
 */
router.post("/generate", async (req, res) => {
  try {
    const { deviceId } = req.body;
    const adminId = (req as any).adminId;

    if (!deviceId || typeof deviceId !== "string") {
      return res.status(400).json({ 
        success: false, 
        error: "deviceId is required" 
      });
    }

    // Valider le format UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(deviceId)) {
      return res.status(400).json({ 
        success: false, 
        error: "deviceId must be a valid UUID" 
      });
    }

    // Vérifier si un token actif existe déjà pour cet appareil
    const existingToken = await prisma.activationToken.findFirst({
      where: {
        deviceId,
        status: "ACTIVE",
      },
    });

    if (existingToken) {
      // Retourner le token existant s'il est encore valide
      const parsed = parseToken(existingToken.token);
      if (parsed && parsed.expiresAt > new Date()) {
        return res.json({
          success: true,
          data: {
            ...existingToken,
            parsedDeviceId: parsed.deviceId,
            parsedExpiresAt: parsed.expiresAt,
            reused: true,
          },
          message: "Existing valid token returned",
        });
      }
    }

    // Générer un nouveau token
    const tokenData = generateActivationToken(deviceId);

    const token = await prisma.activationToken.create({
      data: {
        token: tokenData.token,
        deviceId,
        signature: tokenData.signature,
        timestamp: tokenData.timestamp,
        expiresAt: tokenData.expiresAt,
        status: "ACTIVE",
        createdBy: adminId,
      },
      include: {
        admin: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    // Logger l'audit
    await logAudit({
      action: "TOKEN_CREATE",
      entity: "ActivationToken",
      entityId: token.id,
      details: { deviceId, expiresAt: tokenData.expiresAt },
      adminId,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      data: {
        ...token,
        parsedDeviceId: deviceId,
        parsedExpiresAt: tokenData.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(500).json({ success: false, error: "Failed to generate token" });
  }
});

/**
 * POST /api/tokens/revoke/:id
 * Révoque un token
 */
router.post("/revoke/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).adminId;

    const token = await prisma.activationToken.findUnique({
      where: { id },
    });

    if (!token) {
      return res.status(404).json({ success: false, error: "Token not found" });
    }

    if (token.status !== "ACTIVE") {
      return res.status(400).json({ 
        success: false, 
        error: `Token is already ${token.status.toLowerCase()}` 
      });
    }

    const updatedToken = await prisma.activationToken.update({
      where: { id },
      data: { status: "REVOKED" },
    });

    // Logger l'audit
    await logAudit({
      action: "TOKEN_REVOKE",
      entity: "ActivationToken",
      entityId: id,
      details: { deviceId: token.deviceId },
      adminId,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ success: true, data: updatedToken });
  } catch (error) {
    console.error("Error revoking token:", error);
    res.status(500).json({ success: false, error: "Failed to revoke token" });
  }
});

/**
 * DELETE /api/tokens/:id
 * Supprime un token
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).adminId;

    await prisma.activationToken.delete({
      where: { id },
    });

    await logAudit({
      action: "TOKEN_REVOKE",
      entity: "ActivationToken",
      entityId: id,
      details: { action: "deleted" },
      adminId,
      ipAddress: req.ip,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting token:", error);
    res.status(500).json({ success: false, error: "Failed to delete token" });
  }
});

export default router;

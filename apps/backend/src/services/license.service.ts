import { prisma } from "../prisma/client.js";
import crypto from "crypto";

function generateToken(): string {
  const prefix = "SXB-";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = prefix;
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) result += "-";
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function validateLicense(token: string, phone?: string, deviceId?: string) {
  const license = await prisma.license.findUnique({ where: { token } });
  if (!license) throw new Error("LICENSE_NOT_FOUND");
  if (license.status !== "ACTIVE") throw new Error(`LICENSE_${license.status}`);
  if (license.expireAt && license.expireAt < new Date()) {
    await prisma.license.update({ where: { id: license.id }, data: { status: "EXPIRED" } });
    throw new Error("LICENSE_EXPIRED");
  }

  // If phone is provided, check it matches
  if (phone && license.phone && license.phone !== phone) {
    throw new Error("LICENSE_PHONE_MISMATCH");
  }

  // If deviceId is provided and license already has one, check it
  if (deviceId && license.deviceId && license.deviceId !== deviceId) {
    throw new Error("LICENSE_DEVICE_MISMATCH");
  }

  return license;
}

export async function bindDevice(token: string, deviceId: string, deviceName?: string, phone?: string) {
  const license = await prisma.license.findUnique({ where: { token } });
  if (!license) throw new Error("LICENSE_NOT_FOUND");
  if (license.status !== "ACTIVE") throw new Error(`LICENSE_${license.status}`);

  // If license already has a device bound and it's different, check device limit
  if (license.deviceId && license.deviceId !== deviceId) {
    const deviceCount = await prisma.device.count({
      where: { userId: license.userId ?? "" },
    });
    if (deviceCount >= license.deviceLimit) {
      throw new Error("DEVICE_LIMIT_REACHED");
    }
  }

  const updated = await prisma.license.update({
    where: { id: license.id },
    data: {
      deviceId,
      deviceName: deviceName ?? license.deviceName,
      phone: phone ?? license.phone,
      lastUsedAt: new Date(),
    },
  });

  // Also create/update device record
  if (license.userId) {
    await prisma.device.upsert({
      where: { userId_deviceId: { userId: license.userId, deviceId } },
      create: {
        deviceId,
        deviceName,
        userId: license.userId,
        isActive: true,
        lastSeenAt: new Date(),
      },
      update: {
        deviceName,
        isActive: true,
        lastSeenAt: new Date(),
      },
    });
  }

  return updated;
}

export async function resetDevice(token: string) {
  const license = await prisma.license.findUnique({ where: { token } });
  if (!license) throw new Error("LICENSE_NOT_FOUND");

  return prisma.license.update({
    where: { id: license.id },
    data: {
      deviceId: null,
      deviceName: null,
    },
  });
}

export async function revokeLicense(token: string) {
  const license = await prisma.license.findUnique({ where: { token } });
  if (!license) throw new Error("LICENSE_NOT_FOUND");

  return prisma.license.update({
    where: { id: license.id },
    data: { status: "REVOKED" },
  });
}

export async function generateLicense(data: {
  dataLimitGB?: number;
  deviceLimit?: number;
  durationDays?: number;
  resellerId?: string;
  createdBy?: string;
  count?: number;
}) {
  const count = data.count ?? 1;
  const licenses = [];

  for (let i = 0; i < count; i++) {
    const token = generateToken();
    const license = await prisma.license.create({
      data: {
        token,
        dataLimitGB: data.dataLimitGB ?? 30,
        deviceLimit: data.deviceLimit ?? 1,
        expireAt: new Date(Date.now() + (data.durationDays ?? 30) * 86400000),
        resellerId: data.resellerId,
        createdBy: data.createdBy,
        status: "ACTIVE",
      },
    });
    licenses.push(license);
  }

  return count === 1 ? licenses[0] : licenses;
}

export async function listLicenses(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.license.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, email: true, username: true } } },
    }),
    prisma.license.count(),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
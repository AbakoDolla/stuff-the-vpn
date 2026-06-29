import bcrypt from "bcryptjs";
import { prisma } from "../prisma/client.js";

export async function createReseller(data: {
  userId?: string;
  username?: string;
  email?: string;
  password?: string;
  name: string;
  commission?: number;
}) {
  let userId = data.userId;

  if (!userId) {
    if (!data.username || !data.email || !data.password) {
      throw new Error("Either userId or username/email/password are required");
    }
    const hashed = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashed,
        role: "RESELLER",
        status: "ACTIVE",
      },
    });
    userId = user.id;
  }

  return prisma.reseller.create({
    data: { userId, name: data.name, commission: data.commission ?? 0 },
    include: { user: { select: { id: true, username: true, email: true, role: true } } },
  });
}

export async function listResellers(page: number, limit: number) {
  const skip = (page - 1) * limit;
  return prisma.reseller.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, username: true, email: true } } },
  });
}

export async function getResellerById(id: string) {
  return prisma.reseller.findUniqueOrThrow({
    where: { id },
    include: { user: { select: { id: true, username: true, email: true, role: true } } },
  });
}

export async function getResellerClients(resellerId: string) {
  const clients = await prisma.user.findMany({
    where: { resellerId },
    select: { id: true, username: true, email: true, status: true, expireAt: true },
  });
  return clients;
}

export async function updateReseller(
  id: string,
  data: Partial<{ name: string; commission: number; balance: number }>,
) {
  return prisma.reseller.update({ where: { id }, data });
}

export async function deleteReseller(id: string) {
  await prisma.reseller.delete({ where: { id } });
}

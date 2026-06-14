import { prisma } from "../prisma/client.js";

export async function createReseller(data: {
  userId: string;
  name: string;
  commission?: number;
}) {
  return prisma.reseller.create({
    data: {
      userId: data.userId,
      name: data.name,
      commission: data.commission ?? 0,
    },
    include: { user: { select: { id: true, username: true, email: true, role: true } } },
  });
}

export async function listResellers(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [resellers, total] = await prisma.$transaction([
    prisma.reseller.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, username: true, email: true } } },
    }),
    prisma.reseller.count(),
  ]);
  return { resellers, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getResellerById(id: string) {
  return prisma.reseller.findUniqueOrThrow({
    where: { id },
    include: { user: { select: { id: true, username: true, email: true, role: true } } },
  });
}

export async function getResellerClients(resellerId: string) {
  const reseller = await prisma.reseller.findUniqueOrThrow({ where: { id: resellerId } });
  const clients = await prisma.voucher.findMany({
    where: { createdBy: reseller.userId },
    include: {
      user: { select: { id: true, username: true, email: true, status: true, expireAt: true } },
    },
  });
  return clients.filter((v) => v.user !== null).map((v) => v.user);
}

export async function updateReseller(id: string, data: Partial<{
  name: string;
  commission: number;
  balance: number;
}>) {
  return prisma.reseller.update({ where: { id }, data });
}

export async function deleteReseller(id: string) {
  await prisma.reseller.delete({ where: { id } });
}

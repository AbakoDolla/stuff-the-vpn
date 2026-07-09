import { prisma } from "../prisma/client.js";
import { generateVoucherCode } from "../utils/crypto.js";

  export async function createVouchers(
    quotaGB: number,
    durationDay: number,
    count: number,
    createdBy: string,
  ) {
    const data = Array.from({ length: count }, () => ({
      code: generateVoucherCode(),
      quotaGB,
      durationDay,
      createdBy,
    }));
    await prisma.voucher.createMany({ data });
    return prisma.voucher.findMany({
      where: { createdBy, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: count,
    });
  }

  export async function listVouchers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    return prisma.voucher.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { username: true, email: true } } },
    });
  }

  export async function redeemVoucher(code: string, userId: string) {
    const voucher = await prisma.voucher.findUnique({ where: { code } });
    if (!voucher) throw new Error("Voucher not found");
    if (voucher.status !== "ACTIVE") throw new Error(`Voucher is ${voucher.status.toLowerCase()}`);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const now = new Date();
    const base = user.expireAt && user.expireAt > now ? user.expireAt : now;
    const newExpiry = new Date(base.getTime() + voucher.durationDay * 86_400_000);

    await prisma.$transaction([
      prisma.voucher.update({
        where: { id: voucher.id },
        data: { status: "USED", usedAt: now, userId },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          quotaRemainingGB: user.quotaRemainingGB + voucher.quotaGB,
          expireAt: newExpiry,
        },
      }),
    ]);

    return prisma.voucher.findUniqueOrThrow({ where: { id: voucher.id } });
  }

  export async function updateVoucher(
    id: string,
    data: Partial<{ status: "ACTIVE" | "USED" | "EXPIRED"; quotaGB: number; durationDay: number }>,
  ) {
    return prisma.voucher.update({ where: { id }, data });
  }

  export async function deleteVoucher(id: string) {
    await prisma.voucher.delete({ where: { id } });
  }
  
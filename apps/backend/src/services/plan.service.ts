import { prisma } from "../prisma/client.js";

export async function createPlan(data: {
  name: string;
  price: number;
  dataLimitGB: number;
  durationDays: number;
  description?: string;
  currency?: string;
  deviceLimit?: number;
  isActive?: boolean;
}) {
  return prisma.plan.create({ data: {
    name: data.name,
    price: data.price,
    dataLimitGB: data.dataLimitGB,
    durationDays: data.durationDays,
    description: data.description,
    currency: data.currency ?? "XAF",
    deviceLimit: data.deviceLimit ?? 1,
    isActive: data.isActive ?? true,
  } });
}

export async function listPlans() {
  return prisma.plan.findMany({ orderBy: { createdAt: "desc" } });
}

export async function listActivePlans() {
  return prisma.plan.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } });
}

export async function getPlanById(id: string) {
  return prisma.plan.findUniqueOrThrow({ where: { id } });
}

export async function updatePlan(id: string, data: Partial<{
  name: string;
  price: number;
  dataLimitGB: number;
  durationDays: number;
  description: string;
  currency: string;
  deviceLimit: number;
  isActive: boolean;
}>) {
  return prisma.plan.update({ where: { id }, data });
}

export async function deletePlan(id: string) {
  await prisma.plan.delete({ where: { id } });
}

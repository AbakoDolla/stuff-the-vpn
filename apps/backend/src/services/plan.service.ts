import { prisma } from "../prisma/client.js";

export async function createPlan(data: {
  name: string;
  price: number;
  quotaGB: number;
  durationDay: number;
  description?: string;
  active?: boolean;
}) {
  return prisma.plan.create({ data });
}

export async function listPlans() {
  return prisma.plan.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getPlanById(id: string) {
  return prisma.plan.findUniqueOrThrow({ where: { id } });
}

export async function updatePlan(id: string, data: Partial<{
  name: string;
  price: number;
  quotaGB: number;
  durationDay: number;
  description: string;
  active: boolean;
}>) {
  return prisma.plan.update({ where: { id }, data });
}

export async function deletePlan(id: string) {
  await prisma.plan.delete({ where: { id } });
}

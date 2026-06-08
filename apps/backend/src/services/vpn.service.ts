import { prisma } from "../prisma/client.js";

export async function getMyConfig(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const inbounds = await prisma.inbound.findMany({ where: { enabled: true } });

  let config = "";

  for (const inbound of inbounds) {
    if (inbound.protocol === "VLESS") {
      config += `vless://${user.id}@${inbound.host}:${inbound.port}?path=${inbound.path}&security=reality&sni=${inbound.sni}&fp=chrome&pbk=${process.env.V2RAY_PUBLIC_KEY}&sid=${user.id.slice(0, 8)}&type=tcp&headerType=none#${inbound.remark}\n`;
    } else if (inbound.protocol === "VMESS") {
      const vmConfig = {
        v: "2",
        ps: inbound.remark,
        add: inbound.host,
        port: inbound.port,
        id: user.id,
        aid: 0,
        net: "tcp",
        type: "none",
        host: "",
        path: "",
        tls: "",
      };
      config += `vmess://${Buffer.from(JSON.stringify(vmConfig)).toString("base64")}\n`;
    } else if (inbound.protocol === "TROJAN") {
      config += `trojan://${user.id}@${inbound.host}:${inbound.port}?sni=${inbound.sni}#${inbound.remark}\n`;
    }
  }

  return config;
}

export async function getServers() {
  return prisma.server.findMany({
    where: { isActive: true },
    orderBy: { ping: "asc" },
    select: {
      id: true,
      name: true,
      host: true,
      port: true,
      country: true,
      city: true,
      flag: true,
      type: true,
      ping: true,
      load: true,
      isRecommended: true,
    },
  });
}

export async function getRecommendedServer() {
  return prisma.server.findFirst({
    where: { isActive: true, isRecommended: true },
    orderBy: { ping: "asc" },
  });
}

export async function getVpnConfig(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const config = await getMyConfig(userId);

  return {
    userId: user.id,
    username: user.username,
    config,
    protocol: "VLESS",
    serverCount: await prisma.inbound.count({ where: { enabled: true } }),
  };
}

export async function getVpnStatus(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const activeSession = await prisma.session.findFirst({
    where: { userId, isActive: true },
    orderBy: { lastUsedAt: "desc" },
  });

  return {
    isConnected: activeSession !== null,
    connectedSince: activeSession?.createdAt ?? null,
    deviceName: activeSession?.deviceName ?? null,
    ipAddress: activeSession?.ipAddress ?? null,
    dataUsed: user.quotaUsedGB,
    dataRemaining: user.quotaRemainingGB,
  };
}

export async function connectVpn(userId: string, serverId?: string) {
  // Log the connection attempt
  await prisma.usageLog.create({
    data: {
      userId,
      serverId: serverId ?? null,
      uploadGB: 0,
      downloadGB: 0,
      totalGB: 0,
    },
  });

  return { status: "connected", message: "VPN connected successfully" };
}

export async function disconnectVpn(userId: string) {
  // Deactivate all active sessions
  await prisma.session.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });

  return { status: "disconnected", message: "VPN disconnected successfully" };
}
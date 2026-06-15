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

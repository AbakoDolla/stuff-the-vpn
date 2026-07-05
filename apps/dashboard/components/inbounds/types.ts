// Types for VPN Inbounds
export interface Inbound {
  id: string;
  protocol: InboundProtocol;
  host: string;
  port: number;
  remark?: string;
  enabled: boolean;
  isPremium: boolean;
  sortOrder: number;
  // Xray stats
  xrayApiPort?: number;
  activeConns: number;
  totalUpGB: number;
  totalDownGB: number;
  // VLESS/VMess/Trojan
  uuid?: string;
  path?: string;
  sni?: string;
  network?: string;
  tls?: boolean;
  pbk?: string;
  sid?: string;
  fp?: string;
  // SSH
  sshUser?: string;
  sshPassword?: string;
  sshPayload?: string;
  // Shadowsocks
  ssMethod?: string;
  ssPassword?: string;
  // WireGuard
  wgPrivateKey?: string;
  wgPublicKey?: string;
  wgPeerKey?: string;
  wgDns?: string;
  wgPreshared?: string;
  // SlowDNS
  slowdnsNs?: string;
  // OpenVPN
  ovpnConfig?: string;
  createdAt: string;
  updatedAt: string;
}

export type InboundProtocol = 
  | 'SSH' | 'SSH_SSL' | 'SSH_WS' | 'SSH_WS_SSL' | 'SSH_SLOWDNS' | 'SSH_PAYLOAD' | 'SSH_PAYLOAD_SSL'
  | 'VLESS' | 'VLESS_REALITY' | 'VMESS' | 'TROJAN' | 'TROJAN_GO'
  | 'SHADOWSOCKS' | 'SHADOWSOCKS_R' | 'WIREGUARD' | 'OPENVPN'
  | 'HYSTERIA2' | 'TUIC' | 'HTTP_PROXY' | 'SOCKS5';

export interface InboundStats {
  activeConns: number;
  totalUpGB: number;
  totalDownGB: number;
  uploadSpeed?: number;
  downloadSpeed?: number;
}

export interface CreateInboundData {
  protocol: InboundProtocol;
  host: string;
  port: number;
  remark?: string;
  enabled?: boolean;
  isPremium?: boolean;
  // Protocol-specific fields
  uuid?: string;
  path?: string;
  sni?: string;
  network?: string;
  tls?: boolean;
  pbk?: string;
  sid?: string;
  fp?: string;
  sshUser?: string;
  sshPassword?: string;
  sshPayload?: string;
  ssMethod?: string;
  ssPassword?: string;
  wgPrivateKey?: string;
  wgPublicKey?: string;
  wgPeerKey?: string;
  wgDns?: string;
  wgPreshared?: string;
  slowdnsNs?: string;
  ovpnConfig?: string;
}

export const PROTOCOL_LABELS: Record<InboundProtocol, string> = {
  SSH: 'SSH',
  SSH_SSL: 'SSH SSL',
  SSH_WS: 'SSH WebSocket',
  SSH_WS_SSL: 'SSH WebSocket SSL',
  SSH_SLOWDNS: 'SSH SlowDNS',
  SSH_PAYLOAD: 'SSH Payload',
  SSH_PAYLOAD_SSL: 'SSH Payload SSL',
  VLESS: 'VLESS',
  VLESS_REALITY: 'VLESS Reality',
  VMESS: 'VMess',
  TROJAN: 'Trojan',
  TROJAN_GO: 'Trojan-Go',
  SHADOWSOCKS: 'Shadowsocks',
  SHADOWSOCKS_R: 'ShadowsocksR',
  WIREGUARD: 'WireGuard',
  OPENVPN: 'OpenVPN',
  HYSTERIA2: 'Hysteria2',
  TUIC: 'TUIC',
  HTTP_PROXY: 'HTTP Proxy',
  SOCKS5: 'SOCKS5',
};

export const PROTOCOL_COLORS: Record<InboundProtocol, string> = {
  SSH: 'bg-blue-500',
  SSH_SSL: 'bg-blue-600',
  SSH_WS: 'bg-blue-400',
  SSH_WS_SSL: 'bg-blue-700',
  SSH_SLOWDNS: 'bg-cyan-500',
  SSH_PAYLOAD: 'bg-indigo-500',
  SSH_PAYLOAD_SSL: 'bg-indigo-600',
  VLESS: 'bg-green-500',
  VLESS_REALITY: 'bg-green-600',
  VMESS: 'bg-emerald-500',
  TROJAN: 'bg-red-500',
  TROJAN_GO: 'bg-red-600',
  SHADOWSOCKS: 'bg-purple-500',
  SHADOWSOCKS_R: 'bg-purple-600',
  WIREGUARD: 'bg-orange-500',
  OPENVPN: 'bg-pink-500',
  HYSTERIA2: 'bg-yellow-500',
  TUIC: 'bg-teal-500',
  HTTP_PROXY: 'bg-gray-500',
  SOCKS5: 'bg-gray-600',
};

export const NETWORK_TYPES = [
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
  { value: 'ws', label: 'WebSocket' },
  { value: 'grpc', label: 'gRPC' },
  { value: 'h2', label: 'HTTP/2' },
  { value: 'quic', label: 'QUIC' },
];

export const TLS_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'tls', label: 'TLS' },
  { value: 'reality', label: 'REALITY' },
];

export const SS_METHODS = [
  'aes-256-gcm',
  'aes-128-gcm',
  'chacha20-poly1305',
  '2022-blake3-aes-256-gcm',
  '2022-blake3-aes-128-gcm',
  '2022-blake3-chacha20-poly1305',
];

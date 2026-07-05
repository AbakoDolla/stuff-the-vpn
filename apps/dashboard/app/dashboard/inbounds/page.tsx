"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, RefreshCw, MoreVertical, Edit2, Trash2, Copy,
  Power, Eye, EyeOff, ToggleLeft, ToggleRight, ChevronDown,
  Server, Users, Activity, Shield, Globe, Zap, AlertCircle,
  CheckCircle, XCircle, ArrowUpDown, Filter, Download, Upload,
  Wifi, WifiOff, Clock, TrendingUp, TrendingDown, X, Menu,
  ShieldCheck, ShieldAlert, Lock, Unlock
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// Types
type InboundProtocol = 
  | 'SSH' | 'SSH_SSL' | 'SSH_WS' | 'SSH_WS_SSL' | 'SSH_SLOWDNS' | 'SSH_PAYLOAD' | 'SSH_PAYLOAD_SSL'
  | 'VLESS' | 'VLESS_REALITY' | 'VMESS' | 'TROJAN' | 'TROJAN_GO'
  | 'SHADOWSOCKS' | 'SHADOWSOCKS_R' | 'WIREGUARD' | 'OPENVPN'
  | 'HYSTERIA2' | 'TUIC' | 'HTTP_PROXY' | 'SOCKS5';

interface Inbound {
  id: string;
  protocol: InboundProtocol;
  host: string;
  port: number;
  remark?: string;
  enabled: boolean;
  isPremium: boolean;
  sortOrder: number;
  xrayApiPort?: number;
  activeConns: number;
  totalUpGB: number;
  totalDownGB: number;
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
  createdAt: string;
  updatedAt: string;
}

interface CreateInboundData {
  protocol: InboundProtocol;
  host: string;
  port: number;
  remark?: string;
  enabled?: boolean;
  isPremium?: boolean;
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

const PROTOCOL_LABELS: Record<InboundProtocol, string> = {
  SSH: 'SSH', SSH_SSL: 'SSH SSL', SSH_WS: 'SSH WebSocket', SSH_WS_SSL: 'SSH WebSocket SSL',
  SSH_SLOWDNS: 'SSH SlowDNS', SSH_PAYLOAD: 'SSH Payload', SSH_PAYLOAD_SSL: 'SSH Payload SSL',
  VLESS: 'VLESS', VLESS_REALITY: 'VLESS Reality', VMESS: 'VMess', TROJAN: 'Trojan', TROJAN_GO: 'Trojan-Go',
  SHADOWSOCKS: 'Shadowsocks', SHADOWSOCKS_R: 'ShadowsocksR', WIREGUARD: 'WireGuard', OPENVPN: 'OpenVPN',
  HYSTERIA2: 'Hysteria2', TUIC: 'TUIC', HTTP_PROXY: 'HTTP Proxy', SOCKS5: 'SOCKS5',
};

const PROTOCOL_COLORS: Record<InboundProtocol, string> = {
  SSH: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  SSH_SSL: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
  SSH_WS: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  SSH_WS_SSL: 'bg-cyan-600/20 text-cyan-300 border-cyan-600/30',
  SSH_SLOWDNS: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  SSH_PAYLOAD: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  SSH_PAYLOAD_SSL: 'bg-indigo-600/20 text-indigo-300 border-indigo-600/30',
  VLESS: 'bg-green-500/20 text-green-400 border-green-500/30',
  VLESS_REALITY: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  VMESS: 'bg-emerald-600/20 text-emerald-300 border-emerald-600/30',
  TROJAN: 'bg-red-500/20 text-red-400 border-red-500/30',
  TROJAN_GO: 'bg-red-600/20 text-red-300 border-red-600/30',
  SHADOWSOCKS: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  SHADOWSOCKS_R: 'bg-purple-600/20 text-purple-300 border-purple-600/30',
  WIREGUARD: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  OPENVPN: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  HYSTERIA2: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  TUIC: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  HTTP_PROXY: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  SOCKS5: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const NETWORK_TYPES = [
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
  { value: 'ws', label: 'WebSocket' },
  { value: 'grpc', label: 'gRPC' },
  { value: 'h2', label: 'HTTP/2' },
  { value: 'quic', label: 'QUIC' },
];

const TLS_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'tls', label: 'TLS' },
  { value: 'reality', label: 'REALITY' },
];

const SS_METHODS = [
  'aes-256-gcm', 'aes-128-gcm', 'chacha20-poly1305',
  '2022-blake3-aes-256-gcm', '2022-blake3-aes-128-gcm', '2022-blake3-chacha20-poly1305',
];

// Protocol Badge
function ProtocolBadge({ protocol }: { protocol: string }) {
  const colorClass = PROTOCOL_COLORS[protocol as InboundProtocol] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${colorClass}`}>
      {PROTOCOL_LABELS[protocol as InboundProtocol] || protocol}
    </span>
  );
}

// Status Indicator
function StatusIndicator({ enabled }: { enabled: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${enabled ? "text-green-400" : "text-gray-500"}`}>
      {enabled ? (
        <div className="relative">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75" />
        </div>
      ) : (
        <div className="w-2 h-2 bg-gray-500 rounded-full" />
      )}
      <span className="text-xs font-medium">{enabled ? "Actif" : "Inactif"}</span>
    </div>
  );
}

// Stats Card
function StatsCard({ title, value, sub, icon: Icon, color }: { title: string; value: string | number; sub?: string; icon: React.ElementType; color: string; }) {
  const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
    blue:   { bg: "from-blue-500/10 to-blue-600/5",   icon: "text-blue-400",   border: "border-blue-500/20" },
    green:  { bg: "from-green-500/10 to-green-600/5", icon: "text-green-400",  border: "border-green-500/20" },
    purple: { bg: "from-purple-500/10 to-purple-600/5", icon: "text-purple-400",  border: "border-purple-500/20" },
    orange: { bg: "from-orange-500/10 to-orange-600/5", icon: "text-orange-400",  border: "border-orange-500/20" },
    red:    { bg: "from-red-500/10 to-red-600/5",     icon: "text-red-400",     border: "border-red-500/20" },
    cyan:   { bg: "from-cyan-500/10 to-cyan-600/5",    icon: "text-cyan-400",    border: "border-cyan-500/20" },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.bg} border ${c.border} p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl bg-white/5 ${c.icon}`}><Icon size={20} /></div>
      </div>
    </motion.div>
  );
}

// Inbound Row
function InboundRow({ inbound, onEdit, onDelete, onToggle, onDuplicate }: { inbound: Inbound; onEdit: (i: Inbound) => void; onDelete: (i: Inbound) => void; onToggle: (i: Inbound) => void; onDuplicate: (i: Inbound) => void; }) {
  const [showMenu, setShowMenu] = useState(false);
  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${inbound.enabled ? "bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20" : "bg-gray-500/10 border border-gray-500/20"}`}>
            {inbound.enabled ? <ShieldCheck size={20} className="text-green-400" /> : <ShieldAlert size={20} className="text-gray-500" />}
          </div>
          <div>
            <p className="font-medium text-white">{inbound.remark || `Inbound #${inbound.id.slice(0, 8)}`}</p>
            <p className="text-xs text-gray-500">{inbound.host}:{inbound.port}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4"><ProtocolBadge protocol={inbound.protocol} /></td>
      <td className="px-4 py-4"><StatusIndicator enabled={inbound.enabled} /></td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="flex items-center gap-1 text-green-400 text-sm"><Upload size={12} /><span className="font-mono text-xs">{(inbound.totalUpGB || 0).toFixed(2)} GB</span></div>
            <div className="text-[10px] text-gray-500">Upload</div>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 text-blue-400 text-sm"><Download size={12} /><span className="font-mono text-xs">{(inbound.totalDownGB || 0).toFixed(2)} GB</span></div>
            <div className="text-[10px] text-gray-500">Download</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4"><div className="flex items-center gap-1"><Users size={14} className="text-gray-500" /><span className="text-white font-medium">{inbound.activeConns || 0}</span></div></td>
      <td className="px-4 py-4">
        {inbound.isPremium ? (
          <span className="px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg text-xs text-yellow-400 font-medium flex items-center gap-1 w-fit"><Zap size={10} /> Premium</span>
        ) : (
          <span className="px-2 py-1 bg-gray-500/10 border border-gray-500/20 rounded-lg text-xs text-gray-400 w-fit">Standard</span>
        )}
      </td>
      <td className="px-4 py-4"><p className="text-xs text-gray-500">{formatDistanceToNow(new Date(inbound.updatedAt), { addSuffix: true, locale: fr })}</p></td>
      <td className="px-4 py-4">
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"><MoreVertical size={16} /></button>
          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-full mt-1 w-48 bg-dark-100 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                <button onClick={() => { onEdit(inbound); setShowMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"><Edit2 size={14} className="text-blue-400" /> Modifier</button>
                <button onClick={() => { onToggle(inbound); setShowMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2">{inbound.enabled ? <Power size={14} className="text-orange-400" /> : <Power size={14} className="text-green-400" />}{inbound.enabled ? "Désactiver" : "Activer"}</button>
                <button onClick={() => { onDuplicate(inbound); setShowMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"><Copy size={14} className="text-purple-400" /> Dupliquer</button>
                <div className="border-t border-white/5" />
                <button onClick={() => { onDelete(inbound); setShowMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"><Trash2 size={14} /> Supprimer</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </td>
    </motion.tr>
  );
}

// Modal
function InboundModal({ inbound, onClose, onSave }: { inbound?: Inbound | null; onClose: () => void; onSave: (data: CreateInboundData) => Promise<void>; }) {
  const [form, setForm] = useState<CreateInboundData>({
    protocol: (inbound?.protocol as InboundProtocol) || "VLESS",
    host: inbound?.host || "0.0.0.0",
    port: inbound?.port || 443,
    remark: inbound?.remark || "",
    enabled: inbound?.enabled ?? true,
    isPremium: inbound?.isPremium ?? false,
    uuid: inbound?.uuid || "",
    path: inbound?.path || "",
    sni: inbound?.sni || "",
    network: inbound?.network || "tcp",
    tls: inbound?.tls ?? true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { await onSave(form); onClose(); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const protocols: InboundProtocol[] = ["VLESS", "VLESS_REALITY", "VMESS", "TROJAN", "TROJAN_GO", "SSH", "SSH_SSL", "SSH_WS", "SSH_WS_SSL", "SSH_SLOWDNS", "SHADOWSOCKS", "SHADOWSOCKS_R", "WIREGUARD", "OPENVPN", "HYSTERIA2", "TUIC", "HTTP_PROXY", "SOCKS5"];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-dark-100 border border-white/10 rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-dark-100/95 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div><h2 className="text-xl font-bold text-white">{inbound ? "Modifier l'Inbound" : "Créer un Inbound"}</h2><p className="text-sm text-gray-500">{inbound ? `Édition de "${inbound.remark || inbound.id}"` : "Configuration d'un nouveau point d'entrée VPN"}</p></div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2">Nom / Remark</label>
              <input type="text" value={form.remark || ""} onChange={e => setForm({ ...form, remark: e.target.value })} placeholder="Mon serveur premium" className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Protocole</label>
              <select value={form.protocol} onChange={e => setForm({ ...form, protocol: e.target.value as InboundProtocol })} className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50">
                {protocols.map(p => (<option key={p} value={p} style={{ background: "#0B0F19" }}>{PROTOCOL_LABELS[p]} ({p})</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Port</label>
              <input type="number" value={form.port} onChange={e => setForm({ ...form, port: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2">Adresse d'écoute</label>
              <input type="text" value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} placeholder="0.0.0.0" className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary/50" />
            </div>
          </div>

          {(form.protocol.includes("VLESS") || form.protocol.includes("VMESS") || form.protocol.includes("TROJAN")) && (
            <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/5">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Shield size={14} /> Paramètres {form.protocol}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">UUID</label>
                  <input type="text" value={form.uuid || ""} onChange={e => setForm({ ...form, uuid: e.target.value })} placeholder="Generated UUID" className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-xl text-white font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Network</label>
                  <select value={form.network || "tcp"} onChange={e => setForm({ ...form, network: e.target.value })} className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50">
                    {NETWORK_TYPES.map(n => (<option key={n.value} value={n.value} style={{ background: "#0B0F19" }}>{n.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">TLS</label>
                  <select value={form.tls ? "tls" : "none"} onChange={e => setForm({ ...form, tls: e.target.value !== "none" })} className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50">
                    {TLS_OPTIONS.map(t => (<option key={t.value} value={t.value} style={{ background: "#0B0F19" }}>{t.label}</option>))}
                  </select>
                </div>
                {form.network === "ws" && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Path</label>
                    <input type="text" value={form.path || ""} onChange={e => setForm({ ...form, path: e.target.value })} placeholder="/vless" className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-xl text-white font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-primary/50" />
                  </div>
                )}
                {form.tls && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">SNI</label>
                    <input type="text" value={form.sni || ""} onChange={e => setForm({ ...form, sni: e.target.value })} placeholder="example.com" className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary/50" />
                  </div>
                )}
              </div>
            </div>
          )}

          {form.protocol.startsWith("SSH") && (
            <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/5">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Server size={14} /> Paramètres SSH</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-400 mb-2">Username</label><input type="text" value={form.sshUser || ""} onChange={e => setForm({ ...form, sshUser: e.target.value })} placeholder="root" className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary/50" /></div>
                <div><label className="block text-sm font-medium text-gray-400 mb-2">Password</label><input type="password" value={form.sshPassword || ""} onChange={e => setForm({ ...form, sshPassword: e.target.value })} placeholder="••••••••" className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary/50" /></div>
              </div>
            </div>
          )}

          {form.protocol.includes("SHADOWSOCKS") && !form.protocol.includes("_R") && (
            <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/5">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Lock size={14} /> Paramètres Shadowsocks</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-400 mb-2">Méthode</label><select value={form.ssMethod || "aes-256-gcm"} onChange={e => setForm({ ...form, ssMethod: e.target.value })} className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50">{SS_METHODS.map(m => (<option key={m} value={m} style={{ background: "#0B0F19" }}>{m}</option>))}</select></div>
                <div><label className="block text-sm font-medium text-gray-400 mb-2">Password</label><input type="password" value={form.ssPassword || ""} onChange={e => setForm({ ...form, ssPassword: e.target.value })} placeholder="••••••••" className="w-full px-4 py-3 bg-dark-50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary/50" /></div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setForm({ ...form, enabled: !form.enabled })} className={`w-12 h-6 rounded-full transition-colors ${form.enabled ? "bg-primary" : "bg-gray-600"}`}><div className={`w-5 h-5 mt-0.5 rounded-full bg-white shadow-lg transform transition-transform ${form.enabled ? "translate-x-6" : "translate-x-0.5"}`} /></div>
              <span className="text-sm text-gray-300">Actif</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setForm({ ...form, isPremium: !form.isPremium })} className={`w-12 h-6 rounded-full transition-colors ${form.isPremium ? "bg-gradient-to-r from-yellow-500 to-orange-500" : "bg-gray-600"}`}><div className={`w-5 h-5 mt-0.5 rounded-full bg-white shadow-lg transform transition-transform ${form.isPremium ? "translate-x-6" : "translate-x-0.5"}`} /></div>
              <span className="text-sm text-gray-300 flex items-center gap-1"><Zap size={12} className="text-yellow-400" /> Premium</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">Annuler</button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-cyan-400 text-black hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50">{loading ? "Enregistrement..." : inbound ? "Enregistrer" : "Créer"}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Main Component
export default function InboundsPage() {
  const [inbounds, setInbounds] = useState<Inbound[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingInbound, setEditingInbound] = useState<Inbound | null>(null);
  const [filterProtocol, setFilterProtocol] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Inbound | null>(null);

  const fetchInbounds = async () => {
    try { setLoading(true); const res = await api.get("/inbounds"); const data = (res.data as any)?.data || res.data || []; setInbounds(Array.isArray(data) ? data : []); }
    catch (err) { console.error("Failed to fetch inbounds:", err); toast.error("Erreur lors du chargement des inbounds"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInbounds(); }, []);

  const handleCreate = async (data: CreateInboundData) => { try { await api.post("/inbounds", data); toast.success("Inbound créé avec succès"); fetchInbounds(); } catch (err: any) { toast.error(err.message || "Erreur lors de la création"); throw err; } };
  const handleUpdate = async (data: CreateInboundData) => { if (!editingInbound) return; try { await api.put(`/inbounds/${editingInbound.id}`, data); toast.success("Inbound mis à jour"); fetchInbounds(); } catch (err: any) { toast.error(err.message || "Erreur lors de la mise à jour"); throw err; } };
  const handleDelete = async (inbound: Inbound) => { try { await api.delete(`/inbounds/${inbound.id}`); toast.success("Inbound supprimé"); fetchInbounds(); } catch (err: any) { toast.error(err.message || "Erreur lors de la suppression"); } setShowDeleteConfirm(null); };
  const handleToggle = async (inbound: Inbound) => { try { await api.put(`/inbounds/${inbound.id}`, { enabled: !inbound.enabled }); toast.success(inbound.enabled ? "Inbound désactivé" : "Inbound activé"); fetchInbounds(); } catch (err: any) { toast.error(err.message || "Erreur"); } };
  const handleDuplicate = (inbound: Inbound) => { setEditingInbound(null); setShowModal(true); };
  const handleEdit = (inbound: Inbound) => { setEditingInbound(inbound); setShowModal(true); };

  const totalConns = inbounds.reduce((sum, i) => sum + (i.activeConns || 0), 0);
  const totalUp = inbounds.reduce((sum, i) => sum + (i.totalUpGB || 0), 0);
  const totalDown = inbounds.reduce((sum, i) => sum + (i.totalDownGB || 0), 0);
  const activeInbounds = inbounds.filter(i => i.enabled).length;
  const protocols = [...new Set(inbounds.map(i => i.protocol))];

  const filtered = inbounds.filter(i => {
    const matchSearch = !search || (i.remark?.toLowerCase().includes(search.toLowerCase())) || (i.host?.includes(search)) || (String(i.port).includes(search));
    const matchProtocol = filterProtocol === "all" || i.protocol === filterProtocol;
    const matchStatus = filterStatus === "all" || (filterStatus === "active" && i.enabled) || (filterStatus === "inactive" && !i.enabled);
    return matchSearch && matchProtocol && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white flex items-center gap-3"><Globe className="text-primary" /> Inbounds VPN</h1><p className="text-sm text-gray-500 mt-1">Gérez vos points d'entrée VPN</p></div>
        <button onClick={() => { setEditingInbound(null); setShowModal(true); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-cyan-400 text-black hover:shadow-lg hover:shadow-primary/25 transition-all"><Plus size={18} /> Nouvel Inbound</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Inbounds" value={inbounds.length} icon={Globe} color="blue" />
        <StatsCard title="Actifs" value={activeInbounds} icon={ShieldCheck} color="green" sub={`${inbounds.length - activeInbounds} inactifs`} />
        <StatsCard title="Connexions" value={totalConns} icon={Users} color="purple" />
        <StatsCard title="Trafic Total" value={`${(totalUp + totalDown).toFixed(1)} GB`} icon={Activity} color="cyan" sub={`↑ ${totalUp.toFixed(1)} GB / ↓ ${totalDown.toFixed(1)} GB`} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder="Rechercher un inbound..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-dark-50 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50" /></div>
        <select value={filterProtocol} onChange={e => setFilterProtocol(e.target.value)} className="px-4 py-2.5 bg-dark-50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-primary/50"><option value="all" style={{ background: "#0B0F19" }}>Tous les protocoles</option>{protocols.map(p => (<option key={p} value={p} style={{ background: "#0B0F19" }}>{PROTOCOL_LABELS[p as InboundProtocol] || p}</option>))}</select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2.5 bg-dark-50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-primary/50"><option value="all" style={{ background: "#0B0F19" }}>Tous les statuts</option><option value="active" style={{ background: "#0B0F19" }}>Actifs</option><option value="inactive" style={{ background: "#0B0F19" }}>Inactifs</option></select>
        <button onClick={fetchInbounds} className="p-2.5 rounded-xl bg-dark-50 border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all" title="Rafraîchir"><RefreshCw size={18} className={loading ? "animate-spin" : ""} /></button>
      </div>

      <div className="bg-dark-50/50 border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="flex flex-col items-center gap-3"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /><p className="text-sm text-gray-500">Chargement...</p></div></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center"><Globe size={48} className="text-gray-600 mb-4" /><h3 className="text-lg font-semibold text-gray-400">Aucun inbound trouvé</h3><p className="text-sm text-gray-500 mt-1">{inbounds.length === 0 ? "Commencez par créer votre premier inbound" : "Modifiez vos filtres"}</p>{inbounds.length === 0 && <button onClick={() => { setEditingInbound(null); setShowModal(true); }} className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-cyan-400 text-black hover:shadow-lg hover:shadow-primary/25 transition-all">Créer un inbound</button>}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5 bg-dark-100/50"><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Inbound</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Protocole</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trafic</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Connexions</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mis à jour</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th></tr></thead>
              <tbody>{filtered.map(inbound => (<InboundRow key={inbound.id} inbound={inbound} onEdit={handleEdit} onDelete={(i) => setShowDeleteConfirm(i)} onToggle={handleToggle} onDuplicate={handleDuplicate} />))}</tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && <div className="flex items-center justify-between text-sm text-gray-500"><p>Affichage de {filtered.length} sur {inbounds.length} inbound(s)</p></div>}

      <AnimatePresence>{showModal && (<InboundModal inbound={editingInbound} onClose={() => { setShowModal(false); setEditingInbound(null); }} onSave={editingInbound ? handleUpdate : handleCreate} />)}</AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-dark-100 border border-white/10 rounded-2xl p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-4 mb-4"><div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center"><AlertCircle size={24} className="text-red-400" /></div><div><h3 className="text-lg font-semibold text-white">Supprimer cet inbound ?</h3><p className="text-sm text-gray-500">{showDeleteConfirm.remark || `Inbound #${showDeleteConfirm.id.slice(0, 8)}`}</p></div></div>
              <p className="text-sm text-gray-400 mb-6">Cette action est irréversible. Toutes les configurations associées seront supprimées.</p>
              <div className="flex items-center justify-end gap-3"><button onClick={() => setShowDeleteConfirm(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">Annuler</button><button onClick={() => handleDelete(showDeleteConfirm)} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-all">Supprimer</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

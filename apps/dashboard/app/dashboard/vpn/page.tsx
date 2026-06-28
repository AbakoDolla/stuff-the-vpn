'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Plus, RefreshCw, Copy, Trash2, Edit, Shield, Wifi, ChevronRight,
  Server, Key, Globe, Lock, Zap, Settings2, X, Check, AlertTriangle,
  Network, Radio, Eye, EyeOff, RotateCcw, Users, Calendar, Gauge
} from 'lucide-react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

// ─── Types ────────────────────────────────────────────────────────────────────

const PROTOCOLS = [
  { id: 'SSH',           label: 'SSH',             group: 'SSH',         icon: '🔐' },
  { id: 'SSH_PAYLOAD',   label: 'SSH + Payload',   group: 'SSH',         icon: '🔐' },
  { id: 'SSH_SSL',       label: 'SSH + SSL',       group: 'SSH',         icon: '🔐' },
  { id: 'SSH_WEBSOCKET', label: 'SSH + WebSocket', group: 'SSH',         icon: '🔐' },
  { id: 'SSH_SLOWDNS',   label: 'SSH + SlowDNS',   group: 'SSH',         icon: '🔐' },
  { id: 'VMESS',         label: 'VMess',           group: 'V2Ray',       icon: '🌐' },
  { id: 'VLESS',         label: 'VLESS',           group: 'V2Ray',       icon: '🌐' },
  { id: 'VLESS_REALITY', label: 'VLESS Reality',   group: 'V2Ray',       icon: '🌐' },
  { id: 'TROJAN',        label: 'Trojan',          group: 'Trojan',      icon: '🎭' },
  { id: 'TROJAN_GO',     label: 'Trojan Go',       group: 'Trojan',      icon: '🎭' },
  { id: 'SHADOWSOCKS',   label: 'Shadowsocks',     group: 'Shadowsocks', icon: '👤' },
  { id: 'SHADOWSOCKS_R', label: 'ShadowsocksR',   group: 'Shadowsocks', icon: '👤' },
  { id: 'WIREGUARD',     label: 'WireGuard',       group: 'WireGuard',   icon: '🔒' },
  { id: 'OPENVPN',       label: 'OpenVPN',         group: 'OpenVPN',     icon: '🛡️' },
  { id: 'HTTP_PROXY',    label: 'HTTP Proxy',      group: 'Proxy',       icon: '🔀' },
  { id: 'SOCKS5',        label: 'SOCKS5',          group: 'Proxy',       icon: '🔀' },
  { id: 'HYSTERIA2',     label: 'Hysteria 2',      group: 'Next-Gen',    icon: '⚡' },
  { id: 'TUIC',          label: 'TUIC',            group: 'Next-Gen',    icon: '⚡' },
] as const;

const PROTOCOL_GROUPS = [...new Set(PROTOCOLS.map(p => p.group))];

const CIPHERS_SS = ['aes-256-gcm','aes-128-gcm','chacha20-poly1305','xchacha20-poly1305','aes-256-cfb','aes-128-cfb'];
const NETWORKS = ['tcp','ws','grpc','h2','quic','kcp'];
const TLS_VERSIONS = ['1.2','1.3'];
const ALPNS = ['http/1.1','h2','h3'];
const FINGERPRINTS = ['chrome','firefox','safari','ios','android','edge','360','qq','random','randomized'];
const PAYLOAD_TYPES = ['GET','POST','CONNECT','WebSocket Upgrade'];

type TemplateData = {
  id: string; name: string; protocol: string; category?: string;
  country?: string; flag?: string; icon?: string; color?: string;
  isActive: boolean; isPremium: boolean; _count: { userProfiles: number };
  tags: string[]; createdAt: string;
};

type Step = 'protocol' | 'general' | 'connection' | 'advanced' | 'review';

// ─── Protocol color ────────────────────────────────────────────────────────────
const protoColor: Record<string, string> = {
  SSH:'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  SSH_PAYLOAD:'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  SSH_SSL:'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  SSH_WEBSOCKET:'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  SSH_SLOWDNS:'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  VMESS:'bg-blue-500/10 text-blue-400 border-blue-500/20',
  VLESS:'bg-blue-500/10 text-blue-400 border-blue-500/20',
  VLESS_REALITY:'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  TROJAN:'bg-amber-500/10 text-amber-400 border-amber-500/20',
  TROJAN_GO:'bg-amber-500/10 text-amber-400 border-amber-500/20',
  SHADOWSOCKS:'bg-purple-500/10 text-purple-400 border-purple-500/20',
  SHADOWSOCKS_R:'bg-purple-500/10 text-purple-400 border-purple-500/20',
  WIREGUARD:'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  OPENVPN:'bg-orange-500/10 text-orange-400 border-orange-500/20',
  HTTP_PROXY:'bg-rose-500/10 text-rose-400 border-rose-500/20',
  SOCKS5:'bg-rose-500/10 text-rose-400 border-rose-500/20',
  HYSTERIA2:'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  TUIC:'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

// ─── Input helpers ─────────────────────────────────────────────────────────────
const F = ({ label, name, form, set, type='text', placeholder='', mono=false, required=false }: {
  label:string; name:string; form: Record<string,unknown>; set:(v:Record<string,unknown>)=>void;
  type?:string; placeholder?:string; mono?:boolean; required?:boolean;
}) => (
  <div>
    <label className="label">{label}{required&&<span className="text-red-400 ml-0.5">*</span>}</label>
    <input className={`input ${mono?'font-mono':''}`} type={type} placeholder={placeholder}
      value={String(form[name]??'')} onChange={e=>set({...form,[name]:e.target.value})} required={required}/>
  </div>
);

const Toggle = ({ label, name, form, set, desc='' }: {
  label:string; name:string; form:Record<string,unknown>; set:(v:Record<string,unknown>)=>void; desc?:string;
}) => (
  <div className="flex items-center justify-between py-2">
    <div><p className="text-sm text-[#F1F5F9]">{label}</p>{desc&&<p className="text-xs text-[#64748B]">{desc}</p>}</div>
    <button type="button" onClick={()=>set({...form,[name]:!form[name]})}
      className={`relative w-10 h-5 rounded-full transition-colors ${form[name]?'bg-[#0099FF]':'bg-[#1E2D45]'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form[name]?'translate-x-5':''}`}/>
    </button>
  </div>
);

const Sel = ({ label, name, form, set, options }: {
  label:string; name:string; form:Record<string,unknown>; set:(v:Record<string,unknown>)=>void; options:string[];
}) => (
  <div>
    <label className="label">{label}</label>
    <select className="input" value={String(form[name]??'')} onChange={e=>set({...form,[name]:e.target.value})}>
      <option value="">— Choisir —</option>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const Secret = ({ label, name, form, set, mono=true }: {
  label:string; name:string; form:Record<string,unknown>; set:(v:Record<string,unknown>)=>void; mono?:boolean;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input className={`input pr-10 ${mono?'font-mono':''}`} type={show?'text':'password'}
          value={String(form[name]??'')} onChange={e=>set({...form,[name]:e.target.value})}/>
        <button type="button" onClick={()=>setShow(v=>!v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#F1F5F9]">
          {show?<EyeOff className="w-3.5 h-3.5"/>:<Eye className="w-3.5 h-3.5"/>}
        </button>
      </div>
    </div>
  );
};

// ─── Protocol-specific config forms ───────────────────────────────────────────

function SSHForm({ cfg, set }: { cfg: Record<string,unknown>; set: (v:Record<string,unknown>)=>void }) {
  return (
    <div className="space-y-4">
      <div className="section-title">Connexion SSH</div>
      <div className="grid grid-cols-2 gap-3">
        <F label="SSH Host" name="sshHost" form={cfg} set={set} mono required/>
        <F label="SSH Port" name="sshPort" form={cfg} set={set} type="number" placeholder="22" required/>
        <F label="Username" name="sshUser" form={cfg} set={set} required/>
        <Secret label="Password" name="sshPassword" form={cfg} set={set}/>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <F label="KeepAlive (s)" name="keepAlive" form={cfg} set={set} type="number" placeholder="30"/>
        <F label="Timeout (s)" name="timeout" form={cfg} set={set} type="number" placeholder="10"/>
        <F label="Max Retry" name="maxRetry" form={cfg} set={set} type="number" placeholder="3"/>
      </div>
      <div className="border-t border-[#1E2D45] pt-3 space-y-1">
        <Toggle label="Compression" name="compression" form={cfg} set={set} desc="Compresser le trafic SSH"/>
        <Toggle label="TCP_NODELAY" name="tcpNodelay" form={cfg} set={set} desc="Désactiver l'algorithme de Nagle"/>
        <Toggle label="Reconnexion automatique" name="autoReconnect" form={cfg} set={set}/>
      </div>
    </div>
  );
}

function SSHPayloadForm({ cfg, set }: { cfg: Record<string,unknown>; set: (v:Record<string,unknown>)=>void }) {
  return (
    <div className="space-y-4">
      <SSHForm cfg={cfg} set={set}/>
      <div className="border-t border-[#1E2D45] pt-4">
        <div className="section-title">Payload</div>
        <div className="grid grid-cols-2 gap-3">
          <Sel label="Type de payload" name="payloadType" form={cfg} set={set} options={PAYLOAD_TYPES}/>
          <F label="Host (HTTP Header)" name="payloadHost" form={cfg} set={set}/>
        </div>
        <div className="mt-3">
          <label className="label">Payload personnalisé</label>
          <textarea className="input font-mono h-24 resize-none text-xs"
            placeholder="GET / HTTP/1.1[crlf]Host: [host][crlf][crlf]"
            value={String(cfg['payload']??'')}
            onChange={e=>set({...cfg,payload:e.target.value})}/>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <F label="Encode (base64/url)" name="payloadEncode" form={cfg} set={set} placeholder="base64"/>
          <div className="flex gap-2 mt-5">
            <button type="button" onClick={()=>set({...cfg,payload:'GET / HTTP/1.1[crlf]Host: [host][crlf]X-Online-Host: [host][crlf]Connection: Keep-Alive[crlf][crlf]'})}
              className="px-3 py-1.5 text-xs rounded-lg bg-[#0099FF]/10 text-[#0099FF] border border-[#0099FF]/20 hover:bg-[#0099FF]/20">GET template</button>
            <button type="button" onClick={()=>set({...cfg,payload:'CONNECT [host]:443 HTTP/1.0[crlf]Host: [host][crlf][crlf]'})}
              className="px-3 py-1.5 text-xs rounded-lg bg-[#0099FF]/10 text-[#0099FF] border border-[#0099FF]/20 hover:bg-[#0099FF]/20">CONNECT</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SSHSlowDNSForm({ cfg, set }: { cfg: Record<string,unknown>; set: (v:Record<string,unknown>)=>void }) {
  return (
    <div className="space-y-4">
      <SSHForm cfg={cfg} set={set}/>
      <div className="border-t border-[#1E2D45] pt-4">
        <div className="section-title">SlowDNS</div>
        <div className="grid grid-cols-2 gap-3">
          <F label="DNS Host" name="slowdnsDnsHost" form={cfg} set={set} placeholder="ns.example.com" mono/>
          <F label="NS Server" name="slowdnsNs" form={cfg} set={set} placeholder="dns.example.com" mono/>
          <F label="SlowDNS Port" name="slowdnsPort" form={cfg} set={set} type="number" placeholder="5300"/>
          <F label="Timeout (s)" name="slowdnsTimeout" form={cfg} set={set} type="number" placeholder="30"/>
          <Secret label="Public Key" name="slowdnsPublicKey" form={cfg} set={set}/>
          <Secret label="Private Key" name="slowdnsPrivateKey" form={cfg} set={set}/>
        </div>
        <Toggle label="Compression" name="slowdnsCompression" form={cfg} set={set}/>
      </div>
    </div>
  );
}

function VLessForm({ cfg, set, protocol }: { cfg: Record<string,unknown>; set: (v:Record<string,unknown>)=>void; protocol: string }) {
  const isReality = protocol === 'VLESS_REALITY';
  return (
    <div className="space-y-4">
      <div className="section-title">VLESS / VMess</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">UUID <span className="text-[#0099FF] text-[10px]">auto-généré</span></label>
          <div className="relative">
            <input className="input font-mono text-xs pr-8" value={String(cfg['uuid']??'')} onChange={e=>set({...cfg,uuid:e.target.value})}/>
            <button type="button" onClick={()=>set({...cfg,uuid:''})} title="Régénérer" className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0099FF]"><RotateCcw className="w-3 h-3"/></button>
          </div>
        </div>
        <F label="AlterID (VMess)" name="alterId" form={cfg} set={set} type="number" placeholder="0"/>
        <F label="Host / IP" name="host" form={cfg} set={set} mono required/>
        <F label="Port" name="port" form={cfg} set={set} type="number" placeholder="443" required/>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Sel label="Transport" name="network" form={cfg} set={set} options={NETWORKS}/>
        <Sel label="Security" name="security" form={cfg} set={set} options={['none','tls','reality']}/>
        <F label="Flow (VLESS)" name="flow" form={cfg} set={set} placeholder="xtls-rprx-vision"/>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <F label="Path (WS/H2)" name="path" form={cfg} set={set} placeholder="/"/>
        <F label="Host Header" name="wsHost" form={cfg} set={set}/>
        <F label="SNI" name="sni" form={cfg} set={set}/>
        <Sel label="Fingerprint" name="fp" form={cfg} set={set} options={FINGERPRINTS}/>
      </div>

      {/* Reality specific */}
      {isReality && (
        <div className="border border-indigo-500/20 rounded-xl p-4 bg-indigo-500/5 space-y-3">
          <p className="text-xs font-semibold text-indigo-400 flex items-center gap-2"><Shield className="w-3.5 h-3.5"/>REALITY</p>
          <div className="grid grid-cols-2 gap-3">
            <Secret label="Public Key (pbk)" name="pbk" form={cfg} set={set}/>
            <Secret label="Private Key (pvk)" name="pvk" form={cfg} set={set}/>
            <F label="Short ID (sid)" name="sid" form={cfg} set={set} mono/>
            <F label="SpiderX" name="spx" form={cfg} set={set} placeholder="/"/>
          </div>
        </div>
      )}

      {/* TLS */}
      <div className="border-t border-[#1E2D45] pt-3">
        <div className="section-title">TLS / SSL</div>
        <div className="grid grid-cols-2 gap-3">
          <Sel label="Version TLS" name="tlsVersion" form={cfg} set={set} options={TLS_VERSIONS}/>
          <Sel label="ALPN" name="alpn" form={cfg} set={set} options={ALPNS}/>
        </div>
        <div className="space-y-1 mt-2">
          <Toggle label="Allow Insecure" name="allowInsecure" form={cfg} set={set} desc="Ignorer les erreurs de certificat"/>
          <Toggle label="TLS Fragment" name="tlsFragment" form={cfg} set={set} desc="Fragmenter les paquets TLS"/>
          <Toggle label="TLS Padding" name="tlsPadding" form={cfg} set={set}/>
        </div>
      </div>

      {/* WebSocket */}
      {cfg['network'] === 'ws' && (
        <div className="border-t border-[#1E2D45] pt-3">
          <div className="section-title">WebSocket</div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Path" name="wsPath" form={cfg} set={set} placeholder="/ws"/>
            <F label="Host Header" name="wsHostHeader" form={cfg} set={set}/>
            <F label="User-Agent" name="wsUserAgent" form={cfg} set={set}/>
            <F label="Origin" name="wsOrigin" form={cfg} set={set}/>
          </div>
          <Toggle label="Early Data" name="wsEarlyData" form={cfg} set={set}/>
          <Toggle label="CDN Mode" name="wsCdn" form={cfg} set={set}/>
        </div>
      )}

      {/* gRPC */}
      {cfg['network'] === 'grpc' && (
        <div className="border-t border-[#1E2D45] pt-3">
          <F label="Service Name (gRPC)" name="grpcServiceName" form={cfg} set={set}/>
          <Toggle label="Multi Mode" name="grpcMultiMode" form={cfg} set={set}/>
        </div>
      )}
    </div>
  );
}

function TrojanForm({ cfg, set }: { cfg: Record<string,unknown>; set: (v:Record<string,unknown>)=>void }) {
  return (
    <div className="space-y-4">
      <div className="section-title">Trojan</div>
      <div className="grid grid-cols-2 gap-3">
        <F label="Host / IP" name="host" form={cfg} set={set} mono required/>
        <F label="Port" name="port" form={cfg} set={set} type="number" placeholder="443" required/>
        <Secret label="Password <span class='text-[10px] text-amber-400'>auto-généré</span>" name="password" form={cfg} set={set}/>
        <F label="Flow" name="flow" form={cfg} set={set} placeholder="xtls-rprx-vision"/>
        <F label="SNI" name="sni" form={cfg} set={set}/>
        <Sel label="ALPN" name="alpn" form={cfg} set={set} options={ALPNS}/>
        <Sel label="Fingerprint" name="fp" form={cfg} set={set} options={FINGERPRINTS}/>
        <Sel label="Transport" name="network" form={cfg} set={set} options={NETWORKS}/>
      </div>
      <Toggle label="Allow Insecure" name="allowInsecure" form={cfg} set={set}/>
    </div>
  );
}

function ShadowsocksForm({ cfg, set }: { cfg: Record<string,unknown>; set: (v:Record<string,unknown>)=>void }) {
  return (
    <div className="space-y-4">
      <div className="section-title">Shadowsocks</div>
      <div className="grid grid-cols-2 gap-3">
        <F label="Host / IP" name="host" form={cfg} set={set} mono required/>
        <F label="Port" name="port" form={cfg} set={set} type="number" placeholder="8388" required/>
        <Sel label="Cipher" name="cipher" form={cfg} set={set} options={CIPHERS_SS}/>
        <Secret label="Password <span class='text-[10px] text-amber-400'>auto-généré</span>" name="password" form={cfg} set={set}/>
        <F label="Plugin" name="plugin" form={cfg} set={set} placeholder="v2ray-plugin / obfs-local"/>
        <F label="Plugin Options" name="pluginOpts" form={cfg} set={set} placeholder="obfs=http;obfs-host=…"/>
      </div>
      <div className="flex gap-4 mt-2">
        <Toggle label="TCP" name="tcp" form={cfg} set={set}/>
        <Toggle label="UDP" name="udp" form={cfg} set={set}/>
      </div>
    </div>
  );
}

function WireGuardForm({ cfg, set }: { cfg: Record<string,unknown>; set: (v:Record<string,unknown>)=>void }) {
  return (
    <div className="space-y-4">
      <div className="section-title">WireGuard <span className="text-[10px] text-amber-400 ml-1">clés auto-générées</span></div>
      <div className="grid grid-cols-2 gap-3">
        <Secret label="Private Key" name="privateKey" form={cfg} set={set}/>
        <Secret label="Public Key" name="publicKey" form={cfg} set={set}/>
        <Secret label="Pre-Shared Key" name="presharedKey" form={cfg} set={set}/>
        <F label="Endpoint" name="endpoint" form={cfg} set={set} mono placeholder="vpn.example.com:51820" required/>
        <F label="DNS" name="dns" form={cfg} set={set} placeholder="1.1.1.1, 8.8.8.8"/>
        <F label="MTU" name="mtu" form={cfg} set={set} type="number" placeholder="1420"/>
        <F label="Allowed IPs" name="allowedIps" form={cfg} set={set} placeholder="0.0.0.0/0"/>
        <F label="Persistent KeepAlive" name="persistentKeepalive" form={cfg} set={set} type="number" placeholder="25"/>
      </div>
    </div>
  );
}

function OpenVPNForm({ cfg, set }: { cfg: Record<string,unknown>; set: (v:Record<string,unknown>)=>void }) {
  return (
    <div className="space-y-4">
      <div className="section-title">OpenVPN <span className="text-[10px] text-amber-400 ml-1">certificats auto-générés</span></div>
      <div className="grid grid-cols-2 gap-3">
        <F label="Remote (host)" name="remote" form={cfg} set={set} mono required/>
        <F label="Port" name="port" form={cfg} set={set} type="number" placeholder="1194" required/>
        <Sel label="Protocole" name="protocol" form={cfg} set={set} options={['udp','tcp']}/>
        <Sel label="Cipher" name="cipher" form={cfg} set={set} options={['AES-256-GCM','AES-128-GCM','AES-256-CBC']}/>
        <Sel label="Auth" name="auth" form={cfg} set={set} options={['SHA512','SHA256','SHA1']}/>
        <F label="DNS" name="dns" form={cfg} set={set} placeholder="8.8.8.8"/>
      </div>
      <div>
        <label className="label">CA Certificate</label>
        <textarea className="input font-mono h-24 resize-none text-xs" placeholder="-----BEGIN CERTIFICATE-----…" value={String(cfg['ca']??'')} onChange={e=>set({...cfg,ca:e.target.value})}/>
      </div>
      <div>
        <label className="label">TLS Auth / TLS Crypt</label>
        <textarea className="input font-mono h-16 resize-none text-xs" placeholder="-----BEGIN OpenVPN Static key V1-----…" value={String(cfg['tlsAuth']??'')} onChange={e=>set({...cfg,tlsAuth:e.target.value})}/>
      </div>
      <Toggle label="Compression (LZ4)" name="compression" form={cfg} set={set}/>
    </div>
  );
}

function ProxyForm({ cfg, set, protocol }: { cfg: Record<string,unknown>; set: (v:Record<string,unknown>)=>void; protocol: string }) {
  return (
    <div className="space-y-4">
      <div className="section-title">{protocol === 'HTTP_PROXY' ? 'HTTP / HTTPS Proxy' : 'SOCKS5'}</div>
      <div className="grid grid-cols-2 gap-3">
        <F label="Proxy Host" name="proxyHost" form={cfg} set={set} mono required/>
        <F label="Port" name="proxyPort" form={cfg} set={set} type="number" required/>
        <F label="Username" name="proxyUser" form={cfg} set={set}/>
        <Secret label="Password" name="proxyPassword" form={cfg} set={set}/>
        <F label="DNS via Proxy" name="proxyDns" form={cfg} set={set} placeholder="8.8.8.8"/>
      </div>
      <Toggle label="Proxy Authentication" name="proxyAuth" form={cfg} set={set}/>
      <Toggle label="Rotation de proxy" name="proxyRotation" form={cfg} set={set} desc="Alterner entre plusieurs proxies"/>
    </div>
  );
}

function HysteriaForm({ cfg, set }: { cfg: Record<string,unknown>; set: (v:Record<string,unknown>)=>void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0"/>
        <p className="text-xs">Hysteria 2 — Architecture réservée. Activation manuelle requise sur le serveur.</p>
      </div>
      <div className="section-title">Hysteria 2</div>
      <div className="grid grid-cols-2 gap-3">
        <F label="Server Address" name="server" form={cfg} set={set} mono required/>
        <F label="Port" name="port" form={cfg} set={set} type="number" placeholder="443" required/>
        <Secret label="Auth Password" name="authPassword" form={cfg} set={set}/>
        <F label="SNI" name="sni" form={cfg} set={set}/>
        <F label="Up (Mbps)" name="upMbps" form={cfg} set={set} type="number"/>
        <F label="Down (Mbps)" name="downMbps" form={cfg} set={set} type="number"/>
      </div>
      <Toggle label="Allow Insecure" name="allowInsecure" form={cfg} set={set}/>
    </div>
  );
}

// ─── Config form dispatcher ────────────────────────────────────────────────────
function ProtocolConfigForm({ protocol, cfg, set }: { protocol: string; cfg: Record<string,unknown>; set: (v:Record<string,unknown>)=>void }) {
  switch (protocol) {
    case 'SSH':         return <SSHForm cfg={cfg} set={set}/>;
    case 'SSH_SSL':     return <SSHForm cfg={cfg} set={set}/>;
    case 'SSH_PAYLOAD': return <SSHPayloadForm cfg={cfg} set={set}/>;
    case 'SSH_WEBSOCKET': return <SSHPayloadForm cfg={cfg} set={set}/>;
    case 'SSH_SLOWDNS': return <SSHSlowDNSForm cfg={cfg} set={set}/>;
    case 'VMESS':
    case 'VLESS':
    case 'VLESS_REALITY': return <VLessForm cfg={cfg} set={set} protocol={protocol}/>;
    case 'TROJAN':
    case 'TROJAN_GO':   return <TrojanForm cfg={cfg} set={set}/>;
    case 'SHADOWSOCKS':
    case 'SHADOWSOCKS_R': return <ShadowsocksForm cfg={cfg} set={set}/>;
    case 'WIREGUARD':   return <WireGuardForm cfg={cfg} set={set}/>;
    case 'OPENVPN':     return <OpenVPNForm cfg={cfg} set={set}/>;
    case 'HTTP_PROXY':
    case 'SOCKS5':      return <ProxyForm cfg={cfg} set={set} protocol={protocol}/>;
    case 'HYSTERIA2':
    case 'TUIC':        return <HysteriaForm cfg={cfg} set={set}/>;
    default:            return <p className="text-sm text-[#64748B] py-4">Configuration spécifique à ce protocole bientôt disponible.</p>;
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VpnManagerPage() {
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState<Step>('protocol');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [generatingKeys, setGeneratingKeys] = useState(false);
  const [filterProto, setFilterProto] = useState('');

  // Form state
  const [selectedProtocol, setSelectedProtocol] = useState('');
  const [meta, setMeta] = useState<Record<string,unknown>>({ isActive: true, isPremium: false, name: '', category: '', country: '', flag: '', icon: '', color: '#0099FF', tags: [], notes: '' });
  const [cfg, setCfg] = useState<Record<string,unknown>>({});
  const [access, setAccess] = useState<Record<string,unknown>>({ quotaGB: 100, durationDays: 30, deviceLimit: 1, maxSpeedMbps: null });

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/vpn-templates'); setTemplates(r.data.data ?? []); }
    catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetWizard = () => {
    setStep('protocol'); setSelectedProtocol(''); setMeta({ isActive: true, isPremium: false, name: '', tags: [] });
    setCfg({}); setAccess({ quotaGB: 100, durationDays: 30, deviceLimit: 1 }); setError('');
  };

  const openWizard = () => { resetWizard(); setShowWizard(true); };

  const handleProtocolSelect = async (proto: string) => {
    setSelectedProtocol(proto);
    setGeneratingKeys(true);
    try {
      const r = await api.post('/vpn-templates/generate-keys', { protocol: proto });
      setCfg(r.data.data ?? {});
    } catch {
      setCfg({});
    } finally {
      setGeneratingKeys(false);
    }
    setStep('general');
  };

  const handleSubmit = async () => {
    setSaving(true); setError('');
    try {
      await api.post('/vpn-templates', {
        ...meta, protocol: selectedProtocol,
        rawConfig: cfg,
        tags: Array.isArray(meta.tags) ? meta.tags : [],
      });
      setShowWizard(false);
      await load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur lors de la création');
    } finally { setSaving(false); }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Supprimer ce template ?')) return;
    try { await api.delete(`/vpn-templates/${id}`); await load(); } catch {}
  };

  const duplicateTemplate = async (id: string) => {
    try { await api.post(`/vpn-templates/${id}/duplicate`); await load(); } catch {}
  };

  const filtered = filterProto ? templates.filter(t => t.protocol === filterProto) : templates;
  const protoInfo = (p: string) => PROTOCOLS.find(x => x.id === p);
  const steps: { key: Step; label: string }[] = [
    { key: 'protocol', label: 'Protocole' },
    { key: 'general', label: 'Général' },
    { key: 'connection', label: 'Connexion' },
    { key: 'advanced', label: 'Accès' },
    { key: 'review', label: 'Révision' },
  ];
  const stepIdx = steps.findIndex(s => s.key === step);

  return (
    <DashboardLayout>
      <style>{`.section-title{@apply text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3;}`}</style>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#F1F5F9]">Gestionnaire VPN</h1>
            <p className="text-sm text-[#64748B]">{templates.length} templates · {templates.filter(t=>t.isActive).length} actifs</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-2 rounded-lg bg-[#0F1629] border border-[#1E2D45] text-[#64748B] hover:text-[#F1F5F9]">
              <RefreshCw className="w-4 h-4"/>
            </button>
            <button onClick={openWizard} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
              <Plus className="w-4 h-4"/> Nouveau profil VPN
            </button>
          </div>
        </div>

        {/* Protocol filter */}
        <div className="flex flex-wrap gap-2">
          <button onClick={()=>setFilterProto('')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${!filterProto?'bg-[#0099FF]/20 text-[#0099FF] border-[#0099FF]/40':'bg-[#0F1629] text-[#64748B] border-[#1E2D45] hover:text-[#94A3B8]'}`}>
            Tous ({templates.length})
          </button>
          {PROTOCOL_GROUPS.map(g => {
            const protos = PROTOCOLS.filter(p => p.group === g);
            const count = templates.filter(t => protos.some(p => p.id === t.protocol)).length;
            if (count === 0) return null;
            return (
              <button key={g} onClick={()=>setFilterProto(protos[0]!.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterProto===protos[0]?.id?'bg-[#0099FF]/20 text-[#0099FF] border-[#0099FF]/40':'bg-[#0F1629] text-[#64748B] border-[#1E2D45] hover:text-[#94A3B8]'}`}>
                {g} ({count})
              </button>
            );
          })}
        </div>

        {/* Templates grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_,i)=><div key={i} className="card animate-pulse h-40 bg-[#0A0F1C]"/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center py-16">
            <Wifi className="w-12 h-12 text-[#1E2D45] mb-4"/>
            <p className="text-[#64748B] text-sm mb-4">Aucun template VPN configuré</p>
            <button onClick={openWizard} className="btn-primary px-4 py-2 text-sm">Créer le premier profil</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(t => {
              const p = protoInfo(t.protocol);
              const pc = protoColor[t.protocol] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20';
              return (
                <div key={t.id} className="card group relative overflow-hidden hover:border-[#0099FF]/30 transition-colors">
                  {t.isActive && <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#0099FF]/40 to-transparent"/>}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#060D1A] flex items-center justify-center text-base">{p?.icon ?? '🌐'}</div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#F1F5F9] leading-tight">{t.name}</h3>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${pc}`}>{t.protocol.replace(/_/g,' ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {t.isPremium && <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full">PRO</span>}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${t.isActive?'bg-emerald-500/10 text-emerald-400':'bg-red-500/10 text-red-400'}`}>
                        {t.isActive?'ACTIF':'INACTIF'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    {t.flag && <span className="text-lg">{t.flag}</span>}
                    {t.country && <span className="text-xs text-[#64748B]">{t.country}</span>}
                    <span className="ml-auto flex items-center gap-1 text-xs text-[#64748B]">
                      <Users className="w-3 h-3"/>  {t._count.userProfiles}
                    </span>
                  </div>

                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="flex-1 py-1.5 text-xs rounded-lg bg-[#0099FF]/10 text-[#0099FF] border border-[#0099FF]/20 hover:bg-[#0099FF]/20 flex items-center justify-center gap-1">
                      <Edit className="w-3 h-3"/> Modifier
                    </button>
                    <button onClick={()=>duplicateTemplate(t.id)} className="p-1.5 rounded-lg bg-[#0F1629] border border-[#1E2D45] text-[#64748B] hover:text-[#F1F5F9]">
                      <Copy className="w-3 h-3"/>
                    </button>
                    <button onClick={()=>deleteTemplate(t.id)} className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300">
                      <Trash2 className="w-3 h-3"/>
                    </button>
                  </div>
                  <div className="mt-2 text-[10px] text-[#1E2D45]">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── WIZARD MODAL ─────────────────────────────────────────────────────── */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A0F1C] border border-[#1E2D45] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">

            {/* Wizard header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2D45]">
              <div>
                <h2 className="text-base font-bold text-[#F1F5F9]">
                  {step === 'protocol' ? 'Choisir le protocole' : `Nouveau profil VPN${selectedProtocol ? ` — ${protoInfo(selectedProtocol)?.label}` : ''}`}
                </h2>
                {step !== 'protocol' && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {steps.slice(1).map((s, i) => (
                      <div key={s.key} className="flex items-center gap-1">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border transition-colors ${
                          stepIdx > i+1 ? 'bg-emerald-500 border-emerald-500 text-white' :
                          stepIdx === i+1 ? 'bg-[#0099FF] border-[#0099FF] text-white' :
                          'bg-[#0F1629] border-[#1E2D45] text-[#64748B]'
                        }`}>
                          {stepIdx > i+1 ? <Check className="w-2.5 h-2.5"/> : i+1}
                        </div>
                        <span className={`text-[10px] ${stepIdx === i+1 ? 'text-[#0099FF]' : 'text-[#64748B]'}`}>{s.label}</span>
                        {i < 3 && <ChevronRight className="w-2.5 h-2.5 text-[#1E2D45]"/>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={()=>{ setShowWizard(false); resetWizard(); }} className="p-1.5 rounded-lg text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#141C2E]">
                <X className="w-4 h-4"/>
              </button>
            </div>

            {/* Wizard body */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* STEP 1 — Protocol selection */}
              {step === 'protocol' && (
                <div>
                  {generatingKeys && (
                    <div className="flex items-center justify-center py-8 gap-3">
                      <div className="w-5 h-5 border-2 border-[#0099FF] border-t-transparent rounded-full animate-spin"/>
                      <p className="text-sm text-[#64748B]">Génération des clés…</p>
                    </div>
                  )}
                  {!generatingKeys && PROTOCOL_GROUPS.map(group => (
                    <div key={group} className="mb-6">
                      <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">{group}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {PROTOCOLS.filter(p => p.group === group).map(p => (
                          <button key={p.id} onClick={() => handleProtocolSelect(p.id)}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-95 ${
                              selectedProtocol === p.id
                                ? 'bg-[#0099FF]/10 border-[#0099FF]/40 text-[#0099FF]'
                                : 'bg-[#0F1629] border-[#1E2D45] text-[#94A3B8] hover:border-[#0099FF]/20 hover:text-[#F1F5F9]'
                            } ${(p.id === 'HYSTERIA2' || p.id === 'TUIC') ? 'opacity-70' : ''}`}>
                            <span className="text-base">{p.icon}</span>
                            <span className="text-xs font-medium">{p.label}</span>
                            {(p.id === 'HYSTERIA2' || p.id === 'TUIC') && (
                              <span className="ml-auto text-[9px] text-amber-400 border border-amber-500/20 px-1 rounded">BIENTÔT</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* STEP 2 — General info */}
              {step === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <F label="Nom du profil" name="name" form={meta} set={setMeta} required/>
                    <F label="Catégorie" name="category" form={meta} set={setMeta} placeholder="Premium, Free, Test…"/>
                    <F label="Pays" name="country" form={meta} set={setMeta} placeholder="France"/>
                    <F label="Ville" name="city" form={meta} set={setMeta} placeholder="Paris"/>
                    <F label="Drapeau (emoji)" name="flag" form={meta} set={setMeta} placeholder="🇫🇷"/>
                    <F label="Icône (emoji/URL)" name="icon" form={meta} set={setMeta} placeholder="🌐"/>
                    <F label="Couleur" name="color" form={meta} set={setMeta} type="color"/>
                    <F label="Auteur" name="author" form={meta} set={setMeta}/>
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea className="input h-20 resize-none" value={String(meta.description??'')} onChange={e=>setMeta(m=>({...m,description:e.target.value}))}/>
                  </div>
                  <div>
                    <label className="label">Notes internes</label>
                    <textarea className="input h-16 resize-none text-xs" value={String(meta.notes??'')} onChange={e=>setMeta(m=>({...m,notes:e.target.value}))}/>
                  </div>
                  <div className="flex gap-4">
                    <Toggle label="Actif" name="isActive" form={meta} set={setMeta}/>
                    <Toggle label="Premium" name="isPremium" form={meta} set={setMeta}/>
                  </div>
                </div>
              )}

              {/* STEP 3 — Protocol config */}
              {step === 'connection' && (
                <ProtocolConfigForm protocol={selectedProtocol} cfg={cfg} set={setCfg}/>
              )}

              {/* STEP 4 — Access control */}
              {step === 'advanced' && (
                <div className="space-y-4">
                  <p className="text-xs text-[#64748B]">Ces valeurs définissent les limites par défaut pour les profils assignés à ce template.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <F label="Quota (GB)" name="quotaGB" form={access} set={setAccess} type="number" placeholder="100"/>
                    <F label="Durée (jours)" name="durationDays" form={access} set={setAccess} type="number" placeholder="30"/>
                    <F label="Appareils max" name="deviceLimit" form={access} set={setAccess} type="number" placeholder="1"/>
                    <F label="Vitesse max (Mbps)" name="maxSpeedMbps" form={access} set={setAccess} type="number" placeholder="illimitée"/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Activation planifiée</label><input type="datetime-local" className="input" value={String(meta.scheduledAt??'')} onChange={e=>setMeta(m=>({...m,scheduledAt:e.target.value}))}/></div>
                    <div><label className="label">Expiration planifiée</label><input type="datetime-local" className="input" value={String(meta.scheduledExpireAt??'')} onChange={e=>setMeta(m=>({...m,scheduledExpireAt:e.target.value}))}/></div>
                  </div>
                </div>
              )}

              {/* STEP 5 — Review */}
              {step === 'review' && (
                <div className="space-y-4">
                  <div className="bg-[#060D1A] rounded-xl border border-[#1E2D45] p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{String(meta.flag||protoInfo(selectedProtocol)?.icon||'🌐')}</div>
                      <div>
                        <h3 className="font-bold text-[#F1F5F9]">{String(meta.name||'—')}</h3>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${protoColor[selectedProtocol]??''}`}>{selectedProtocol.replace(/_/g,' ')}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                      {[
                        ['Pays', meta.country], ['Ville', meta.city], ['Catégorie', meta.category],
                        ['Quota', `${access.quotaGB ?? '—'} GB`], ['Durée', `${access.durationDays ?? '—'} jours`],
                        ['Appareils', access.deviceLimit], ['Vitesse max', access.maxSpeedMbps ? `${access.maxSpeedMbps} Mbps` : 'Illimitée'],
                        ['Statut', meta.isActive ? '🟢 Actif' : '🔴 Inactif'], ['Type', meta.isPremium ? '⭐ Premium' : 'Standard'],
                      ].map(([k,v])=>v?(
                        <div key={k as string}><span className="text-[#64748B]">{k} : </span><span className="text-[#94A3B8]">{v as string}</span></div>
                      ):null)}
                    </div>
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex gap-2">
                    <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5"/>
                    <div className="text-xs text-amber-300">
                      <p className="font-semibold mb-1">Sécurité — Distribution chiffrée</p>
                      <p>La configuration sera chiffrée avec AES-256-GCM avant d'être stockée. Les clients ne verront jamais l'hôte, les credentials, les clés ou les certificats.</p>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0"/>
                      <p className="text-xs text-red-300">{error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Wizard footer */}
            <div className="px-6 py-4 border-t border-[#1E2D45] flex items-center justify-between">
              <button
                onClick={() => {
                  if (step === 'general') setStep('protocol');
                  else if (step === 'connection') setStep('general');
                  else if (step === 'advanced') setStep('connection');
                  else if (step === 'review') setStep('advanced');
                }}
                className={`px-4 py-2 rounded-lg border border-[#1E2D45] text-[#64748B] hover:text-[#F1F5F9] text-sm transition-colors ${step === 'protocol' ? 'invisible' : ''}`}>
                Retour
              </button>

              <div className="flex gap-3">
                {step !== 'review' && step !== 'protocol' && (
                  <button
                    onClick={() => {
                      if (step === 'general') setStep('connection');
                      else if (step === 'connection') setStep('advanced');
                      else if (step === 'advanced') setStep('review');
                    }}
                    disabled={step === 'general' && !meta.name}
                    className="btn-primary px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-50">
                    Suivant <ChevronRight className="w-4 h-4"/>
                  </button>
                )}
                {step === 'review' && (
                  <button onClick={handleSubmit} disabled={saving} className="btn-primary px-6 py-2 text-sm flex items-center gap-2 disabled:opacity-50">
                    {saving ? (<><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"/> Création…</>)
                      : (<><Check className="w-4 h-4"/> Créer le profil</>)}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

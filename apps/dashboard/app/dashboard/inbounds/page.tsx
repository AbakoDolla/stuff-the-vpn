'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, endpoints } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Globe, Trash2, Edit, Eye, EyeOff, RefreshCw } from 'lucide-react';

const PROTOCOLS = [
  'VLESS', 'VLESS_REALITY', 'VMESS', 'TROJAN', 'TROJAN_GO',
  'SHADOWSOCKS', 'SSH', 'SSH_PAYLOAD', 'SSH_SSL', 'SSH_WEBSOCKET',
  'WIREGUARD', 'OPENVPN', 'HTTP_PROXY', 'SOCKS5', 'HYSTERIA2', 'TUIC'
];

const PROTOCOL_COLORS: Record<string, string> = {
  VLESS: 'blue', VLESS_REALITY: 'indigo', VMESS: 'violet',
  TROJAN: 'rose', TROJAN_GO: 'pink',
  SHADOWSOCKS: 'orange', SSH: 'yellow', SSH_PAYLOAD: 'yellow',
  SSH_SSL: 'amber', SSH_WEBSOCKET: 'amber', SSH_SLOWDNS: 'amber',
  WIREGUARD: 'green', OPENVPN: 'teal', HYSTERIA2: 'cyan', TUIC: 'sky',
};

interface Inbound {
  id: string; remark: string; protocol: string; host: string; port: number;
  enabled: boolean; isPremium: boolean; activeConns?: number;
  totalUpGB: number; totalDownGB: number; sortOrder: number;
}

const INITIAL_FORM = {
  remark: '', protocol: 'VLESS', host: '', port: 443,
  uuid: '', path: '', sni: '', network: 'tcp', tls: false,
  pbk: '', sid: '', fp: 'chrome',
  sshUser: '', sshPassword: '', sshPayload: '',
  ssMethod: 'aes-256-gcm', ssPassword: '',
  wgPublicKey: '', wgPrivateKey: '', wgDns: '1.1.1.1,8.8.8.8',
  ovpnConfig: '',
  isPremium: false, enabled: true, sortOrder: 0,
};

export default function InboundsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['inbounds'],
    queryFn: () => api.get(endpoints.inbounds.list).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof INITIAL_FORM) => api.post(endpoints.inbounds.create, body),
    onSuccess: () => {
      toast.success('Inbound créé avec succès');
      qc.invalidateQueries({ queryKey: ['inbounds'] });
      setShowForm(false);
      setForm(INITIAL_FORM);
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message ?? 'Erreur création'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(endpoints.inbounds.delete(id)),
    onSuccess: () => { toast.success('Inbound supprimé'); qc.invalidateQueries({ queryKey: ['inbounds'] }); },
    onError: () => toast.error('Erreur suppression'),
  });

  const inbounds: Inbound[] = data?.data ?? [];
  const isSSH = form.protocol.startsWith('SSH');
  const isVless = form.protocol.includes('VLESS');
  const isVmess = form.protocol === 'VMESS';
  const isTrojan = form.protocol.startsWith('TROJAN');
  const isSS = form.protocol === 'SHADOWSOCKS';
  const isWG = form.protocol === 'WIREGUARD';
  const isOVPN = form.protocol === 'OPENVPN';

  function F(key: string, value: string | number | boolean) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Inbounds VPN</h1>
          <p className="text-sm text-[#64748B]">Points d&apos;entrée multi-protocoles</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="btn-ghost flex items-center gap-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-xs">
            <Plus className="w-4 h-4" /> Nouvel inbound
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-sm">Créer un inbound</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-[#94A3B8] mb-1 block">Nom / Remark *</label>
              <input className="input" placeholder="🇫🇷 France VLESS" value={form.remark} onChange={e => F('remark', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-[#94A3B8] mb-1 block">Protocole *</label>
              <select className="input" value={form.protocol} onChange={e => F('protocol', e.target.value)}>
                {PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#94A3B8] mb-1 block">Hôte / IP *</label>
              <input className="input" placeholder="vpn.example.com" value={form.host} onChange={e => F('host', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-[#94A3B8] mb-1 block">Port *</label>
              <input className="input" type="number" value={form.port} onChange={e => F('port', Number(e.target.value))} />
            </div>

            {/* V2Ray fields */}
            {(isVless || isVmess) && <>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1 block">UUID</label>
                <input className="input" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={form.uuid} onChange={e => F('uuid', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1 block">Network</label>
                <select className="input" value={form.network} onChange={e => F('network', e.target.value)}>
                  {['tcp','ws','grpc','h2','quic'].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1 block">SNI / Host</label>
                <input className="input" placeholder="cdn.cloudflare.com" value={form.sni} onChange={e => F('sni', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1 block">Path (WebSocket)</label>
                <input className="input" placeholder="/ws" value={form.path} onChange={e => F('path', e.target.value)} />
              </div>
            </>}

            {/* VLESS Reality */}
            {isVless && form.protocol === 'VLESS_REALITY' && <>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1 block">Public Key (Reality)</label>
                <input className="input" placeholder="pbk..." value={form.pbk} onChange={e => F('pbk', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1 block">Short ID</label>
                <input className="input" placeholder="sid..." value={form.sid} onChange={e => F('sid', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1 block">Fingerprint</label>
                <select className="input" value={form.fp} onChange={e => F('fp', e.target.value)}>
                  {['chrome','firefox','safari','ios','android','edge'].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </>}

            {/* Trojan */}
            {isTrojan && <>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1 block">Password</label>
                <input className="input" type="password" value={form.sshPassword} onChange={e => F('sshPassword', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1 block">SNI</label>
                <input className="input" placeholder="example.com" value={form.sni} onChange={e => F('sni', e.target.value)} />
              </div>
            </>}

            {/* SSH */}
            {isSSH && <>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1 block">Utilisateur SSH</label>
                <input className="input" placeholder="root" value={form.sshUser} onChange={e => F('sshUser', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1 block">Mot de passe SSH</label>
                <input className="input" type="password" value={form.sshPassword} onChange={e => F('sshPassword', e.target.value)} />
              </div>
              {form.protocol !== 'SSH' && (
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1 block">Payload / Bug Host</label>
                  <input className="input" placeholder="GET / HTTP/1.1..." value={form.sshPayload} onChange={e => F('sshPayload', e.target.value)} />
                </div>
              )}
            </>}

            {/* Shadowsocks */}
            {isSS && <>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1 block">Méthode</label>
                <select className="input" value={form.ssMethod} onChange={e => F('ssMethod', e.target.value)}>
                  {['aes-256-gcm','aes-128-gcm','chacha20-poly1305','2022-blake3-aes-256-gcm'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1 block">Password SS</label>
                <input className="input" type="password" value={form.ssPassword} onChange={e => F('ssPassword', e.target.value)} />
              </div>
            </>}

            {/* WireGuard */}
            {isWG && <>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1 block">Public Key</label>
                <input className="input" placeholder="wg public key..." value={form.wgPublicKey} onChange={e => F('wgPublicKey', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1 block">DNS</label>
                <input className="input" placeholder="1.1.1.1,8.8.8.8" value={form.wgDns} onChange={e => F('wgDns', e.target.value)} />
              </div>
            </>}

            {/* OpenVPN */}
            {isOVPN && (
              <div className="col-span-full">
                <label className="text-xs text-[#94A3B8] mb-1 block">Config .ovpn</label>
                <textarea className="input h-32 font-mono text-xs" placeholder="Coller le contenu du fichier .ovpn..." value={form.ovpnConfig} onChange={e => F('ovpnConfig', e.target.value)} />
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="rounded" checked={form.isPremium} onChange={e => F('isPremium', e.target.checked)} />
                Premium
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="rounded" checked={form.enabled} onChange={e => F('enabled', e.target.checked)} />
                Actif
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn-ghost text-xs">Annuler</button>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending || !form.remark || !form.host}
              className="btn-primary text-xs"
            >
              {createMutation.isPending ? 'Création...' : 'Créer l\'inbound'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : inbounds.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-[#64748B]">
          <Globe className="w-10 h-10 mb-3 opacity-30" />
          <p className="font-medium">Aucun inbound configuré</p>
          <p className="text-sm mt-1">Créez votre premier point d&apos;entrée VPN</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inbounds.map(inbound => (
            <div key={inbound.id} className="card flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className={`badge badge-${PROTOCOL_COLORS[inbound.protocol] ?? 'gray'} shrink-0`}>
                  {inbound.protocol}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{inbound.remark}</p>
                    {inbound.isPremium && <span className="badge badge-yellow text-[10px]">Premium</span>}
                  </div>
                  <p className="text-xs text-[#64748B]">
                    {inbound.host}:{inbound.port}
                    {inbound.activeConns !== undefined && ` · ${inbound.activeConns} connexions`}
                    {` · ↑${inbound.totalUpGB.toFixed(2)}GB ↓${inbound.totalDownGB.toFixed(2)}GB`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`badge ${inbound.enabled ? 'badge-green' : 'badge-gray'}`}>
                  {inbound.enabled ? 'Actif' : 'Inactif'}
                </span>
                <button
                  onClick={() => { if (confirm('Supprimer cet inbound ?')) deleteMutation.mutate(inbound.id); }}
                  className="btn-danger p-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { Server, Wifi, HardDrive, Activity, Users, MoreVertical } from 'lucide-react';

interface ServerData {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'connecting';
  cpu: number;
  ram: number;
  ping: number;
  users: number;
  location: string;
  type: string;
}

const servers: ServerData[] = [
  { id: '1', name: 'EU-Frankfurt-01', status: 'online', cpu: 45, ram: 62, ping: 12, users: 128, location: '🇩🇪 Frankfurt', type: 'VLESS' },
  { id: '2', name: 'US-NewYork-01', status: 'online', cpu: 72, ram: 81, ping: 89, users: 256, location: '🇺🇸 New York', type: 'VMESS' },
  { id: '3', name: 'AS-Singapore-01', status: 'online', cpu: 34, ram: 45, ping: 156, users: 64, location: '🇸🇬 Singapore', type: 'WireGuard' },
  { id: '4', name: 'EU-London-01', status: 'connecting', cpu: 0, ram: 0, ping: 0, users: 0, location: '🇬🇧 London', type: 'OpenVPN' },
  { id: '5', name: 'US-LA-01', status: 'offline', cpu: 0, ram: 0, ping: 0, users: 0, location: '🇺🇸 Los Angeles', type: 'VLESS' },
  { id: '6', name: 'EU-Paris-01', status: 'online', cpu: 28, ram: 35, ping: 8, users: 42, location: '🇫🇷 Paris', type: 'VMESS' },
];

function StatusBadge({ status }: { status: ServerData['status'] }) {
  const config = {
    online: { dot: 'online', label: 'En ligne', color: 'text-green-400' },
    offline: { dot: 'offline', label: 'Hors ligne', color: 'text-red-400' },
    connecting: { dot: 'connecting', label: 'Connexion...', color: 'text-yellow-400' },
  };
  const c = config[status];
  return (
    <div className="flex items-center gap-2">
      <span className={`status-dot ${c.dot}`} />
      <span className={`text-xs font-medium ${c.color}`}>{c.label}</span>
    </div>
  );
}

function UsageBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-dark-100 rounded-full h-1.5 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  );
}

export function ServerStatus() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-surface-light flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server size={18} className="text-primary" />
          <h3 className="text-sm font-semibold text-gray-200">État des serveurs</h3>
        </div>
        <span className="text-xs text-gray-500">
          {servers.filter((s) => s.status === 'online').length}/{servers.length} en ligne
        </span>
      </div>

      <div className="divide-y divide-surface-light">
        {servers.map((server, idx) => (
          <motion.div
            key={server.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-4 hover:bg-surface-hover transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  server.status === 'online' ? 'bg-green-500/10 text-green-400' :
                  server.status === 'offline' ? 'bg-red-500/10 text-red-400' :
                  'bg-yellow-500/10 text-yellow-400'
                }`}>
                  <Wifi size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-200">{server.name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-50 text-gray-500 font-mono">
                      {server.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{server.location}</p>
                </div>
              </div>
              <button className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-white">
                <MoreVertical size={16} />
              </button>
            </div>

            {server.status === 'online' && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <HardDrive size={10} /> CPU
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">{server.cpu}%</span>
                  </div>
                  <UsageBar value={server.cpu} color={server.cpu > 70 ? 'bg-red-500' : server.cpu > 50 ? 'bg-yellow-500' : 'bg-primary'} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Activity size={10} /> RAM
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">{server.ram}%</span>
                  </div>
                  <UsageBar value={server.ram} color={server.ram > 70 ? 'bg-red-500' : server.ram > 50 ? 'bg-yellow-500' : 'bg-accent'} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Users size={10} /> Users
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">{server.users}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">Ping:</span>
                    <span className="text-[10px] font-mono text-gray-400">{server.ping}ms</span>
                  </div>
                </div>
              </div>
            )}

            {server.status !== 'online' && (
              <StatusBadge status={server.status} />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
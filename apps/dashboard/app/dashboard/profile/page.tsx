'use client';

import { useQuery } from '@tanstack/react-query';
import { Api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { User, Mail, Phone, Shield, Calendar, HardDrive, Clock, Wifi, Smartphone } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { frFR as fr } from 'date-fns/locale';

interface UserProfile {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  role: string;
  status: string;
  quotaUsedGB: number;
  quotaRemainingGB: number;
  quotaTotalGB: number;
  deviceLimit: number;
  expireAt?: string;
  createdAt: string;
  lastLoginAt?: string;
  devices?: { deviceId: string; deviceName?: string; lastSeenAt?: string }[];
}

const ROLE_LABELS: Record<string, string> = {
  USER: 'Utilisateur',
  RESELLER: 'Revendeur',
  SUPPORT: 'Support',
  ADMIN: 'Administrateur',
  SUPER_ADMIN: 'Super Administrateur'
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  ACTIVE: { color: 'text-emerald-400', label: 'Actif' },
  SUSPENDED: { color: 'text-red-400', label: 'Suspendu' },
  BANNED: { color: 'text-red-500', label: 'Banni' },
  EXPIRED: { color: 'text-yellow-400', label: 'Expiré' },
  PENDING: { color: 'text-gray-400', label: 'En attente' }
};

export default function ProfilePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const token = localStorage.getItem('sxb_token');
      if (!token) throw new Error('Not authenticated');
      
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch profile');
      const json = await res.json();
      return json.data as UserProfile;
    },
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-white/5 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-40 bg-white/5 rounded-2xl" />
            <div className="h-40 bg-white/5 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="card flex flex-col items-center py-16 text-[#64748B]">
          <User className="w-16 h-16 mb-4 opacity-30" />
          <p className="font-medium text-lg">Profil non disponible</p>
        </div>
      </DashboardLayout>
    );
  }

  const user = data;
  const statusConfig = STATUS_CONFIG[user.status] ?? { color: 'text-gray-400', label: user.status };
  const quotaTotal = user.quotaUsedGB + user.quotaRemainingGB;
  const quotaPercent = quotaTotal > 0 ? (user.quotaUsedGB / quotaTotal) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              {(user.username?.[0] ?? 'U').toUpperCase()}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold">{user.username}</h1>
              <p className={`text-sm font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </p>
              <div className="mt-2">
                <span className="badge badge-blue">{ROLE_LABELS[user.role] ?? user.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quota Card */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            Quota de données
          </h2>
          
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="relative h-4 bg-[#0F172A] rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                style={{ width: `${Math.min(quotaPercent, 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-white drop-shadow-lg">
                  {quotaPercent.toFixed(1)}% utilisé
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-[#0F172A] rounded-xl p-4">
                <p className="text-xs text-[#64748B] mb-1">Utilisé</p>
                <p className="text-xl font-bold text-orange-400">{user.quotaUsedGB.toFixed(2)} GB</p>
              </div>
              <div className="bg-[#0F172A] rounded-xl p-4">
                <p className="text-xs text-[#64748B] mb-1">Restant</p>
                <p className="text-xl font-bold text-emerald-400">{user.quotaRemainingGB.toFixed(2)} GB</p>
              </div>
              <div className="bg-[#0F172A] rounded-xl p-4">
                <p className="text-xs text-[#64748B] mb-1">Total</p>
                <p className="text-xl font-bold">{quotaTotal.toFixed(2)} GB</p>
              </div>
            </div>

            {/* Devices */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#64748B]">Appareils autorisés</span>
              <span className="font-semibold">{user.deviceLimit}</span>
            </div>
          </div>
        </div>

        {/* Expiration & Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Expiration */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Expiration
            </h2>
            {user.expireAt ? (
              <div className="space-y-2">
                <p className="text-sm text-[#64748B]">Date d'expiration</p>
                <p className="text-xl font-bold">
                  {format(new Date(user.expireAt), 'dd MMMM yyyy', { locale: fr })}
                </p>
                <p className="text-sm text-yellow-400">
                  Expire {formatDistanceToNow(new Date(user.expireAt), { addSuffix: true, locale: fr })}
                </p>
              </div>
            ) : (
              <p className="text-[#64748B]">Pas de date d'expiration</p>
            )}
          </div>

          {/* Account Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Informations du compte
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#64748B]" />
                <span className="text-[#64748B]">Membre depuis</span>
                <span className="ml-auto">{format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: fr })}</span>
              </div>
              {user.lastLoginAt && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#64748B]" />
                  <span className="text-[#64748B]">Dernière connexion</span>
                  <span className="ml-auto">{formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true, locale: fr })}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-cyan-400" />
            Coordonnées
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {user.email && (
              <div className="flex items-center gap-3 bg-[#0F172A] rounded-lg p-3">
                <Mail className="w-5 h-5 text-[#64748B]" />
                <div>
                  <p className="text-xs text-[#64748B]">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center gap-3 bg-[#0F172A] rounded-lg p-3">
                <Phone className="w-5 h-5 text-[#64748B]" />
                <div>
                  <p className="text-xs text-[#64748B]">Téléphone</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>
            )}
            {!user.email && !user.phone && (
              <p className="text-[#64748B] col-span-2">Aucune coordonnée enregistrée</p>
            )}
          </div>
        </div>

        {/* Devices List */}
        {user.devices && user.devices.length > 0 && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-indigo-400" />
              Mes appareils ({user.devices.length}/{user.deviceLimit})
            </h2>
            <div className="space-y-2">
              {user.devices.map((device, i) => (
                <div key={i} className="flex items-center justify-between bg-[#0F172A] rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-[#64748B]" />
                    <div>
                      <p className="font-medium text-sm">{device.deviceName || 'Appareil inconnu'}</p>
                      <p className="text-xs text-[#64748B] font-mono">{device.deviceId.slice(0, 16)}...</p>
                    </div>
                  </div>
                  {device.lastSeenAt && (
                    <span className="text-xs text-[#64748B]">
                      {formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true, locale: fr })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

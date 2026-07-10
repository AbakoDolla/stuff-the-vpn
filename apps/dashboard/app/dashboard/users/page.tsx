'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';
import { Plus, Users, Search, Ban, CheckCircle, Trash2, HardDrive, Key, Copy, X, Calendar, User, Shield, Wifi, Edit } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { frFR as fr } from 'date-fns/locale';

interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  role: string;
  status: string;
  quotaUsedGB: number;
  quotaRemainingGB: number;
  deviceLimit: number;
  expireAt?: string;
  createdAt: string;
  lastLoginAt?: string;
  loginToken?: string;
  loginTokenExpiresAt?: string;
}

interface CreateForm {
  username: string;
  email: string;
  phone: string;
  role: string;
  quotaRemainingGB: number;
  expireAt?: string;
}

interface EditForm {
  quotaRemainingGB: number;
  expireAt?: string;
}

interface CreatedUserData {
  id: string;
  loginToken: string;
  loginTokenExpiresAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'badge-green',
  SUSPENDED: 'badge-red',
  BANNED: 'badge-red',
  EXPIRED: 'badge-yellow',
  PENDING: 'badge-gray'
};

const ROLE_BADGE: Record<string, string> = {
  USER: 'badge-gray',
  RESELLER: 'badge-blue',
  ADMIN: 'badge-yellow',
  SUPER_ADMIN: 'badge-red',
  SUPPORT: 'badge-purple'
};

const ROLE_LABELS: Record<string, string> = {
  USER: 'Utilisateur',
  RESELLER: 'Revendeur',
  SUPPORT: 'Support',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin'
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [createdUser, setCreatedUser] = useState<CreatedUserData | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    quotaRemainingGB: 10,
    expireAt: undefined
  });
  const [form, setForm] = useState<CreateForm>({
    username: '',
    email: '',
    phone: '',
    role: 'USER',
    quotaRemainingGB: 10,
    expireAt: undefined
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () => Api.getUsers({ search, limit: 100 }),
    refetchInterval: 30_000,
  });

  const createMut = useMutation({
    mutationFn: (body: CreateForm) => Api.createUser(body),
    onSuccess: (data) => {
      const response = data as unknown as CreatedUserData;
      if (response?.loginToken) {
        setCreatedUser(response);
        setShowTokenModal(true);
      } else {
        toast.success('Utilisateur créé');
      }
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowCreate(false);
      setForm({ username: '', email: '', phone: '', role: 'USER', quotaRemainingGB: 10, expireAt: undefined });
    },
    onError: (e: Error & { response?: { data?: { message?: string; data?: Record<string, string[]> } } }) => {
      const errData = e.response?.data;
      if (errData?.data) {
        const messages = Object.entries(errData.data)
          .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
          .join(' | ');
        toast.error(messages || 'Erreur de validation');
      } else {
        toast.error(e.message || errData?.message || 'Erreur création');
      }
    },
  });

  const regenerateTokenMut = useMutation({
    mutationFn: (id: string) => Api.regenerateUserToken(id),
    onSuccess: (data) => {
      const response = data as { loginToken?: string };
      const token = response?.loginToken;
      if (token) {
        setCreatedUser({ id: '', loginToken: token, loginTokenExpiresAt: '' });
        setShowTokenModal(true);
      }
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Erreur regénération token');
    },
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      Api.updateUser(id, { status }),
    onSuccess: () => {
      toast.success('Statut mis à jour');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Erreur'),
  });

  const editMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditForm }) =>
      Api.updateUser(id, data),
    onSuccess: () => {
      toast.success('Utilisateur modifié');
      qc.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
    },
    onError: (e: Error) => toast.error(e.message || 'Erreur modification'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => Api.deleteUser(id),
    onSuccess: () => {
      toast.success('Utilisateur supprimé');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Erreur suppression'),
  });

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success('Token copié !');
  };

  const users: User[] = data?.data ?? [];
  const total = data?.total ?? users.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Utilisateurs</h1>
            <p className="text-sm text-[#64748B]">{total} utilisateurs</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvel utilisateur</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            className="input pl-9 w-full"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1E293B] rounded-2xl p-6 w-full max-w-md space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Nouvel utilisateur</h2>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1 block">Username *</label>
                  <input
                    className="input w-full"
                    placeholder="nom_utilisateur"
                    value={form.username}
                    onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-xs text-[#94A3B8] mb-1 block">Email</label>
                  <input
                    className="input w-full"
                    type="email"
                    placeholder="email@exemple.com"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-xs text-[#94A3B8] mb-1 block">Téléphone</label>
                  <input
                    className="input w-full"
                    placeholder="+225..."
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-xs text-[#94A3B8] mb-1 block">Rôle</label>
                  <select
                    className="input w-full"
                    value={form.role}
                    onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  >
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1 block flex items-center gap-1">
                      <HardDrive className="w-3 h-3" /> Quota (GB)
                    </label>
                    <input
                      className="input w-full"
                      type="number"
                      min="0"
                      value={form.quotaRemainingGB}
                      onChange={e => setForm(p => ({ ...p, quotaRemainingGB: Number(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1 block flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Expiration
                    </label>
                    <input
                      className="input w-full"
                      type="date"
                      value={form.expireAt || ''}
                      onChange={e => setForm(p => ({ ...p, expireAt: e.target.value || undefined }))}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1">
                  Annuler
                </button>
                <button
                  onClick={() => createMut.mutate(form)}
                  disabled={createMut.isPending || !form.username}
                  className="btn-primary flex-1"
                >
                  {createMut.isPending ? 'Création...' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Token Modal */}
        {showTokenModal && createdUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1E293B] rounded-2xl p-6 w-full max-w-md space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Key className="w-5 h-5 text-emerald-400" />
                  Token de connexion
                </h2>
                <button onClick={() => setShowTokenModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-[#0F172A] rounded-xl p-4 space-y-3">
                <p className="text-sm text-[#94A3B8]">Partagez ce token avec l'utilisateur :</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-[#1E293B] px-4 py-3 rounded-lg text-emerald-400 font-mono text-lg tracking-wider break-all">
                    {createdUser.loginToken}
                  </code>
                  <button
                    onClick={() => copyToken(createdUser.loginToken)}
                    className="btn-primary p-3 shrink-0"
                    title="Copier"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-[#64748B]">
                  Valide pendant 7 jours
                </p>
              </div>

              <button onClick={() => setShowTokenModal(false)} className="btn-primary w-full">
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1E293B] rounded-2xl p-6 w-full max-w-md space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Edit className="w-5 h-5 text-indigo-400" />
                  Modifier {editingUser.username}
                </h2>
                <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1 block flex items-center gap-1">
                      <HardDrive className="w-3 h-3" /> Quota (GB)
                    </label>
                    <input
                      className="input w-full"
                      type="number"
                      min="0"
                      value={editForm.quotaRemainingGB}
                      onChange={e => setEditForm(p => ({ ...p, quotaRemainingGB: Number(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1 block flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Expiration
                    </label>
                    <input
                      className="input w-full"
                      type="date"
                      value={editForm.expireAt || ''}
                      onChange={e => setEditForm(p => ({ ...p, expireAt: e.target.value || undefined }))}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingUser(null)} className="btn-ghost flex-1">
                  Annuler
                </button>
                <button
                  onClick={() => editMut.mutate({ id: editingUser.id, data: editForm })}
                  disabled={editMut.isPending}
                  className="btn-primary flex-1"
                >
                  {editMut.isPending ? 'Modification...' : 'Modifier'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Grid - Responsive */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="card flex flex-col items-center py-16 text-[#64748B]">
            <Users className="w-16 h-16 mb-4 opacity-30" />
            <p className="font-medium text-lg">Aucun utilisateur</p>
            <p className="text-sm">Créez votre premier utilisateur</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(u => (
              <div key={u.id} className="card p-4 space-y-3 hover:bg-white/5 transition-colors">
                {/* User Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                      {(u.username?.[0] ?? 'U').toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{u.username}</p>
                      <p className="text-xs text-[#64748B]">{u.email ?? u.phone ?? '—'}</p>
                    </div>
                  </div>
                  <span className={`badge ${ROLE_BADGE[u.role] ?? 'badge-gray'}`}>
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#0F172A] rounded-lg p-2">
                    <p className="text-[#64748B]">Quota restant</p>
                    <p className="font-semibold text-emerald-400">{u.quotaRemainingGB.toFixed(1)} GB</p>
                  </div>
                  <div className="bg-[#0F172A] rounded-lg p-2">
                    <p className="text-[#64748B]">Utilisé</p>
                    <p className="font-semibold text-orange-400">{u.quotaUsedGB.toFixed(1)} GB</p>
                  </div>
                </div>

                {/* Expiry */}
                {u.expireAt && (
                  <div className="flex items-center gap-2 text-xs text-[#64748B]">
                    <Calendar className="w-3 h-3" />
                    <span>Expire: {format(new Date(u.expireAt), 'dd/MM/yyyy', { locale: fr })}</span>
                  </div>
                )}

                {/* Status & Last Login */}
                <div className="flex items-center justify-between text-xs">
                  <span className={`badge ${STATUS_BADGE[u.status] ?? 'badge-gray'}`}>
                    {u.status}
                  </span>
                  <span className="text-[#64748B]">
                    {u.lastLoginAt
                      ? `Connecté ${formatDistanceToNow(new Date(u.lastLoginAt), { addSuffix: true, locale: fr })}`
                      : 'Jamais connecté'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  {u.role !== 'SUPER_ADMIN' && (
                    <>
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setEditForm({
                            quotaRemainingGB: u.quotaRemainingGB,
                            expireAt: u.expireAt
                          });
                        }}
                        className="btn-ghost text-xs py-2 flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Modifier
                      </button>

                      <button
                        onClick={() => regenerateTokenMut.mutate(u.id)}
                        className="flex-1 btn-ghost text-xs py-2 flex items-center justify-center gap-1"
                        disabled={regenerateTokenMut.isPending}
                      >
                        <Key className="w-3 h-3" />
                        Token
                      </button>

                      {u.status === 'ACTIVE' ? (
                        <button
                          onClick={() => statusMut.mutate({ id: u.id, status: 'SUSPENDED' })}
                          className="flex-1 btn-ghost text-xs py-2 flex items-center justify-center gap-1 text-yellow-400"
                        >
                          <Ban className="w-3 h-3" />
                          Suspendre
                        </button>
                      ) : (
                        <button
                          onClick={() => statusMut.mutate({ id: u.id, status: 'ACTIVE' })}
                          className="flex-1 btn-ghost text-xs py-2 flex items-center justify-center gap-1 text-emerald-400"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Activer
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (confirm(`Supprimer ${u.username} ?`)) {
                            deleteMut.mutate(u.id);
                          }
                        }}
                        className="btn-ghost text-xs p-2 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {u.role === 'SUPER_ADMIN' && (
                    <span className="text-xs text-[#64748B] flex-1 text-center">Compte protégé</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

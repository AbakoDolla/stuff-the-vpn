'use client';
  import { useState, useEffect, useCallback } from 'react';
  import DashboardLayout from '@/components/DashboardLayout';
  import DataTable from '@/components/DataTable';
  import { api } from '@/lib/api';
  import { formatDate, formatGB } from '@/lib/utils';
  import { UserPlus, RefreshCw, Ban, CheckCircle, Trash2, Eye } from 'lucide-react';

  interface User {
    id: string; username: string; email: string; role: string; status: string;
    quotaUsedGB: number; quotaRemainingGB: number; deviceLimit: number;
    expireAt: string | null; createdAt: string;
  }

  const ROLE_COLORS: Record<string, string> = {
    USER: 'badge-info', RESELLER: 'badge-warning', ADMIN: 'badge-active', SUPER_ADMIN: 'badge-active'
  };

  export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ username: '', email: '', password: '', role: 'USER', deviceLimit: 1, quotaRemainingGB: 10 });

    const loadUsers = useCallback(async () => {
      setLoading(true);
      try {
        const r = await api.get('/users');
        const arr = Array.isArray(r.data.data) ? r.data.data : r.data.data?.items || r.data || [];
        setUsers(arr);
      } catch { setUsers([]); }
      finally { setLoading(false); }
    }, []);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    async function handleCreate(e: React.FormEvent) {
      e.preventDefault(); setCreating(true);
      try {
        await api.post('/users', form);
        setShowCreate(false);
        setForm({ username: '', email: '', password: '', role: 'USER', deviceLimit: 1, quotaRemainingGB: 10 });
        await loadUsers();
      } catch (err: unknown) {
        alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors de la création');
      } finally { setCreating(false); }
    }

    async function toggleStatus(user: User) {
      const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      try {
        await api.patch(`/users/${user.id}`, { status: newStatus });
        await loadUsers();
      } catch { alert('Erreur lors de la mise à jour'); }
    }

    async function deleteUser(user: User) {
      if (!confirm(`Supprimer ${user.username} ?`)) return;
      try {
        await api.delete(`/users/${user.id}`);
        await loadUsers();
      } catch { alert('Erreur lors de la suppression'); }
    }

    const columns = [
      {
        key: 'username', label: 'Utilisateur',
        render: (u: User) => (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0099FF] to-[#00D4FF] flex items-center justify-center text-white text-xs font-bold">
              {u.username[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium text-[#F1F5F9]">{u.username}</div>
              <div className="text-xs text-[#64748B]">{u.email}</div>
            </div>
          </div>
        )
      },
      {
        key: 'role', label: 'Rôle',
        render: (u: User) => <span className={ROLE_COLORS[u.role] || 'badge-info'}>{u.role}</span>
      },
      {
        key: 'status', label: 'Statut',
        render: (u: User) => (
          <span className={u.status === 'ACTIVE' ? 'badge-active' : u.status === 'SUSPENDED' ? 'badge-inactive' : 'badge-warning'}>
            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-red-400'}`} />{u.status}
          </span>
        )
      },
      {
        key: 'quota', label: 'Quota',
        render: (u: User) => (
          <div>
            <div className="text-sm text-[#F1F5F9]">{formatGB(u.quotaRemainingGB)} restant</div>
            <div className="text-xs text-[#64748B]">{formatGB(u.quotaUsedGB)} utilisé</div>
          </div>
        )
      },
      {
        key: 'expireAt', label: 'Expiration',
        render: (u: User) => <span className="text-sm text-[#94A3B8]">{u.expireAt ? formatDate(u.expireAt) : '—'}</span>
      },
      {
        key: 'createdAt', label: 'Créé le',
        render: (u: User) => <span className="text-sm text-[#94A3B8]">{formatDate(u.createdAt)}</span>
      },
    ];

    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#F1F5F9]">Utilisateurs</h1>
              <p className="text-sm text-[#64748B]">{users.length} utilisateurs enregistrés</p>
            </div>
            <div className="flex gap-2">
              <button onClick={loadUsers} className="btn-ghost flex items-center gap-1.5"><RefreshCw className="w-4 h-4" />Actualiser</button>
              <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5"><UserPlus className="w-4 h-4" />Nouvel utilisateur</button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={users}
            loading={loading}
            searchable
            searchKeys={['username', 'email', 'role', 'status']}
            emptyMessage="Aucun utilisateur trouvé"
            actions={(u: User) => (
              <div className="flex items-center gap-1 justify-end">
                <button className="p-1.5 rounded-lg hover:bg-[#1E2D45] text-[#94A3B8] hover:text-[#F1F5F9]" title="Voir">
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => toggleStatus(u)} className={`p-1.5 rounded-lg hover:bg-[#1E2D45] ${u.status === 'ACTIVE' ? 'text-amber-400' : 'text-emerald-400'}`} title={u.status === 'ACTIVE' ? 'Suspendre' : 'Activer'}>
                  {u.status === 'ACTIVE' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => deleteUser(u)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400" title="Supprimer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          />

          {/* Create Modal */}
          {showCreate && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <div className="bg-[#0F1629] border border-[#1E2D45] rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2D45]">
                  <h3 className="font-semibold text-[#F1F5F9]">Créer un utilisateur</h3>
                  <button onClick={() => setShowCreate(false)} className="text-[#64748B] hover:text-[#F1F5F9] text-xl">×</button>
                </div>
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1 block">Nom d'utilisateur</label>
                      <input className="input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1 block">Email</label>
                      <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1 block">Mot de passe</label>
                    <input type="password" className="input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1 block">Rôle</label>
                      <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                        <option>USER</option><option>RESELLER</option><option>ADMIN</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1 block">Quota (GB)</label>
                      <input type="number" className="input" value={form.quotaRemainingGB} onChange={e => setForm(f => ({ ...f, quotaRemainingGB: +e.target.value }))} min={1} />
                    </div>
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1 block">Appareils</label>
                      <input type="number" className="input" value={form.deviceLimit} onChange={e => setForm(f => ({ ...f, deviceLimit: +e.target.value }))} min={1} max={10} />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Annuler</button>
                    <button type="submit" className="btn-primary flex-1" disabled={creating}>{creating ? 'Création...' : 'Créer'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }
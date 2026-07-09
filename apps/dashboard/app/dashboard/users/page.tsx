'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';
import { Plus, Users, Search, Ban, CheckCircle, Trash2, HardDrive } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { frFR as fr } from 'date-fns/locale';

interface User {
  id:string; username:string; email?:string; phone?:string;
  role:string; status:string; quotaUsedGB:number; quotaRemainingGB:number;
  expireAt?:string; createdAt:string; lastLoginAt?:string;
}

interface CreateForm {
  username: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  quotaRemainingGB: number;
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:'badge-green', SUSPENDED:'badge-red', BANNED:'badge-red', EXPIRED:'badge-yellow', PENDING:'badge-gray'
};
const ROLE_BADGE: Record<string, string> = {
  USER:'badge-gray', RESELLER:'badge-blue', ADMIN:'badge-yellow', SUPER_ADMIN:'badge-red', SUPPORT:'badge-blue'
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>({ username:'', email:'', phone:'', password:'', role:'USER', quotaRemainingGB: 10 });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', search],
    queryFn: () => Api.getUsers({ search, limit: 100 }),
    refetchInterval: 30_000,
  });

  const createMut = useMutation({
    mutationFn: (body: CreateForm) => api.post('/users', body),
    onSuccess: () => {
      toast.success('Utilisateur créé');
      qc.invalidateQueries({queryKey:['users']});
      setShowCreate(false);
      setForm({ username:'', email:'', phone:'', password:'', role:'USER', quotaRemainingGB: 10 });
    },
    onError: (e: {response?: {data?: {message?: string; data?: Record<string, string[]>}}}) => {
      const errData = e.response?.data;
      if (errData?.data) {
        // Format Zod validation errors: { field: ["error messages"] }
        const messages = Object.entries(errData.data)
          .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
          .join(' | ');
        toast.error(messages || 'Erreur de validation');
      } else {
        toast.error(errData?.message ?? 'Erreur création');
      }
    },
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/users/${id}`, { status }),
    onSuccess: () => { toast.success('Statut mis à jour'); qc.invalidateQueries({queryKey:['users']}); },
    onError: () => toast.error('Erreur'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => { toast.success('Utilisateur supprimé'); qc.invalidateQueries({queryKey:['users']}); },
    onError: () => toast.error('Erreur suppression'),
  });

  const users: User[] = data?.data ?? [];
  const total = data?.total ?? users.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Utilisateurs</h1>
            <p className="text-sm text-[#64748B]">{total} utilisateurs au total</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-xs">
            <Plus className="w-4 h-4"/> Créer
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="card space-y-4">
            <h2 className="font-semibold text-sm">Nouvel utilisateur</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {[['Username','username','text'],['Email','email','email'],['Téléphone','phone','text'],['Mot de passe','password','password']].map(([l,k,t]) => (
                <div key={String(k)}>
                  <label className="text-xs text-[#94A3B8] mb-1 block">{l}</label>
                  <input className="input" type={String(t)}
                    value={String((form as Record<string,string | number>)[String(k)])}
                    onChange={e => setForm(p => ({...p, [String(k)]: e.target.value}))} />
                </div>
              ))}
              <div>
                <label className="text-xs text-[#94A3B8] mb-1 block">Rôle</label>
                <select className="input" value={form.role} onChange={e => setForm(p=>({...p,role:e.target.value}))}>
                  {['USER','RESELLER','SUPPORT','ADMIN'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1 block flex items-center gap-1">
                  <HardDrive className="w-3 h-3" /> Quota (GB)
                </label>
                <input className="input" type="number" min="0" step="1"
                  value={form.quotaRemainingGB}
                  onChange={e => setForm(p => ({...p, quotaRemainingGB: Number(e.target.value)}))} 
                  placeholder="10" />
                <p className="text-[10px] text-[#64748B] mt-1">Quota de données en GB</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="btn-ghost text-xs">Annuler</button>
              <button onClick={() => createMut.mutate(form)} disabled={createMut.isPending || !form.username || !form.password}
                className="btn-primary text-xs">
                {createMut.isPending ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input className="input pl-9" placeholder="Rechercher par username, email, téléphone..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse"/>)}</div>
        ) : users.length === 0 ? (
          <div className="card flex flex-col items-center py-12 text-[#64748B]">
            <Users className="w-10 h-10 mb-3 opacity-30"/>
            <p className="font-medium">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Utilisateur</th><th>Rôle</th><th>Statut</th>
                  <th>Quota</th><th>Dernière connexion</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{background:'linear-gradient(135deg,#6366F1,#8B5CF6)'}}>
                          {(u.username?.[0] ?? 'U').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{u.username}</p>
                          <p className="text-xs text-[#64748B]">{u.email ?? u.phone ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${ROLE_BADGE[u.role]??'badge-gray'}`}>{u.role}</span></td>
                    <td><span className={`badge ${STATUS_BADGE[u.status]??'badge-gray'}`}>{u.status}</span></td>
                    <td>
                      <p className="text-xs">{u.quotaUsedGB.toFixed(2)}GB utilisés</p>
                      <p className="text-[10px] text-[#64748B]">{u.quotaRemainingGB.toFixed(2)}GB restants</p>
                    </td>
                    <td className="text-xs text-[#64748B]">
                      {u.lastLoginAt ? formatDistanceToNow(new Date(u.lastLoginAt), {addSuffix:true, locale:fr}) : '—'}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {u.role === 'SUPER_ADMIN' ? (
                          <span className="text-gray-500 text-xs px-2 py-1 bg-gray-800 rounded" title="Super Admin protégé">
                            Protégé
                          </span>
                        ) : (
                          <>
                            {u.status === 'ACTIVE' ? (
                              <button onClick={() => statusMut.mutate({id:u.id, status:'SUSPENDED'})}
                                className="text-yellow-400 hover:text-yellow-300" title="Suspendre">
                                <Ban className="w-4 h-4"/>
                              </button>
                            ) : (
                              <button onClick={() => statusMut.mutate({id:u.id, status:'ACTIVE'})}
                                className="text-emerald-400 hover:text-emerald-300" title="Activer">
                                <CheckCircle className="w-4 h-4"/>
                              </button>
                            )}
                            <button onClick={() => {if(confirm('Supprimer cet utilisateur ?')) deleteMut.mutate(u.id);}}
                              className="text-red-400 hover:text-red-300" title="Supprimer">
                              <Trash2 className="w-4 h-4"/>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

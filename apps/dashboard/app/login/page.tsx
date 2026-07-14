'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, Loader2, ShieldCheck, Lock, Mail } from 'lucide-react';

function saveAuth(user: { id: string; username: string; email: string; role: string; token: string }) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sxb_token', user.token);
  localStorage.setItem('sxb_user', JSON.stringify(user));
  document.cookie = `stv_token=${user.token}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json() as { success?: boolean; data?: { user?: { id?: string; username?: string; email?: string; role?: string }; token?: string }; message?: string };
      if (!res.ok || !json.data?.token) {
        setError(json.message || 'Identifiants invalides');
        return;
      }
      const { token, user } = json.data;
      saveAuth({
        id:       user?.id ?? '',
        username: user?.username ?? 'Admin',
        email:    user?.email ?? email,
        role:     user?.role ?? 'ADMIN',
        token:    token!,
      });
      router.push('/dashboard');
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 py-8"
      style={{ background: 'radial-gradient(ellipse at top, #071B3A 0%, #020817 70%)' }}
    >
      {/* Glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-2xl bg-blue-500/25 blur-2xl scale-150" />
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl"
              style={{ boxShadow: '0 0 40px rgba(0,153,255,0.4)' }}>
              <Image src="/logo.png" alt="SXB VPN" width={80} height={80} className="w-full h-full object-cover" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Stuff X Bilal VPN</h1>
          <p className="text-sm text-slate-400 mt-1">Panneau d&apos;administration</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/8 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-semibold text-slate-100">Connexion administrateur</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/70 border border-white/10 rounded-xl
                             text-slate-100 placeholder-slate-600 text-sm
                             focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30
                             transition-all duration-200"
                  placeholder="admin@sxbvpn.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type={showPw ? 'text' : 'password'}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800/70 border border-white/10 rounded-xl
                             text-slate-100 placeholder-slate-600 text-sm
                             focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30
                             transition-all duration-200"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label="Afficher/masquer le mot de passe"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-2">
                <span className="mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 mt-2
                         bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400
                         text-white text-sm font-semibold rounded-xl
                         transition-all duration-200 active:scale-95
                         disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-lg shadow-blue-900/40"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Connexion en cours…</>
              ) : (
                <><ShieldCheck className="w-4 h-4" /> Se connecter</>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 mt-5">
            Accès réservé aux administrateurs autorisés
          </p>
        </div>

        <p className="text-center text-xs text-slate-800 mt-5">
          Stuff X Bilal VPN — Dashboard v2.0
        </p>
      </div>
    </div>
  );
}

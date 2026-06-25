'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { saveAuth } from '@/lib/auth';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';

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
      const res = await api.post('/auth/login', { email, password });
      const { data } = res.data;
      saveAuth({ id: data.user.id, username: data.user.username, email: data.user.email, role: data.user.role, token: data.token });
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020817]" style={{background: 'radial-gradient(ellipse at top, #071B3A 0%, #020817 70%)'}}>
      <div className="w-full max-w-md px-6">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-xl scale-110" />
            <Image
              src="/logo.png"
              alt="Stuff X Billal VPN Logo"
              width={88}
              height={88}
              className="relative rounded-2xl shadow-lg"
              style={{boxShadow: '0 0 32px rgba(0,153,255,0.5)'}}
            />
          </div>
          <h1 className="text-2xl font-bold text-[#F1F5F9] tracking-wide">Stuff X Billal VPN</h1>
          <p className="text-[#64748B] text-sm mt-1">Panneau d&apos;administration</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-6 text-center">Connexion</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Email</label>
              <input type="email" className="input" placeholder="admin@sxbvpn.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Mot de passe</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input pr-10" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8]">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>
            )}
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 mt-2" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <p className="text-center text-xs text-[#64748B] mt-4">
            Accès réservé aux administrateurs
          </p>
        </div>

        <p className="text-center text-xs text-[#1E2D45] mt-6">Stuff X Billal VPN — Dashboard v2.0</p>
      </div>
    </div>
  );
}

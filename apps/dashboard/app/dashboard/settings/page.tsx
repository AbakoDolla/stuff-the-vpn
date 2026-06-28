'use client';
import { useState, useEffect } from 'react';
import { Settings, Save, Key, Shield, Bell } from 'lucide-react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

type SettingsMap = Record<string, string | boolean | number>;

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/settings').then(r=>setSettings(r.data.data??{})).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try { await api.post('/settings', settings); setSaved(true); setTimeout(()=>setSaved(false),2000); }
    catch(err: unknown){ alert((err as {response?:{data?:{message?:string}}})?.response?.data?.message??'Erreur'); }
    finally { setSaving(false); }
  };

  const set = (key: string, value: string | boolean | number) => setSettings(s => ({ ...s, [key]: value }));

  const textFields: { key: string; label: string; placeholder?: string }[] = [
    { key: 'app_name',      label: "Nom de l'application",  placeholder: 'SxB VPN' },
    { key: 'support_email', label: "Email support",          placeholder: 'support@sxbvpn.com' },
    { key: 'telegram_bot',  label: "Bot Telegram",           placeholder: '@monbot' },
    { key: 'default_plan',  label: "Forfait par défaut",     placeholder: '30 Jours' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold text-[#F1F5F9]">Paramètres</h1><p className="text-sm text-[#64748B]">Configuration générale de la plateforme</p></div>
          <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50">
            <Save className="w-4 h-4"/>{saving ? 'Enregistrement…' : saved ? '✓ Enregistré' : 'Enregistrer'}
          </button>
        </div>

        {loading ? <div className="card animate-pulse h-64 bg-[#0A0F1C]"/> : (
          <div className="space-y-4">
            {/* General */}
            <div className="card">
              <h2 className="text-sm font-semibold text-[#F1F5F9] mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-[#0099FF]"/>Général</h2>
              <div className="grid grid-cols-2 gap-4">
                {textFields.map(({key,label,placeholder})=>(
                  <div key={key}>
                    <label className="label">{label}</label>
                    <input className="input" placeholder={placeholder} value={String(settings[key]??'')} onChange={e=>set(key, e.target.value)}/>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature toggles */}
            <div className="card">
              <h2 className="text-sm font-semibold text-[#F1F5F9] mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-[#0099FF]"/>Sécurité & Accès</h2>
              <div className="space-y-3">
                {[
                  { key:'maintenance',    label:'Mode maintenance',        desc:'Bloquer tous les accès client' },
                  { key:'allow_register', label:'Inscription libre',       desc:'Permettre la création de compte' },
                ].map(({key,label,desc})=>(
                  <div key={key} className="flex items-center justify-between py-3 border-b border-[#1E2D45] last:border-0">
                    <div><p className="text-sm text-[#F1F5F9]">{label}</p><p className="text-xs text-[#64748B]">{desc}</p></div>
                    <button onClick={()=>set(key, !settings[key])}
                      className={`relative w-11 h-6 rounded-full transition-colors ${settings[key] ? 'bg-[#0099FF]' : 'bg-[#1E2D45]'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${settings[key] ? 'translate-x-5' : ''}`}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

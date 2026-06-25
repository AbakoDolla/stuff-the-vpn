'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { Save, Key, Globe, Shield, Bell } from 'lucide-react';

  export default function SettingsPage() {
    const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_API_URL||'http://localhost:5000');
    const [corsOrigin, setCorsOrigin] = useState('*');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [pwForm, setPwForm] = useState({current:'',newPw:'',confirm:''});
    const [pwSaving, setPwSaving] = useState(false);

    async function saveGeneral(e:React.FormEvent){
      e.preventDefault(); setSaving(true);
      setTimeout(()=>{setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2000);},600);
    }

    async function changePw(e:React.FormEvent){
      e.preventDefault();
      if(pwForm.newPw!==pwForm.confirm){alert('Les mots de passe ne correspondent pas');return;}
      setPwSaving(true);
      try{await api.patch('/user/password',{currentPassword:pwForm.current,newPassword:pwForm.newPw});
        alert('Mot de passe changé avec succès');setPwForm({current:'',newPw:'',confirm:''});}
      catch(err:unknown){alert((err as {response?:{data?:{message?:string}}})?.response?.data?.message||'Erreur');}
      finally{setPwSaving(false);}
    }

    const sections = [
      { id:'general', icon:Globe, label:'Général' },
      { id:'security', icon:Shield, label:'Sécurité' },
      { id:'notifications', icon:Bell, label:'Notifications' },
    ];
    const [active,setActive] = useState('general');

    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div><h1 className="text-xl font-bold text-[#F1F5F9]">Paramètres</h1><p className="text-sm text-[#64748B]">Configuration de la plateforme SxBVPN</p></div>
          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar nav */}
            <div className="col-span-12 lg:col-span-3">
              <div className="card p-2 space-y-1">
                {sections.map(s=>(
                  <button key={s.id} onClick={()=>setActive(s.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${active===s.id?'bg-[#0099FF]/10 text-[#0099FF]':'text-[#94A3B8] hover:bg-[#0F1629] hover:text-[#F1F5F9]'}`}>
                    <s.icon className="w-4 h-4"/>{s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="col-span-12 lg:col-span-9 space-y-4">
              {active==='general'&&(
                <div className="card">
                  <h2 className="font-semibold text-[#F1F5F9] mb-5 flex items-center gap-2"><Globe className="w-4 h-4 text-[#0099FF]"/>Configuration générale</h2>
                  <form onSubmit={saveGeneral} className="space-y-4">
                    <div><label className="text-xs text-[#94A3B8] mb-1 block">URL de l'API backend</label>
                      <input className="input font-mono" value={apiUrl} onChange={e=>setApiUrl(e.target.value)} placeholder="http://localhost:5000"/></div>
                    <div><label className="text-xs text-[#94A3B8] mb-1 block">CORS Origin</label>
                      <input className="input font-mono" value={corsOrigin} onChange={e=>setCorsOrigin(e.target.value)} placeholder="*"/></div>
                    <div className="bg-[#0F1629] border border-[#1E2D45] rounded-lg p-4">
                      <p className="text-xs text-[#94A3B8] font-medium mb-2">Identifiants admin par défaut</p>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="text-[#64748B]">Login :</div><div className="text-[#0099FF]">SxBVPN</div>
                        <div className="text-[#64748B]">Email :</div><div className="text-[#0099FF]">admin@sxbvpn.com</div>
                        <div className="text-[#64748B]">Mot de passe :</div><div className="text-[#0099FF]">SxBvpn2026</div>
                      </div>
                    </div>
                    <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
                      <Save className="w-4 h-4"/>{saved?'Sauvegardé !':saving?'Sauvegarde...':'Sauvegarder'}
                    </button>
                  </form>
                </div>
              )}

              {active==='security'&&(
                <div className="card">
                  <h2 className="font-semibold text-[#F1F5F9] mb-5 flex items-center gap-2"><Key className="w-4 h-4 text-[#0099FF]"/>Changer le mot de passe</h2>
                  <form onSubmit={changePw} className="space-y-4 max-w-sm">
                    <div><label className="text-xs text-[#94A3B8] mb-1 block">Mot de passe actuel</label>
                      <input type="password" className="input" value={pwForm.current} onChange={e=>setPwForm(f=>({...f,current:e.target.value}))} required/></div>
                    <div><label className="text-xs text-[#94A3B8] mb-1 block">Nouveau mot de passe</label>
                      <input type="password" className="input" value={pwForm.newPw} onChange={e=>setPwForm(f=>({...f,newPw:e.target.value}))} required minLength={8}/></div>
                    <div><label className="text-xs text-[#94A3B8] mb-1 block">Confirmer</label>
                      <input type="password" className="input" value={pwForm.confirm} onChange={e=>setPwForm(f=>({...f,confirm:e.target.value}))} required/></div>
                    <button type="submit" className="btn-primary flex items-center gap-2" disabled={pwSaving}>
                      <Key className="w-4 h-4"/>{pwSaving?'Changement...':'Changer le mot de passe'}
                    </button>
                  </form>
                </div>
              )}

              {active==='notifications'&&(
                <div className="card">
                  <h2 className="font-semibold text-[#F1F5F9] mb-5 flex items-center gap-2"><Bell className="w-4 h-4 text-[#0099FF]"/>Notifications</h2>
                  <div className="space-y-3">
                    {[
                      {label:'Nouveau utilisateur inscrit',desc:'Recevoir une alerte à chaque inscription'},
                      {label:'Quota critique (>90%)',desc:'Alerte quand le quota global dépasse 90%'},
                      {label:'Serveur hors ligne',desc:'Notification si un inbound tombe'},
                      {label:'Voucher utilisé',desc:'Alerte à chaque utilisation de voucher'},
                    ].map((n,i)=>(
                      <div key={i} className="flex items-center justify-between p-3 bg-[#0F1629] rounded-lg border border-[#1E2D45]">
                        <div><div className="text-sm text-[#F1F5F9]">{n.label}</div><div className="text-xs text-[#64748B]">{n.desc}</div></div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked={i<2} className="sr-only peer"/>
                          <div className="w-10 h-6 bg-[#1E2D45] peer-checked:bg-[#0099FF] rounded-full transition-colors peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"/>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
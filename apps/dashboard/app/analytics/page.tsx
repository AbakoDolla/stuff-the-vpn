'use client';
  import { useState, useEffect } from 'react';
  import DashboardLayout from '@/components/DashboardLayout';
  import { api } from '@/lib/api';
  import { formatGB } from '@/lib/utils';
  import { TrendingUp, TrendingDown, Activity, Database } from 'lucide-react';
  import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, Legend
  } from 'recharts';

  const DAYS_DATA = Array.from({length:14},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-13+i);
    return {
      day: d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'}),
      users: Math.floor(Math.random()*20+5),
      upload: Math.floor(Math.random()*500+100),
      download: Math.floor(Math.random()*2000+500),
      vouchers: Math.floor(Math.random()*15+2),
    };
  });

  const PROTOCOL_DATA = [
    {name:'VLESS',value:45,color:'#0099FF'},
    {name:'VMESS',value:25,color:'#00D4FF'},
    {name:'TROJAN',value:20,color:'#10B981'},
    {name:'SSH',value:10,color:'#F59E0B'},
  ];

  export default function AnalyticsPage() {
    const [period, setPeriod] = useState<'7d'|'14d'|'30d'>('14d');
    const shown = period === '7d' ? DAYS_DATA.slice(-7) : period === '14d' ? DAYS_DATA : DAYS_DATA;
    const totalUp = shown.reduce((s,d)=>s+d.upload,0);
    const totalDown = shown.reduce((s,d)=>s+d.download,0);
    const totalUsers = shown.reduce((s,d)=>s+d.users,0);
    const totalVouchers = shown.reduce((s,d)=>s+d.vouchers,0);

    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#F1F5F9]">Analytiques</h1>
              <p className="text-sm text-[#64748B]">Statistiques et tendances de la plateforme</p>
            </div>
            <div className="flex gap-1 bg-[#0F1629] border border-[#1E2D45] rounded-lg p-1">
              {(['7d','14d','30d'] as const).map(p=>(
                <button key={p} onClick={()=>setPeriod(p)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${period===p?'bg-[#0099FF] text-white':'text-[#94A3B8] hover:text-[#F1F5F9]'}`}>{p}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {label:'Nouveaux users',val:totalUsers,icon:TrendingUp,color:'text-[#0099FF]'},
              {label:'Upload total',val:formatGB(totalUp/1024),icon:Activity,color:'text-emerald-400'},
              {label:'Download total',val:formatGB(totalDown/1024),icon:Database,color:'text-[#00D4FF]'},
              {label:'Vouchers utilisés',val:totalVouchers,icon:TrendingDown,color:'text-amber-400'},
            ].map(s=>(
              <div key={s.label} className="card">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs text-[#64748B]">{s.label}</span>
                </div>
                <div className="text-2xl font-bold text-[#F1F5F9]">{s.val}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h2 className="text-sm font-semibold text-[#F1F5F9] mb-4">Trafic réseau (MB)</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={shown}>
                  <defs>
                    <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0099FF" stopOpacity={0.3}/><stop offset="95%" stopColor="#0099FF" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3}/><stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
                  <XAxis dataKey="day" tick={{fill:'#64748B',fontSize:10}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill:'#64748B',fontSize:10}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{background:'#141C2E',border:'1px solid #1E2D45',borderRadius:8,color:'#F1F5F9'}} />
                  <Area type="monotone" dataKey="upload" stroke="#0099FF" fill="url(#gU)" strokeWidth={2} name="Upload MB" />
                  <Area type="monotone" dataKey="download" stroke="#00D4FF" fill="url(#gD)" strokeWidth={2} name="Download MB" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h2 className="text-sm font-semibold text-[#F1F5F9] mb-4">Nouveaux utilisateurs & Vouchers</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={shown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
                  <XAxis dataKey="day" tick={{fill:'#64748B',fontSize:10}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill:'#64748B',fontSize:10}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{background:'#141C2E',border:'1px solid #1E2D45',borderRadius:8,color:'#F1F5F9'}} />
                  <Legend formatter={(v)=><span style={{color:'#94A3B8',fontSize:11}}>{v}</span>} />
                  <Bar dataKey="users" fill="#0099FF" radius={[4,4,0,0]} name="Utilisateurs" />
                  <Bar dataKey="vouchers" fill="#00D4FF" radius={[4,4,0,0]} name="Vouchers" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-[#F1F5F9] mb-4">Répartition des protocoles</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {PROTOCOL_DATA.map(p=>(
                <div key={p.name} className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-2">
                    <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1E2D45" strokeWidth="3"/>
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke={p.color} strokeWidth="3"
                        strokeDasharray={`${p.value} ${100-p.value}`} strokeLinecap="round"/>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{color:p.color}}>{p.value}%</div>
                  </div>
                  <div className="text-sm font-medium text-[#F1F5F9]">{p.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

  interface StatsCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: { value: number; label: string };
    color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  }

  const colors = {
    blue:   { icon: 'text-[#0099FF]', bg: 'bg-[#0099FF]/10', border: 'border-[#0099FF]/20' },
    green:  { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    amber:  { icon: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    red:    { icon: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    purple: { icon: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  };

  export default function StatsCard({ title, value, subtitle, icon: Icon, trend, color = 'blue' }: StatsCardProps) {
    const c = colors[color];
    return (
      <div className="card hover:border-[#0099FF]/30 transition-all duration-200 group">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', c.bg, c.border)}>
            <Icon className={cn('w-5 h-5', c.icon)} />
          </div>
          {trend && (
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', trend.value >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10')}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </span>
          )}
        </div>
        <div className="text-2xl font-bold text-[#F1F5F9] mb-0.5">{value}</div>
        <div className="text-sm text-[#94A3B8]">{title}</div>
        {subtitle && <div className="text-xs text-[#64748B] mt-1">{subtitle}</div>}
      </div>
    );
  }
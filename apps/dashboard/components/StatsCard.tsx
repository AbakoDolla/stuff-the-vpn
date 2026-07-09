'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  color?: 'primary' | 'accent' | 'green' | 'red' | 'yellow';
  prefix?: string;
  suffix?: string;
}

const colorMap = {
  primary: {
    bg: 'from-primary/20 to-primary/5',
    border: 'border-primary/20',
    text: 'text-primary',
    glow: 'rgba(0,212,255,0.15)',
  },
  accent: {
    bg: 'from-accent/20 to-accent/5',
    border: 'border-accent/20',
    text: 'text-accent',
    glow: 'rgba(124,58,237,0.15)',
  },
  green: {
    bg: 'from-green-500/20 to-green-500/5',
    border: 'border-green-500/20',
    text: 'text-green-400',
    glow: 'rgba(34,197,94,0.15)',
  },
  red: {
    bg: 'from-red-500/20 to-red-500/5',
    border: 'border-red-500/20',
    text: 'text-red-400',
    glow: 'rgba(239,68,68,0.15)',
  },
  yellow: {
    bg: 'from-yellow-500/20 to-yellow-500/5',
    border: 'border-yellow-500/20',
    text: 'text-yellow-400',
    glow: 'rgba(245,158,11,0.15)',
  },
};

export function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color = 'primary',
  prefix,
  suffix,
}: StatsCardProps) {
  const colors = colorMap[color];
  const isPositive = change && change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card-hover p-5 group cursor-pointer relative overflow-hidden"
    >
      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />

      {/* Glow effect on hover */}
      <div
        className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
        style={{ background: colors.glow }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {title}
          </span>
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.bg} border ${colors.border} flex items-center justify-center ${colors.text}`}
          >
            <Icon size={20} />
          </div>
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1 mb-2">
          {prefix && <span className="text-sm text-gray-500">{prefix}</span>}
          <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
          {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
        </div>

        {/* Change */}
        {change !== undefined && (
          <div className="flex items-center gap-1.5">
            <div
              className={`flex items-center gap-0.5 text-xs font-medium ${
                isPositive ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{Math.abs(change)}%</span>
            </div>
            {changeLabel && (
              <span className="text-xs text-gray-500">{changeLabel}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
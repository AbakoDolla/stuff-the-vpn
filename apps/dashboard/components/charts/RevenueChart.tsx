'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { month: 'Jan', revenue: 4200, prevRevenue: 3800 },
  { month: 'Fév', revenue: 5800, prevRevenue: 4100 },
  { month: 'Mar', revenue: 7500, prevRevenue: 5600 },
  { month: 'Avr', revenue: 9200, prevRevenue: 7200 },
  { month: 'Mai', revenue: 10800, prevRevenue: 8900 },
  { month: 'Juin', revenue: 12450, prevRevenue: 10500 },
];

export default function RevenueChart() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-200">Revenus Mensuels</h3>
          <p className="text-xs text-gray-500 mt-0.5">Comparaison année précédente</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-accent" />
            2026
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-primary/40" />
            2025
          </span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="month"
              stroke="#4B5563"
              tick={{ fill: '#6B7280', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="#4B5563"
              tick={{ fill: '#6B7280', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111522',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#9CA3AF' }}
              formatter={(value: number) => [`${value.toLocaleString()} €`]}
            />
            <Bar
              dataKey="prevRevenue"
              fill="#00D4FF"
              fillOpacity={0.2}
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar
              dataKey="revenue"
              fill="#7C3AED"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
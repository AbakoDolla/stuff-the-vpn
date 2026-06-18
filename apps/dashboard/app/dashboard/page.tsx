'use client';

import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  DollarSign,
  Activity,
  Server,
  Key,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';
import { ServerStatus } from '@/components/ServerStatus';
import { DataTable } from '@/components/DataTable';
import { VoucherGenerator } from '@/components/VoucherGenerator';
import dynamic from 'next/dynamic';

const DynamicLineChart = dynamic(
  () => import('@/components/charts/UserGrowthChart'),
  { ssr: false }
);

const DynamicRevenueChart = dynamic(
  () => import('@/components/charts/RevenueChart'),
  { ssr: false }
);

// Données mockées pour la table
const recentUsers = [
  { id: '1', phone: '+237 691 234 567', device: '3E9A-7C91-F2B8', status: 'Actif', server: 'EU-Frankfurt-01', traffic: '2.4 GB', expires: '15/07/2026' },
  { id: '2', phone: '+237 677 890 123', device: '8F2B-1A3C-9D7E', status: 'Actif', server: 'US-NewYork-01', traffic: '5.1 GB', expires: '20/07/2026' },
  { id: '3', phone: '+237 655 432 109', device: '4C5D-6E7F-8A9B', status: 'Suspendu', server: 'AS-Singapore-01', traffic: '0 GB', expires: '01/06/2026' },
  { id: '4', phone: '+237 698 765 432', device: '7D8E-9F0A-1B2C', status: 'Actif', server: 'EU-Paris-01', traffic: '1.2 GB', expires: '28/07/2026' },
  { id: '5', phone: '+237 612 345 678', device: '2A3B-4C5D-6E7F', status: 'Actif', server: 'EU-Frankfurt-01', traffic: '8.7 GB', expires: '10/08/2026' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Vue d'ensemble de votre plateforme VPN
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-xs text-gray-500">
            <span className="status-dot online" />
            Système opérationnel
          </span>
          <button className="btn-primary text-sm flex items-center gap-2">
            <ArrowUpRight size={16} />
            Exporter
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Utilisateurs Total"
          value="2,847"
          change={12.5}
          changeLabel="ce mois"
          icon={Users}
          color="primary"
        />
        <StatsCard
          title="Utilisateurs Actifs"
          value="1,923"
          change={8.2}
          changeLabel="cette semaine"
          icon={UserCheck}
          color="green"
        />
        <StatsCard
          title="Revenus Mensuels"
          value="12,450 €"
          change={15.3}
          changeLabel="vs mois dernier"
          icon={DollarSign}
          color="accent"
        />
        <StatsCard
          title="Traffic Total"
          value="2.4"
          suffix="TB"
          change={-3.1}
          changeLabel="cette semaine"
          icon={Activity}
          color="yellow"
        />
      </motion.div>

      {/* Secondary Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Serveurs en ligne"
          value="4/6"
          icon={Server}
          color="green"
        />
        <StatsCard
          title="Licences Actives"
          value="1,847"
          change={22.1}
          changeLabel="ce mois"
          icon={Key}
          color="primary"
        />
        <StatsCard
          title="Taux de Croissance"
          value="+18.4%"
          icon={TrendingUp}
          color="accent"
        />
      </motion.div>

      {/* Charts */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DynamicLineChart />
        <DynamicRevenueChart />
      </motion.div>

      {/* Server Status + Voucher Generator */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ServerStatus />
        </div>
        <div>
          <VoucherGenerator />
        </div>
      </motion.div>

      {/* Recent Users Table */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Derniers utilisateurs</h2>
          <button className="text-xs text-primary hover:text-primary/80 transition-colors">
            Voir tout →
          </button>
        </div>
        <DataTable
          columns={[
            { key: 'phone', label: 'Téléphone', sortable: true },
            { key: 'device', label: 'Appareil', sortable: true },
            {
              key: 'status',
              label: 'Statut',
              sortable: true,
              render: (item) => (
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.status === 'Actif'
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {item.status}
                </span>
              ),
            },
            { key: 'server', label: 'Serveur', sortable: true },
            { key: 'traffic', label: 'Traffic', sortable: true },
            { key: 'expires', label: 'Expire le', sortable: true },
          ]}
          data={recentUsers}
          searchPlaceholder="Rechercher un utilisateur..."
          onRowClick={(user) => console.log('User clicked:', user)}
        />
      </motion.div>
    </motion.div>
  );
}
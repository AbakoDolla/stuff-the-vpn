'use client';

// Simple i18n for FR/EN language switching
export type Lang = 'fr' | 'en';

const LANG_KEY = 'sxb_lang';

export function getLang(): Lang {
  if (typeof window === 'undefined') return 'fr';
  return (localStorage.getItem(LANG_KEY) as Lang) ?? 'fr';
}

export function setLang(lang: Lang) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LANG_KEY, lang);
  window.dispatchEvent(new CustomEvent('lang-change', { detail: lang }));
}

export const t: Record<Lang, Record<string, string>> = {
  fr: {
    dashboard: 'Tableau de bord',
    analytics: 'Statistiques',
    users: 'Utilisateurs',
    devices: 'Appareils',
    tokens: 'Tokens mobiles',
    quotas: 'Quotas & Données',
    inbounds: 'Inbounds VPN',
    vpnProfiles: 'Profils VPN',
    servers: 'Serveurs',
    licenses: 'Licences',
    vouchers: 'Vouchers',
    payments: 'Paiements',
    tickets: 'Tickets support',
    audit: 'Journaux d\'audit',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    overview: 'Vue d\'ensemble',
    usersSection: 'Utilisateurs',
    vpn: 'VPN',
    commercial: 'Commercial',
    admin: 'Administration',
    refresh: 'Actualiser',
    loading: 'Chargement…',
    noData: 'Aucune donnée',
    active: 'Actif',
    inactive: 'Inactif',
    total: 'Total',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    generate: 'Générer',
    search: 'Rechercher…',
    adminPanel: 'Panneau d\'administration',
    sxbTitle: 'SXB VPN — Dashboard',
  },
  en: {
    dashboard: 'Dashboard',
    analytics: 'Analytics',
    users: 'Users',
    devices: 'Devices',
    tokens: 'Mobile Tokens',
    quotas: 'Quotas & Data',
    inbounds: 'VPN Inbounds',
    vpnProfiles: 'VPN Profiles',
    servers: 'Servers',
    licenses: 'Licenses',
    vouchers: 'Vouchers',
    payments: 'Payments',
    tickets: 'Support Tickets',
    audit: 'Audit Logs',
    settings: 'Settings',
    logout: 'Logout',
    overview: 'Overview',
    usersSection: 'Users',
    vpn: 'VPN',
    commercial: 'Commercial',
    admin: 'Administration',
    refresh: 'Refresh',
    loading: 'Loading…',
    noData: 'No data',
    active: 'Active',
    inactive: 'Inactive',
    total: 'Total',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    generate: 'Generate',
    search: 'Search…',
    adminPanel: 'Administration Panel',
    sxbTitle: 'SXB VPN — Dashboard',
  },
};

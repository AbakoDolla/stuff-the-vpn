'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, User, ChevronDown, Settings, LogOut, Menu, Globe, Check, X,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { api } from '@/lib/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface TopbarProps {
  user?: { username?: string; email?: string; role?: string };
  onMenuToggle?: () => void;
  onLogout?: () => void;
}

export function Topbar({ user, onMenuToggle, onLogout }: TopbarProps = {}) {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const { lang, toggleLang, tr } = useLanguage();

  const fetchNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const res = await api.get('/notifications') as { data: { data?: Notification[]; success?: boolean; message?: string } | Notification[] };
      let notifData: Notification[] = [];
      
      // Handle different response formats
      if (Array.isArray(res.data)) {
        notifData = res.data;
      } else if (res.data && typeof res.data === 'object' && 'data' in res.data && Array.isArray(res.data.data)) {
        notifData = res.data.data;
      }
      
      setNotifications(notifData.slice(0, 10));
    } catch {
      // Silently fail
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    if (showNotifications && notifications.length === 0) {
      fetchNotifications();
    }
  }, [showNotifications, notifications.length, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  function roleLabel(role?: string) {
    const map: Record<string, Record<string, string>> = {
      SUPER_ADMIN: { fr: 'Super Admin', en: 'Super Admin' },
      ADMIN:       { fr: 'Administrateur', en: 'Administrator' },
      SUPPORT:     { fr: 'Support', en: 'Support' },
    };
    return map[role ?? '']?.[lang] ?? role ?? 'Admin';
  }

  return (
    <header className="sticky top-0 z-30 bg-[#0A0F1E]/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center justify-between h-14 px-3 sm:px-5 gap-2">

        {/* Left — hamburger (mobile only) + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-white hidden sm:block truncate">
            {tr.sxbTitle}
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Language switcher */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleLang}
            title={lang === 'fr' ? 'Switch to English' : 'Passer en Français'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all text-xs font-semibold"
          >
            <Globe size={14} />
            <span>{lang === 'fr' ? 'FR' : 'EN'}</span>
          </motion.button>

          {/* Notifications */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-[#111827] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">{lang === 'fr' ? 'Notifications' : 'Notifications'}</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <Check size={12} />
                        {lang === 'fr' ? 'Tout lire' : 'Mark all read'}
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {loadingNotifs ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        {lang === 'fr' ? 'Chargement...' : 'Loading...'}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        {lang === 'fr' ? 'Aucune notification' : 'No notifications'}
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${!notif.isRead ? 'bg-white/5' : ''}`}
                        >
                          <div className="flex items-start gap-2">
                            {!notif.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{notif.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                              <p className="text-[10px] text-gray-500 mt-1">
                                {new Date(notif.createdAt).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile dropdown */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center shrink-0">
                <User size={14} className="text-white" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-gray-200 leading-tight">{user?.username ?? 'Admin'}</p>
                <p className="text-[10px] text-gray-500 leading-tight">{roleLabel(user?.role)}</p>
              </div>
              <ChevronDown
                size={13}
                className={`text-gray-500 transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`}
              />
            </motion.button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-[#111827] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-sm font-semibold text-white truncate">{user?.username ?? 'Admin'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email ?? ''}</p>
                    <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">
                      {roleLabel(user?.role)}
                    </span>
                  </div>
                  {/* Actions */}
                  <div className="p-1">
                    <button
                      onClick={() => { setShowProfile(false); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Settings size={14} />
                      <span>{tr.settings}</span>
                    </button>
                    <button
                      onClick={() => { setShowProfile(false); onLogout?.(); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                    >
                      <LogOut size={14} />
                      <span>{tr.logout}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

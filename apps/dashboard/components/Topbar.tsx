'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Moon,
  Sun,
  User,
  ChevronDown,
  Settings,
  LogOut,
  HelpCircle,
} from 'lucide-react';

export function Topbar() {
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <header className="sticky top-0 z-40 bg-dark-200/60 backdrop-blur-xl border-b border-surface-light">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Rechercher un utilisateur, serveur..."
              className="w-full pl-10 pr-4 py-2 bg-dark-100 border border-surface-light rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 bg-dark-50 px-1.5 py-0.5 rounded border border-surface-light">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg bg-surface hover:bg-surface-hover text-gray-400 hover:text-white transition-all duration-200"
          >
            {darkMode ? <Moon size={18} /> : <Sun size={18} />}
          </motion.button>

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 rounded-lg bg-surface hover:bg-surface-hover text-gray-400 hover:text-white transition-all duration-200"
          >
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
              3
            </span>
          </motion.button>

          {/* Profile */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-3 p-1.5 pr-3 rounded-lg bg-surface hover:bg-surface-hover transition-all duration-200"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-gray-200">Admin</p>
                <p className="text-[10px] text-gray-500">Super Admin</p>
              </div>
              <ChevronDown
                size={14}
                className={`text-gray-500 transition-transform duration-200 ${
                  showProfile ? 'rotate-180' : ''
                }`}
              />
            </motion.button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 glass-card p-2 shadow-2xl"
                >
                  <div className="px-3 py-2 border-b border-surface-light mb-2">
                    <p className="text-sm font-medium text-gray-200">Administrateur</p>
                    <p className="text-xs text-gray-500">admin@stuffvpn.com</p>
                  </div>
                  <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-hover transition-all text-sm">
                    <Settings size={16} />
                    Paramètres
                  </button>
                  <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-hover transition-all text-sm">
                    <HelpCircle size={16} />
                    Aide
                  </button>
                  <hr className="border-surface-light my-1" />
                  <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm">
                    <LogOut size={16} />
                    Déconnexion
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Bell,
  Sun,
  Moon,
  Search,
  LogOut,
  User,
  Shield,
  Sparkles,
  ChevronDown
} from 'lucide-react';

export function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile sidebar trigger & Brand */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <Link to={user?.role === 'admin' ? '/admin' : '/student'} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="font-extrabold text-lg leading-none tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                QueueSense <span className="text-blue-600 dark:text-blue-400 text-xs px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 font-semibold border border-blue-200 dark:border-blue-800">AI</span>
              </div>
              <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Saveetha Engineering College</span>
            </div>
          </Link>
        </div>

        {/* Center: Search input */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search queue records, student IDs, camera feeds..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white rounded-xl border border-slate-200/80 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Toggle Dark/Light Theme"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900 animate-ping" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600" />
            </button>

            {/* Quick Notif Dropdown */}
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Notifications</span>
                  <Link
                    to={user?.role === 'admin' ? '/admin' : '/student/notifications'}
                    onClick={() => setNotifOpen(false)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    View All
                  </Link>
                </div>
                <div className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 text-xs">
                    <p className="font-semibold text-blue-900 dark:text-blue-300">🎉 Monthly Reward Status</p>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">Discipline score evaluated for reward eligibility.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 text-xs">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-300">✅ Line Compliance Verified</p>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">Saveetha Main Canteen Camera #01 active.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 p-1.5 pl-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200/60 dark:border-slate-700/60"
            >
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
                alt={user?.name || 'User'}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-blue-500/30"
              />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user?.name || 'User'}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{user?.role === 'admin' ? 'Administrator' : 'Student (Read-Only)'}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-2 z-50">
                <div className="p-3 border-b border-slate-100 dark:border-slate-700 mb-1">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email || user?.registerNumber || 'Saveetha Eng. College'}</p>
                </div>
                
                {user?.role === 'student' && (
                  <Link
                    to="/student/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition"
                  >
                    <User className="w-4 h-4 text-blue-500" /> View Student ID Card
                  </Link>
                )}

                {user?.role === 'admin' && (
                  <Link
                    to="/admin/database"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition"
                  >
                    <Shield className="w-4 h-4 text-indigo-500" /> Manage Student Database
                  </Link>
                )}

                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

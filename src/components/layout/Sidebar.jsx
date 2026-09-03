import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Video,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Sparkles,
  Award,
  ChevronRight,
  Database
} from 'lucide-react';

export function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Live Camera', icon: Video, path: '/admin/live', badge: 'LIVE' },
    { label: 'Student Database', icon: Database, path: '/admin/database' },
    { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
    { label: 'Reports', icon: FileText, path: '/admin/reports' },
    { label: 'Settings', icon: Settings, path: '/admin/settings' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs lg:hidden z-40"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-transform duration-300 ease-in-out flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Header */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-base leading-none text-slate-900 dark:text-white">
                QueueSense AI
              </div>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">Admin Control Center</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase">
              Main Menu
            </div>

            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-red-500 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer info box */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/60 border border-blue-100 dark:border-slate-700/60">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Active Rule Set</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Max: 50 Pts | Deduct: 15 Pts | Threshold: 90
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-between w-full px-3.5 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
}

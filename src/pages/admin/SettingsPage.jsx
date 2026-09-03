import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Settings,
  Award,
  Shield,
  UserCheck,
  Save,
  UserPlus,
  Trash2,
  Lock,
  Mail,
  Building,
  Key,
  ShieldCheck,
  Camera,
  CheckCircle2,
} from 'lucide-react';

export function SettingsPage() {
  const { user, adminsList, addAdmin, updateAdminProfile, deleteAdmin } = useAuth();
  const { addToast } = useToast();

  // Scoring Rules State
  const [maxReward, setMaxReward] = useState(50);
  const [weeklyDeduction, setWeeklyDeduction] = useState(15);
  const [minScore, setMinScore] = useState(90);

  // Admin Profile Edit State
  const [profileForm, setProfileForm] = useState({
    id: user?.id || '212224040141',
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    password: user?.password || 'john24',
    avatar: user?.avatar || '',
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);

  // Keep profileForm in sync if user object updates
  useEffect(() => {
    if (user) {
      setProfileForm({
        id: user.id || '212224040141',
        name: user.name || '',
        email: user.email || '',
        department: user.department || '',
        password: user.password || 'john24',
        avatar: user.avatar || '',
      });
      setAvatarPreview(user.avatar || null);
    }
  }, [user]);

  // Add New Admin Modal State
  const [newAdminModal, setNewAdminModal] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({
    id: '',
    name: '',
    email: '',
    department: 'Campus Security & Discipline',
    password: '',
  });

  const handleSaveRules = (e) => {
    e.preventDefault();
    addToast('Reward system configuration updated successfully!', 'success', 'Settings Saved');
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.password) {
      addToast('Name and Password cannot be empty.', 'danger', 'Validation Error');
      return;
    }
    updateAdminProfile(profileForm);
    addToast('Your Administrator profile was updated successfully!', 'success', 'Profile Updated');
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);
      setProfileForm(prev => ({ ...prev, avatar: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreateAdmin = (e) => {
    e.preventDefault();
    if (!newAdminForm.id.trim() || !newAdminForm.password || !newAdminForm.name.trim()) {
      addToast('Please provide Admin ID, Name, and Password.', 'danger', 'Missing Info');
      return;
    }

    addAdmin(newAdminForm);
    addToast(`New Administrator "${newAdminForm.name}" created with ID: ${newAdminForm.id}!`, 'success', 'Admin Added');
    setNewAdminForm({ id: '', name: '', email: '', department: 'Campus Security & Discipline', password: '' });
    setNewAdminModal(false);
  };

  const handleDeleteAdmin = (adminId, adminName) => {
    if (adminId === '212224040141') {
      addToast('The Primary Root Admin cannot be deleted.', 'warning', 'Protected Account');
      return;
    }
    deleteAdmin(adminId);
    addToast(`Admin "${adminName}" removed successfully.`, 'info', 'Admin Removed');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Admin System & Account Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Saveetha Engineering College • Manage profile details, administrator accounts & scoring rules
        </p>
      </div>

      {/* 1. Edit Admin Profile Card */}
      <Card>
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Edit Your Admin Profile</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Update your name, email, department, password & avatar</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-4">
            <div className="relative group">
              <img
                src={avatarPreview || user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300'}
                alt={user?.name}
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-blue-500/30 bg-slate-800 shadow-md"
              />
              <label className="absolute inset-0 bg-black/60 text-white rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold">
                <Camera className="w-5 h-5 mb-1" /> Change
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Admin ID (Login Username)</label>
                <input
                  type="text"
                  required
                  value={profileForm.id}
                  onChange={e => setProfileForm(p => ({ ...p, id: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Admin Password</label>
                <input
                  type="text"
                  required
                  value={profileForm.password}
                  onChange={e => setProfileForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-700">
            <Button type="submit" variant="primary" icon={Save}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* 2. Administrator Access & Management Card */}
      <Card>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">Admin Accounts Roster</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage all staff members with Administrator login privileges</p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={UserPlus}
            onClick={() => setNewAdminModal(true)}
          >
            Add New Admin
          </Button>
        </div>

        <div className="space-y-3">
          {(adminsList || []).map((adm) => (
            <div
              key={adm.id}
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-150 dark:border-slate-700 hover:border-blue-400 transition"
            >
              <div className="flex items-center gap-3">
                <img
                  src={adm.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300'}
                  alt={adm.name}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-500/30"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{adm.name}</h3>
                    {adm.id === '212224040141' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 border border-amber-300 dark:border-amber-800">
                        Root Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    ID: <span className="text-blue-600 dark:text-blue-400 font-bold">{adm.id}</span> • Pass: {adm.password} • {adm.email}
                  </p>
                </div>
              </div>

              {adm.id !== '212224040141' && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => handleDeleteAdmin(adm.id, adm.name)}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 3. Reward & Penalty Scoring Rules Card */}
      <Card>
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Reward & Penalty Thresholds</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Parameters governing monthly student reward points</p>
          </div>
        </div>

        <form onSubmit={handleSaveRules} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Maximum Monthly Reward
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={maxReward}
                  onChange={(e) => setMaxReward(Number(e.target.value))}
                  className="w-full pl-4 pr-16 py-2.5 text-sm font-bold bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Points</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Weekly Queue Violation Penalty
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={weeklyDeduction}
                  onChange={(e) => setWeeklyDeduction(Number(e.target.value))}
                  className="w-full pl-4 pr-16 py-2.5 text-sm font-bold bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Points</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Minimum Queue Score for Reward
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full pl-4 pr-16 py-2.5 text-sm font-bold bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">/ 100</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button type="submit" variant="primary" icon={Save}>
              Save Scoring Rules
            </Button>
          </div>
        </form>
      </Card>

      {/* Add Admin Modal */}
      <Modal
        isOpen={newAdminModal}
        onClose={() => setNewAdminModal(false)}
        title="Add New Administrator Account"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Admin Login ID *
            </label>
            <input
              type="text"
              required
              value={newAdminForm.id}
              onChange={e => setNewAdminForm(p => ({ ...p, id: e.target.value }))}
              placeholder="e.g. 212224040150 or admin_dean"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Administrator Name *
            </label>
            <input
              type="text"
              required
              value={newAdminForm.name}
              onChange={e => setNewAdminForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Prof. Anand Kumar"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={newAdminForm.email}
              onChange={e => setNewAdminForm(p => ({ ...p, email: e.target.value }))}
              placeholder="e.g. anand.discipline@saveetha.ac.in"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Login Password *
            </label>
            <input
              type="text"
              required
              value={newAdminForm.password}
              onChange={e => setNewAdminForm(p => ({ ...p, password: e.target.value }))}
              placeholder="Set secure password"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
            <Button variant="ghost" type="button" onClick={() => setNewAdminModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" icon={UserPlus}>Create Admin</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

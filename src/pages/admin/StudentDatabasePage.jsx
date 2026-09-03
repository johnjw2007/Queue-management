import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudentDB } from '../../context/StudentDBContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  UserPlus, Search, Edit3, Trash2, Key, Camera,
  UploadCloud, X, Eye, EyeOff, Users, ShieldCheck
} from 'lucide-react';

// ─── Student Form Modal (Add / Edit) ─────────────────────────────────────────
function StudentFormModal({ isOpen, onClose, editStudent = null }) {
  const { addStudent, updateStudent } = useStudentDB();
  const { addToast } = useToast();
  const isEdit = !!editStudent;

  const blank = {
    name: '', registerNumber: '', department: '', email: '', phone: '',
    username: '', password: '', queueScore: 80, monthlyRewardPoints: 0, facePhoto: null,
  };
  const [form, setForm] = useState(blank);
  const [showPass, setShowPass] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (isEdit) {
        setForm({ ...editStudent, password: editStudent.password || '' });
        setPhotoPreview(editStudent.facePhoto || editStudent.avatar || null);
      } else {
        setForm(blank);
        setPhotoPreview(null);
      }
    }
  }, [isOpen, editStudent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Auto-generate username from name
    if (name === 'name') {
      setForm(prev => ({ ...prev, name: value, username: value.toLowerCase().replace(/\s+/g, '.') }));
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result);
      setForm(prev => ({ ...prev, facePhoto: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.registerNumber || !form.username || !form.password) {
      addToast('Please fill in all required fields.', 'danger', 'Validation Error');
      return;
    }
    if (isEdit) {
      updateStudent(editStudent.id, { ...form, avatar: form.facePhoto || editStudent.avatar });
      addToast(`Student "${form.name}" updated successfully.`, 'success', 'Student Updated');
    } else {
      addStudent({ ...form, avatar: form.facePhoto || null });
      addToast(`Student "${form.name}" added to database.`, 'success', 'Student Added');
    }
    onClose();
  };

  const departments = [
    'Computer Science & Engineering',
    'Information Technology',
    'Artificial Intelligence & Data Science',
    'Electronics & Communication Engineering',
    'Electrical & Electronics Engineering',
    'Biotechnology',
    'Biomedical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Robotics & Automation',
    'Management Studies'
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Student Record' : 'Add New Student'} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Face Photo Upload */}
        <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border-2 border-dashed border-slate-200 dark:border-slate-600">
          {photoPreview ? (
            <div className="relative">
              <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-2xl object-cover ring-4 ring-blue-500/30" />
              <button type="button" onClick={() => { setPhotoPreview(null); setForm(p => ({ ...p, facePhoto: null })); }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
              <Camera className="w-10 h-10" />
            </div>
          )}
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow-md">
              <UploadCloud className="w-4 h-4" />
              {photoPreview ? 'Change Face Photo' : 'Upload Face Photo'}
            </span>
          </label>
          <p className="text-[11px] text-slate-400">This photo will be used for AI face detection in the live camera feed.</p>
        </div>

        {/* Student Info Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Full Name *', name: 'name', placeholder: 'e.g. Alex Morgan', required: true },
            { label: 'Register Number *', name: 'registerNumber', placeholder: 'e.g. 2024CS1092', required: true },
            { label: 'Email Address', name: 'email', placeholder: 'student@college.edu', type: 'email' },
            { label: 'Phone Number', name: 'phone', placeholder: '+1 (555) 000-0000' },
          ].map(field => (
            <div key={field.name}>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">{field.label}</label>
              <input
                type={field.type || 'text'}
                name={field.name}
                value={form[field.name] || ''}
                onChange={handleChange}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Department *</label>
            <input
              type="text"
              name="department"
              list="department-suggestions"
              value={form.department || ''}
              onChange={handleChange}
              placeholder="Type department (e.g. Computer Science, AI & DS)"
              required
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
            <datalist id="department-suggestions">
              {departments.map(d => <option key={d.id || d} value={d.name || d} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Queue Score (0–100)</label>
            <input
              type="number" name="queueScore" min={0} max={100}
              value={form.queueScore} onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Credentials Section */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-extrabold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Login Credentials</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Username *</label>
              <input
                type="text" name="username"
                value={form.username || ''}
                onChange={handleChange}
                placeholder="e.g. alex.morgan"
                required
                className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Password *</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password || ''}
                  onChange={handleChange}
                  placeholder="Set password"
                  required
                  className="w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">
            {isEdit ? 'Save Changes' : 'Add Student to Database'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({ isOpen, onClose, student }) {
  const { updateStudent } = useStudentDB();
  const { addToast } = useToast();
  const [newPass, setNewPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleReset = (e) => {
    e.preventDefault();
    if (!newPass.trim()) return;
    updateStudent(student.id, { password: newPass });
    addToast(`Password reset for ${student.name}.`, 'success', 'Password Updated');
    setNewPass('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Reset Password — ${student?.name}`} maxWidth="max-w-sm">
      <form onSubmit={handleReset} className="space-y-4">
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300 font-semibold">
          ⚠️ This will immediately change the student's login password.
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">New Password</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="Enter new password"
              required
              autoFocus
              className="w-full pl-3 pr-10 py-2 text-sm bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
            <button type="button" onClick={() => setShowPass(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="danger">Reset Password</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Student Database Page ───────────────────────────────────────────────
export function StudentDatabasePage() {
  const { students, deleteStudent, loading, cloudConnected, fetchCloudData } = useStudentDB();
  const { addToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchCloudData();
      addToast('Student database synced from cloud.', 'success', 'Synced');
    } catch {
      addToast('Could not reach cloud database.', 'danger', 'Sync Failed');
    } finally {
      setRefreshing(false);
    }
  };

  const departments = [...new Set(students.map(s => s.department).filter(Boolean))];

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = (s.name || '').toLowerCase().includes(q) ||
      (s.registerNumber || '').toLowerCase().includes(q) ||
      (s.username || '').toLowerCase().includes(q);
    const matchDept = deptFilter === 'all' || s.department === deptFilter;
    return matchSearch && matchDept;
  });

  const handleDelete = (student) => {
    deleteStudent(student.id);
    setDeleteConfirm(null);
    addToast(`"${student.name}" removed from database.`, 'danger', 'Student Deleted');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-7 h-7 text-blue-600" /> Student Database
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
              cloudConnected ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {cloudConnected ? 'Cloud Synced' : 'Local Mode'}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Centralized database of students, credentials, and facial profiles synced across all devices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleManualRefresh}
            disabled={loading || refreshing}
            className="text-xs"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading || refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            {loading || refreshing ? 'Syncing...' : 'Sync Cloud'}
          </Button>
          <Button variant="primary" icon={UserPlus} onClick={() => setAddOpen(true)}>
            Add New Student
          </Button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: students.length, color: 'text-blue-600' },
          { label: 'Eligible (≥90)', value: students.filter(s => s.queueScore >= 90).length, color: 'text-emerald-600' },
          { label: 'With Face Photo', value: students.filter(s => s.facePhoto).length, color: 'text-indigo-600' },
          { label: 'Departments', value: departments.length, color: 'text-amber-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
            <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm p-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, reg no, or username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="all">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase border-b border-slate-100 dark:border-slate-700">
                <th className="pb-3">Face & Name</th>
                <th className="pb-3">Register No.</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Username</th>
                <th className="pb-3">Queue Score</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
              <AnimatePresence>
                {filtered.map(stu => (
                  <motion.tr
                    key={stu.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition"
                  >
                    {/* Face + Name */}
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {(stu.facePhoto || stu.avatar) ? (
                            <img
                              src={stu.facePhoto || stu.avatar}
                              alt={stu.name}
                              className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-500/20"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 font-black text-base">
                              {stu.name?.charAt(0) || 'S'}
                            </div>
                          )}
                          {stu.facePhoto && (
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800 flex items-center justify-center">
                              <ShieldCheck className="w-2.5 h-2.5 text-white" />
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{stu.name}</div>
                          <div className="text-[11px] text-slate-400">{stu.email || '—'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Reg No */}
                    <td className="py-3.5 font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {stu.registerNumber}
                    </td>

                    {/* Department */}
                    <td className="py-3.5 text-slate-600 dark:text-slate-300">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-xs font-semibold">
                        {stu.department || '—'}
                      </span>
                    </td>

                    {/* Username */}
                    <td className="py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                      @{stu.username || '—'}
                    </td>

                    {/* Queue Score */}
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-sm ${
                          stu.queueScore >= 90 ? 'text-emerald-600' :
                          stu.queueScore >= 75 ? 'text-blue-600' :
                          stu.queueScore >= 60 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {stu.queueScore}
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              stu.queueScore >= 90 ? 'bg-emerald-500' :
                              stu.queueScore >= 75 ? 'bg-blue-500' :
                              stu.queueScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, stu.queueScore)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        stu.currentQueueStatus === 'Skipped Line' || stu.currentQueueStatus === 'Left Early'
                          ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800'
                          : stu.queueScore >= 90
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          stu.currentQueueStatus === 'Skipped Line' ? 'bg-red-500' :
                          stu.queueScore >= 90 ? 'bg-emerald-500' : 'bg-blue-500'
                        }`} />
                        {stu.currentQueueStatus || 'In Proper Line'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="Edit Student"
                          onClick={() => setEditTarget(stu)}
                          className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          title="Reset Password"
                          onClick={() => setResetTarget(stu)}
                          className="p-2 rounded-xl text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          title="Delete Student"
                          onClick={() => setDeleteConfirm(stu)}
                          className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {loading && students.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Connecting to Cloud Database...</div>
                      <p className="text-xs text-slate-400 max-w-sm">Fetching centralized student records and live profiles from Supabase Cloud.</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                      <div>No students match your query.</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Button variant="outline" size="sm" onClick={handleManualRefresh}>
                          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Re-sync Cloud
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
                          <UserPlus className="w-3.5 h-3.5 mr-1" /> Add Student
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <StudentFormModal
        isOpen={addOpen || !!editTarget}
        onClose={() => { setAddOpen(false); setEditTarget(null); }}
        editStudent={editTarget}
      />

      {/* Reset Password Modal */}
      {resetTarget && (
        <ResetPasswordModal
          isOpen={!!resetTarget}
          onClose={() => setResetTarget(null)}
          student={resetTarget}
        />
      )}

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Student Record"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-semibold">
            ⚠️ This action cannot be undone. The student and all associated data will be permanently removed.
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-200">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => handleDelete(deleteConfirm)}>Yes, Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

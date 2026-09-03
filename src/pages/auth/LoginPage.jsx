import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useStudentDB } from '../../context/StudentDBContext';
import { useToast } from '../../context/ToastContext';
import { Sparkles, Shield, User, Lock, ArrowRight } from 'lucide-react';
import { Button } from '../../components/common/Button';

export function LoginPage() {
  const [role, setRole] = useState('student'); // 'student' | 'admin'
  const [idInput, setIdInput] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const { user, loginAsStudent, loginAsAdmin, authenticateAdmin } = useAuth();
  const { authenticateStudent } = useStudentDB();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!idInput.trim() || !password) {
      addToast('Please enter your credentials.', 'warning', 'Required');
      return;
    }

    if (role === 'student') {
      const student = await authenticateStudent(idInput.trim(), password);
      if (student) {
        loginAsStudent(student, rememberMe);
        addToast(`Welcome back, ${student.name}!`, 'success', 'Logged In');
        navigate('/student');
      } else {
        addToast('Invalid Student ID or password.', 'danger', 'Login Failed');
      }
    } else {
      // Dynamic Admin Authentication against configured Admins
      const verifiedAdmin = authenticateAdmin(idInput.trim(), password);
      if (verifiedAdmin) {
        loginAsAdmin(verifiedAdmin, rememberMe);
        addToast(`Welcome, ${verifiedAdmin.name}!`, 'success', 'Admin Authenticated');
        navigate('/admin');
      } else {
        addToast('Invalid Admin ID or password.', 'danger', 'Access Denied');
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Animated Particle Glows */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 50, 0],
          y: [0, -30, 0]
        }}
        transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
        className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/30 rounded-full blur-[120px] pointer-events-none"
      />

      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -40, 0],
          y: [0, 40, 0]
        }}
        transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
        className="absolute bottom-10 -right-20 w-[30rem] h-[30rem] bg-indigo-600/25 rounded-full blur-[140px] pointer-events-none"
      />

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 shadow-2xl"
      >
        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-bold mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            Saveetha Engineering College
          </div>

          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">QueueSense AI</h1>
          </div>
          <p className="text-xs text-slate-400">Campus Queue Discipline & Live Surveillance Portal</p>
        </div>

        {/* Role Toggle Switch */}
        <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => { setRole('student'); setIdInput(''); setPassword(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              role === 'student'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" /> Student Login
          </button>
          <button
            type="button"
            onClick={() => { setRole('admin'); setIdInput(''); setPassword(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              role === 'admin'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" /> Admin Login
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {role === 'student' ? 'Student Register Number / ID' : 'Admin ID'}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                autoComplete="off"
                value={idInput}
                onChange={(e) => setIdInput(e.target.value)}
                placeholder=""
                className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <span>Remember Me</span>
            </label>

            <button
              type="button"
              onClick={() => addToast('Please contact the campus administrator to reset your credentials.', 'info', 'Forgot Password')}
              className="text-blue-400 hover:underline font-semibold"
            >
              Forgot Password?
            </button>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full mt-2" icon={ArrowRight}>
            Sign In to {role === 'student' ? 'Student Portal' : 'Admin Control Center'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

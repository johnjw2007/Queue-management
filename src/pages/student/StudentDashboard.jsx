import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useStudentDB } from '../../context/StudentDBContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { StatusChip } from '../../components/common/StatusChip';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Button } from '../../components/common/Button';
import {
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  Bell,
  ChevronRight,
  MapPin,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function StudentDashboard() {
  const { user } = useAuth();
  const { students, violations } = useStudentDB();
  const { permissionStatus, requestPushPermission } = useToast();

  // Retrieve current student's live data from real-time database context
  const currentStudent = students.find(s => 
    (s.id && user?.id && s.id === user.id) || 
    (s.registerNumber && user?.registerNumber && s.registerNumber === user.registerNumber) ||
    (s.name && user?.name && s.name.toLowerCase() === user.name.toLowerCase())
  ) || user;

  const score = currentStudent?.queueScore ?? 80;
  const rewardPoints = currentStudent?.monthlyRewardPoints ?? 0;
  const maxPoints = currentStudent?.maxMonthlyReward ?? 50;
  const isEligible = score >= 90;
  const weeklyDeduction = currentStudent?.weeklyDeduction ?? 0;

  // Filter dynamic violations strictly for this student
  const studentViolations = (violations || []).filter(v => {
    if (!v) return false;
    const vStuId = v.student_id || v.studentId;
    const vReg = v.register_number || v.registerNumber;
    const vName = v.student_name || v.studentName;

    const matchesId = vStuId && (vStuId === currentStudent?.id || vStuId === user?.id);
    const matchesReg = vReg && (vReg === currentStudent?.registerNumber || vReg === user?.registerNumber);
    const matchesName = vName && currentStudent?.name && vName.toLowerCase().trim() === currentStudent.name.toLowerCase().trim();

    return matchesId || matchesReg || matchesName;
  });

  const getScoreStatus = (s) => {
    if (s >= 90) return { label: 'Excellent', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40' };
    if (s >= 75) return { label: 'Good', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40' };
    return { label: 'Needs Improvement', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/40' };
  };

  const statusInfo = getScoreStatus(score);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-500/15 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={currentStudent?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
              alt={currentStudent?.name}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/20 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight">Welcome back, {currentStudent?.name}! 👋</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md">
                  {currentStudent?.department || 'Department'}
                </span>
              </div>
              <p className="text-blue-100 text-sm mt-1">
                Reg No: <span className="font-mono font-semibold">{currentStudent?.registerNumber}</span> • Saveetha Engineering College
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15">
            <ShieldCheck className="w-8 h-8 text-emerald-300 shrink-0" />
            <div>
              <div className="text-xs text-blue-100 font-medium">Monthly Status</div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                {isEligible ? 'Eligible for 50 Pts Reward' : 'Score Below 90 Threshold'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 4 Primary Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Queue Score Card */}
        <Card className="relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Queue Score
            </span>
            <div className={`p-2 rounded-xl ${statusInfo.bg}`}>
              <TrendingUp className={`w-4 h-4 ${statusInfo.color}`} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{score}</span>
            <span className="text-sm font-semibold text-slate-400">/ 100</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <span className={`text-xs font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
            <span className="text-[11px] text-slate-400 font-medium">
              {weeklyDeduction > 0 ? `-${weeklyDeduction} pts this week` : 'No penalties this week'}
            </span>
          </div>
        </Card>

        {/* Card 2: Monthly Reward Points */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Monthly Reward Points
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{rewardPoints}</span>
            <span className="text-sm font-semibold text-slate-400">/ {maxPoints} Max</span>
          </div>
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <ProgressBar value={rewardPoints} max={maxPoints} color="bg-amber-500" />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Progress</span>
              <span>{Math.round((rewardPoints / maxPoints) * 100)}%</span>
            </div>
          </div>
        </Card>

        {/* Card 3: Reward Eligibility */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Reward Eligibility
            </span>
            <div className={`p-2 rounded-xl ${isEligible ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500' : 'bg-red-50 dark:bg-red-950/40 text-red-500'}`}>
              {isEligible ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
          </div>
          <div className="mb-2">
            <span className={`text-xl font-extrabold ${isEligible ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {isEligible ? 'Eligible (50 Pts)' : 'Not Eligible'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60">
            {isEligible ? 'Criteria met: Score ≥ 90 maintained.' : `Requires score ≥ 90 (Current: ${score}).`}
          </p>
        </Card>

        {/* Card 4: CCTV Detection Status */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Live Queue Status
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mb-2">
            <StatusChip status={studentViolations.length > 0 ? 'Violation Recorded' : (currentStudent?.currentQueueStatus || 'Proper Queue')} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60 font-mono">
            {studentViolations.length > 0 ? `${studentViolations.length} total infraction(s) logged` : 'Zero infractions recorded'}
          </p>
        </Card>
      </div>

      {/* Automated Contact Warning Notice Banner */}
      <Card className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-800/80">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                Automated SMS & Phone Pop-up Warning System Active
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h3>
              <p className="text-xs text-slate-300">
                Line discipline infractions detected by Saveetha CCTV vision nodes trigger immediate SMS warnings to your registered contact number <span className="font-mono text-white font-bold">({currentStudent?.phone || '+91 98401 23456'})</span> and alert your screen.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {permissionStatus !== 'granted' ? (
              <Button variant="primary" size="sm" onClick={requestPushPermission}>
                Enable Phone Alerts 🔔
              </Button>
            ) : (
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                PHONE PUSH: ACTIVE
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Recent Activity Feed (100% Real Database Events) */}
      <Card>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Recent Activity Feed
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Live AI camera verification logs & queue session records</p>
          </div>
          <Link
            to="/student/history"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View Full History <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {studentViolations.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Clean Discipline Record</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No queue infractions have been detected for your ID. Maintain orderly queue standing at campus counters to earn 50 monthly reward points!
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
            {studentViolations.map((v) => {
              const camName = v.camera_name || v.cameraName || 'Saveetha Lift 1 CCTV Node';
              const reason = v.reason || 'Outside Queue Standing Area';
              const penaltyPts = v.penalty_points || v.penaltyPoints || 15;
              const dateStr = v.timestamp ? new Date(v.timestamp).toLocaleString() : 'Just now';

              return (
                <div key={v.id || Math.random()} className="relative group">
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full ring-4 ring-white dark:ring-slate-800 flex items-center justify-center bg-red-500 text-white animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <div className="flex items-start justify-between gap-4 p-3.5 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/70 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 transition shadow-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-red-600 dark:text-red-400">Queue Infraction Detected</span>
                        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-500" /> {camName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{reason}</p>
                      <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                        {dateStr} • SMS Warning Dispatched to {currentStudent?.phone || 'Phone'}
                      </span>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full shrink-0 bg-red-500 text-white shadow-sm">
                      -{penaltyPts} Pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

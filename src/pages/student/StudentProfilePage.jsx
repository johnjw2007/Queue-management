import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Mail, Phone, Building, Hash, Award, Shield, Calendar, Lock } from 'lucide-react';

export function StudentProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Official Student Identification</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Saveetha Engineering College • Read-Only Verified Profile
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          <span>Profile Managed by College Admin</span>
        </div>
      </div>

      {/* Digital ID Card (Read-Only) */}
      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white border-slate-700/80 shadow-2xl relative overflow-hidden p-8">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
          <Shield className="w-96 h-96 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          <img
            src={user?.avatar || user?.facePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
            alt={user?.name}
            className="w-32 h-32 rounded-3xl object-cover ring-4 ring-blue-500/50 shadow-xl bg-slate-800"
          />

          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-2">
                Saveetha Engineering College • Verified ID
              </div>
              <h2 className="text-2xl font-extrabold">{user?.name || 'Student Name'}</h2>
              <p className="text-slate-300 text-sm">{user?.department || 'Department'}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-700/60">
              <div>
                <span className="text-[11px] text-slate-400 block uppercase font-mono">Register No</span>
                <span className="font-mono font-bold text-sm text-white">{user?.registerNumber || user?.id}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block uppercase font-mono">Queue Score</span>
                <span className="font-bold text-sm text-emerald-400">{user?.queueScore ?? 80} / 100</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block uppercase font-mono">Monthly Reward</span>
                <span className="font-bold text-sm text-amber-400">{user?.monthlyRewardPoints ?? 0} Pts</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Details Grid (Strictly Read-Only) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span>Academic & Contact Info</span>
            <span className="text-[11px] text-slate-400 font-normal">Read-Only</span>
          </h3>
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-slate-700 text-blue-600">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Email Address</span>
                <span className="font-medium text-slate-900 dark:text-white">{user?.email || 'Registered on campus record'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-slate-700 text-emerald-600">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Phone Number</span>
                <span className="font-medium text-slate-900 dark:text-white">{user?.phone || 'Registered on campus record'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-slate-700 text-indigo-600">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Department</span>
                <span className="font-medium text-slate-900 dark:text-white">{user?.department || 'General'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-slate-700 text-amber-600">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Enrolled Date</span>
                <span className="font-medium text-slate-900 dark:text-white">{user?.joinDate || new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
            Queue Discipline & Reward Status
          </h3>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Reward Eligibility</span>
                <Badge variant={(user?.queueScore ?? 80) >= 90 ? 'success' : 'warning'}>
                  {(user?.queueScore ?? 80) >= 90 ? 'Eligible' : 'Needs Improvement'}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {(user?.queueScore ?? 80) >= 90
                  ? `You are eligible for the monthly reward point benefit because your Queue Score is ${user?.queueScore}/100.`
                  : `Maintain a Queue Score of 90 or above to unlock monthly reward benefits.`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-blue-800 dark:text-blue-300">Weekly Penalty Deductions</span>
                <Badge variant="info">{user?.weeklyDeduction || 0} Pts Deducted</Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Discipline score is updated automatically by Saveetha CCTV camera vision nodes.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

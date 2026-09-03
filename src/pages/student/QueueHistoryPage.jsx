import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { StatusChip } from '../../components/common/StatusChip';
import { Search, Filter, Calendar, MapPin, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useStudentDB } from '../../context/StudentDBContext';
import { useAuth } from '../../context/AuthContext';

export function QueueHistoryPage() {
  const { user } = useAuth();
  const { students, violations } = useStudentDB();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const currentStudent = students.find(s => s.id === user?.id || s.registerNumber === user?.registerNumber) || user;

  // Filter real violations from database
  const studentViolations = (violations || []).filter(
    v => (v.student_id && v.student_id === currentStudent?.id) ||
         (v.register_number && v.register_number === currentStudent?.registerNumber) ||
         (v.student_name && v.student_name.toLowerCase() === currentStudent?.name?.toLowerCase())
  );

  const realHistory = studentViolations.map((v) => {
    const d = new Date(v.timestamp);
    return {
      id: v.id,
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: v.camera_name || 'Saveetha CCTV Station',
      status: 'Violation Detected',
      score: Math.max(0, (currentStudent?.queueScore ?? 80)),
      rewardChange: `-${v.penalty_points || 15} Pts`,
      reason: v.reason,
    };
  });

  const filtered = realHistory.filter((item) => {
    const matchesSearch = item.location.toLowerCase().includes(searchTerm.toLowerCase()) || item.date.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'all' || (statusFilter === 'violation' ? item.status.includes('Violation') : !item.status.includes('Violation'));
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Queue History Log</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Realtime audit trail of verified queue infractions & sessions for <span className="font-bold text-blue-600 dark:text-blue-400">{currentStudent?.name}</span>
        </p>
      </div>

      <Card>
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search location or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200 font-medium"
            >
              <option value="all">All Events ({realHistory.length})</option>
              <option value="violation">Violations Only</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">No Incident History Found</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              You have a flawless discipline record with zero recorded queue violations.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase border-b border-slate-100 dark:border-slate-700">
                  <th className="pb-3">Date & Time</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3">Queue Status</th>
                  <th className="pb-3">Queue Score</th>
                  <th className="pb-3">Reward Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3.5">
                      <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {item.date}
                      </div>
                      <span className="text-[11px] text-slate-400 block">{item.time}</span>
                    </td>
                    <td className="py-3.5">
                      <div className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        {item.location}
                      </div>
                      <span className="text-[11px] text-slate-400 block">{item.reason}</span>
                    </td>
                    <td className="py-3.5">
                      <StatusChip status={item.status} />
                    </td>
                    <td className="py-3.5 font-bold text-slate-900 dark:text-white">{item.score} / 100</td>
                    <td className="py-3.5">
                      <span className="font-bold px-2.5 py-1 rounded-full text-xs bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400">
                        {item.rewardChange}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

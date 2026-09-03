import React from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ViolationTrendChart } from '../../components/charts/ViolationTrendChart';
import camerasData from '../../data/cameras.json';
import {
  Video,
  Users,
  AlertTriangle,
  Award,
  TrendingUp,
  Sparkles,
  Trophy,
  Database,
  Tv,
  CloudCheck,
  CloudOff,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStudentDB } from '../../context/StudentDBContext';

export function AdminDashboard() {
  const { students, violations, getDepartmentStats, cloudConnected } = useStudentDB();
  const totalCameras = camerasData.length;
  
  // Compute dynamic daily violation trends from real database violations
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailyViolationCounts = daysOfWeek.map(day => ({
    day,
    violations: 0,
    resolved: 0,
  }));

  (violations || []).forEach(v => {
    const d = new Date(v.timestamp);
    const dayIndex = (d.getDay() + 6) % 7;
    if (dayIndex >= 0 && dayIndex < 7) {
      dailyViolationCounts[dayIndex].violations += 1;
      dailyViolationCounts[dayIndex].resolved += 1;
    }
  });

  const eligible = students.filter(s => (s.queueScore || 80) >= 90).length;
  const eligibilityPct = students.length > 0
    ? Math.round((eligible / students.length) * 100)
    : 0;

  // Authoritative dynamic calculation based on COUNT(DISTINCT students.id) GROUP BY department_id
  const { departmentList, topDepartment } = getDepartmentStats();

  const handleOpenHdmiDisplay = () => {
    window.open('/display/cctv', 'QueueSenseCCTVDisplay', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              System Overview Dashboard <Sparkles className="w-5 h-5 text-blue-600" />
            </h1>
            {cloudConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Cloud Database Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                Local Connected Mode
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Realtime AI queue surveillance • Centralized data aggregation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" icon={Tv} onClick={handleOpenHdmiDisplay}>
            Launch HDMI Display (Monitor 2)
          </Button>
          <Link to="/admin/database">
            <Button variant="outline" icon={Database}>
              Student Database
            </Button>
          </Link>
          <Link to="/admin/live">
            <Button variant="primary" icon={Video}>
              Live CCTV Station
            </Button>
          </Link>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Active Cameras */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-400">Active Cameras</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">1 / {totalCameras}</div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Live AI Node #01</span>
        </Card>

        {/* Metric 2: Students Enrolled — authoritative count */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-400">Students Enrolled</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{students.length}</div>
          <span className="text-[11px] text-slate-400 font-semibold mt-1 block">
            Across {departmentList.filter(d => d.totalStudents > 0).length} Departments
          </span>
        </Card>

        {/* Metric 3: Active Penalty Records */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-400">Active Violations</span>
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">
            {students.filter(s => s.weeklyDeduction > 0).length}
          </div>
          <span className="text-[11px] text-red-500 font-semibold mt-1 block">Students with Point Deductions</span>
        </Card>

        {/* Metric 4: Avg Queue Score */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-400">Avg Queue Score</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {students.length > 0
              ? (students.reduce((acc, s) => acc + (Number(s.queueScore) || 0), 0) / students.length).toFixed(1)
              : '—'}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Campus Score Benchmark</span>
        </Card>

        {/* Metric 5: Reward Eligibility */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-400">Reward Eligible</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{eligibilityPct}%</div>
          <span className="text-[11px] text-slate-400 font-semibold mt-1 block">Score ≥ 90 Compliance</span>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Violations Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Daily Queue Violations Trend</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Weekly detected boundary cross and line cutting incidents</p>
            </div>
            <Link to="/admin/analytics">
              <Button variant="ghost" size="sm">Full Analytics</Button>
            </Link>
          </div>
          <ViolationTrendChart data={dailyViolationCounts} />
        </Card>

        {/* Authoritative Dynamic Department Leaderboard */}
        <Card>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Top Departments</h3>
                <p className="text-[11px] text-slate-400">Ranked by unique student enrollment</p>
              </div>
            </div>
            {topDepartment && (
              <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-xs">
                #1 {topDepartment.code}
              </span>
            )}
          </div>
          
          <div className="space-y-3">
            {departmentList.slice(0, 5).map((dept, index) => {
              const rank = index + 1;
              return (
                <div key={dept.departmentId} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                      rank === 1 ? 'bg-amber-400 text-slate-900 font-black' :
                      rank === 2 ? 'bg-slate-300 text-slate-800 font-bold' :
                      rank === 3 ? 'bg-amber-700 text-white font-bold' :
                      'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>#{rank}</span>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{dept.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {dept.totalStudents} Student{dept.totalStudents !== 1 ? 's' : ''} ({dept.code})
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400 block">{dept.avgScore} pts</span>
                    <span className="text-[10px] text-slate-400">Avg Score</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Student Roster Preview */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Centralized Student Compliance Roster</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Live preview from the database</p>
          </div>
          <Link to="/admin/database">
            <Button variant="outline" size="sm">Manage Database</Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase border-b border-slate-100 dark:border-slate-700">
                <th className="pb-3">Student</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Queue Score</th>
                <th className="pb-3">Reward Points</th>
                <th className="pb-3">Reward Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
              {students.slice(0, 6).map((stu) => (
                <tr key={stu.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      {stu.avatar || stu.facePhoto ? (
                        <img src={stu.avatar || stu.facePhoto} alt={stu.name} className="w-8 h-8 rounded-xl object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-bold text-sm">
                          {stu.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{stu.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{stu.registerNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-xs text-slate-600 dark:text-slate-300 font-medium">{stu.department}</td>
                  <td className="py-3 font-black text-xs" style={{color: stu.queueScore >= 90 ? '#22c55e' : stu.queueScore >= 75 ? '#2563eb' : '#ef4444'}}>
                    {stu.queueScore} / 100
                  </td>
                  <td className="py-3 font-bold text-emerald-600 dark:text-emerald-400 text-xs">{stu.monthlyRewardPoints} / 50 Pts</td>
                  <td className="py-3">
                    <Badge variant={stu.queueScore >= 90 ? 'success' : 'warning'}>
                      {stu.queueScore >= 90 ? 'Eligible' : 'Ineligible'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

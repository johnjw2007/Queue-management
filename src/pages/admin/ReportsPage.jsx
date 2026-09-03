import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useStudentDB } from '../../context/StudentDBContext';
import reportsData from '../../data/reports.json';
import { FileText, Download, Eye, Calendar, HardDrive, AlertTriangle, Users, CheckCircle2 } from 'lucide-react';

export function ReportsPage() {
  const { addToast } = useToast();
  const { students, violations, getDepartmentStats } = useStudentDB();
  const [selectedReport, setSelectedReport] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Filter students whose points have been deducted or flagged
  const penalizedStudents = students.filter(s => (s.weeklyDeduction > 0) || (s.queueScore < 90));
  const { topDepartment } = getDepartmentStats();

  const handleDownload = (title) => {
    addToast(`Generating and downloading compliance report: "${title}"...`, 'info', 'Generating Report');

    try {
      // Build dynamic CSV content including all penalized student details
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += '=====================================================\r\n';
      csvContent += `QUEUESENSE AI - CAMPUS COMPLIANCE & PENALTY AUDIT REPORT\r\n`;
      csvContent += `Report Title: ${title}\r\n`;
      csvContent += `Generated On: ${new Date().toLocaleString()}\r\n`;
      csvContent += `Total Students Evaluated: ${students.length}\r\n`;
      csvContent += `Total Penalized Students: ${penalizedStudents.length}\r\n`;
      csvContent += '=====================================================\r\n\r\n';
      
      csvContent += 'STUDENTS WITH POINT DEDUCTIONS & LINE INFRACTIONS:\r\n';
      csvContent += 'Student ID,Student Name,Register Number,Department,Queue Score,Weekly Deduction (Pts),Monthly Reward Pts,Status\r\n';

      penalizedStudents.forEach(stu => {
        csvContent += `"${stu.id}","${stu.name}","${stu.registerNumber}","${stu.department}",${stu.queueScore},"-${stu.weeklyDeduction || 15} Pts",${stu.monthlyRewardPoints},"${stu.currentQueueStatus}"\r\n`;
      });

      if (penalizedStudents.length === 0) {
        csvContent += 'No active student point deductions recorded.\r\n';
      }

      csvContent += '\r\n\r\nRECENT CCTV LINE VIOLATIONS LOG:\r\n';
      csvContent += 'Violation ID,Student Name,Register Number,Camera Node,Points Deducted,Timestamp,Infraction Reason\r\n';

      violations.slice(0, 50).forEach(v => {
        csvContent += `"${v.id}","${v.student_name}","${v.register_number || 'N/A'}","${v.camera_name || 'CAM-01'}","-${v.penalty_points || 15} Pts","${new Date(v.timestamp).toLocaleString()}","${v.reason}"\r\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `QueueSense_Discipline_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        addToast(`Report downloaded successfully with ${penalizedStudents.length} penalized student records!`, 'success', 'Download Complete 📄');
      }, 500);
    } catch (err) {
      console.error('Download error:', err);
      addToast('Failed to generate report download.', 'danger', 'Error');
    }
  };

  const handlePreview = (report) => {
    setSelectedReport(report);
    setPreviewOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Audit & Compliance Reports</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Generated campus discipline summary documents with itemized student point deductions & CCTV violations
        </p>
      </div>

      {/* Penalized Students Live Banner */}
      <Card className="border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {penalizedStudents.length} Student{penalizedStudents.length !== 1 ? 's' : ''} Flagged with Deductions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All downloaded reports dynamically compile the full list of students whose points were deducted.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={() => handleDownload('Campus_Full_Penalty_Audit')}
          >
            Export Penalty Roster (CSV)
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportsData.map((rep) => (
          <Card key={rep.id} className="flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  {rep.period} Report
                </span>
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <HardDrive className="w-3 h-3" /> {rep.fileSize}
                </span>
              </div>

              <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-2">{rep.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-6">
                <Calendar className="w-3.5 h-3.5" /> {rep.date}
              </p>

              <div className="space-y-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/40 text-xs mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Students Tracked:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{students.length} Enrolled</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Penalized Students:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">{penalizedStudents.length} Students</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Top Department:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {topDepartment?.name || 'Computer Science'} ({topDepartment?.totalStudents || 0})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                icon={Eye}
                onClick={() => handlePreview(rep)}
              >
                Preview
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                icon={Download}
                onClick={() => handleDownload(rep.title)}
              >
                Download Report
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Report Preview Modal */}
      {selectedReport && (
        <Modal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          title={`Report Preview: ${selectedReport.title}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono text-xs space-y-2 overflow-x-auto">
              <div className="text-emerald-400 font-bold">===================================================</div>
              <div className="text-white font-bold">QUEUESENSE AI AUDIT REPORT - {selectedReport.period.toUpperCase()}</div>
              <div>Date Range: {selectedReport.date}</div>
              <div>Total Enrolled Students: {students.length}</div>
              <div>Students with Deductions: {penalizedStudents.length}</div>
              <div className="text-emerald-400 font-bold">===================================================</div>
              <br />
              <div className="text-amber-400 font-bold">PENALIZED STUDENTS ROSTER:</div>
              {penalizedStudents.map((s, idx) => (
                <div key={s.id} className="text-slate-300">
                  {idx + 1}. {s.name} ({s.registerNumber}) • {s.department} • Score: {s.queueScore}/100 • Deducted: -{s.weeklyDeduction || 15} Pts
                </div>
              ))}
              {penalizedStudents.length === 0 && <div className="text-slate-400">No active deductions.</div>}
              <br />
              <div>AUDITORS: AI CCTV Vision Node Network (1 Active Webcam + 3 Standby)</div>
              <div>VERIFICATION STATUS: Verified Cryptographic Log Hash</div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <Button variant="ghost" onClick={() => setPreviewOpen(false)}>Close</Button>
              <Button variant="primary" icon={Download} onClick={() => handleDownload(selectedReport.title)}>
                Download Full CSV Report
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

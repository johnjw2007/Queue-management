import React, { useState } from 'react';
import { LiveCameraCard } from '../../components/cctv/LiveCameraCard';
import { useToast } from '../../context/ToastContext';
import { useStudentDB } from '../../context/StudentDBContext';
import { Video, ShieldAlert, CheckCircle, RefreshCw, Layers, Tv, Maximize } from 'lucide-react';
import { Button } from '../../components/common/Button';

export function LiveMonitoringPage() {
  const { addToast } = useToast();
  const { cameras, fetchCloudData, cloudConnected, loading } = useStudentDB();
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleTriggerViolation = (camName) => {
    // Silence admin toasts - alerts are sent directly to the student portal
  };

  const handleOpenHdmiDisplay = () => {
    window.open('/display/cctv', 'QueueSenseCCTVDisplay', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no');
  };

  const handleRefreshNodes = async () => {
    setRefreshing(true);
    try {
      await fetchCloudData();
      addToast('Camera nodes synced from Supabase Cloud.', 'success', 'Streams Updated');
    } catch {
      addToast('Failed to sync cameras from cloud.', 'danger', 'Sync Error');
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = (cameras || []).filter((cam) => {
    if (filter === 'violation') return cam.status === 'Violation' || cam.status === 'Warning';
    if (filter === 'normal') return cam.status === 'Normal';
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              Live AI CCTV Surveillance Station <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
              cloudConnected ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {cloudConnected ? 'Centralized AI Mesh' : 'Local Standby'}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Realtime computer vision analysis, queue zone monitoring & discipline tracking synced to Supabase Cloud
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={Tv}
            onClick={handleOpenHdmiDisplay}
          >
            HDMI Display Mode (Monitor 2)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshNodes}
            disabled={loading || refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading || refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            {loading || refreshing ? 'Syncing...' : 'Refresh Nodes'}
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-100 dark:border-slate-700'
          }`}
        >
          All CCTV Nodes ({cameras.length})
        </button>
        <button
          onClick={() => setFilter('violation')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            filter === 'violation'
              ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-100 dark:border-slate-700'
          }`}
        >
          Active Incidents
        </button>
        <button
          onClick={() => setFilter('normal')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            filter === 'normal'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-100 dark:border-slate-700'
          }`}
        >
          Normal Queue Flow
        </button>
      </div>

      {/* 4-Camera Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((cam) => (
          <LiveCameraCard key={cam.id} camera={cam} onTriggerViolation={handleTriggerViolation} />
        ))}
      </div>
    </div>
  );
}

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { StudentLayout } from '../layouts/StudentLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { AuthLayout } from '../layouts/AuthLayout';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';

// Student Pages
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { QueueHistoryPage } from '../pages/student/QueueHistoryPage';
import { NotificationsPage } from '../pages/student/NotificationsPage';
import { StudentProfilePage } from '../pages/student/StudentProfilePage';
import { PerksStorePage } from '../pages/student/PerksStorePage';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { LiveMonitoringPage } from '../pages/admin/LiveMonitoringPage';
import { StudentDatabasePage } from '../pages/admin/StudentDatabasePage';
import { AnalyticsPage } from '../pages/admin/AnalyticsPage';
import { ReportsPage } from '../pages/admin/ReportsPage';
import { SettingsPage } from '../pages/admin/SettingsPage';

// Dedicated HDMI CCTV Display Mode Page (Without Admin Navigation)
import { CctvDisplayPage } from '../pages/display/CctvDisplayPage';

// Error Page
import { NotFoundPage } from '../pages/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Dedicated HDMI Secondary Monitor Display Route */}
      <Route path="/display/cctv" element={<CctvDisplayPage />} />
      <Route path="/display/cctv/:cameraId" element={<CctvDisplayPage />} />

      {/* Student Routes */}
      <Route element={<StudentLayout />}>
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/history" element={<QueueHistoryPage />} />
        <Route path="/student/notifications" element={<NotificationsPage />} />
        <Route path="/student/profile" element={<StudentProfilePage />} />
      </Route>

      {/* Admin Routes */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/live" element={<LiveMonitoringPage />} />
        <Route path="/admin/database" element={<StudentDatabasePage />} />
        <Route path="/admin/analytics" element={<AnalyticsPage />} />
        <Route path="/admin/reports" element={<ReportsPage />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

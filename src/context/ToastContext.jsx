import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  MessageSquare,
  Phone,
  ShieldAlert,
  Smartphone,
  BellRing,
} from 'lucide-react';

const ToastContext = createContext();
const STORAGE_KEY_AUTH = 'queuesense_auth';
const BROADCAST_KEY_SMS = 'queuesense_sms_broadcast';

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [smsWarnings, setSmsWarnings] = useState([]);
  const [permissionStatus, setPermissionStatus] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  
  // Dedicated BroadcastChannel API for reliable instant tab-to-tab communication
  const broadcastChannelRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      broadcastChannelRef.current = new BroadcastChannel('queuesense_alerts_channel');
      broadcastChannelRef.current.onmessage = (event) => {
        if (event.data && event.data.type === 'SMS_WARNING') {
          handleIncomingSmsWarning(event.data.payload);
        }
      };
    }

    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, []);

  // Register Mobile Service Worker & Check Notification Permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[QueueSense SW] Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('[QueueSense SW] Registration failed:', err);
        });
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((perm) => {
          setPermissionStatus(perm);
        });
      }
    }
  }, []);

  // Listen to cross-window storage events as secondary fallback
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === BROADCAST_KEY_SMS && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          handleIncomingSmsWarning(payload);
        } catch {/* ignore */}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const requestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setPermissionStatus(perm);
      if (perm === 'granted') {
        addToast('Mobile push notifications enabled for discipline alerts!', 'success', 'Notifications Active 🔔');
      }
    }
  };

  const addToast = (message, type = 'info', title = '') => {
    // Completely silence danger toasts on admin / display pages
    const isSpecialistPage = typeof window !== 'undefined' && (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/display'));
    if (isSpecialistPage && (title?.includes('Violation') || title?.includes('Infraction') || type === 'danger')) {
      return;
    }

    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, title }]);

    sendSystemPushNotification({
      title: title || 'QueueSense AI • Saveetha College',
      body: message,
    });

    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const sendSystemPushNotification = ({ title, body }) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          body,
          icon: '/favicon.ico',
        });
      } else if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: '/favicon.ico',
            vibrate: [200, 100, 200],
          });
        }).catch(() => {
          try { new Notification(title, { body, icon: '/favicon.ico' }); } catch {/* ignore */}
        });
      } else {
        try {
          new Notification(title, { body, icon: '/favicon.ico' });
        } catch {/* ignore */}
      }
    }
  };

  /**
   * Handle displaying the SMS warning modal ONLY in Student sessions
   */
  const handleIncomingSmsWarning = (warningPayload) => {
    // If the window is currently on any /admin or /display path, NEVER show the SMS warning box
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    if (currentPath.startsWith('/admin') || currentPath.startsWith('/display')) {
      return;
    }

    setSmsWarnings((prev) => {
      // Avoid duplicate popups for the exact same violation id
      if (prev.some(w => w.id === warningPayload.id)) return prev;
      return [warningPayload, ...prev];
    });

    // Push alert to phone/lock screen
    sendSystemPushNotification({
      title: `⚠️ DISCIPLINE WARNING: ${warningPayload.studentName} (${warningPayload.phoneNumber})`,
      body: `Infraction at ${warningPayload.cameraLocation}: -${warningPayload.penaltyPoints} Pts deducted for ${warningPayload.reason}.`,
    });
  };

  /**
   * Trigger SMS Warning: broadcasts to student session via BroadcastChannel and localStorage
   */
  const triggerSmsWarning = ({ studentId, studentName, registerNumber, phoneNumber, penaltyPoints, reason, cameraLocation }) => {
    const id = `SMS_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const phone = phoneNumber || '+91 98401 23456';
    const warningPayload = {
      id,
      studentId: studentId || null,
      studentName: studentName || 'Student',
      registerNumber: registerNumber || 'N/A',
      phoneNumber: phone,
      penaltyPoints: penaltyPoints || 15,
      reason: reason || 'Queue Line Infraction / Out of Safe Standing Zone',
      cameraLocation: cameraLocation || 'Main Entrance Lift 1 Lobby',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // 1. Broadcast via BroadcastChannel API (Immediate multi-tab dispatch)
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ type: 'SMS_WARNING', payload: warningPayload });
      } catch {/* ignore */}
    }

    // 2. Broadcast via localStorage (Cross-window fallback)
    try {
      localStorage.setItem(BROADCAST_KEY_SMS, JSON.stringify({ ...warningPayload, timestamp: Date.now() }));
    } catch {/* ignore */}

    // 3. Local check
    handleIncomingSmsWarning(warningPayload);
  };

  const dismissSmsWarning = (id) => {
    setSmsWarnings((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <ToastContext.Provider value={{
      toasts,
      addToast,
      removeToast,
      triggerSmsWarning,
      permissionStatus,
      requestPushPermission
    }}>
      {children}

      {/* 1. Instant Phone SMS Warning Pop-up Modal (Only visible on student sessions) */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {smsWarnings.map((warn) => (
            <motion.div
              key={warn.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl text-white rounded-3xl p-5 border-2 border-red-500/60 shadow-2xl shadow-red-500/20 relative overflow-hidden"
            >
              {/* Top Warning Ribbon */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 animate-bounce">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-red-400 block">
                      OFFICIAL SMS DISCIPLINE NOTICE
                    </span>
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-400" /> {warn.phoneNumber}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => dismissSmsWarning(warn.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message Content */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-2xl bg-red-950/40 border border-red-900/50 text-slate-200 space-y-1 font-sans">
                  <p className="font-bold text-red-300">
                    ⚠️ Saveetha Engineering College Surveillance:
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Dear <span className="font-bold text-white">{warn.studentName}</span> ({warn.registerNumber}), you were recorded outside the designated queue zone at <span className="font-semibold text-white">{warn.cameraLocation}</span>.
                  </p>
                  <p className="text-[11px] font-bold text-red-400 pt-1">
                    Penalty: -{warn.penaltyPoints} Points deducted from monthly score.
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                  <span>DISPATCH: DELIVERED VIA SMS GATEWAY</span>
                  <span>{warn.time}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 2. Standard Toast Messages */}
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              className={`pointer-events-auto p-4 rounded-2xl shadow-xl flex items-start gap-3 border ${
                toast.type === 'danger'
                  ? 'bg-red-950/90 border-red-800 text-red-100'
                  : toast.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-800 text-emerald-100'
                  : toast.type === 'warning'
                  ? 'bg-amber-950/90 border-amber-800 text-amber-100'
                  : 'bg-slate-900/90 border-slate-700 text-white'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'danger' && <AlertTriangle className="w-5 h-5 text-red-400" />}
                {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
              </div>

              <div className="flex-1">
                {toast.title && <h4 className="font-bold text-xs">{toast.title}</h4>}
                <p className="text-xs opacity-90 leading-relaxed">{toast.message}</p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

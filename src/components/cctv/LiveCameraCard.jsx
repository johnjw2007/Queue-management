import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Camera,
  Activity,
  Users,
  ShieldAlert,
  Layers,
  Brain,
  AlertCircle,
  CheckCircle2,
  Settings as SettingsIcon,
  X,
  SlidersHorizontal,
  Clock,
  Square,
  Maximize2,
  Tv,
} from 'lucide-react';
import { StatusChip } from '../common/StatusChip';
import { Button } from '../common/Button';
import { useStudentDB } from '../../context/StudentDBContext';
import { useToast } from '../../context/ToastContext';
import {
  loadFaceModels,
  computeDescriptorFromSrc,
  buildFaceMatcher,
  detectAndMatchFaces,
} from '../../utils/faceRecognition';

export function LiveCameraCard({ camera, onTriggerViolation, isDisplayMode = false }) {
  const { students, updateStudent, saveFaceDescriptor, recordViolation, getCameraZoneConfig, updateZoneConfig } = useStudentDB();
  const { addToast, triggerSmsWarning } = useToast();

  // ─── State ────────────────────────────────────────────────────────────────
  const [useWebcam, setUseWebcam] = useState(false);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showQueueZone, setShowQueueZone] = useState(true);
  const [activeCamStatus, setActiveCamStatus] = useState(camera?.queueStatus || 'Proper Queue');
  const [webcamError, setWebcamError] = useState(null);
  const [faceModelsReady, setFaceModelsReady] = useState(false);
  const [faceDetectionActive, setFaceDetectionActive] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState([]);  
  const [encodingProgress, setEncodingProgress] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Settings from camera-specific zoneConfig in Context
  const camZoneConfig = getCameraZoneConfig(camera?.id || 'CAM-01');
  const {
    zoneX = 15,
    zoneY = 40,
    zoneWidth = 70,
    zoneHeight = 55,
    penaltyPoints = 15,
    penaltyTime = 5,
  } = camZoneConfig || {};

  const handleUpdateZone = (updates) => {
    updateZoneConfig(updates, camera?.id || 'CAM-01');
  };

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceCanvasRef = useRef(null);
  const faceLoopRef = useRef(null);
  
  const violationTimersRef = useRef({});
  const penalizedRecentlyRef = useRef({});

  const isViolation = activeCamStatus.includes('Cut-In') || activeCamStatus.includes('Violation');

  // ─── Load face-api models on mount ────────────────────────────────────────
  useEffect(() => {
    loadFaceModels()
      .then(() => setFaceModelsReady(true))
      .catch(() => setFaceModelsReady(false));
  }, []);

  // ─── Auto-encode student face photos into descriptors ─────────────────────
  useEffect(() => {
    if (!faceModelsReady) return;
    const needsEncoding = students.filter(s => (s.facePhoto || s.avatar) && !s.faceDescriptor);
    if (needsEncoding.length === 0) return;

    (async () => {
      for (let i = 0; i < needsEncoding.length; i++) {
        const stu = needsEncoding[i];
        setEncodingProgress(`Encoding face for ${stu.name} (${i + 1}/${needsEncoding.length})...`);
        try {
          const desc = await computeDescriptorFromSrc(stu.facePhoto || stu.avatar);
          if (desc) {
            saveFaceDescriptor(stu.id, Array.from(desc));
          }
        } catch {/* skip */}
      }
      setEncodingProgress(null);
    })();
  }, [faceModelsReady, students.length]);

  // ─── Webcam Stream Handler ────────────────────────────────────────────────
  useEffect(() => {
    let stream = null;
    if (useWebcam) {
      navigator.mediaDevices
        .getUserMedia({ video: { width: 640, height: 360 } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
          setWebcamError(null);
        })
        .catch(() => {
          setWebcamError('Cannot access webcam. Check browser camera permissions.');
          setUseWebcam(false);
        });
    } else {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      setDetectedFaces([]);
      stopFaceDetectionLoop();
    }
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, [useWebcam]);

  // ─── Queue Standing Area / Detection Zone Canvas Overlay ───────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let offset = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (showQueueZone) {
        const zx = (zoneX / 100) * canvas.width;
        const zy = (zoneY / 100) * canvas.height;
        const zw = (zoneWidth / 100) * canvas.width;
        const zh = (zoneHeight / 100) * canvas.height;

        ctx.save();
        // Permitted Queue Area
        ctx.fillStyle = isViolation ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)';
        ctx.fillRect(zx, zy, zw, zh);

        // Dashed Border
        ctx.beginPath();
        ctx.rect(zx, zy, zw, zh);
        ctx.lineWidth = 3;
        ctx.strokeStyle = isViolation ? '#EF4444' : '#22C55E';
        ctx.setLineDash([10, 6]);
        ctx.lineDashOffset = -offset;
        ctx.stroke();

        // Corner Target Accents
        const cornerLen = 14;
        ctx.setLineDash([]);
        ctx.lineWidth = 4;
        ctx.strokeStyle = isViolation ? '#EF4444' : '#3B82F6';
        
        ctx.beginPath(); ctx.moveTo(zx, zy + cornerLen); ctx.lineTo(zx, zy); ctx.lineTo(zx + cornerLen, zy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(zx + zw - cornerLen, zy); ctx.lineTo(zx + zw, zy); ctx.lineTo(zx + zw, zy + cornerLen); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(zx, zy + zh - cornerLen); ctx.lineTo(zx, zy + zh); ctx.lineTo(zx + cornerLen, zy + zh); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(zx + zw - cornerLen, zy + zh); ctx.lineTo(zx + zw, zy + zh); ctx.lineTo(zx + zw, zy + zh - cornerLen); ctx.stroke();

        // Zone Tag Label
        ctx.fillStyle = isViolation ? '#EF4444' : '#22C55E';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(isViolation ? '⚠️ QUEUE BOUNDARY INFRACTION' : '🎯 DESIGNATED QUEUE STANDING ZONE', zx + 10, zy - 8);
        ctx.restore();
      }
      offset = (offset + 0.5) % 16;
      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, [showQueueZone, isViolation, zoneX, zoneY, zoneWidth, zoneHeight]);

  // ─── Face Detection Loop & Zone Boundary Check ─────────────────────────────
  const startFaceDetectionLoop = useCallback(() => {
    const faceCanvas = faceCanvasRef.current;
    const video = videoRef.current;
    if (!faceCanvas || !video || !faceModelsReady) return;
    const ctx = faceCanvas.getContext('2d');

    const faceMatcher = buildFaceMatcher(students);

    const loop = async () => {
      if (!videoRef.current || videoRef.current.paused) return;
      const results = await detectAndMatchFaces(videoRef.current, faceMatcher);

      ctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);

      const scaleX = faceCanvas.width / video.videoWidth;
      const scaleY = faceCanvas.height / video.videoHeight;
      const now = Date.now();
      let anyViolation = false;

      const zx = (zoneX / 100) * faceCanvas.width;
      const zy = (zoneY / 100) * faceCanvas.height;
      const zw = (zoneWidth / 100) * faceCanvas.width;
      const zh = (zoneHeight / 100) * faceCanvas.height;

      const faces = results.map(r => {
        const { x, y, width, height } = r.detection.box;
        const rawBx = x * scaleX;
        const by = y * scaleY;
        const bw = width * scaleX;
        const bh = height * scaleY;
        const bx = faceCanvas.width - (rawBx + bw);
        
        const faceCenterX = bx + (bw / 2);
        const faceCenterY = by + (bh / 2);

        const isOutsideZone = faceCenterX < zx || faceCenterX > (zx + zw) || faceCenterY < zy || faceCenterY > (zy + zh);
        
        if (isOutsideZone) {
          anyViolation = true;
          if (!r.isUnknown && r.studentId) {
            if (!violationTimersRef.current[r.studentId]) {
              violationTimersRef.current[r.studentId] = now;
            } else {
              const duration = now - violationTimersRef.current[r.studentId];
              if (duration >= penaltyTime * 1000) {
                const lastPenalized = penalizedRecentlyRef.current[r.studentId] || 0;
                
                if (now - lastPenalized > 12000) {
                  const studentObj = students.find(s => s.id === r.studentId);
                  const currentScore = parseInt(r.queueScore, 10) || 80;
                  const newScore = Math.max(0, currentScore - penaltyPoints);
                  const currentDeduction = (studentObj?.weeklyDeduction || 0) + penaltyPoints;
                  
                  updateStudent(r.studentId, {
                    queueScore: newScore,
                    weeklyDeduction: currentDeduction,
                    currentQueueStatus: 'Violation Detected',
                  });

                  recordViolation({
                    studentId: r.studentId,
                    studentName: r.studentName,
                    registerNumber: r.registerNumber,
                    departmentId: r.departmentId,
                    cameraId: camera?.id || 'CAM-01',
                    cameraName: camera?.name || 'Main Camera',
                    penaltyPoints: penaltyPoints,
                    reason: `Outside Queue Standing Area for ${penaltyTime}s`,
                  });
                  
                  // Dispatch automated SMS Warning notice to student's contact number & student portal
                  if (triggerSmsWarning) {
                    triggerSmsWarning({
                      studentId: r.studentId,
                      studentName: r.studentName,
                      registerNumber: r.registerNumber,
                      phoneNumber: studentObj?.phone || '+91 98401 23456',
                      penaltyPoints: penaltyPoints,
                      reason: `Recorded outside designated queue zone for ${penaltyTime}s`,
                      cameraLocation: camera?.location || camera?.name || 'Main Entrance Lift 1 Lobby',
                    });
                  }
                  
                  penalizedRecentlyRef.current[r.studentId] = now;
                  if (onTriggerViolation) onTriggerViolation(camera?.name || 'Camera 01');
                }
              }
            }
          }
        } else {
          if (!r.isUnknown && r.studentId) {
            delete violationTimersRef.current[r.studentId];
          }
        }

        const color = isOutsideZone ? '#EF4444' : (r.isUnknown ? '#F97316' : (r.queueScore >= 90 ? '#22C55E' : '#3B82F6'));

        ctx.strokeStyle = color;
        ctx.lineWidth = isOutsideZone ? 3 : 2;
        ctx.strokeRect(bx, by, bw, bh);

        const label = r.isUnknown
          ? 'Unknown Person'
          : `${r.studentName} — ${r.queueScore} Pts`;
        ctx.font = 'bold 11px sans-serif';
        const tw = ctx.measureText(label).width + 10;
        ctx.fillStyle = color;
        ctx.fillRect(bx, by - 20, tw, 20);
        ctx.fillStyle = '#FFF';
        ctx.fillText(label, bx + 5, by - 5);
        
        if (isOutsideZone && !r.isUnknown && r.studentId) {
          const duration = now - (violationTimersRef.current[r.studentId] || now);
          const timeLeft = Math.max(0, penaltyTime - (duration / 1000)).toFixed(1);
          if (timeLeft > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(bx, by + bh, tw, 20);
            ctx.fillStyle = '#EF4444';
            ctx.fillText(`Penalty in ${timeLeft}s`, bx + 5, by + bh + 14);
          }
        }

        return { ...r, box: { x: bx, y: by, w: bw, h: bh }, color, isOutsideZone };
      });

      setDetectedFaces(faces);
      if (anyViolation !== (activeCamStatus === 'Cut-In Detected')) {
        setActiveCamStatus(anyViolation ? 'Cut-In Detected' : 'Proper Queue');
      }

      faceLoopRef.current = setTimeout(loop, 100);
    };

    loop();
  }, [faceModelsReady, students, zoneX, zoneY, zoneWidth, zoneHeight, penaltyPoints, penaltyTime, isDisplayMode]);

  const stopFaceDetectionLoop = () => {
    if (faceLoopRef.current) clearTimeout(faceLoopRef.current);
    faceLoopRef.current = null;
    const faceCanvas = faceCanvasRef.current;
    if (faceCanvas) faceCanvas.getContext('2d').clearRect(0, 0, faceCanvas.width, faceCanvas.height);
    setDetectedFaces([]);
    setActiveCamStatus('Proper Queue');
  };

  useEffect(() => {
    if (faceDetectionActive && useWebcam) startFaceDetectionLoop();
    else stopFaceDetectionLoop();
    return stopFaceDetectionLoop;
  }, [faceDetectionActive, useWebcam, faceModelsReady, students, zoneX, zoneY, zoneWidth, zoneHeight, penaltyPoints, penaltyTime, startFaceDetectionLoop]);

  return (
    <div className={`bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-3xl overflow-hidden shadow-xl ${isDisplayMode ? 'h-full flex flex-col' : ''}`}>
      {/* Header Bar */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white leading-tight">{camera?.name || 'Queue Camera 01'}</h3>
            <p className="text-[11px] text-slate-400 font-mono">{camera?.location || 'Campus Main Queue'} • {camera?.id || 'CAM-01'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-extrabold tracking-wider">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" /> LIVE
          </span>
          <StatusChip status={activeCamStatus} />
        </div>
      </div>

      {/* Video Viewport */}
      <div className={`relative ${isDisplayMode ? 'flex-1' : 'aspect-video'} bg-slate-950 overflow-hidden flex items-center justify-center group`}>
        {/* Webcam feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${useWebcam ? 'block' : 'hidden'} transform -scale-x-100`}
        />

        {/* Standby placeholder */}
        {!useWebcam && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-0">
            <Video className="w-16 h-16 text-slate-800 animate-pulse mb-2" />
            <p className="text-xs text-slate-500 font-mono">STANDBY NODE — CLICK "USE WEBCAM" TO ACTIVATE LIVE AI STREAM</p>
          </div>
        )}

        {/* Queue Standing Zone Canvas */}
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />

        {/* Face Detection Canvas */}
        <canvas
          ref={faceCanvasRef}
          width={640}
          height={360}
          className="absolute inset-0 w-full h-full pointer-events-none z-30"
        />

        {/* HUD Info */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
          <span className="text-xs font-mono text-slate-300 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-700">
            {camera?.fps || 30} FPS
          </span>
          <span className="text-xs font-mono text-emerald-400 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 animate-spin" /> {camera?.confidence || 98.6}% AI CONF
          </span>
          {faceDetectionActive && faceModelsReady && (
            <span className="text-xs font-mono text-indigo-300 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-lg border border-indigo-500/30 flex items-center gap-1">
              <Brain className="w-3.5 h-3.5 animate-pulse" /> FACE AI ACTIVE
            </span>
          )}
        </div>
        
        {/* Settings Overlay - Synchronized directly into updateZoneConfig */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, x: 20, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 20, y: -20 }}
              className="absolute top-12 right-3 z-40 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-2xl p-4 w-80 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <SlidersHorizontal className="w-4 h-4 text-blue-500" /> {camera?.name || 'Camera'} Zone & Rules
                </div>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3 text-xs">
                {/* Zone Area Sliders */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Zone Left (X: {zoneX}%)</label>
                    <input type="range" min="0" max="50" value={zoneX} onChange={e => handleUpdateZone({ zoneX: Number(e.target.value) })} className="w-full accent-blue-500" />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Zone Top (Y: {zoneY}%)</label>
                    <input type="range" min="0" max="60" value={zoneY} onChange={e => handleUpdateZone({ zoneY: Number(e.target.value) })} className="w-full accent-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Zone Width ({zoneWidth}%)</label>
                    <input type="range" min="30" max="100" value={zoneWidth} onChange={e => handleUpdateZone({ zoneWidth: Number(e.target.value) })} className="w-full accent-blue-500" />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Zone Height ({zoneHeight}%)</label>
                    <input type="range" min="20" max="100" value={zoneHeight} onChange={e => handleUpdateZone({ zoneHeight: Number(e.target.value) })} className="w-full accent-blue-500" />
                  </div>
                </div>
                
                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Penalty: -{penaltyPoints} pts</label>
                    <input type="range" min="5" max="50" step="5" value={penaltyPoints} onChange={e => handleUpdateZone({ penaltyPoints: Number(e.target.value) })} className="w-full accent-red-500" />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Time Limit: {penaltyTime}s</label>
                    <input type="range" min="1" max="60" value={penaltyTime} onChange={e => handleUpdateZone({ penaltyTime: Number(e.target.value) })} className="w-full accent-amber-500" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HUD: People count & settings toggle */}
        <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2">
          {!isDisplayMode && (
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-lg bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-md"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-1.5 text-xs text-slate-200 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 shadow-md">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            {useWebcam
              ? `${detectedFaces.length} face(s) tracked`
              : (camera?.peopleCount ? `${camera.peopleCount} Tracked` : 'Standby (0 Tracked)')}
          </div>
        </div>
      </div>

      {/* Identified Face Badges */}
      {useWebcam && detectedFaces.length > 0 && (
        <div className="px-5 pt-3 pb-1">
          <div className="flex flex-wrap gap-2">
            {detectedFaces.map((f, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  f.isOutsideZone
                    ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300'
                    : f.isUnknown
                    ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300'
                    : f.queueScore >= 90
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                }`}
              >
                {f.isOutsideZone ? <AlertCircle className="w-3.5 h-3.5" /> : (f.isUnknown ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />)}
                {f.studentName}
                {!f.isUnknown && ` • Score: ${f.queueScore}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Encoding / Status Banner */}
      {encodingProgress && (
        <div className="mx-5 mt-3 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
          <Brain className="w-4 h-4 animate-spin" /> {encodingProgress}
        </div>
      )}

      {/* Control Toolbar */}
      {!isDisplayMode && (
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Button variant={useWebcam ? 'primary' : 'outline'} size="sm" icon={Camera}
              onClick={() => setUseWebcam(p => !p)} className="w-full">
              {useWebcam ? 'Webcam: ON' : 'Use Webcam'}
            </Button>

            <Button
              variant={faceDetectionActive ? 'secondary' : 'outline'} size="sm" icon={Brain}
              onClick={() => {
                if (!faceModelsReady) {
                  addToast('AI models are still loading...', 'warning', 'Please Wait');
                  return;
                }
                if (!useWebcam) {
                  addToast('Turn on webcam first to enable face recognition.', 'warning', 'Webcam Required');
                  return;
                }
                setFaceDetectionActive(p => !p);
              }}
              className="w-full"
            >
              {faceDetectionActive ? 'Face AI: ON' : 'Enable Face AI'}
            </Button>

            <Button variant={showQueueZone ? 'secondary' : 'outline'} size="sm" icon={Square}
              onClick={() => setShowQueueZone(p => !p)} className="w-full">
              {showQueueZone ? 'Queue Zone: ON' : 'Queue Zone: OFF'}
            </Button>

            <Button variant={showSettings ? 'secondary' : 'outline'} size="sm" icon={SettingsIcon}
              onClick={() => setShowSettings(!showSettings)} className="w-full">
              Zone Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

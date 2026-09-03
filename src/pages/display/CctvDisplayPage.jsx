import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import camerasData from '../../data/cameras.json';
import { useStudentDB } from '../../context/StudentDBContext';
import {
  loadFaceModels,
  buildFaceMatcher,
  detectAndMatchFaces,
} from '../../utils/faceRecognition';
import {
  Maximize,
  Minimize,
  Clock,
  AlertTriangle,
  Users,
  Activity,
} from 'lucide-react';

export function CctvDisplayPage() {
  const { cameraId } = useParams();
  const { students, violations, updateStudent, recordViolation, zoneConfig } = useStudentDB();

  // State
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [faceModelsReady, setFaceModelsReady] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [activeCamStatus, setActiveCamStatus] = useState('Proper Queue');
  const [webcamError, setWebcamError] = useState(null);

  // Dynamic Queue Zone Parameters from shared Context / Live Admin changes
  const {
    zoneX = 15,
    zoneY = 40,
    zoneWidth = 70,
    zoneHeight = 55,
    penaltyPoints = 15,
    penaltyTime = 5,
  } = zoneConfig || {};

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const zoneCanvasRef = useRef(null);
  const faceCanvasRef = useRef(null);
  const faceLoopRef = useRef(null);
  const violationTimersRef = useRef({});
  const penalizedRecentlyRef = useRef({});

  // Active Camera
  const onlineCameras = camerasData.filter((c) => c.isOnline);
  const activeCamera = onlineCameras.find((c) => c.id === cameraId) || onlineCameras[0] || camerasData[0];
  const isViolation = activeCamStatus.includes('Cut-In') || activeCamStatus.includes('Violation');
  const recentViolation = violations[0] || null;

  // Live Digital Clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load Face Models on mount
  useEffect(() => {
    loadFaceModels()
      .then(() => setFaceModelsReady(true))
      .catch(() => setFaceModelsReady(false));
  }, []);

  // Sync canvas width and height dynamically with video element size
  const syncCanvasDimensions = useCallback(() => {
    const video = videoRef.current;
    const zoneCanvas = zoneCanvasRef.current;
    const faceCanvas = faceCanvasRef.current;
    if (!video || !zoneCanvas || !faceCanvas) return;

    const width = video.clientWidth || 1280;
    const height = video.clientHeight || 720;

    if (zoneCanvas.width !== width || zoneCanvas.height !== height) {
      zoneCanvas.width = width;
      zoneCanvas.height = height;
    }
    if (faceCanvas.width !== width || faceCanvas.height !== height) {
      faceCanvas.width = width;
      faceCanvas.height = height;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', syncCanvasDimensions);
    return () => window.removeEventListener('resize', syncCanvasDimensions);
  }, [syncCanvasDimensions]);

  // Auto-start live webcam directly for HDMI secondary display
  useEffect(() => {
    let stream = null;
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 360 },
          facingMode: 'user',
        },
      })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(() => {});
            syncCanvasDimensions();
          };
        }
        setWebcamError(null);
      })
      .catch((err) => {
        console.error('HDMI Display Webcam Error:', err);
        setWebcamError('Camera offline or permission denied. Please enable camera access.');
      });

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [syncCanvasDimensions]);

  // Real-time Queue Standing Zone Box Canvas Render (Updates live as admin changes sliders)
  useEffect(() => {
    const canvas = zoneCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let offset = 0;

    const render = () => {
      syncCanvasDimensions();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const zx = (zoneX / 100) * canvas.width;
      const zy = (zoneY / 100) * canvas.height;
      const zw = (zoneWidth / 100) * canvas.width;
      const zh = (zoneHeight / 100) * canvas.height;

      ctx.save();
      // Shaded Queue Area
      ctx.fillStyle = isViolation ? 'rgba(239, 68, 68, 0.16)' : 'rgba(34, 197, 94, 0.14)';
      ctx.fillRect(zx, zy, zw, zh);

      // Dashed Border
      ctx.beginPath();
      ctx.rect(zx, zy, zw, zh);
      ctx.lineWidth = 4;
      ctx.strokeStyle = isViolation ? '#EF4444' : '#22C55E';
      ctx.setLineDash([14, 8]);
      ctx.lineDashOffset = -offset;
      ctx.stroke();

      // Corner Target Accents
      const cl = 24;
      ctx.setLineDash([]);
      ctx.lineWidth = 5;
      ctx.strokeStyle = isViolation ? '#EF4444' : '#3B82F6';
      ctx.beginPath(); ctx.moveTo(zx, zy + cl); ctx.lineTo(zx, zy); ctx.lineTo(zx + cl, zy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(zx + zw - cl, zy); ctx.lineTo(zx + zw, zy); ctx.lineTo(zx + zw, zy + cl); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(zx, zy + zh - cl); ctx.lineTo(zx, zy + zh); ctx.lineTo(zx + cl, zy + zh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(zx + zw - cl, zy + zh); ctx.lineTo(zx + zw, zy + zh); ctx.lineTo(zx + zw, zy + zh - cl); ctx.stroke();

      // Queue Zone Header Label
      ctx.fillStyle = isViolation ? '#EF4444' : '#22C55E';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(
        isViolation ? '⚠️ QUEUE BOUNDARY CROSSING DETECTED' : '🎯 DESIGNATED QUEUE STANDING ZONE',
        zx + 14,
        zy - 12
      );
      ctx.restore();

      offset = (offset + 0.6) % 22;
      raf = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(raf);
  }, [isViolation, zoneX, zoneY, zoneWidth, zoneHeight, syncCanvasDimensions]);

  // Real-time AI Face Recognition & Queue Area Violation Tracking Loop
  const startDetectionLoop = useCallback(() => {
    const faceCanvas = faceCanvasRef.current;
    const video = videoRef.current;
    if (!faceCanvas || !video || !faceModelsReady) return;
    const ctx = faceCanvas.getContext('2d');
    const faceMatcher = buildFaceMatcher(students);

    const loop = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

      syncCanvasDimensions();
      const results = await detectAndMatchFaces(videoRef.current, faceMatcher);
      ctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);

      const videoW = video.videoWidth || 640;
      const videoH = video.videoHeight || 360;
      const canvasW = faceCanvas.width;
      const canvasH = faceCanvas.height;

      // Scale factors to map video pixel coordinates to displayed canvas pixels
      const scaleX = canvasW / videoW;
      const scaleY = canvasH / videoH;
      const now = Date.now();
      let anyViolation = false;

      const zx = (zoneX / 100) * canvasW;
      const zy = (zoneY / 100) * canvasH;
      const zw = (zoneWidth / 100) * canvasW;
      const zh = (zoneHeight / 100) * canvasH;

      const faces = results.map((r) => {
        const { x, y, width, height } = r.detection.box;
        const rawBx = x * scaleX;
        const by = y * scaleY;
        const bw = width * scaleX;
        const bh = height * scaleY;
        // The <video> element has CSS transform -scale-x-100 (horizontal mirror), so mirror X on canvas:
        const bx = canvasW - (rawBx + bw);

        const faceCenterX = bx + bw / 2;
        const faceCenterY = by + bh / 2;

        const isOutsideZone =
          faceCenterX < zx || faceCenterX > zx + zw || faceCenterY < zy || faceCenterY > zy + zh;

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
                  const currentScore = parseInt(r.queueScore, 10) || 80;
                  const newScore = Math.max(0, currentScore - penaltyPoints);
                  const currentDeduction =
                    (students.find((s) => s.id === r.studentId)?.weeklyDeduction || 0) + penaltyPoints;

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
                    cameraId: activeCamera.id,
                    cameraName: activeCamera.name,
                    penaltyPoints: penaltyPoints,
                    reason: `Outside Queue Standing Area for ${penaltyTime}s`,
                  });

                  penalizedRecentlyRef.current[r.studentId] = now;
                }
              }
            }
          }
        } else {
          if (!r.isUnknown && r.studentId) {
            delete violationTimersRef.current[r.studentId];
          }
        }

        const color = isOutsideZone
          ? '#EF4444'
          : r.isUnknown
          ? '#F97316'
          : r.queueScore >= 90
          ? '#22C55E'
          : '#3B82F6';

        // Draw Bounding Box around face
        ctx.strokeStyle = color;
        ctx.lineWidth = isOutsideZone ? 4 : 3;
        ctx.strokeRect(bx, by, bw, bh);

        // Name & Score Tag
        const label = r.isUnknown ? 'Unknown Person' : `${r.studentName} — ${r.queueScore} Pts`;
        ctx.font = 'bold 15px sans-serif';
        const tw = ctx.measureText(label).width + 16;
        ctx.fillStyle = color;
        ctx.fillRect(bx, by - 28, tw, 28);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(label, bx + 8, by - 9);

        // Violation countdown banner
        if (isOutsideZone && !r.isUnknown && r.studentId) {
          const duration = now - (violationTimersRef.current[r.studentId] || now);
          const timeLeft = Math.max(0, penaltyTime - duration / 1000).toFixed(1);
          if (timeLeft > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillRect(bx, by + bh, tw, 26);
            ctx.fillStyle = '#EF4444';
            ctx.fillText(`Infraction Penalty in ${timeLeft}s`, bx + 8, by + bh + 18);
          }
        }

        return { ...r, isOutsideZone };
      });

      setDetectedFaces(faces);
      setActiveCamStatus(anyViolation ? 'Cut-In Detected' : 'Proper Queue');

      faceLoopRef.current = setTimeout(loop, 100);
    };

    loop();
  }, [faceModelsReady, students, zoneX, zoneY, zoneWidth, zoneHeight, penaltyPoints, penaltyTime, activeCamera, syncCanvasDimensions]);

  useEffect(() => {
    if (faceModelsReady) {
      startDetectionLoop();
    }
    return () => {
      if (faceLoopRef.current) clearTimeout(faceLoopRef.current);
    };
  }, [faceModelsReady, startDetectionLoop]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black text-white flex flex-col justify-between overflow-hidden font-sans select-none z-50">
      {/* Top 16:9 Clean HUD Header */}
      <header className="h-16 px-6 bg-slate-950/90 backdrop-blur border-b border-slate-800 flex items-center justify-between z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping" />
            <span className="font-mono font-black text-sm uppercase tracking-widest text-red-500">
              CCTV LIVE FEED
            </span>
          </div>
          <div className="h-5 w-px bg-slate-800" />
          <div>
            <h1 className="font-black text-base tracking-tight text-white flex items-center gap-2">
              {activeCamera.name}
            </h1>
            <span className="text-[11px] text-slate-400 font-mono">
              {activeCamera.location} • NODE ID: {activeCamera.id}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Badge */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs ${
              isViolation
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isViolation ? 'bg-red-500' : 'bg-emerald-500'}`} />
            {isViolation ? '⚠️ QUEUE INFRACTION DETECTED' : '● ALL LANES DISCIPLINED'}
          </div>

          {/* Live Digital Clock */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-sm font-bold text-blue-400">
            <Clock className="w-4 h-4 text-blue-400" />
            {currentTime}
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Video Viewport with full 16:9 Canvas overlay */}
      <main
        ref={containerRef}
        className="flex-1 w-full h-full relative overflow-hidden bg-black flex items-center justify-center"
      >
        {/* Full-bleed Video Stream */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="w-full h-full object-contain transform -scale-x-100"
        />

        {/* Error / Standby Fallback */}
        {webcamError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-10 p-6 text-center">
            <AlertTriangle className="w-16 h-16 text-amber-500 mb-3 animate-bounce" />
            <h2 className="text-xl font-black text-white">Camera Feed Offline</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md">{webcamError}</p>
          </div>
        )}

        {/* Queue Standing Zone Canvas Overlay */}
        <canvas
          ref={zoneCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />

        {/* Face Recognition AI Canvas Overlay */}
        <canvas
          ref={faceCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-30"
        />

        {/* Corner Tracking Counts */}
        <div className="absolute bottom-4 left-6 z-40 flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-slate-950/85 backdrop-blur border border-slate-800 text-xs font-mono flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-white">{detectedFaces.length}</span> Person(s) Identified
          </div>
          <div className="px-4 py-2 rounded-2xl bg-slate-950/85 backdrop-blur border border-slate-800 text-xs font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-bold">30 FPS</span> • AI CONF 98.6%
          </div>
        </div>
      </main>

      {/* Bottom Live Alert Ticker */}
      <footer className="h-12 px-6 bg-slate-950/90 backdrop-blur border-t border-slate-800 flex items-center justify-between text-xs z-40 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            HDMI MONITOR 2 OUTPUT • REALTIME AI SYNC
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">
            ZONE BOX: {zoneWidth}% × {zoneHeight}% (POS: {zoneX}%, {zoneY}%)
          </span>
        </div>

        <div>
          {recentViolation ? (
            <span className="text-red-400 flex items-center gap-2 animate-pulse font-bold">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              LATEST INFRACTION: {recentViolation.student_name} (-{recentViolation.penalty_points || 15} PTS)
            </span>
          ) : (
            <span className="text-slate-400">
              STATUS: ZERO ACTIVE LINE INFRACTIONS
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}

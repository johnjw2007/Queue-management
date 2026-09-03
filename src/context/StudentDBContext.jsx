import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import defaultStudents from '../data/students.json';
import defaultDepartments from '../data/departments.json';
import { supabase, isCloudConfigured } from '../utils/supabaseClient';

import defaultCameras from '../data/cameras.json';

const StudentDBContext = createContext();

const STORAGE_KEY_STUDENTS = 'queuesense_students_cache';
const STORAGE_KEY_DEPTS = 'queuesense_departments_cache';
const STORAGE_KEY_VIOLATIONS = 'queuesense_violations_cache';
const STORAGE_KEY_CAMERAS = 'queuesense_cameras_cache';
const STORAGE_KEY_ZONE = 'queuesense_camera_zone_config';

const DEFAULT_ZONE_CONFIG = {
  zoneX: 15,
  zoneY: 40,
  zoneWidth: 70,
  zoneHeight: 55,
  penaltyPoints: 15,
  penaltyTime: 5,
};

// Helper to normalize department objects
function createDeptMap(departments) {
  const map = new Map();
  departments.forEach(d => map.set(d.id, d));
  return map;
}

// Initial fallback loader for students
function loadInitialStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (raw) return JSON.parse(raw);
  } catch {/* ignore */}
  return defaultStudents.map(s => ({
    ...s,
    username: s.username || s.name.toLowerCase().replace(/\s+/g, '.'),
    password: s.password || 'student123',
    facePhoto: s.facePhoto || s.avatar || null,
    faceDescriptor: s.faceDescriptor || null,
  }));
}

// Initial fallback loader for departments
function loadInitialDepartments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEPTS);
    if (raw) return JSON.parse(raw);
  } catch {/* ignore */}
  return defaultDepartments;
}

// Initial fallback loader for violations
function loadInitialViolations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VIOLATIONS);
    if (raw) return JSON.parse(raw);
  } catch {/* ignore */}
  return [];
}

// Initial fallback loader for cameras
function loadInitialCameras() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAMERAS);
    if (raw) return JSON.parse(raw);
  } catch {/* ignore */}
  return defaultCameras;
}

// Initial loader for shared camera zone settings
function loadInitialZoneConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ZONE);
    if (raw) return JSON.parse(raw);
  } catch {/* ignore */}
  return DEFAULT_ZONE_CONFIG;
}

export function StudentDBProvider({ children }) {
  const [departments, setDepartments] = useState(loadInitialDepartments);
  const [students, setStudents] = useState(loadInitialStudents);
  const [violations, setViolations] = useState(loadInitialViolations);
  const [cameras, setCameras] = useState(loadInitialCameras);
  const [zoneConfig, setZoneConfig] = useState(loadInitialZoneConfig);
  const [cloudConnected, setCloudConnected] = useState(true);
  const [loading, setLoading] = useState(true);

  // Sync caches
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DEPTS, JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VIOLATIONS, JSON.stringify(violations));
  }, [violations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CAMERAS, JSON.stringify(cameras));
  }, [cameras]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ZONE, JSON.stringify(zoneConfig));
  }, [zoneConfig]);

  // Update queue zone config for a specific camera (or default) across admin and HDMI display tabs
  const updateZoneConfig = useCallback((newConfig, cameraId = 'CAM-01') => {
    setZoneConfig(prev => {
      const isCameraSpecific = typeof cameraId === 'string';
      const updated = isCameraSpecific
        ? { ...prev, [cameraId]: { ...(prev[cameraId] || DEFAULT_ZONE_CONFIG), ...newConfig } }
        : { ...prev, ...newConfig };
      
      localStorage.setItem(STORAGE_KEY_ZONE, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getCameraZoneConfig = useCallback((cameraId = 'CAM-01') => {
    if (zoneConfig && zoneConfig[cameraId]) {
      return zoneConfig[cameraId];
    }
    return {
      zoneX: zoneConfig?.zoneX ?? DEFAULT_ZONE_CONFIG.zoneX,
      zoneY: zoneConfig?.zoneY ?? DEFAULT_ZONE_CONFIG.zoneY,
      zoneWidth: zoneConfig?.zoneWidth ?? DEFAULT_ZONE_CONFIG.zoneWidth,
      zoneHeight: zoneConfig?.zoneHeight ?? DEFAULT_ZONE_CONFIG.zoneHeight,
      penaltyPoints: zoneConfig?.penaltyPoints ?? DEFAULT_ZONE_CONFIG.penaltyPoints,
      penaltyTime: zoneConfig?.penaltyTime ?? DEFAULT_ZONE_CONFIG.penaltyTime,
    };
  }, [zoneConfig]);

  // Update camera details (e.g. stream_url, name, location) in cloud & local state
  const updateCamera = useCallback(async (cameraId, updates) => {
    setCameras(prev => prev.map(c => c.id === cameraId ? { ...c, ...updates } : c));

    if (isCloudConfigured && supabase) {
      try {
        const cloudPayload = {};
        if (updates.name) cloudPayload.name = updates.name;
        if (updates.location) cloudPayload.location = updates.location;
        if (updates.streamType || updates.stream_type) cloudPayload.stream_type = updates.streamType || updates.stream_type;
        if (updates.streamUrl !== undefined || updates.stream_url !== undefined) cloudPayload.stream_url = updates.streamUrl ?? updates.stream_url;
        if (updates.isOnline !== undefined || updates.is_active !== undefined) cloudPayload.is_active = updates.isOnline ?? updates.is_active;

        await supabase.from('cameras').update(cloudPayload).eq('id', cameraId);
      } catch (err) {
        console.error('[QueueSense] Failed to update camera in cloud:', err);
      }
    }
  }, []);

  // Listen to cross-tab storage events so changes reflect instantly across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY_ZONE && e.newValue) {
        try { setZoneConfig(JSON.parse(e.newValue)); } catch {/* skip */}
      } else if (e.key === STORAGE_KEY_STUDENTS && e.newValue) {
        try { setStudents(JSON.parse(e.newValue)); } catch {/* skip */}
      } else if (e.key === STORAGE_KEY_DEPTS && e.newValue) {
        try { setDepartments(JSON.parse(e.newValue)); } catch {/* skip */}
      } else if (e.key === STORAGE_KEY_VIOLATIONS && e.newValue) {
        try { setViolations(JSON.parse(e.newValue)); } catch {/* skip */}
      } else if (e.key === STORAGE_KEY_CAMERAS && e.newValue) {
        try { setCameras(JSON.parse(e.newValue)); } catch {/* skip */}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Load from Supabase Cloud if configured
  const fetchCloudData = useCallback(async () => {
    if (!isCloudConfigured || !supabase) return;
    try {
      setLoading(true);

      // Fetch Departments
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      
      if (!deptError && deptData && deptData.length > 0) {
        setDepartments(deptData);
      }

      // Fetch Cameras
      const { data: camData, error: camError } = await supabase
        .from('cameras')
        .select('*')
        .order('id');

      if (!camError && camData && camData.length > 0) {
        const mappedCameras = camData.map(c => ({
          id: c.id,
          name: c.name,
          location: c.location,
          streamType: c.stream_type || 'webcam',
          streamUrl: c.stream_url || null,
          isOnline: c.is_active ?? true,
          fps: c.fps || 30,
          confidence: Number(c.confidence) || 98.5,
          status: 'Normal',
          queueStatus: 'Proper Queue',
          peopleCount: 0,
          virtualLineActive: true,
          lastIncident: 'None today',
        }));
        setCameras(mappedCameras);
        try { localStorage.setItem(STORAGE_KEY_CAMERAS, JSON.stringify(mappedCameras)); } catch {/* ignore */}
      }

      // Fetch Students
      const { data: stuData, error: stuError } = await supabase
        .from('students')
        .select('*')
        .order('name');

      if (!stuError && stuData) {
        const currentDepts = (deptData && deptData.length > 0) ? deptData : departments;
        const mappedStudents = stuData.map(s => ({
          id: s.id,
          username: s.username || s.name.toLowerCase().replace(/\s+/g, '.'),
          password: s.password || 'student123',
          name: s.name,
          registerNumber: s.register_number,
          departmentId: s.department_id,
          department: currentDepts?.find(d => d.id === s.department_id)?.name || s.department_id,
          email: s.email,
          phone: s.phone,
          avatar: s.avatar,
          facePhoto: s.face_photo,
          faceDescriptor: s.face_descriptor,
          queueScore: Number(s.queue_score) || 80,
          monthlyRewardPoints: Number(s.monthly_reward_points) || 0,
          maxMonthlyReward: Number(s.max_monthly_reward) || 50,
          weeklyDeduction: Number(s.weekly_deduction) || 0,
          isEligibleForReward: Boolean(s.is_eligible_for_reward ?? (Number(s.queue_score) >= 90)),
          currentQueueStatus: s.current_queue_status || 'Proper Queue',
          joinDate: s.join_date,
        }));
        setStudents(mappedStudents);
        try {
          localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(mappedStudents));
        } catch {/* ignore */}
      }

      // Fetch Violations
      const { data: violData, error: violError } = await supabase
        .from('violations')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (!violError && violData) {
        setViolations(violData);
      }

      setCloudConnected(true);
    } catch (err) {
      console.warn('[QueueSense Cloud] Fetch failed:', err);
      setCloudConnected(false);
    } finally {
      setLoading(false);
    }
  }, [departments]);

  // Setup Realtime Subscription on Cloud
  useEffect(() => {
    if (!isCloudConfigured || !supabase) return;
    fetchCloudData();

    const channel = supabase
      .channel('queuesense-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new) {
          setStudents(prev => prev.map(s => s.id === payload.new.id ? {
            ...s,
            queueScore: payload.new.queue_score,
            weeklyDeduction: payload.new.weekly_deduction,
            monthlyRewardPoints: payload.new.monthly_reward_points,
            currentQueueStatus: payload.new.current_queue_status,
            name: payload.new.name,
            registerNumber: payload.new.register_number,
            departmentId: payload.new.department_id,
            email: payload.new.email,
            phone: payload.new.phone,
            avatar: payload.new.avatar,
            facePhoto: payload.new.face_photo,
            faceDescriptor: payload.new.face_descriptor,
          } : s));
        } else {
          fetchCloudData();
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, () => {
        fetchCloudData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cameras' }, () => {
        fetchCloudData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'violations' }, (payload) => {
        if (payload.new) {
          setViolations(prev => [payload.new, ...prev]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCloudData]);

  // Ensure department exists or create it
  const ensureDepartment = useCallback(async (deptName) => {
    if (!deptName || !deptName.trim()) return 'DEPT_GEN';
    const cleanName = deptName.trim();
    const existing = departments.find(
      d => d.name.toLowerCase() === cleanName.toLowerCase() || d.code.toLowerCase() === cleanName.toLowerCase()
    );
    if (existing) return existing.id;

    // Generate code and ID
    const code = cleanName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 8) || 'DEPT';
    const id = `DEPT_${cleanName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase().slice(0, 20)}_${Date.now().toString().slice(-4)}`;
    const newDept = { id, name: cleanName, code };

    // Update locally
    setDepartments(prev => [...prev, newDept]);

    // Update cloud if active
    if (isCloudConfigured && supabase) {
      try {
        await supabase.from('departments').insert([newDept]);
      } catch (e) {
        console.error('[QueueSense] Cloud department insert error:', e);
      }
    }

    return id;
  }, [departments]);

  // Add a new student
  const addStudent = async (studentData) => {
    const deptId = studentData.departmentId || await ensureDepartment(studentData.department);
    const deptObj = departments.find(d => d.id === deptId);
    const deptName = deptObj ? deptObj.name : (studentData.department || 'General');

    const newStudent = {
      ...studentData,
      id: studentData.id || `STU${Date.now()}`,
      departmentId: deptId,
      department: deptName,
      queueScore: studentData.queueScore ?? 80,
      monthlyRewardPoints: studentData.monthlyRewardPoints ?? 0,
      maxMonthlyReward: 50,
      weeklyDeduction: 0,
      isEligibleForReward: (studentData.queueScore ?? 80) >= 90,
      currentQueueStatus: 'Proper Queue',
      joinDate: new Date().toISOString().split('T')[0],
      faceDescriptor: studentData.faceDescriptor || null,
      username: studentData.username || studentData.name.toLowerCase().replace(/\s+/g, '.'),
      password: studentData.password || 'student123',
    };

    setStudents(prev => [...prev, newStudent]);

    // Push to Supabase Cloud
    if (isCloudConfigured && supabase) {
      try {
        await supabase.from('students').insert([{
          id: newStudent.id,
          username: newStudent.username,
          password: newStudent.password,
          name: newStudent.name,
          register_number: newStudent.registerNumber,
          department_id: deptId,
          email: newStudent.email || null,
          phone: newStudent.phone || null,
          avatar: newStudent.avatar || null,
          face_photo: newStudent.facePhoto || null,
          face_descriptor: newStudent.faceDescriptor || null,
          queue_score: newStudent.queueScore,
          monthly_reward_points: newStudent.monthlyRewardPoints,
          max_monthly_reward: newStudent.maxMonthlyReward,
          weekly_deduction: newStudent.weeklyDeduction,
          is_eligible_for_reward: newStudent.isEligibleForReward,
          current_queue_status: newStudent.currentQueueStatus,
          join_date: newStudent.joinDate,
        }]);
      } catch (err) {
        console.error('[QueueSense] Cloud add student error:', err);
      }
    }

    return newStudent;
  };

  // Update existing student
  const updateStudent = async (id, updates) => {
    let deptId = updates.departmentId;
    let deptName = updates.department;

    if (updates.department && !deptId) {
      deptId = await ensureDepartment(updates.department);
      const d = departments.find(item => item.id === deptId);
      deptName = d ? d.name : updates.department;
    }

    setStudents(prev =>
      prev.map(s => {
        if (s.id !== id) return s;
        const newScore = updates.queueScore !== undefined ? updates.queueScore : s.queueScore;
        return {
          ...s,
          ...updates,
          departmentId: deptId || s.departmentId,
          department: deptName || s.department,
          queueScore: newScore,
          isEligibleForReward: newScore >= 90,
        };
      })
    );

    // Push updates to cloud
    if (isCloudConfigured && supabase) {
      const cloudUpdates = {};
      if (updates.username) cloudUpdates.username = updates.username;
      if (updates.password) cloudUpdates.password = updates.password;
      if (updates.name) cloudUpdates.name = updates.name;
      if (updates.registerNumber) cloudUpdates.register_number = updates.registerNumber;
      if (deptId) cloudUpdates.department_id = deptId;
      if (updates.email !== undefined) cloudUpdates.email = updates.email;
      if (updates.phone !== undefined) cloudUpdates.phone = updates.phone;
      if (updates.avatar !== undefined) cloudUpdates.avatar = updates.avatar;
      if (updates.facePhoto !== undefined) cloudUpdates.face_photo = updates.facePhoto;
      if (updates.faceDescriptor !== undefined) cloudUpdates.face_descriptor = updates.faceDescriptor;
      if (updates.queueScore !== undefined) {
        cloudUpdates.queue_score = updates.queueScore;
        cloudUpdates.is_eligible_for_reward = updates.queueScore >= 90;
      }
      if (updates.weeklyDeduction !== undefined) cloudUpdates.weekly_deduction = updates.weeklyDeduction;
      if (updates.monthlyRewardPoints !== undefined) cloudUpdates.monthly_reward_points = updates.monthlyRewardPoints;

      try {
        await supabase.from('students').update(cloudUpdates).eq('id', id);
      } catch (err) {
        console.error('[QueueSense] Cloud update student error:', err);
      }
    }
  };

  // Delete student
  const deleteStudent = async (id) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    if (isCloudConfigured && supabase) {
      try {
        await supabase.from('students').delete().eq('id', id);
      } catch (err) {
        console.error('[QueueSense] Cloud delete student error:', err);
      }
    }
  };

  // Record a CCTV violation event in cloud & local database
  const recordViolation = async ({ studentId, studentName, registerNumber, departmentId, cameraId, cameraName, penaltyPoints, reason }) => {
    const violationPayload = {
      student_id: studentId || null,
      student_name: studentName,
      register_number: registerNumber || null,
      department_id: departmentId || null,
      camera_id: cameraId || 'CAM-01',
      camera_name: cameraName || 'Camera 01 (Lift 1 AI Vision Node)',
      penalty_points: penaltyPoints || 15,
      reason: reason || 'Queue Cut-In / Line Cross',
    };

    // Push to Supabase Cloud
    if (isCloudConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('violations').insert([violationPayload]).select();
        if (!error && data && data.length > 0) {
          setViolations(prev => [data[0], ...prev.filter(v => v.id !== data[0].id)]);
          return data[0];
        }
      } catch (e) {
        console.error('[QueueSense] Cloud violation log error:', e);
      }
    }

    const localRecord = {
      id: `VIOL_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ...violationPayload,
      timestamp: new Date().toISOString(),
    };
    setViolations(prev => [localRecord, ...prev]);
    return localRecord;
  };

  // Save face descriptor
  const saveFaceDescriptor = (id, descriptor) => {
    updateStudent(id, { faceDescriptor: descriptor });
  };

  // Authenticate student by ID, Register Number, or Username + password
  const authenticateStudent = async (loginId, password) => {
    const cleanId = (loginId || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // 1. Check current memory / cache
    let found = students.find(
      s => ((s.username && s.username.toLowerCase() === cleanId) ||
            (s.id && s.id.toLowerCase() === cleanId) ||
            (s.registerNumber && s.registerNumber.toLowerCase() === cleanId)) &&
            ((s.password || 'student123').trim() === cleanPass)
    );

    if (found) return found;

    // 2. If not found in cache (e.g. freshly opened device), query Supabase directly
    if (isCloudConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .or(`id.ilike.%${cleanId}%,register_number.ilike.%${cleanId}%,username.ilike.%${cleanId}%`)
          .limit(1);

        if (!error && data && data.length > 0) {
          const s = data[0];
          const expectedPass = (s.password || 'student123').trim();
          if (expectedPass === cleanPass) {
            const mapped = {
              id: s.id,
              username: s.username,
              password: s.password || 'student123',
              name: s.name,
              registerNumber: s.register_number,
              departmentId: s.department_id,
              department: departments.find(d => d.id === s.department_id)?.name || s.department_id,
              email: s.email,
              phone: s.phone,
              avatar: s.avatar,
              facePhoto: s.face_photo,
              faceDescriptor: s.face_descriptor,
              queueScore: s.queue_score,
              monthlyRewardPoints: s.monthly_reward_points,
              maxMonthlyReward: s.max_monthly_reward,
              weeklyDeduction: s.weekly_deduction,
              isEligibleForReward: s.is_eligible_for_reward,
              currentQueueStatus: s.current_queue_status,
              joinDate: s.join_date,
            };
            // Cache it locally
            setStudents(prev => [mapped, ...prev.filter(x => x.id !== mapped.id)]);
            return mapped;
          }
        }
      } catch (err) {
        console.warn('Direct cloud login lookup failed:', err);
      }
    }

    return null;
  };

  // Compute Authoritative Department Statistics
  const getDepartmentStats = useCallback(() => {
    const deptMap = createDeptMap(departments);
    const counts = new Map();

    // Group active students by department_id
    students.forEach(s => {
      const dId = s.departmentId || 'DEPT_UNKNOWN';
      if (!counts.has(dId)) {
        counts.set(dId, {
          departmentId: dId,
          departmentName: deptMap.get(dId)?.name || s.department || 'Other',
          departmentCode: deptMap.get(dId)?.code || 'GEN',
          uniqueStudentIds: new Set(),
          totalScore: 0,
          totalDeductions: 0,
          eligibleCount: 0,
        });
      }
      const entry = counts.get(dId);
      entry.uniqueStudentIds.add(s.id);
      entry.totalScore += (s.queueScore || 0);
      entry.totalDeductions += (s.weeklyDeduction || 0);
      if ((s.queueScore || 0) >= 90) {
        entry.eligibleCount += 1;
      }
    });

    // Ensure all defined departments are represented
    departments.forEach(d => {
      if (!counts.has(d.id)) {
        counts.set(d.id, {
          departmentId: d.id,
          departmentName: d.name,
          departmentCode: d.code,
          uniqueStudentIds: new Set(),
          totalScore: 0,
          totalDeductions: 0,
          eligibleCount: 0,
        });
      }
    });

    const result = Array.from(counts.values()).map(entry => {
      const studentCount = entry.uniqueStudentIds.size;
      return {
        departmentId: entry.departmentId,
        name: entry.departmentName,
        code: entry.departmentCode,
        totalStudents: studentCount,
        avgScore: studentCount > 0 ? Number((entry.totalScore / studentCount).toFixed(1)) : 0,
        totalDeductions: entry.totalDeductions,
        eligibleCount: entry.eligibleCount,
      };
    });

    // Sort by unique enrolled students descending, then avgScore descending
    result.sort((a, b) => b.totalStudents - a.totalStudents || b.avgScore - a.avgScore);

    const topDepartment = result.length > 0 ? result[0] : null;

    return {
      departmentList: result,
      topDepartment,
    };
  }, [departments, students]);

  return (
    <StudentDBContext.Provider value={{
      students,
      departments,
      violations,
      cameras,
      updateCamera,
      zoneConfig,
      updateZoneConfig,
      getCameraZoneConfig,
      cloudConnected,
      loading,
      addStudent,
      updateStudent,
      deleteStudent,
      saveFaceDescriptor,
      authenticateStudent,
      recordViolation,
      ensureDepartment,
      getDepartmentStats,
      fetchCloudData,
    }}>
      {children}
    </StudentDBContext.Provider>
  );
}

export function useStudentDB() {
  const ctx = useContext(StudentDBContext);
  if (!ctx) throw new Error('useStudentDB must be used within StudentDBProvider');
  return ctx;
}

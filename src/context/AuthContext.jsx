import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isCloudConfigured } from '../utils/supabaseClient';

const AuthContext = createContext();

const STORAGE_KEY_AUTH = 'queuesense_auth';
const STORAGE_KEY_ADMINS = 'queuesense_admins_roster';

const DEFAULT_ADMINS = [
  {
    id: '212224040141',
    password: 'john24',
    name: 'Chief Surveillance Admin',
    email: 'admin.surveillance@saveetha.ac.in',
    department: 'Deanery of Discipline & Campus Surveillance',
    institution: 'Saveetha Engineering College',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300'
  }
];

export function AuthProvider({ children }) {
  // Load admins strictly from Supabase Cloud
  const [adminsList, setAdminsList] = useState(DEFAULT_ADMINS);

  // Load session from localStorage if present
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_AUTH);
      if (!savedUser) return null;
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });

  // Sync admins from Supabase Cloud if available
  const fetchCloudAdmins = useCallback(async () => {
    if (!isCloudConfigured || !supabase) return;
    try {
      const { data, error } = await supabase.from('admins').select('*');
      if (!error && data && data.length > 0) {
        setAdminsList(data);
        localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Could not fetch cloud admins, using cached:', e);
    }
  }, []);

  useEffect(() => {
    fetchCloudAdmins();
  }, [fetchCloudAdmins]);

  // Sync admins to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(adminsList));
  }, [adminsList]);

  // Sync user session to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
  }, [user]);

  // Authenticate Admin against stored list / Cloud
  const authenticateAdmin = (adminId, password) => {
    const cleanId = (adminId || '').trim();
    const found = adminsList.find(a => a.id === cleanId && a.password === password);
    return found || null;
  };

  // Add a new Administrator (Saves to both Cloud & Local Cache)
  const addAdmin = async (newAdminData) => {
    const newAdmin = {
      id: (newAdminData.id || '').trim(),
      password: newAdminData.password,
      name: newAdminData.name || 'Campus Administrator',
      email: newAdminData.email || 'admin@saveetha.ac.in',
      department: newAdminData.department || 'Campus Security & Discipline',
      institution: 'Saveetha Engineering College',
      role: 'admin',
      avatar: newAdminData.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300'
    };

    setAdminsList(prev => {
      const filtered = prev.filter(a => a.id !== newAdmin.id);
      const updated = [...filtered, newAdmin];
      localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(updated));
      return updated;
    });

    if (isCloudConfigured && supabase) {
      try {
        await supabase.from('admins').upsert(newAdmin);
      } catch (e) {
        console.error('Failed to sync admin to cloud:', e);
      }
    }

    return newAdmin;
  };

  // Update current user's profile details (ID, Name, Email, Department, Avatar, Password)
  const updateAdminProfile = async (updates) => {
    const oldId = user?.id;
    const newId = (updates.id || oldId || '').trim();

    const updatedUser = {
      ...user,
      ...updates,
      id: newId,
      role: 'admin',
      institution: 'Saveetha Engineering College',
    };

    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(updatedUser));

    // Update local admins list
    setAdminsList(prev => {
      let found = false;
      const updatedList = prev.map(a => {
        if (a.id === oldId) {
          found = true;
          return { ...a, ...updates, id: newId };
        }
        return a;
      });

      if (!found) {
        updatedList.push(updatedUser);
      }

      localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(updatedList));
      return updatedList;
    });

    // Update in Supabase Cloud
    if (isCloudConfigured && supabase) {
      try {
        if (oldId && oldId !== newId) {
          await supabase.from('admins').delete().eq('id', oldId);
        }
        await supabase.from('admins').upsert({
          id: newId,
          name: updatedUser.name,
          email: updatedUser.email,
          department: updatedUser.department,
          password: updatedUser.password,
          avatar: updatedUser.avatar,
          role: 'admin',
          institution: 'Saveetha Engineering College'
        });
      } catch (e) {
        console.error('Failed to update admin in cloud:', e);
      }
    }
  };

  // Delete admin
  const deleteAdmin = async (adminId) => {
    if (adminId === '212224040141') return false;
    setAdminsList(prev => {
      const updated = prev.filter(a => a.id !== adminId);
      localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(updated));
      return updated;
    });

    if (isCloudConfigured && supabase) {
      try {
        await supabase.from('admins').delete().eq('id', adminId);
      } catch (e) {
        console.error('Failed to delete admin from cloud:', e);
      }
    }
    return true;
  };

  const loginAsStudent = (studentObj, remember = false) => {
    const userData = {
      role: 'student',
      ...studentObj
    };
    setUser(userData);
    if (remember) {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(userData));
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
  };

  const loginAsAdmin = (adminData, remember = false) => {
    const payload = {
      role: 'admin',
      ...adminData
    };
    setUser(payload);
    if (remember) {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(payload));
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_AUTH);
  };

  const updateStudentPoints = (studentId, newPoints, newScore) => {
    if (user && user.id === studentId) {
      setUser(prev => ({
        ...prev,
        monthlyRewardPoints: newPoints ?? prev.monthlyRewardPoints,
        queueScore: newScore ?? prev.queueScore,
        isEligibleForReward: (newScore ?? prev.queueScore) >= 90
      }));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      adminsList,
      authenticateAdmin,
      addAdmin,
      updateAdminProfile,
      deleteAdmin,
      loginAsStudent,
      loginAsAdmin,
      logout,
      updateStudentPoints
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

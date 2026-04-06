import { useState, useEffect } from 'react';
import { AdminSession, SchoolSession } from '../types';
import {
  adminSessionStorageKey,
  schoolSessionStorageKey,
  adminActivityStorageKey,
  schoolActivityStorageKey,
  sessionTimeoutMs
} from '../lib/constants';

export const useAuth = () => {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [schoolSession, setSchoolSession] = useState<SchoolSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedAdmin = localStorage.getItem(adminSessionStorageKey);
    const storedSchool = localStorage.getItem(schoolSessionStorageKey);

    if (storedAdmin) {
      const lastActivity = localStorage.getItem(adminActivityStorageKey);
      if (lastActivity && Date.now() - Number(lastActivity) < sessionTimeoutMs) {
        setAdminSession(JSON.parse(storedAdmin));
      } else {
        logoutAdmin();
      }
    }

    if (storedSchool) {
      const lastActivity = localStorage.getItem(schoolActivityStorageKey);
      if (lastActivity && Date.now() - Number(lastActivity) < sessionTimeoutMs) {
        setSchoolSession(JSON.parse(storedSchool));
      } else {
        logoutSchool();
      }
    }

    setIsLoading(false);
  }, []);

  const loginAdmin = (session: AdminSession) => {
    setAdminSession(session);
    localStorage.setItem(adminSessionStorageKey, JSON.stringify(session));
    localStorage.setItem(adminActivityStorageKey, String(Date.now()));
  };

  const loginSchool = (session: SchoolSession) => {
    setSchoolSession(session);
    localStorage.setItem(schoolSessionStorageKey, JSON.stringify(session));
    localStorage.setItem(schoolActivityStorageKey, String(Date.now()));
  };

  const logoutAdmin = () => {
    setAdminSession(null);
    localStorage.removeItem(adminSessionStorageKey);
    localStorage.removeItem(adminActivityStorageKey);
  };

  const logoutSchool = () => {
    setSchoolSession(null);
    localStorage.removeItem(schoolSessionStorageKey);
    localStorage.removeItem(schoolActivityStorageKey);
  };

  return {
    adminSession,
    schoolSession,
    isLoading,
    loginAdmin,
    loginSchool,
    logoutAdmin,
    logoutSchool
  };
};

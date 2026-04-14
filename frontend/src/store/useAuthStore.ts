import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AdminSession = { email: string; fullName: string; role: string };
type SchoolSession = {
  tenantId: string;
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  email: string;
  fullName: string;
  role: string;
};

interface AuthState {
  adminSession: AdminSession | null;
  schoolSession: SchoolSession | null;
  setAdminSession: (session: AdminSession | null) => void;
  setSchoolSession: (session: SchoolSession | null) => void;
  logoutAdmin: () => void;
  logoutSchool: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      adminSession: null,
      schoolSession: null,
      setAdminSession: (session) => set({ adminSession: session }),
      setSchoolSession: (session) => set({ schoolSession: session }),
      logoutAdmin: () => set({ adminSession: null }),
      logoutSchool: () => set({ schoolSession: null }),
    }),
    {
      name: 'elevate-auth-storage',
    }
  )
);

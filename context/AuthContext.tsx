'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { apiClient } from '@/services/apiClient';

export interface CurrentUserInfo {
  id: number;
  email: string;
  name: string;
  role: string;
  department: string | null;
  department_code: string | null;
  class_name: string | null;
  picture?: string;
}

export const mapBackendRoleToFrontend = (backendRole: string): string => {
  if (!backendRole) return '';
  const role = backendRole.toLowerCase();
  if (role === 'faculty') return 'teacher';
  if (role === 'evaluation') return 'evaluator';
  return role; // student, admin
};

const DEPARTMENT_COURSE_MAP: Record<string, {
  deptCode: string;
  department: string;
  course: string;
  displayCourse: string;
  level: 'UG' | 'PG';
  multiBatch: boolean;
}> = {
  ce: { deptCode: 'ENG', department: 'Department of English / Languages', course: 'BA Communicative English', displayCourse: 'BACE', level: 'UG', multiBatch: false },
  bm: { deptCode: 'SCPS', department: 'School of Commerce and Professional Studies', course: 'Bachelor of Commerce', displayCourse: 'BCOM', level: 'UG', multiBatch: true },
  mm: { deptCode: 'SCPS', department: 'School of Commerce and Professional Studies', course: 'Master of Commerce', displayCourse: 'MCOM', level: 'PG', multiBatch: true },
  bf: { deptCode: 'SCPS', department: 'School of Commerce and Professional Studies', course: 'B.Com FinTech with Applied AI', displayCourse: 'BCOM (FINTECH)', level: 'UG', multiBatch: false },
  bb: { deptCode: 'UGBBA', department: 'UG Department of Business Administration', course: 'Bachelor of Business Administration', displayCourse: 'BBA', level: 'UG', multiBatch: true },
  bc: { deptCode: 'UGDCA', department: 'UG Department of Computer Applications', course: 'Bachelor of Computer Applications', displayCourse: 'BCA', level: 'UG', multiBatch: true },
  sw: { deptCode: 'SSW', department: 'School of Social Work', course: 'Bachelor of Social Work', displayCourse: 'BSW', level: 'UG', multiBatch: true },
  psw: { deptCode: 'SSW', department: 'School of Social Work', course: 'Master of Social Work', displayCourse: 'MSW', level: 'PG', multiBatch: false },
  ma: { deptCode: 'MATHS', department: 'Department of Mathematics', course: 'B.Sc Mathematics', displayCourse: 'MATHS', level: 'UG', multiBatch: false },
  cm: { deptCode: 'MCMS', department: 'Department of Communication and Media Studies', course: 'Master of Communication and Media Studies', displayCourse: 'MCMS', level: 'PG', multiBatch: false },
  ht: { deptCode: 'MHTM', department: 'Department of Hospitality and Tourism Management', course: 'Master of Hospitality and Tourism Management', displayCourse: 'MHTM', level: 'PG', multiBatch: false },
  ph: { deptCode: 'PHYSICS', department: 'Department of Physics', course: 'M.Sc Integrated Physics', displayCourse: 'MSC PHYSICS', level: 'UG', multiBatch: false },
  ec: { deptCode: 'ECONOMICS', department: 'Department of Economics', course: 'BA Economics', displayCourse: 'ECONOMICS', level: 'UG', multiBatch: false },
  py: { deptCode: 'PSYCHOLOGY', department: 'Department of Psychology', course: 'B.Sc Psychology', displayCourse: 'PSYCHOLOGY', level: 'UG', multiBatch: false },
  ba: { deptCode: 'MBA', department: 'Masters of Business Administration', course: 'Master of Business Administration', displayCourse: 'MBA', level: 'PG', multiBatch: true },
  mc: { deptCode: 'PGDCA', department: 'PG Department of Computer Applications', course: 'Master of Computer Applications', displayCourse: 'MCA', level: 'PG', multiBatch: false },
};

const SECTION_MAP: Record<string, string> = {
  '1': 'A',
  '2': 'B',
  '3': 'C',
};

const ROMAN_YEARS: Record<number, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
  6: 'VI',
};

export function parseStudentEmail(email: string) {
  if (!email || typeof email !== 'string') return null;
  const clean = email.trim().toLowerCase();
  if (!clean.endsWith('@mariancollege.org')) return null;

  const localPart = clean.slice(0, -'@mariancollege.org'.length);
  const dotIndex = localPart.lastIndexOf('.');
  if (dotIndex === -1) return null;

  const namePart = localPart.slice(0, dotIndex);
  const codePart = localPart.slice(dotIndex + 1);

  // Capitalize name parts (e.g. faizah -> Faizah, mary.ann -> Mary Ann)
  const firstName = namePart
    .split('.')
    .filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');

  // Strict regex: YY (2 digits), L (u/p/i), CC (2 letters), D (1 digit), XX (2 digits)
  let match = codePart.match(/^(\d{2})([upi])([a-z]{2})(\d)(\d{2})$/);
  if (!match) {
    // Fallback for variable length roll numbers
    match = codePart.match(/^(\d{2})([upi])([a-z]{2})(\d)(\d+)$/);
  }
  if (!match) return null;

  const [, batchStr, levelChar, courseCodeStr, sectionDigit, rollDigits] = match;
  const batchYear = 2000 + parseInt(batchStr, 10);
  const rollNumber = parseInt(rollDigits, 10);

  // Determine lookup code (sw + p -> psw MSW)
  let lookupCode = courseCodeStr;
  if (courseCodeStr === 'sw' && levelChar === 'p') {
    lookupCode = 'psw';
  }

  const courseInfo = DEPARTMENT_COURSE_MAP[lookupCode];
  if (!courseInfo) return null;

  // Active academic year calculation (e.g. 2026-2027)
  const now = new Date();
  const activeYearStart = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  const yearNumber = Math.max(1, activeYearStart - batchYear + 1);
  const yearRoman = ROMAN_YEARS[yearNumber] || String(yearNumber);

  // Section handling
  let section = '';
  if (courseInfo.multiBatch) {
    section = SECTION_MAP[sectionDigit] || 'A';
  }

  const className = section
    ? `${yearRoman} ${courseInfo.displayCourse} ${section}`
    : `${yearRoman} ${courseInfo.displayCourse}`;

  const levelName = levelChar === 'p' ? 'Postgraduate' : levelChar === 'i' ? 'Integrated' : 'Undergraduate';

  return {
    name: firstName,
    firstName,
    batchYear,
    yearNumber,
    year: yearRoman,
    level: levelName,
    courseName: courseInfo.displayCourse,
    courseFullName: courseInfo.course,
    department: courseInfo.department,
    departmentCode: courseInfo.deptCode,
    section,
    rollNumber,
    rollDigits: `${sectionDigit}${rollDigits}`,
    studentId: rollDigits,
    className,
  };
}

export interface AuthContextType {
  currentRole: string;
  loggedIn: boolean;
  currentUserId: number | null;
  currentStudentId: number;
  jwtToken: string | null;
  currentUserInfo: CurrentUserInfo | null;
  isInitialized: boolean;
  isStudentRep: boolean;
  setRole: (role: string) => void;
  loginAsRole: (role: string) => void;
  loginWithGoogleToken: (idToken: string) => Promise<{ success: boolean; error?: string; user?: any }>;
  loginBypass: (email: string, role?: string) => Promise<{ success: boolean; error?: string; user?: any }>;
  logout: () => Promise<void>;
  updateUserProfile: (name: string, className: string) => Promise<{ success: boolean; error?: string }>;
  toggleStudentRepMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<string>('');
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentStudentId, setCurrentStudentId] = useState<number>(1);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [currentUserInfo, setCurrentUserInfo] = useState<CurrentUserInfo | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isStudentRep, setIsStudentRep] = useState<boolean>(false);

  const updateCurrentUserInfo = useCallback((userData: any) => {
    let department = userData.department || null;
    let departmentCode = userData.department_code || null;
    let className = userData.class_name || null;

    if (userData.role === 'student' && (!department || !className)) {
      const parsed = parseStudentEmail(userData.email);
      if (parsed) {
        if (!department) department = parsed.department;
        if (!departmentCode) departmentCode = parsed.departmentCode;
        if (!className) className = parsed.className;
      }
    }

    setCurrentUserInfo({
      id: userData.id,
      email: userData.email,
      name: userData.name || userData.first_name || userData.email,
      role: userData.role,
      department,
      department_code: departmentCode,
      class_name: className,
      picture: userData.picture,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = apiClient.getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout/', { refresh: refreshToken }).catch(() => {});
      }
    } catch {
      // Ignored
    } finally {
      setLoggedIn(false);
      setCurrentRole('');
      setCurrentUserId(null);
      setJwtToken(null);
      setCurrentUserInfo(null);
      setCurrentStudentId(1);
      setIsStudentRep(false);

      apiClient.clearTokens();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('marian_best_class_state');
        localStorage.removeItem('bc_persistent_state');
        localStorage.removeItem('bc_persistent_state_v2');
      }

      toast.info('Logged out successfully');
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSessionExpired = () => {
      logout();
      toast.warn('Session expired. Please log in again.');
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);

    const initAuth = async () => {
      try {
        const accessToken = apiClient.getAccessToken();
        const refreshToken = apiClient.getRefreshToken();

        if (accessToken || refreshToken) {
          if (accessToken) setJwtToken(accessToken);

          try {
            const userData = await apiClient.get('/auth/profile/');
            if (userData && userData.id) {
              updateCurrentUserInfo(userData);
              setLoggedIn(true);
              setCurrentRole(mapBackendRoleToFrontend(userData.role));
              setCurrentUserId(userData.id);
            }
          } catch (err: any) {
            console.warn('Initial session verification failed:', err.message);
          }
        }
      } catch (e) {
        console.error('Failed to initialize auth session', e);
      } finally {
        setIsInitialized(true);
      }
    };

    initAuth();

    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [updateCurrentUserInfo, logout]);

  const setRole = useCallback((role: string) => {
    setCurrentRole(role);
  }, []);

  const loginAsRole = useCallback((role: string) => {
    setCurrentRole(role);
    setLoggedIn(true);
  }, []);

  const loginWithGoogleToken = useCallback(
    async (idToken: string) => {
      try {
        const data = await apiClient.post(
          '/auth/google/',
          { token: idToken },
          { skipAuth: true }
        );

        const feRole = mapBackendRoleToFrontend(data.user.role);
        setJwtToken(data.tokens.access);
        updateCurrentUserInfo(data.user);
        setLoggedIn(true);
        setCurrentRole(feRole);
        setCurrentUserId(data.user.id);

        apiClient.setTokens(data.tokens.access, data.tokens.refresh);

        toast.success(`Logged in successfully! Welcome, ${data.user.name || data.user.first_name || 'User'}`);
        return { success: true, user: data.user };
      } catch (err: any) {
        const errMsg = err.data?.error || err.message || 'Authentication failed';
        toast.error(errMsg);
        return { success: false, error: errMsg };
      }
    },
    [updateCurrentUserInfo]
  );

  const loginBypass = useCallback(
    async (email: string, role?: string) => {
      try {
        const payload: any = { email };
        if (role) payload.role = role;

        const data = await apiClient.post('/auth/bypass/', payload, { skipAuth: true });

        const feRole = mapBackendRoleToFrontend(data.user.role);
        setJwtToken(data.tokens.access);
        updateCurrentUserInfo(data.user);
        setLoggedIn(true);
        setCurrentRole(feRole);
        setCurrentUserId(data.user.id);

        apiClient.setTokens(data.tokens.access, data.tokens.refresh);

        toast.success(`Logged in successfully as ${data.user.name || email}`);
        return { success: true, user: data.user };
      } catch (err: any) {
        const errMsg = err.data?.error || err.message || 'Bypass authentication failed';
        toast.error(errMsg);
        return { success: false, error: errMsg };
      }
    },
    [updateCurrentUserInfo]
  );

  const updateUserProfile = useCallback(
    async (name: string, className: string) => {
      try {
        const data = await apiClient.put('/auth/profile/', { name, class_name: className });
        updateCurrentUserInfo(data);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.data?.error || err.message || 'Failed to update profile' };
      }
    },
    [updateCurrentUserInfo]
  );

  const toggleStudentRepMode = useCallback(() => {
    setIsStudentRep((prev) => !prev);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentRole,
        loggedIn,
        currentUserId,
        currentStudentId,
        jwtToken,
        currentUserInfo,
        isInitialized,
        isStudentRep,
        setRole,
        loginAsRole,
        loginWithGoogleToken,
        loginBypass,
        logout,
        updateUserProfile,
        toggleStudentRepMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

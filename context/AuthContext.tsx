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
  is_student_rep?: boolean;
  isStudentRep?: boolean;
  is_dqc_member?: boolean;
  is_class_teacher?: boolean;
  assigned_class_name?: string | null;
  is_evaluator?: boolean;
  available_roles?: string[];
  priority_role?: string;
}


export const mapBackendRoleToFrontend = (backendRole: string): string => {
  if (!backendRole) return '';
  const role = backendRole.toLowerCase();
  if (role === 'faculty') return 'teacher';
  if (role === 'evaluation') return 'evaluator';
  return role; // student, iqac, admin
};

export function parseStudentEmail(email: string) {
  if (!email || !email.includes('@')) return null;
  const usernamePart = email.split('@')[0];
  const parts = usernamePart.split('.');
  if (parts.length < 2) return null;

  const rawName = parts[0];
  const codePart = parts[1];

  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  if (!codePart || codePart.length < 5 || !/^\d{2}/.test(codePart)) return null;

  const batchYear = 2000 + parseInt(codePart.substring(0, 2), 10);
  const levelChar = codePart.charAt(2).toLowerCase();
  const courseCode = codePart.substring(3, 5).toLowerCase();
  const rollDigits = codePart.substring(5);

  const isPg = levelChar === 'p';
  const isUg = levelChar === 'u';

  const courseMap: Record<string, { full: string; abbr: string; field: string }> = {
    mc: { full: 'Master of Computer Applications', abbr: 'MCA', field: 'Computer Applications' },
    bc: { full: 'Bachelor of Computer Applications', abbr: 'BCA', field: 'Computer Applications' },
    ba: { full: 'Bachelor of Business Administration', abbr: 'BBA', field: 'Business Administration' },
    cm: { full: 'Commerce', abbr: 'BCom', field: 'Commerce' },
    sw: { full: 'Social Work', abbr: 'MSW', field: 'Social Work' },
  };

  const courseInfo = courseMap[courseCode] || {
    full: courseCode.toUpperCase(),
    abbr: courseCode.toUpperCase(),
    field: courseCode.toUpperCase(),
  };

  const department = isPg
    ? `The Post-Graduate Department of ${courseInfo.field}`
    : `The Under-Graduate Department of ${courseInfo.field}`;

  const departmentCode = isPg
    ? courseInfo.abbr === 'MCA'
      ? 'PGDCA'
      : `PG-${courseInfo.abbr}`
    : courseInfo.abbr === 'BCA'
    ? 'UGDCA'
    : `UG-${courseInfo.abbr}`;

  let section = '';
  if (isUg && /^\d+$/.test(rollDigits)) {
    const rollNum = parseInt(rollDigits, 10);
    const series = Math.floor(rollNum / 100);
    if (series === 1) section = 'A';
    else if (series === 2) section = 'B';
    else if (series === 3) section = 'C';
    else if (series === 4) section = 'D';
    else section = 'A';
  }

  const currentYear = new Date().getFullYear();
  const yearDiff = currentYear - batchYear + 1;
  let yearRoman = 'II';
  if (yearDiff <= 1) yearRoman = 'I';
  else if (yearDiff === 2) yearRoman = 'II';
  else if (yearDiff === 3) yearRoman = 'III';
  else if (yearDiff >= 4) yearRoman = 'IV';

  const className = section
    ? `${yearRoman} ${courseInfo.abbr} ${section}`
    : `${yearRoman} ${courseInfo.abbr}`;

  return {
    firstName,
    batchYear,
    level: isPg ? 'Postgraduate' : 'Undergraduate',
    courseName: courseInfo.abbr,
    department,
    departmentCode,
    section,
    rollDigits,
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
  isDqcMember: boolean;
  isClassTeacher: boolean;
  isEvaluator: boolean;
  assignedClassName: string | null;
  availableRoles: string[];
  priorityRole: string;
  setRole: (role: string) => void;
  loginAsRole: (role: string) => void;
  loginWithGoogleToken: (idToken: string) => Promise<{ success: boolean; error?: string; user?: any; priorityRole?: string }>;
  loginBypass: (email: string, role?: string) => Promise<{ success: boolean; error?: string; user?: any }>;
  logout: () => Promise<void>;
  updateUserProfile: (name: string, className: string) => Promise<{ success: boolean; error?: string }>;
  toggleStudentRepMode: () => void;
  switchRole: (role: string) => void;
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
  const [isClassTeacher, setIsClassTeacher] = useState<boolean>(false);
  const [isEvaluator, setIsEvaluator] = useState<boolean>(false);
  const [assignedClassName, setAssignedClassName] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [priorityRole, setPriorityRole] = useState<string>('');

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

    const isRep = Boolean(userData.is_student_rep || userData.isStudentRep);
    const isDqc = Boolean(userData.is_dqc_member);
    const isTeacher = Boolean(userData.is_class_teacher);
    const isEval = Boolean(userData.is_evaluator);
    const assignedClass = userData.assigned_class_name || null;
    const roles: string[] = Array.isArray(userData.available_roles) ? userData.available_roles : [];
    const pRole: string = userData.priority_role || userData.role || '';

    setCurrentUserInfo({
      id: userData.id,
      email: userData.email,
      name: userData.name || userData.first_name || userData.email,
      role: userData.role,
      department,
      department_code: departmentCode,
      class_name: className,
      picture: userData.picture,
      is_student_rep: isRep,
      isStudentRep: isRep,
      is_dqc_member: isDqc,
      is_class_teacher: isTeacher,
      assigned_class_name: assignedClass,
      is_evaluator: isEval,
      available_roles: roles,
      priority_role: pRole,
    });

    if (isRep || isDqc) setIsStudentRep(true);
    setIsClassTeacher(isTeacher);
    setIsEvaluator(isEval);
    setAssignedClassName(assignedClass);
    setAvailableRoles(roles);
    setPriorityRole(pRole);
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
      setIsClassTeacher(false);
      setIsEvaluator(false);
      setAssignedClassName(null);
      setAvailableRoles([]);
      setPriorityRole('');

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
              setIsStudentRep(Boolean(userData.is_student_rep || userData.isStudentRep));
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

  const switchRole = useCallback((role: string) => {
    setCurrentRole(role);
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
        setIsStudentRep(Boolean(data.user.is_student_rep || data.user.isStudentRep));

        apiClient.setTokens(data.tokens.access, data.tokens.refresh);

        toast.success(`Logged in successfully! Welcome, ${data.user.name || data.user.first_name || 'User'}`);
        return { success: true, user: data.user, priorityRole: data.user.priority_role };
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
        setIsStudentRep(Boolean(data.user.is_student_rep || data.user.isStudentRep));

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

  const isDqcMember = Boolean(currentUserInfo?.is_dqc_member);

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
        isDqcMember,
        isClassTeacher,
        isEvaluator,
        assignedClassName,
        availableRoles,
        priorityRole,
        setRole,
        loginAsRole,
        loginWithGoogleToken,
        loginBypass,
        logout,
        updateUserProfile,
        toggleStudentRepMode,
        switchRole,
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

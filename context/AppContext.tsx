'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  CriteriaCategory,
  CriteriaItem,
  Student,
  Submission,
  AppUser,
  UserGroup,
  defaultCriteriaCatalog,
  defaultStudents,
  defaultSubmissions,
  defaultUsers,
  defaultAcademicYears,
  defaultUserGroups,
  Champion
} from '@/data/initialData';

export interface Course {
  id: number;
  department: number;
  department_name?: string;
  department_code?: string;
  name: string;
  abbreviation: string;
  email_code: string;
  is_multi_batch: boolean;
  duration_years: number;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  email_prefix: string;
  level: 'UG' | 'PG' | 'Professional' | 'Other' | string;
  courses: Course[];
  classes: any[];
  created_at?: string;
  updated_at?: string;
}

interface AppContextType {
  currentRole: string;
  activePage: string;
  loggedIn: boolean;
  currentUserId: number | null;
  currentStudentId: number;
  selectedAcademicYear: string;
  activeAcademicYear: string;
  academicYears: string[];
  submissionOpen: boolean;
  evaluationOpen: boolean;
  submissions: Submission[];
  criteriaCatalog: CriteriaCategory[];
  users: AppUser[];
  students: Student[];
  userGroups: UserGroup[];
  jwtToken: string | null;
  currentUserInfo: {
    id: number;
    email: string;
    name: string;
    role: string;
    department: string | null;
    department_code: string | null;
    class_name: string | null;
    picture?: string;
  } | null;
  setRole: (role: string) => void;
  setActivePage: (page: string) => void;
  setAcademicYear: (year: string) => void;
  fetchSubmissions: () => Promise<void>;
  addSubmission: (newSub: Omit<Submission, 'id'>) => void;
  updateSubmission: (id: number, updates: Partial<Submission>) => void;
  deleteSubmission: (id: number) => void;
  addCriteriaItem: (categoryId: string | number, item: Omit<CriteriaItem, 'id'>) => void;
  updateCriteriaItem: (categoryId: string | number, itemId: number, item: Partial<CriteriaItem>) => void;
  deleteCriteriaItem: (categoryId: string | number, itemId: number) => void;
  addCriteriaCategory: (category: Omit<CriteriaCategory, 'id' | 'items'>) => Promise<any>;
  updateCriteriaCategory: (categoryId: string | number, category: Partial<CriteriaCategory>) => void;
  deleteCriteriaCategory: (categoryId: string | number) => void;
  fetchCriteriaCatalog: () => Promise<void>;
  addUser: (user: Omit<AppUser, 'id'>) => void;
  toggleUserApproval: (userId: number) => void;
  toggleSubmissionOpen: () => void;
  toggleEvaluationOpen: () => void;
  submissionWindowStart: string;
  submissionWindowEnd: string;
  setSubmissionWindow: (start: string, end: string) => void;
  loginAsRole: (role: string) => void;
  loginWithGoogleToken: (idToken: string) => Promise<{ success: boolean; error?: string }>;
  loginBypass: (email: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  addStudent: (student: Omit<Student, 'id'>) => void;
  deleteStudent: (id: number) => void;
  addUserGroup: (group: Omit<UserGroup, 'id'>) => void;
  deleteUserGroup: (groupId: string) => void;
  isStudentRep: boolean;
  toggleStudentRepMode: () => void;
  addUserToGroup: (groupId: string, email: string) => boolean;
  removeUserFromGroup: (groupId: string, email: string) => void;
  updateUserProfile: (name: string, className: string) => Promise<{ success: boolean; error?: string }>;
  editingSubId: number | null;
  setEditingSubId: (id: number | null) => void;
  classes: any[];
  departments: any[];
  courses: Course[];
  fetchDepartmentsFull: () => Promise<void>;
  createDepartment: (data: { name: string; code?: string; email_prefix?: string; level?: string }) => Promise<{ success: boolean; error?: string; data?: any }>;
  updateDepartment: (id: number, data: { name?: string; code?: string; email_prefix?: string; level?: string }) => Promise<{ success: boolean; error?: string; data?: any }>;
  deleteDepartmentById: (id: number) => Promise<{ success: boolean; error?: string; deleted_courses?: number; deleted_classes?: number }>;
  fetchCourses: (deptId?: number) => Promise<void>;
  createCourse: (data: { department: number; name: string; abbreviation: string; email_code: string; is_multi_batch?: boolean; duration_years?: number }) => Promise<{ success: boolean; error?: string; data?: any }>;
  updateCourse: (id: number, data: { department?: number; name?: string; abbreviation?: string; email_code?: string; is_multi_batch?: boolean; duration_years?: number }) => Promise<{ success: boolean; error?: string; data?: any }>;
  deleteCourse: (id: number) => Promise<{ success: boolean; error?: string; deleted_classes?: number }>;
  createClass: (data: { course_id?: number; department_code?: string; name?: string; year_number?: number; section?: string; batch_start_year?: number }) => Promise<{ success: boolean; error?: string; data?: any }>;
  updateClass: (id: number, data: any) => Promise<{ success: boolean; error?: string; data?: any }>;
  deleteClass: (id: number) => Promise<{ success: boolean; error?: string }>;
  addAcademicYearGlobal: (year: string) => Promise<void>;
  deleteAcademicYearGlobal: (year: string) => Promise<void>;
  setActiveAcademicYearGlobal: (year: string, isActive?: boolean) => Promise<void>;
  addDepartmentGlobal: (name: string, code: string) => Promise<void>;
  deleteDepartmentGlobal: (code: string) => Promise<void>;
  addClassGlobal: (name: string, deptCode: string) => Promise<void>;
  updateClassMapping: (name: string, teacherEmail: string, dqcEmail: string) => Promise<void>;
  addUserGlobal: (email: string, role: string, name: string, deptCode: string, className: string) => Promise<void>;
  assignEvaluatorsToCategory: (categoryId: string, evaluators: string[]) => Promise<void>;
  championsData: Record<string, Champion[]>;
  fetchChampions: () => Promise<void>;
  isInitialized: boolean;
  // Mark moderation & rankings
  classIndexData: ClassIndexEntry[] | null;
  smallestClassSize: number;
  fetchClassIndex: (year?: string) => Promise<void>;
  updateClassModeration: (classId: number, numStudents: number, negativePoints: number) => Promise<void>;
  updateSmallestClassSize: (n: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// -------------------------------------------------------
// ClassIndexEntry — shape returned by GET /api/class-index/
// -------------------------------------------------------
export interface ClassIndexEntry {
  rank: number | null;
  class_name: string;
  department: string;
  department_code: string;
  N: number;
  S: number;
  P: number;
  n: number;
  M: number | null;
}


// Role helper to map Django backend roles to frontend route slugs
const mapBackendRoleToFrontend = (backendRole: string): string => {
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
    field: courseCode.toUpperCase()
  };

  const department = isPg
    ? `The Post-Graduate Department of ${courseInfo.field}`
    : `The Under-Graduate Department of ${courseInfo.field}`;

  const departmentCode = isPg
    ? (courseInfo.abbr === 'MCA' ? 'PGDCA' : `PG-${courseInfo.abbr}`)
    : (courseInfo.abbr === 'BCA' ? 'UGDCA' : `UG-${courseInfo.abbr}`);

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
    className
  };
}

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<string>('');
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [editingSubId, setEditingSubId] = useState<number | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentStudentId, setCurrentStudentId] = useState<number>(1);

  const [academicYears, setAcademicYears] = useState<string[]>(defaultAcademicYears);
  const [activeAcademicYear, setActiveAcademicYear] = useState<string>(defaultAcademicYears[0]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(defaultAcademicYears[0]);

  const [submissionOpen, setSubmissionOpen] = useState<boolean>(true);
  const [evaluationOpen, setEvaluationOpen] = useState<boolean>(true);
  const [submissionWindowStart, setSubmissionWindowStart] = useState<string>('');
  const [submissionWindowEnd, setSubmissionWindowEnd] = useState<string>('');

  const setSubmissionWindow = (start: string, end: string) => {
    setSubmissionWindowStart(start);
    setSubmissionWindowEnd(end);
    syncSettingsToBackend({ submissionWindowStart: start, submissionWindowEnd: end });
  };

  const [submissions, setSubmissions] = useState<Submission[]>(defaultSubmissions);
  const [criteriaCatalog, setCriteriaCatalog] = useState<CriteriaCategory[]>(defaultCriteriaCatalog);
  const [users, setUsers] = useState<AppUser[]>(defaultUsers);
  const [students, setStudents] = useState<Student[]>(defaultStudents);
  const [userGroups, setUserGroups] = useState<UserGroup[]>(defaultUserGroups);

  const defaultClasses = [
    { id: 1, name: "II MCA", department: "The Post-Graduate Department of Computer Applications", department_code: "PGDCA", classTeacher: "kochumol.abraham@mariancollege.org", dqcMember: "santhosh.25pmc152@mariancollege.org" },
    { id: 2, name: "II BCA A", department: "The Under-Graduate Department of Computer Applications", department_code: "UGDCA", classTeacher: "rajesh@marian.ac.in", dqcMember: "santhosh.25ubc154@mariancollege.org" },
    { id: 3, name: "BCA A", department: "Computer Science", department_code: "CS", classTeacher: "", dqcMember: "" },
    { id: 4, name: "MCA", department: "The Post-Graduate Department of Computer Applications", department_code: "PGDCA", classTeacher: "", dqcMember: "" },
  ];

  const defaultDepartments = [
    { name: "The Post-Graduate Department of Computer Applications", code: "PGDCA" },
    { name: "The Under-Graduate Department of Computer Applications", code: "UGDCA" },
    { name: "Computer Science", code: "CS" },
    { name: "Internal Quality Assurance Cell", code: "IQAC" },
    { name: "Administration", code: "ADMIN" }
  ];

  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [currentUserInfo, setCurrentUserInfo] = useState<AppContextType['currentUserInfo']>(null);
  const [classes, setClasses] = useState<any[]>(defaultClasses);
  const [departments, setDepartments] = useState<any[]>(defaultDepartments);
  const [courses, setCourses] = useState<Course[]>([]);
  const [championsData, setChampionsData] = useState<Record<string, Champion[]>>({});

  // Mark moderation & class rankings state
  const [classIndexData, setClassIndexData] = useState<ClassIndexEntry[] | null>(null);
  const [smallestClassSize, setSmallestClassSize] = useState<number>(0);

  const fetchChampions = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/champions/');
      if (res.ok) {
        const data: Champion[] = await res.json();
        // Group by year
        const grouped: Record<string, Champion[]> = {};
        data.forEach(champ => {
          if (!grouped[champ.year]) grouped[champ.year] = [];
          grouped[champ.year].push(champ);
        });
        setChampionsData(grouped);
      }
    } catch (e) {
      console.error('Failed to fetch champions:', e);
    }
  };

  // Fetch departments, courses and classes from backend on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/departments/')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDepartments(data);
        }
      })
      .catch((err) => console.error("Failed to fetch departments from backend:", err));

    fetch('http://localhost:8000/api/courses/')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCourses(data);
        }
      })
      .catch((err) => console.error("Failed to fetch courses from backend:", err));

    fetch('http://localhost:8000/api/auth/classes/')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setClasses(data);
        }
      })
      .catch((err) => console.error("Failed to fetch classes from backend:", err));

    fetchChampions();
  }, []);

  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const updateCurrentUserInfo = (info: AppContextType['currentUserInfo']) => {
    if (info && info.email) {
      const parsed = parseStudentEmail(info.email);
      if (parsed) {
        info = {
          ...info,
          name: info.name && info.name !== info.email ? info.name : parsed.firstName,
          department: info.department || parsed.department,
          department_code: info.department_code || parsed.departmentCode,
          class_name: info.class_name || parsed.className
        };
      }
    }
    setCurrentUserInfo(info);
  };

  // Load session from backend via JWT & fetch backend settings on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Purge legacy full-state cache keys to prevent stale data and privacy leaks
        localStorage.removeItem('marian_best_class_state');
        localStorage.removeItem('bc_persistent_state');
        localStorage.removeItem('bc_persistent_state_v2');

        // Check if access or refresh token exists
        const accessToken = localStorage.getItem('bc_access_token');
        const refreshToken = localStorage.getItem('bc_refresh_token');

        if (accessToken || refreshToken) {
          const effectiveToken = accessToken || '';
          if (effectiveToken) {
            setJwtToken(effectiveToken);
          }

          // Fetch user profile from Django backend to verify token & establish current user
          fetch('http://localhost:8000/api/auth/profile/', {
            headers: effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {}
          })
            .then(async (res) => {
              if (res.ok) {
                const userData = await res.json();
                updateCurrentUserInfo(userData);
                setLoggedIn(true);
                setCurrentRole(mapBackendRoleToFrontend(userData.role));
                setCurrentUserId(userData.id);
              } else if (res.status === 401 && refreshToken) {
                // Access token expired, attempt refresh
                const newAccess = await refreshAccessToken();
                if (newAccess) {
                  const profileRes = await fetch('http://localhost:8000/api/auth/profile/', {
                    headers: { 'Authorization': `Bearer ${newAccess}` }
                  });
                  if (profileRes.ok) {
                    const userData = await profileRes.json();
                    updateCurrentUserInfo(userData);
                    setLoggedIn(true);
                    setCurrentRole(mapBackendRoleToFrontend(userData.role));
                    setCurrentUserId(userData.id);
                  }
                }
              }
            })
            .catch((err) => {
              console.warn('Failed to verify profile session on mount:', err);
            });
        }

        // Fetch persisted settings from Django DB backend
        fetch('http://localhost:8000/api/settings/')
          .then(res => res.ok ? res.json() : null)
          .then(settingsData => {
            if (settingsData) {
              if (settingsData.submissionOpen !== undefined) {
                const val = String(settingsData.submissionOpen).toLowerCase().trim();
                setSubmissionOpen(val === 'true' || val === '1');
              }
              if (settingsData.evaluationOpen !== undefined) {
                const val = String(settingsData.evaluationOpen).toLowerCase().trim();
                setEvaluationOpen(val === 'true' || val === '1');
              }
              if (settingsData.submissionWindowStart !== undefined) setSubmissionWindowStart(settingsData.submissionWindowStart);
              if (settingsData.submissionWindowEnd !== undefined) setSubmissionWindowEnd(settingsData.submissionWindowEnd);
              if (settingsData.smallest_class_size !== undefined) {
                const val = parseFloat(settingsData.smallest_class_size);
                if (!isNaN(val)) setSmallestClassSize(val);
              }
            }
          })
          .catch(err => console.warn('Failed to fetch backend settings:', err));
      } catch (e) {
        console.error('Failed to initialize session', e);
      } finally {
        setIsInitialized(true);
      }
    }
  }, []);

  const setRole = (role: string) => {
    setCurrentRole(role);
    setActivePage('dashboard');
    const matchingUser = users.find((u) => u.role === role);
    if (matchingUser) {
      setCurrentUserId(matchingUser.id);
    }
  };

  const loginAsRole = (role: string) => {
    setRole(role);
    setLoggedIn(true);
  };

  // Google Login Token Handler
  const loginWithGoogleToken = async (idToken: string) => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/google/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: idToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error || 'Authentication failed';
        toast.error(errMsg);
        return { success: false, error: errMsg };
      }

      const feRole = mapBackendRoleToFrontend(data.user.role);
      setJwtToken(data.tokens.access);
      updateCurrentUserInfo(data.user);
      setLoggedIn(true);
      setCurrentRole(feRole);
      setCurrentUserId(data.user.id);
      setActivePage('dashboard');
      
      // Update local storage explicitly
      localStorage.setItem('bc_access_token', data.tokens.access);
      localStorage.setItem('bc_refresh_token', data.tokens.refresh);

      toast.success(`Logged in successfully! Welcome, ${data.user.name || data.user.first_name || 'User'}`);

      return { success: true, user: data.user };
    } catch (err: any) {
      const errMsg = err.message || 'Connection to authentication server failed';
      toast.error(errMsg);
      return { success: false, error: errMsg };
    }
  };

  // Dev bypass login handler
  const loginBypass = async (email: string, role?: string) => {
    try {
      const payload: any = { email };
      if (role) payload.role = role;
      
      const res = await fetch('http://localhost:8000/api/auth/bypass/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error || 'Bypass authentication failed';
        toast.error(errMsg);
        return { success: false, error: errMsg };
      }

      const feRole = mapBackendRoleToFrontend(data.user.role);
      setJwtToken(data.tokens.access);
      updateCurrentUserInfo(data.user);
      setLoggedIn(true);
      setCurrentRole(feRole);
      setCurrentUserId(data.user.id);
      setActivePage('dashboard');

      // Update local storage explicitly
      localStorage.setItem('bc_access_token', data.tokens.access);
      localStorage.setItem('bc_refresh_token', data.tokens.refresh);

      toast.success(`Logged in successfully as ${data.user.name || email}`);

      return { success: true, user: data.user };
    } catch (err: any) {
      const errMsg = err.message || 'Connection to development authentication server failed';
      toast.error(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const updateUserProfile = async (name: string, className: string) => {
    try {
      const token = jwtToken || localStorage.getItem('bc_access_token');
      const res = await fetch('http://localhost:8000/api/auth/profile/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, class_name: className }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to update profile' };
      }

      updateCurrentUserInfo(data);

      setUsers((prev) =>
        prev.map((u) =>
          u.email.toLowerCase() === data.email.toLowerCase()
            ? { ...u, name: data.name, className: data.class_name, department: data.department }
            : u
        )
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Server connection failed' };
    }
  };

  /**
   * Normalize a raw submission object from the Django REST API into the shape
   * expected by the frontend (camelCase fields).
   *
   * The backend serializer returns snake_case keys such as:
   *   - criteria_id  →  criteriaId
   *   - user         →  studentId   (integer FK)
   *   - academic_year → academicYear
   *   - verified_by_name → verifiedByName  (etc.)
   */
  const normalizeSubmission = (raw: any): Submission => ({
    id: raw.id,
    studentId: raw.studentId ?? raw.user ?? raw.student_id ?? 0,
    criteriaId: raw.criteriaId ?? raw.criteria_id ?? 0,
    academicYear: raw.academicYear ?? raw.academic_year ?? '',
    description: raw.description ?? '',
    status: raw.status ?? 'Pending',
    remarks: raw.remarks ?? '',
    marks: raw.marks ?? null,
    proof: raw.proof ?? '',
    eventId: raw.eventId ?? raw.event_id ?? '',
    startDate: raw.startDate ?? raw.start_date ?? raw.evidence?.startDate ?? '',
    endDate: raw.endDate ?? raw.end_date ?? raw.evidence?.endDate ?? '',
    evaluatorVerified: raw.evaluatorVerified ?? raw.evaluator_verified ?? false,
    evidence: raw.evidence ?? undefined,
    verifiedByName: raw.verifiedByName ?? raw.verified_by_name ?? '',
    user_email: raw.user_email ?? '',
    user_name: raw.user_name ?? '',
    className: raw.className ?? raw.class_name ?? '',
    repVerifiedByName: raw.repVerifiedByName ?? raw.rep_verified_by_name ?? '',
    repRemarks: raw.repRemarks ?? raw.rep_remarks ?? '',
    teacherVerifiedByName: raw.teacherVerifiedByName ?? raw.teacher_verified_by_name ?? '',
    teacherRemarks: raw.teacherRemarks ?? raw.teacher_remarks ?? '',
    evaluatorVerifiedByName: raw.evaluatorVerifiedByName ?? raw.evaluator_verified_by_name ?? '',
    evaluatorRemarks: raw.evaluatorRemarks ?? raw.evaluator_remarks ?? '',
  });

  const fetchSubmissions = async () => {
    try {
      const token = jwtToken || localStorage.getItem('bc_access_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('http://localhost:8000/api/submissions/', { headers });
      if (res.ok) {
        const data = await res.json();
        // Normalize API snake_case → frontend camelCase
        setSubmissions(Array.isArray(data) ? data.map(normalizeSubmission) : data);
      }
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/academic-years/');
      if (res.ok) {
        const data = await res.json();
        setAcademicYears(data.map((y: any) => y.year));
        const active = data.find((y: any) => y.status === 'Active');
        if (active) {
          setActiveAcademicYear(active.year);
          setSelectedAcademicYear(active.year);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/departments/');
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDepartmentsFull = fetchDepartments;

  const fetchCourses = async (deptId?: number) => {
    try {
      const url = deptId ? `http://localhost:8000/api/courses/?department=${deptId}` : 'http://localhost:8000/api/courses/';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (e) {
      console.error('Failed to fetch courses:', e);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/classes/');
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = jwtToken || localStorage.getItem('bc_access_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('http://localhost:8000/api/users/', { headers });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        
        // Populate students array from the users data
        const studentUsers = data.filter((u: any) => u.role === 'student');
        if (studentUsers.length > 0) {
           setStudents(studentUsers.map((u: any) => ({
             id: u.id,
             name: u.name || u.username || u.email,
             email: u.email,
             department: u.department,
             className: u.className || u.class_name || 'Unknown',
           })));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCriteriaCatalog = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/criteria-categories/');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const merged = data.map((cat: any) => {
            const defCat = defaultCriteriaCatalog.find(
              (d) =>
                (d.code && cat.code && String(d.code).toLowerCase() === String(cat.code).toLowerCase()) ||
                (d.id && cat.id && String(d.id).toLowerCase() === String(cat.id).toLowerCase()) ||
                (d.category && cat.category && String(d.category).toLowerCase().trim() === String(cat.category).toLowerCase().trim())
            );
            const items = cat.items && Array.isArray(cat.items) && cat.items.length > 0
              ? cat.items
              : (defCat ? defCat.items : []);
            return {
              ...cat,
              id: cat.code || cat.id,
              items
            };
          });
          setCriteriaCatalog(merged);
        } else {
          // Backend DB is empty — seed default criteria catalog
          setCriteriaCatalog(defaultCriteriaCatalog);
          
          defaultCriteriaCatalog.forEach((cat) => {
            fetch('http://localhost:8000/api/criteria-categories/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code: cat.id,
                category: cat.category,
                evaluators: cat.evaluators || []
              })
            }).then(res => {
              if (res.ok) {
                res.json().then(savedCat => {
                  cat.items.forEach(item => {
                    fetch('http://localhost:8000/api/criteria-items/', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        category: savedCat.id,
                        title: item.title,
                        type: item.type,
                        marks: item.marks,
                        rules_json: item.rules || null
                      })
                    }).catch(console.error);
                  });
                });
              }
            }).catch(console.error);
          });
        }
      }
    } catch (e) {
      console.error('Failed to fetch criteria catalog:', e);
    }
  };

  const fetchUserGroups = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/user-groups/');
      if (res.ok) {
        const data = await res.json();

        // Normalize backend 'members' field → frontend 'emails' field
        const fromBackend: UserGroup[] = Array.isArray(data)
          ? data.map((g: any) => ({
              id: g.id ?? g.group_id,
              name: g.name,
              description: g.description ?? '',
              emails: Array.isArray(g.emails) ? g.emails
                : Array.isArray(g.members) ? g.members
                : []
            }))
          : [];

        // Only seed defaultUserGroups if the backend database is COMPLETELY empty (first run).
        // If it's not empty, it means the DB is initialized, so missing default groups were likely deleted by the user.
        if (fromBackend.length === 0) {
          // Seed missing groups to backend silently
          defaultUserGroups.forEach((g) => {
            fetch('http://localhost:8000/api/user-groups/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: g.id,
                name: g.name,
                description: g.description,
                members: g.emails
              })
            }).catch(() => {/* silently ignore if backend unreachable */});
          });
          setUserGroups(defaultUserGroups);
        } else {
          setUserGroups(fromBackend);
        }
      }
    } catch (e) {
      console.error(e);
      // Fallback to defaults if backend is unreachable
      setUserGroups(defaultUserGroups);
    }
  };

  useEffect(() => {
    if (loggedIn) {
      fetchSubmissions();
      fetchAcademicYears();
      fetchDepartments();
      fetchCourses();
      fetchClasses();
      fetchUsers();
      fetchCriteriaCatalog();
      fetchUserGroups();
    }
  }, [loggedIn, jwtToken]);

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const refreshToken = localStorage.getItem('bc_refresh_token');
      if (!refreshToken) return null;

      const res = await fetch('http://localhost:8000/api/auth/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!res.ok) {
        logout();
        return null;
      }

      const data = await res.json();
      if (data.access) {
        setJwtToken(data.access);
        localStorage.setItem('bc_access_token', data.access);
        if (data.refresh) {
          localStorage.setItem('bc_refresh_token', data.refresh);
        }
        return data.access;
      }
      return null;
    } catch {
      return null;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('bc_refresh_token');
      if (refreshToken) {
        fetch('http://localhost:8000/api/auth/logout/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        }).catch(() => {});
      }
    } catch {}

    setLoggedIn(false);
    setCurrentRole('');
    setCurrentUserId(null);
    setJwtToken(null);
    setCurrentUserInfo(null);
    setCurrentStudentId(1);
    setSubmissions([]);
    setUsers([]);
    localStorage.removeItem('bc_access_token');
    localStorage.removeItem('bc_refresh_token');
    localStorage.removeItem('marian_best_class_state');
    localStorage.removeItem('bc_persistent_state');
    localStorage.removeItem('bc_persistent_state_v2');

    toast.info('Logged out successfully');
  };

  const setAcademicYear = (year: string) => {
    setSelectedAcademicYear(year);
    setActiveAcademicYear(year);
  };

  const addSubmission = async (newSub: Omit<Submission, 'id'>) => {
    const tempId = Date.now();
    const userEmail = currentUserInfo?.email || users.find((u) => u.id === currentUserId)?.email || '';

    const parsedClass = userEmail ? parseStudentEmail(userEmail)?.className : '';
    const userClass = (currentUserInfo as any)?.className || (currentUserInfo as any)?.class_name || parsedClass || '';
    const userName = currentUserInfo?.name || (userEmail ? userEmail.split('@')[0] : '');

    const createdTempSub: Submission = {
      ...newSub,
      id: tempId,
      studentId: newSub.studentId || currentUserId || currentStudentId,
      user_email: userEmail,
      userEmail: userEmail,
      email: userEmail,
      user_name: userName,
      className: userClass,
      class_name: userClass,
      academicYear: selectedAcademicYear || '2025-2026',
      status: newSub.status || 'Pending Rep Verification',
      remarks: newSub.remarks || ''
    };

    // Optimistically update local state immediately so My Submissions updates instantly
    setSubmissions((prev) => [createdTempSub, ...prev]);

    try {
      const token = jwtToken || localStorage.getItem('bc_access_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:8000/api/submissions/', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: userEmail,
          criteriaId: newSub.criteriaId,
          academicYear: selectedAcademicYear || '2025-2026',
          description: newSub.description,
          status: newSub.status || 'Pending Rep Verification',
          remarks: newSub.remarks || '',
          marks: newSub.marks || null,
          proof: newSub.proof || '',
          eventId: newSub.eventId || '',
          start_date: newSub.startDate || '',
          end_date: newSub.endDate || '',
          evidence: newSub.evidence || null
        })
      });

      if (res.ok) {
        const createdSub = await res.json();
        setSubmissions((prev) =>
          prev.map((s) => (s.id === tempId ? normalizeSubmission(createdSub) : s))
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error || errData.detail || (typeof errData === 'object' && Object.keys(errData).length ? JSON.stringify(errData) : 'Failed to create submission.');
        toast.error(errMsg);
        setSubmissions((prev) => prev.filter((s) => s.id !== tempId));
      }
    } catch (err: any) {
      console.error('Server connection failed during submission creation:', err);
    }
  };

  const updateSubmission = async (id: number, updates: Partial<Submission>) => {
    // Optimistically update state locally first
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );

    try {
      const token = jwtToken || localStorage.getItem('bc_access_token');
      const userEmail = currentUserInfo?.email || users.find((u) => u.id === currentUserId)?.email || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`http://localhost:8000/api/submissions/${id}/`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          email: userEmail,
          criteriaId: updates.criteriaId,
          academicYear: updates.academicYear,
          description: updates.description,
          status: updates.status,
          remarks: updates.remarks,
          marks: updates.marks,
          proof: updates.proof,
          eventId: updates.eventId,
          start_date: updates.startDate,
          end_date: updates.endDate,
          evidence: updates.evidence,
          evaluatorVerified: updates.evaluatorVerified,
          verifiedByName: updates.verifiedByName,
          teacherVerifiedByName: updates.teacherVerifiedByName,
          teacherRemarks: updates.teacherRemarks,
          repVerifiedByName: updates.repVerifiedByName,
          repRemarks: updates.repRemarks,
          evaluatorVerifiedByName: updates.evaluatorVerifiedByName,
          evaluatorRemarks: updates.evaluatorRemarks
        })
      });
      if (res.ok) {
        const updatedSub = await res.json();
        setSubmissions((prev) =>
          prev.map((s) => (s.id === id ? normalizeSubmission(updatedSub) : s))
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error || errData.detail || errData.message || (typeof errData === 'string' ? errData : null);
        toast.error(errMsg || 'Failed to update submission.');
        fetchSubmissions();
      }
    } catch (err: any) {
      console.error('Server connection failed during submission update:', err);
    }
  };

  const deleteSubmission = async (id: number) => {
    // Optimistically remove from state locally first
    setSubmissions((prev) => prev.filter((s) => s.id !== id));

    try {
      const token = jwtToken || localStorage.getItem('bc_access_token');
      if (token) {
        await fetch(`http://localhost:8000/api/submissions/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
      }
    } catch (err: any) {
      console.error('Server connection failed during submission deletion:', err);
    }
  };

  const addCriteriaItem = async (categoryId: string | number, item: Omit<CriteriaItem, 'id'>) => {
    // Optimistic update
    const tempId = Date.now();
    setCriteriaCatalog((prev) =>
      prev.map((cat) => {
        if (cat.id == categoryId) {
          return { ...cat, items: [...cat.items, { ...item, id: tempId }] };
        }
        return cat;
      })
    );
    try {
      const res = await fetch('http://localhost:8000/api/criteria-items/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, category: categoryId })
      });
      if (res.ok) {
        const createdItem = await res.json();
        setCriteriaCatalog((prev) =>
          prev.map((cat) => {
            if (cat.id == categoryId) {
              return {
                ...cat,
                items: cat.items.map(i => i.id === tempId ? createdItem : i)
              };
            }
            return cat;
          })
        );
        // Re-fetch from DB so ALL roles see the updated catalog immediately
        await fetchCriteriaCatalog();
      }
    } catch (e) {
      console.error('Failed to add criteria item', e);
    }
  };

  const updateCriteriaItem = async (categoryId: string | number, itemId: number, updates: Partial<CriteriaItem>) => {
    // Optimistic update
    setCriteriaCatalog((prev) =>
      prev.map((cat) => {
        if (cat.id == categoryId) {
          return {
            ...cat,
            items: cat.items.map((i) => (i.id === itemId ? { ...i, ...updates } : i))
          };
        }
        return cat;
      })
    );
    try {
      const res = await fetch(`http://localhost:8000/api/criteria-items/${itemId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updatedItem = await res.json();
        setCriteriaCatalog((prev) =>
          prev.map((cat) => {
            if (cat.id == categoryId) {
              return {
                ...cat,
                items: cat.items.map(i => i.id === itemId ? updatedItem : i)
              };
            }
            return cat;
          })
        );
        // Re-fetch from DB so ALL roles see the updated catalog immediately
        await fetchCriteriaCatalog();
      }
    } catch (e) {
      console.error('Failed to update criteria item', e);
    }
  };

  const deleteCriteriaItem = async (categoryId: string | number, itemId: number) => {
    setCriteriaCatalog((prev) =>
      prev.map((cat) => {
        if (cat.id == categoryId) {
          return {
            ...cat,
            items: cat.items.filter((i) => i.id !== itemId)
          };
        }
        return cat;
      })
    );
    try {
      await fetch(`http://localhost:8000/api/criteria-items/${itemId}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      // Re-fetch from DB so ALL roles see the updated catalog immediately
      await fetchCriteriaCatalog();
    } catch (e) {
      console.error('Failed to delete criteria item', e);
    }
  };

  const addCriteriaCategory = async (category: Omit<CriteriaCategory, 'id' | 'items'>) => {
    const tempId = Date.now().toString();
    const tempCat = { ...category, id: tempId, items: [] } as CriteriaCategory;
    setCriteriaCatalog((prev) => [...prev, tempCat]);
    
    try {
      const res = await fetch('http://localhost:8000/api/criteria-categories/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category)
      });
      if (res.ok) {
        const createdCategory = await res.json();
        setCriteriaCatalog((prev) => prev.map(c => c.id === tempId ? createdCategory : c));
        // Re-fetch from DB so ALL roles see the updated catalog immediately
        await fetchCriteriaCatalog();
        return createdCategory;
      }
    } catch (e) {
      console.error('Failed to add criteria category', e);
    }
    return tempCat;
  };

  const updateCriteriaCategory = async (categoryId: string | number, updates: Partial<CriteriaCategory>) => {
    setCriteriaCatalog((prev) => prev.map((cat) => (cat.id == categoryId ? { ...cat, ...updates } : cat)));
    try {
      const res = await fetch(`http://localhost:8000/api/criteria-categories/${categoryId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updatedCategory = await res.json();
        setCriteriaCatalog((prev) => prev.map((cat) => (cat.id == categoryId ? updatedCategory : cat)));
        // Re-fetch from DB so ALL roles see the updated catalog immediately
        await fetchCriteriaCatalog();
      }
    } catch (e) {
      console.error('Failed to update criteria category', e);
    }
  };

  const deleteCriteriaCategory = async (categoryId: string | number) => {
    setCriteriaCatalog((prev) => prev.filter((cat) => cat.id != categoryId));
    try {
      await fetch(`http://localhost:8000/api/criteria-categories/${categoryId}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      // Re-fetch from DB so ALL roles see the updated catalog immediately
      await fetchCriteriaCatalog();
    } catch (e) {
      console.error('Failed to delete criteria category', e);
    }
  };

  const addUser = (newUser: Omit<AppUser, 'id'>) => {
    const nextId = users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
    const user: AppUser = { ...newUser, id: nextId, isApproved: true };
    setUsers((prev) => [...prev, user]);
  };

  const toggleUserApproval = (userId: number) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isApproved: !u.isApproved } : u))
    );
  };

  const syncSettingsToBackend = async (updates: Record<string, any>) => {
    try {
      await fetch('http://localhost:8000/api/settings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.warn('Backend settings sync failed:', e);
    }
  };

  const toggleSubmissionOpen = () => {
    setSubmissionOpen((prev) => {
      const next = !prev;
      syncSettingsToBackend({ submissionOpen: next });
      return next;
    });
  };

  const toggleEvaluationOpen = () => {
    setEvaluationOpen((prev) => {
      const next = !prev;
      syncSettingsToBackend({ evaluationOpen: next });
      return next;
    });
  };

  const addStudent = async (newStud: Omit<Student, 'id'>) => {
    try {
      const email = newStud.email || `${newStud.name.replace(/\s+/g, '.').toLowerCase()}@mariancollege.org`;
      const res = await fetch('http://localhost:8000/api/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStud.name,
          email: email,
          role: 'student',
          class_name: newStud.className
        })
      });
      if (res.ok) {
        const data = await res.json();
        const student: Student = { ...newStud, id: data.id, email: data.email };
        setStudents((prev) => [...prev, student]);
      } else {
        const nextId = students.reduce((max, s) => Math.max(max, s.id), 0) + 1;
        const student: Student = { ...newStud, id: nextId, email };
        setStudents((prev) => [...prev, student]);
      }
    } catch (e) {
      console.error('Failed to add student to backend API:', e);
      const nextId = students.reduce((max, s) => Math.max(max, s.id), 0) + 1;
      const student: Student = { ...newStud, id: nextId, email: newStud.email };
      setStudents((prev) => [...prev, student]);
    }
  };

  const deleteStudent = async (id: number) => {
    try {
      const res = await fetch('http://localhost:8000/api/users/', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok || res.status === 404) {
        setStudents((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete student from backend API:', e);
      setStudents((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const addUserGroup = async (newGrp: Omit<UserGroup, 'id'>) => {
    const id = `grp-${Date.now()}`;
    const group: UserGroup = { ...newGrp, id, emails: newGrp.emails || [] };
    setUserGroups((prev) => [...prev, group]);

    try {
      await fetch('http://localhost:8000/api/user-groups/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: group.id,
          name: group.name,
          description: (group as any).desc || group.description || '',
          members: group.emails
        })
      });
    } catch (e) {
      console.error('Failed to add user group', e);
    }
  };

  const addAcademicYearGlobal = async (year: string) => {
    // Update local state immediately
    setAcademicYears((prev) => [...prev.filter((y) => y !== year), year]);

    try {
      const res = await fetch('http://localhost:8000/api/academic-years/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, is_active: false })
      });
      if (res.ok) {
        setAcademicYears((prev) => [...prev.filter((y) => y !== year), year]);
      }
    } catch (e) {
      console.error('Failed to add academic year to backend API:', e);
    }
  };

  const setActiveAcademicYearGlobal = async (year: string, isActive: boolean = true) => {
    if (isActive) {
      setActiveAcademicYear(year);
      setSelectedAcademicYear(year);
    } else if (activeAcademicYear === year) {
      setActiveAcademicYear('');
    }

    try {
      const res = await fetch('http://localhost:8000/api/academic-years/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, is_active: isActive })
      });
      if (res.ok) {
        if (isActive) {
          setActiveAcademicYear(year);
          setSelectedAcademicYear(year);
        }
      }
    } catch (e) {
      console.error('Failed to update active academic year on backend API:', e);
    }
  };

  const deleteAcademicYearGlobal = async (year: string) => {
    setAcademicYears((prev) => prev.filter((y) => y !== year));
    if (activeAcademicYear === year) {
      setActiveAcademicYear('');
    }
    if (selectedAcademicYear === year) {
      setSelectedAcademicYear('');
    }

    try {
      await fetch('http://localhost:8000/api/academic-years/', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year })
      });
    } catch (e) {
      console.error('Failed to delete academic year from backend API:', e);
    }
  };

  const addDepartmentGlobal = async (name: string, code: string) => {
    const newDeptObj = { name, code };
    setDepartments((prev) => [...prev.filter((d) => d.code !== code && d.name !== name), newDeptObj]);

    try {
      const res = await fetch('http://localhost:8000/api/departments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code })
      });
      if (res.ok) {
        const newDept = await res.json();
        setDepartments((prev) => [...prev.filter((d) => d.code !== code && d.name !== name), newDept]);
      }
    } catch (e) {
      console.error('Failed to add department to backend API:', e);
    }
  };

  const deleteDepartmentGlobal = async (code: string) => {
    setDepartments((prev) => prev.filter((d) => d.code !== code && d.name !== code));

    try {
      await fetch('http://localhost:8000/api/departments/', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
    } catch (e) {
      console.error('Failed to delete department from backend API:', e);
    }
  };

  const createDepartment = async (data: { name: string; code?: string; email_prefix?: string; level?: string }) => {
    try {
      const res = await fetch('http://localhost:8000/api/departments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const newDept = await res.json();
        await fetchDepartments();
        return { success: true, data: newDept };
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || JSON.stringify(err) };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  const updateDepartment = async (id: number, data: { name?: string; code?: string; email_prefix?: string; level?: string }) => {
    try {
      const res = await fetch(`http://localhost:8000/api/departments/${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        await fetchDepartments();
        return { success: true, data: updated };
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || JSON.stringify(err) };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  const deleteDepartmentById = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/departments/${id}/`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const result = await res.json();
        await fetchDepartments();
        await fetchCourses();
        await fetchClasses();
        return { success: true, ...result };
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || 'Failed to delete department' };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  const createCourse = async (data: { department: number; name: string; abbreviation: string; email_code: string; is_multi_batch?: boolean; duration_years?: number }) => {
    try {
      const res = await fetch('http://localhost:8000/api/courses/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const newCourse = await res.json();
        await fetchCourses();
        await fetchDepartments();
        return { success: true, data: newCourse };
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || JSON.stringify(err) };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  const updateCourse = async (id: number, data: { department?: number; name?: string; abbreviation?: string; email_code?: string; is_multi_batch?: boolean; duration_years?: number }) => {
    try {
      const res = await fetch(`http://localhost:8000/api/courses/${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        await fetchCourses();
        await fetchDepartments();
        return { success: true, data: updated };
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || JSON.stringify(err) };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  const deleteCourse = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/courses/${id}/`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const result = await res.json();
        await fetchCourses();
        await fetchDepartments();
        await fetchClasses();
        return { success: true, ...result };
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || 'Failed to delete course' };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  const createClass = async (data: { course_id?: number; department_code?: string; name?: string; year_number?: number; section?: string; batch_start_year?: number }) => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/classes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const newClass = await res.json();
        await fetchClasses();
        await fetchDepartments();
        return { success: true, data: newClass };
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || JSON.stringify(err) };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  const updateClass = async (id: number, data: any) => {
    try {
      const sanitizedData = { ...data };
      if (sanitizedData.negative_points !== undefined) {
        sanitizedData.negative_points = Math.max(0, Math.abs(Number(sanitizedData.negative_points) || 0));
      }
      const res = await fetch(`http://localhost:8000/api/auth/classes/${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedData),
      });
      if (res.ok) {
        const updated = await res.json();
        await fetchClasses();
        await fetchDepartments();
        return { success: true, data: updated };
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || JSON.stringify(err) };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  const deleteClass = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/auth/classes/${id}/`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchClasses();
        await fetchDepartments();
        return { success: true };
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || 'Failed to delete class' };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  const addClassGlobal = async (name: string, deptCode: string) => {
    const deptObj = departments.find((d) => d.code === deptCode || d.name === deptCode);
    const deptName = deptObj ? deptObj.name : deptCode;
    const realCode = deptObj ? deptObj.code : deptCode;

    const newClsObj = {
      id: Date.now(),
      name,
      department: deptName,
      department_code: realCode,
      classTeacher: "",
      dqcMember: ""
    };

    setClasses((prev) => [...prev.filter((c) => c.name !== name), newClsObj]);

    try {
      const res = await fetch('http://localhost:8000/api/auth/classes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, department_code: realCode })
      });
      if (res.ok) {
        const newCls = await res.json();
        setClasses((prev) => [...prev.filter((c) => c.name !== name), newCls]);
      }
    } catch (e) {
      console.error('Failed to add class to backend API:', e);
    }
  };

  const updateClassMapping = async (name: string, teacherEmail: string, dqcEmail: string) => {
    const cleanTeacher = teacherEmail ? teacherEmail.trim().toLowerCase() : '';
    const cleanDqc = dqcEmail ? dqcEmail.trim().toLowerCase() : '';

    const targetClass = classes.find((c) => c.name === name);
    const deptName = targetClass?.department || '';
    const deptCode = targetClass?.department_code || '';

    // Optimistically update local classes with exclusivity logic
    setClasses((prev) =>
      prev.map((c) => {
        if (c.name === name) {
          return { ...c, classTeacher: teacherEmail, dqcMember: dqcEmail };
        } else if (cleanTeacher && c.classTeacher && c.classTeacher.trim().toLowerCase() === cleanTeacher) {
          return { ...c, classTeacher: '' };
        }
        return c;
      })
    );

    // Sync users list state
    setUsers((prev) =>
      prev.map((u) => {
        const uEmail = u.email.trim().toLowerCase();
        if (cleanTeacher && uEmail === cleanTeacher) {
          return { ...u, className: name, department: deptName };
        }
        if (u.className === name && (!cleanTeacher || uEmail !== cleanTeacher)) {
          return { ...u, className: undefined };
        }
        return u;
      })
    );

    // Sync currentUserInfo if currently logged in user's class assignment changed
    setCurrentUserInfo((prev) => {
      if (!prev) return null;
      const currEmail = (prev.email || '').trim().toLowerCase();
      if (cleanTeacher && currEmail === cleanTeacher) {
        return {
          ...prev,
          class_name: name,
          className: name,
          department: deptName || prev.department,
          department_code: deptCode || prev.department_code
        };
      }
      if (prev.class_name === name && currEmail !== cleanTeacher) {
        return {
          ...prev,
          class_name: null,
          className: null
        };
      }
      return prev;
    });

    // Auto-sync group memberships directly in state
    if (teacherEmail) {
      setUserGroups((prev) =>
        prev.map((g) => {
          if (g.id === 'grp-class-teachers' && !g.emails.some((e) => e.toLowerCase() === cleanTeacher)) {
            return { ...g, emails: [...g.emails, cleanTeacher] };
          }
          return g;
        })
      );
    }

    if (dqcEmail) {
      setUserGroups((prev) =>
        prev.map((g) => {
          if (
            (g.id === 'grp-student-reps' || g.id.includes('student-rep')) &&
            !g.emails.some((e) => e.toLowerCase() === cleanDqc)
          ) {
            return { ...g, emails: [...g.emails, cleanDqc] };
          }
          return g;
        })
      );
      setUsers((prev) =>
        prev.map((u) => (u.email.toLowerCase().trim() === cleanDqc ? { ...u, isStudentRep: true } : u))
      );
    }

    try {
      const res = await fetch('http://localhost:8000/api/auth/classes/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, classTeacher: teacherEmail, dqcMember: dqcEmail })
      });
      if (res.ok) {
        const updatedCls = await res.json();
        setClasses((prev) => prev.map((c) => (c.name === name ? updatedCls : c)));
      }
    } catch (e) {
      console.error('Failed to update class mapping on backend:', e);
    }
  };

  const addUserGlobal = async (email: string, role: string, name: string, deptCode: string, className: string) => {
    try {
      const res = await fetch('http://localhost:8000/api/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, name, department_code: deptCode, class_name: className })
      });
      if (res.ok) {
        const newUser = await res.json();
        setUsers(prev => [...prev.filter(u => u.email.toLowerCase() !== email.toLowerCase()), newUser]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteUserGroup = async (groupId: string) => {
    setUserGroups((prev) => prev.filter((g) => g.id !== groupId));
    try {
      await fetch(`http://localhost:8000/api/user-groups/${groupId}/`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error('Failed to delete user group', e);
    }
  };

  const addUserToGroup = (groupId: string, email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return false;
    let added = false;

    setUserGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId || (groupId === 'grp-student-reps' && g.id === 'grp-student-reps')) {
          if (!g.emails.map((e) => e.toLowerCase()).includes(cleanEmail)) {
            added = true;
            const newEmails = [...g.emails, cleanEmail];
            fetch(`http://localhost:8000/api/user-groups/${g.id}/`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ members: newEmails })
            }).catch(console.error);
            return { ...g, emails: newEmails };
          }
        }
        return g;
      })
    );

    // If student email is added to Student Representatives group, update rep role ONLY for their corresponding class
    if (groupId === 'grp-student-reps' || groupId.includes('student-rep')) {
      const studentObj = users.find((u) => u.email.toLowerCase().trim() === cleanEmail);
      let targetClass = studentObj?.className || '';

      if (!targetClass && cleanEmail.includes('@mariancollege.org')) {
        const localPart = cleanEmail.split('@')[0] || '';
        if (localPart.includes('25pmc') || localPart.includes('pmc')) targetClass = 'II MCA';
        else if (localPart.includes('25ubc') || localPart.includes('ubc')) targetClass = 'II BCA A';
      }

      if (targetClass) {
        // Mark user as student rep
        setUsers((prev) =>
          prev.map((u) => (u.email.toLowerCase().trim() === cleanEmail ? { ...u, isStudentRep: true } : u))
        );

        // Update dqcMember ONLY for the corresponding class, preserving existing classTeacher and avoiding infinite recursion with updateClassMapping
        setClasses((prev) =>
          prev.map((c) => (c.name === targetClass ? { ...c, dqcMember: cleanEmail } : c))
        );
      }
    }

    return added;
  };

  const currentUserEmail = currentUserInfo?.email || users.find((u) => u.id === currentUserId)?.email || '';

  const isStudentRep = React.useMemo(() => {
    if (!currentUserEmail) return false;
    const cleanEmail = currentUserEmail.trim().toLowerCase();
    const userObj = users.find((u) => u.email.trim().toLowerCase() === cleanEmail);
    if (
      userObj &&
      (userObj.isStudentRep ||
        (userObj as any).is_student_rep ||
        userObj.role === 'evaluator' ||
        userObj.role === 'dqc_member' ||
        (userObj as any).is_dqc_member)
    ) {
      return true;
    }
    const repGroup = userGroups.find(
      (g) =>
        g.id === 'grp-student-reps' ||
        g.name.toLowerCase().includes('student representative') ||
        g.name.toLowerCase().includes('student rep') ||
        g.name.toLowerCase().includes('dqc')
    );
    if (repGroup && Array.isArray(repGroup.emails) && repGroup.emails.some((e) => e.trim().toLowerCase() === cleanEmail)) {
      return true;
    }
    const isDqcMemberInClass = classes.some(
      (c) =>
        (c.dqcMember && c.dqcMember.trim().toLowerCase() === cleanEmail) ||
        (c.dqc_member && c.dqc_member.trim().toLowerCase() === cleanEmail)
    );
    if (isDqcMemberInClass) return true;
    if (cleanEmail === 'santhosh.25pmc152@mariancollege.org' || cleanEmail === 'santhosh.25ubc154@mariancollege.org') {
      return true;
    }
    return false;
  }, [currentUserEmail, userGroups, users, classes]);

  const toggleStudentRepMode = () => {
    if (!currentUserEmail) return;
    const cleanEmail = currentUserEmail.trim().toLowerCase();
    const repGroup = userGroups.find(
      (g) => g.id === 'grp-student-reps' || g.name.toLowerCase().includes('student representative') || g.name.toLowerCase().includes('student rep')
    );
    if (!repGroup) return;

    if (repGroup.emails.map(e => e.toLowerCase()).includes(cleanEmail)) {
      removeUserFromGroup(repGroup.id, currentUserEmail);
    } else {
      addUserToGroup(repGroup.id, currentUserEmail);
    }
  };

  const removeUserFromGroup = (groupId: string, email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    setUserGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          const newEmails = g.emails.filter((e) => e.toLowerCase() !== cleanEmail);
          fetch(`http://localhost:8000/api/user-groups/${groupId}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ members: newEmails })
          }).catch(console.error);
          return { ...g, emails: newEmails };
        }
        return g;
      })
    );
  };

  const assignEvaluatorsToCategory = async (categoryId: string, evaluators: string[]) => {
    const category = criteriaCatalog.find(c => c.id === categoryId);
    if (!category) return;

    // Optimistically update state
    setCriteriaCatalog(prev =>
      prev.map(c => c.id === categoryId ? { ...c, evaluators } : c)
    );

    try {
      await fetch(`http://localhost:8000/api/criteria-categories/${categoryId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluators })
      });
    } catch (e) {
      console.error('Failed to assign evaluators', e);
    }
  };

  // -------------------------------------------------------
  // MARK MODERATION & CLASS RANKING FUNCTIONS
  // -------------------------------------------------------

  const updateClassModeration = async (classId: number, numStudents: number, negativePoints: number) => {
    const positivePenalty = Math.max(0, Math.abs(Number(negativePoints) || 0));
    // Optimistic update in local classes state
    setClasses(prev =>
      prev.map(c => c.id === classId ? { ...c, num_students: numStudents, negative_points: positivePenalty } : c)
    );
    try {
      await fetch(`http://localhost:8000/api/auth/classes/${classId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_students: numStudents, negative_points: positivePenalty }),
      });
    } catch (e) {
      console.error('Failed to update class moderation fields:', e);
    }
  };

  const fetchClassIndex = async (year?: string) => {
    try {
      const url = year
        ? `http://localhost:8000/api/class-index/?year=${encodeURIComponent(year)}`
        : 'http://localhost:8000/api/class-index/';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setClassIndexData(data);
      }
    } catch (e) {
      console.error('Failed to fetch class index:', e);
    }
  };

  const updateSmallestClassSize = async (n: number) => {
    setSmallestClassSize(n);
    try {
      await fetch('http://localhost:8000/api/settings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smallest_class_size: n }),
      });
    } catch (e) {
      console.error('Failed to save smallest_class_size:', e);
    }
  };


  return (
    <AppContext.Provider
      value={{
        currentRole,
        activePage,
        loggedIn,
        currentUserId,
        currentStudentId,
        selectedAcademicYear,
        activeAcademicYear,
        academicYears,
        submissionOpen,
        evaluationOpen,
        submissions,
        criteriaCatalog,
        users,
        students,
        userGroups,
        jwtToken,
        currentUserInfo,
        setRole,
        setActivePage,
        setAcademicYear,
        fetchSubmissions,
        addSubmission,
        updateSubmission,
        deleteSubmission,
        addCriteriaItem,
        updateCriteriaItem,
        deleteCriteriaItem,
        addCriteriaCategory,
        updateCriteriaCategory,
        deleteCriteriaCategory,
        fetchCriteriaCatalog,
        addUser,
        toggleUserApproval,
        toggleSubmissionOpen,
        toggleEvaluationOpen,
        submissionWindowStart,
        submissionWindowEnd,
        setSubmissionWindow,
        loginAsRole,
        loginWithGoogleToken,
        loginBypass,
        logout,
        addStudent,
        deleteStudent,
        addUserGroup,
        deleteUserGroup,
        isStudentRep,
        toggleStudentRepMode,
        addUserToGroup,
        removeUserFromGroup,
        updateUserProfile,
        editingSubId,
        setEditingSubId,
        classes,
        departments,
        courses,
        fetchDepartmentsFull,
        createDepartment,
        updateDepartment,
        deleteDepartmentById,
        fetchCourses,
        createCourse,
        updateCourse,
        deleteCourse,
        createClass,
        updateClass,
        deleteClass,
        addAcademicYearGlobal,
        deleteAcademicYearGlobal,
        setActiveAcademicYearGlobal,
        addDepartmentGlobal,
        deleteDepartmentGlobal,
        addClassGlobal,
        updateClassMapping,
        addUserGlobal,
        assignEvaluatorsToCategory,
        championsData,
        fetchChampions,
        isInitialized,
        // Mark moderation & rankings
        classIndexData,
        smallestClassSize,
        fetchClassIndex,
        updateClassModeration,
        updateSmallestClassSize,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
};

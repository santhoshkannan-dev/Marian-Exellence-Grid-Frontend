'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
  CriteriaCategory,
  CriteriaItem,
  Student,
  Submission,
  AppUser,
  UserGroup,
  defaultStudents,
  defaultUsers,
  defaultAcademicYears,
  defaultUserGroups,
  Champion,
} from '@/data/initialData';
import { apiClient } from '@/services/apiClient';

// Re-export sub-context types and utilities for seamless backward compatibility
export { useAuth, parseStudentEmail, mapBackendRoleToFrontend } from '@/context/AuthContext';
export type { CurrentUserInfo, AuthContextType } from '@/context/AuthContext';

export { useCriteria } from '@/context/CriteriaContext';
export type { Course, Department, CriteriaContextType } from '@/context/CriteriaContext';

export { useSubmissions, normalizeSubmission } from '@/context/SubmissionContext';
export type { SubmissionContextType } from '@/context/SubmissionContext';

export { useRankings } from '@/context/RankingContext';
export type { ClassIndexEntry, RankingContextType } from '@/context/RankingContext';

export interface EvaluatorUser {
  id?: number | string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  assigned_categories: string[];
  created_at?: string;
}

import { AuthProvider, useAuth, mapBackendRoleToFrontend } from '@/context/AuthContext';
import { CriteriaProvider, useCriteria, Course } from '@/context/CriteriaContext';
import { SubmissionProvider, useSubmissions } from '@/context/SubmissionContext';
import { RankingProvider, useRankings, ClassIndexEntry } from '@/context/RankingContext';

export interface AppContextType {
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
  isDqcMember: boolean;
  toggleStudentRepMode: () => void;
  addUserToGroup: (groupId: string, email: string) => boolean;
  removeUserFromGroup: (groupId: string, email: string) => void;
  updateUserProfile: (name: string, className: string) => Promise<{ success: boolean; error?: string }>;
  editingSubId: number | null;
  setEditingSubId: (id: number | null) => void;
  evaluators: EvaluatorUser[];
  fetchEvaluators: () => Promise<void>;
  createEvaluator: (data: { email: string; name?: string; assigned_categories?: string[] }) => Promise<{ success: boolean; error?: string; data?: any }>;
  updateEvaluatorCategories: (email: string, assigned_categories: string[], name?: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  deleteEvaluator: (email: string) => Promise<{ success: boolean; error?: string }>;

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
  classIndexData: ClassIndexEntry[] | null;
  smallestClassSize: number;
  fetchClassIndex: (year?: string) => Promise<void>;
  updateClassModeration: (classId: number, numStudents: number, negativePoints: number) => Promise<void>;
  updateSmallestClassSize: (n: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Inner provider that consumes domain contexts and manages global app-level settings/navigation
 */
const AppProviderInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const criteria = useCriteria();
  const submission = useSubmissions();
  const ranking = useRankings();

  // App-level Navigation & Academic Year State
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [academicYears, setAcademicYears] = useState<string[]>(defaultAcademicYears);
  const [activeAcademicYear, setActiveAcademicYear] = useState<string>(defaultAcademicYears[0]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(defaultAcademicYears[0]);

  // Submission / Evaluation Window State
  const [submissionOpen, setSubmissionOpen] = useState<boolean>(true);
  const [evaluationOpen, setEvaluationOpen] = useState<boolean>(true);
  const [submissionWindowStart, setSubmissionWindowStart] = useState<string>('');
  const [submissionWindowEnd, setSubmissionWindowEnd] = useState<string>('');

  // User & Group Administration State
  const [users, setUsers] = useState<AppUser[]>(defaultUsers);
  const [students, setStudents] = useState<Student[]>(defaultStudents);
  const [userGroups, setUserGroups] = useState<UserGroup[]>(defaultUserGroups);
  const [evaluators, setEvaluators] = useState<EvaluatorUser[]>([]);

  // Sync settings helper
  const syncSettingsToBackend = useCallback(async (updates: Record<string, any>) => {
    try {
      await apiClient.post('/settings/', updates);
    } catch (e: any) {
      console.warn('Backend settings sync failed:', e.message);
    }
  }, []);

  // Fetch backend settings & academic years
  const fetchSettingsAndYears = useCallback(async () => {
    try {
      const [settingsData, yearsData] = await Promise.all([
        apiClient.get('/settings/').catch(() => null),
        apiClient.get('/academic-years/').catch(() => null),
      ]);

      if (settingsData) {
        if (settingsData.submissionOpen !== undefined) {
          const val = String(settingsData.submissionOpen).toLowerCase().trim();
          setSubmissionOpen(val === 'true' || val === '1');
        }
        if (settingsData.evaluationOpen !== undefined) {
          const val = String(settingsData.evaluationOpen).toLowerCase().trim();
          setEvaluationOpen(val === 'true' || val === '1');
        }
        if (settingsData.submissionWindowStart !== undefined) {
          setSubmissionWindowStart(settingsData.submissionWindowStart);
        }
        if (settingsData.submissionWindowEnd !== undefined) {
          setSubmissionWindowEnd(settingsData.submissionWindowEnd);
        }
      }

      if (Array.isArray(yearsData) && yearsData.length > 0) {
        setAcademicYears(yearsData.map((y: any) => y.year));
        const active = yearsData.find((y: any) => y.status === 'Active');
        if (active) {
          setActiveAcademicYear(active.year);
          setSelectedAcademicYear(active.year);
        }
      }
    } catch (e) {
      console.warn('Settings & years fetch encountered warning:', e);
    }
  }, []);

  // Fetch users & user groups
  const fetchUsersAndGroups = useCallback(async () => {
    try {
      const [usersData, groupsData] = await Promise.all([
        apiClient.get('/users/').catch(() => null),
        apiClient.get('/user-groups/').catch(() => null),
      ]);

      if (Array.isArray(usersData) && usersData.length > 0) {
        setUsers(
          usersData.map((u: any) => ({
            id: u.id,
            name: u.first_name && u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.name || u.email,
            email: u.email,
            role: mapBackendRoleToFrontend(u.role),
            className: u.class_name_display || u.class_name || '',
            department: u.department_name || u.department || '',
            isApproved: u.is_active ?? true,
          }))
        );
        const studentUsers = usersData.filter((u: any) => u.role === 'student');
        if (studentUsers.length > 0) {
          setStudents(
            studentUsers.map((u: any) => ({
              id: u.id,
              name: u.first_name && u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.name || u.email,
              email: u.email,
              department: u.department_name || u.department || '',
              className: u.class_name_display || u.class_name || 'Unknown',
            }))
          );
        }
      }


      if (Array.isArray(groupsData) && groupsData.length > 0) {
        setUserGroups(
          groupsData.map((g: any) => ({
            id: g.id,
            name: g.name,
            description: g.description || g.desc || '',
            emails: g.members || g.emails || [],
          }))
        );
      }
    } catch (e) {
      console.warn('Users & groups fetch encountered warning:', e);
    }
  }, []);

  const fetchEvaluators = useCallback(async () => {
    try {
      const data = await apiClient.get('/evaluators/');
      if (Array.isArray(data)) {
        setEvaluators(data);
      }
    } catch (e: any) {
      console.warn('Evaluators fetch encountered warning:', e);
    }
  }, []);

  const createEvaluator = useCallback(
    async (data: { email: string; name?: string; assigned_categories?: string[] }) => {
      try {
        const resData = await apiClient.post('/evaluators/', data);
        setEvaluators((prev) => {
          const filtered = prev.filter((e) => e.email.toLowerCase() !== resData.email.toLowerCase());
          return [...filtered, resData];
        });
        await criteria.fetchCriteriaCatalog();
        return { success: true, data: resData };
      } catch (err: any) {
        return { success: false, error: err.data?.error || err.message || 'Failed to create evaluator' };
      }
    },
    [criteria]
  );

  const updateEvaluatorCategories = useCallback(
    async (email: string, assigned_categories: string[], name?: string) => {
      try {
        const payload: any = { assigned_categories };
        if (name) payload.name = name;
        const resData = await apiClient.put(`/evaluators/${encodeURIComponent(email)}/`, payload);
        setEvaluators((prev) =>
          prev.map((e) => (e.email.toLowerCase() === email.toLowerCase() ? resData : e))
        );
        await criteria.fetchCriteriaCatalog();
        return { success: true, data: resData };
      } catch (err: any) {
        return { success: false, error: err.data?.error || err.message || 'Failed to update evaluator' };
      }
    },
    [criteria]
  );

  const deleteEvaluator = useCallback(
    async (email: string) => {
      try {
        await apiClient.delete(`/evaluators/${encodeURIComponent(email)}/`);
        setEvaluators((prev) => prev.filter((e) => e.email.toLowerCase() !== email.toLowerCase()));
        await criteria.fetchCriteriaCatalog();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.data?.error || err.message || 'Failed to delete evaluator' };
      }
    },
    [criteria]
  );

  useEffect(() => {
    fetchSettingsAndYears();
    fetchUsersAndGroups();
    fetchEvaluators();
  }, [fetchSettingsAndYears, fetchUsersAndGroups, fetchEvaluators]);

  const setAcademicYear = useCallback((year: string) => {
    setSelectedAcademicYear(year);
    setActiveAcademicYear(year);
  }, []);

  const toggleSubmissionOpen = useCallback(() => {
    setSubmissionOpen((prev) => {
      const next = !prev;
      syncSettingsToBackend({ submissionOpen: next });
      return next;
    });
  }, [syncSettingsToBackend]);

  const toggleEvaluationOpen = useCallback(() => {
    setEvaluationOpen((prev) => {
      const next = !prev;
      syncSettingsToBackend({ evaluationOpen: next });
      return next;
    });
  }, [syncSettingsToBackend]);

  const setSubmissionWindow = useCallback(
    (start: string, end: string) => {
      setSubmissionWindowStart(start);
      setSubmissionWindowEnd(end);
      syncSettingsToBackend({ submissionWindowStart: start, submissionWindowEnd: end });
    },
    [syncSettingsToBackend]
  );

  const addUser = useCallback((newUser: Omit<AppUser, 'id'>) => {
    setUsers((prev) => {
      const nextId = prev.reduce((max, u) => Math.max(max, u.id), 0) + 1;
      return [...prev, { ...newUser, id: nextId, isApproved: true }];
    });
  }, []);

  const toggleUserApproval = useCallback((userId: number) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isApproved: !u.isApproved } : u))
    );
  }, []);

  const addStudent = useCallback(async (newStud: Omit<Student, 'id'>) => {
    const email = newStud.email || `${newStud.name.replace(/\s+/g, '.').toLowerCase()}@mariancollege.org`;
    try {
      const data = await apiClient.post('/users/', {
        name: newStud.name,
        email,
        role: 'student',
        class_name: newStud.className,
      });
      const student: Student = { ...newStud, id: data.id, email: data.email };
      setStudents((prev) => [...prev, student]);
    } catch (e) {
      setStudents((prev) => {
        const nextId = prev.reduce((max, s) => Math.max(max, s.id), 0) + 1;
        return [...prev, { ...newStud, id: nextId, email }];
      });
    }
  }, []);

  const deleteStudent = useCallback(async (id: number) => {
    try {
      await apiClient.delete('/users/', { body: { id } });
    } catch {
      // Handled
    } finally {
      setStudents((prev) => prev.filter((s) => s.id !== id));
    }
  }, []);

  const addUserGroup = useCallback(async (newGrp: Omit<UserGroup, 'id'>) => {
    const id = `grp-${Date.now()}`;
    const group: UserGroup = { ...newGrp, id, emails: newGrp.emails || [] };
    setUserGroups((prev) => [...prev, group]);

    try {
      await apiClient.post('/user-groups/', {
        id: group.id,
        name: group.name,
        description: (group as any).desc || group.description || '',
        members: group.emails,
      });
    } catch (e) {
      console.error('Failed to add user group', e);
    }
  }, []);

  const deleteUserGroup = useCallback(async (groupId: string) => {
    setUserGroups((prev) => prev.filter((g) => g.id !== groupId));
    try {
      await apiClient.delete(`/user-groups/${groupId}/`);
    } catch (e) {
      console.error('Failed to delete user group', e);
    }
  }, []);

  const addUserToGroup = useCallback(
    (groupId: string, email: string): boolean => {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) return false;
      let added = false;

      setUserGroups((prev) =>
        prev.map((g) => {
          if (g.id === groupId || (groupId === 'grp-student-reps' && g.id === 'grp-student-reps')) {
            if (!g.emails.map((e) => e.toLowerCase()).includes(cleanEmail)) {
              added = true;
              const newEmails = [...g.emails, cleanEmail];
              apiClient
                .put(`/user-groups/${g.id}/`, { members: newEmails })
                .catch(console.error);
              return { ...g, emails: newEmails };
            }
          }
          return g;
        })
      );

      return added;
    },
    []
  );

  const removeUserFromGroup = useCallback((groupId: string, email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    setUserGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          const newEmails = g.emails.filter((e) => e.toLowerCase() !== cleanEmail);
          apiClient
            .put(`/user-groups/${groupId}/`, { members: newEmails })
            .catch(console.error);
          return { ...g, emails: newEmails };
        }
        return g;
      })
    );
  }, []);

  const addAcademicYearGlobal = useCallback(async (year: string) => {
    setAcademicYears((prev) => [...prev.filter((y) => y !== year), year]);
    try {
      await apiClient.post('/academic-years/', { year, is_active: false });
    } catch (e) {
      console.error('Failed to add academic year:', e);
    }
  }, []);

  const setActiveAcademicYearGlobal = useCallback(
    async (year: string, isActive: boolean = true) => {
      if (isActive) {
        setActiveAcademicYear(year);
        setSelectedAcademicYear(year);
      } else if (activeAcademicYear === year) {
        setActiveAcademicYear('');
      }

      try {
        await apiClient.put('/academic-years/', { year, is_active: isActive });
      } catch (e) {
        console.error('Failed to update active academic year:', e);
      }
    },
    [activeAcademicYear]
  );

  const deleteAcademicYearGlobal = useCallback(
    async (year: string) => {
      setAcademicYears((prev) => prev.filter((y) => y !== year));
      if (activeAcademicYear === year) setActiveAcademicYear('');
      if (selectedAcademicYear === year) setSelectedAcademicYear('');

      try {
        await apiClient.delete('/academic-years/', { body: { year } });
      } catch (e) {
        console.error('Failed to delete academic year:', e);
      }
    },
    [activeAcademicYear, selectedAcademicYear]
  );

  const addUserGlobal = useCallback(
    async (email: string, role: string, name: string, deptCode: string, className: string) => {
      try {
        const newUser = await apiClient.post('/users/', {
          email,
          role,
          name,
          department_code: deptCode,
          class_name: className,
        });
        setUsers((prev) => [...prev.filter((u) => u.email.toLowerCase() !== email.toLowerCase()), newUser]);
      } catch (e) {
        console.error('Failed to add user globally:', e);
      }
    },
    []
  );

  // Submissions adapter for backward compatibility
  const addSubmissionAdapter = useCallback(
    (newSub: Omit<Submission, 'id'>) => {
      const userEmail = auth.currentUserInfo?.email || '';
      submission.addSubmission(newSub, selectedAcademicYear, userEmail);
    },
    [auth.currentUserInfo, submission, selectedAcademicYear]
  );

  const updateSubmissionAdapter = useCallback(
    (id: number, updates: Partial<Submission>) => {
      const userEmail = auth.currentUserInfo?.email || '';
      submission.updateSubmission(id, updates, userEmail);
    },
    [auth.currentUserInfo, submission]
  );

  // Compose the full backward-compatible AppContext value
  const contextValue: AppContextType = useMemo(
    () => ({
      // Auth slice
      currentRole: auth.currentRole,
      loggedIn: auth.loggedIn,
      currentUserId: auth.currentUserId,
      currentStudentId: auth.currentStudentId,
      jwtToken: auth.jwtToken,
      currentUserInfo: auth.currentUserInfo,
      isInitialized: auth.isInitialized,
      isStudentRep: auth.isStudentRep,
      isDqcMember: auth.isDqcMember,
      setRole: auth.setRole,
      loginAsRole: auth.loginAsRole,
      loginWithGoogleToken: auth.loginWithGoogleToken,
      loginBypass: auth.loginBypass,
      logout: auth.logout,
      updateUserProfile: auth.updateUserProfile,
      toggleStudentRepMode: auth.toggleStudentRepMode,

      // Navigation & Settings slice
      activePage,
      setActivePage,
      selectedAcademicYear,
      activeAcademicYear,
      academicYears,
      setAcademicYear,
      submissionOpen,
      evaluationOpen,
      submissionWindowStart,
      submissionWindowEnd,
      toggleSubmissionOpen,
      toggleEvaluationOpen,
      setSubmissionWindow,

      // Submissions slice
      submissions: submission.submissions,
      editingSubId: submission.editingSubId,
      setEditingSubId: submission.setEditingSubId,
      fetchSubmissions: submission.fetchSubmissions,
      addSubmission: addSubmissionAdapter,
      updateSubmission: updateSubmissionAdapter,
      deleteSubmission: submission.deleteSubmission,

      // Criteria slice
      criteriaCatalog: criteria.criteriaCatalog,
      departments: criteria.departments,
      courses: criteria.courses,
      classes: criteria.classes,
      fetchCriteriaCatalog: criteria.fetchCriteriaCatalog,
      addCriteriaItem: criteria.addCriteriaItem,
      updateCriteriaItem: criteria.updateCriteriaItem,
      deleteCriteriaItem: criteria.deleteCriteriaItem,
      addCriteriaCategory: criteria.addCriteriaCategory,
      updateCriteriaCategory: criteria.updateCriteriaCategory,
      deleteCriteriaCategory: criteria.deleteCriteriaCategory,
      assignEvaluatorsToCategory: criteria.assignEvaluatorsToCategory,
      fetchDepartmentsFull: criteria.fetchDepartmentsFull,
      createDepartment: criteria.createDepartment,
      updateDepartment: criteria.updateDepartment,
      deleteDepartmentById: criteria.deleteDepartmentById,
      fetchCourses: criteria.fetchCourses,
      createCourse: criteria.createCourse,
      updateCourse: criteria.updateCourse,
      deleteCourse: criteria.deleteCourse,
      createClass: criteria.createClass,
      updateClass: criteria.updateClass,
      deleteClass: criteria.deleteClass,
      addDepartmentGlobal: criteria.addDepartmentGlobal,
      deleteDepartmentGlobal: criteria.deleteDepartmentGlobal,
      addClassGlobal: criteria.addClassGlobal,
      updateClassMapping: criteria.updateClassMapping,

      // Rankings slice
      classIndexData: ranking.classIndexData,
      smallestClassSize: ranking.smallestClassSize,
      championsData: ranking.championsData,
      fetchClassIndex: ranking.fetchClassIndex,
      updateClassModeration: ranking.updateClassModeration,
      updateSmallestClassSize: ranking.updateSmallestClassSize,
      fetchChampions: ranking.fetchChampions,

      // Admin & Users slice
      users,
      students,
      userGroups,
      addUser,
      toggleUserApproval,
      addStudent,
      deleteStudent,
      addUserGroup,
      deleteUserGroup,
      addUserToGroup,
      removeUserFromGroup,
      addAcademicYearGlobal,
      deleteAcademicYearGlobal,
      setActiveAcademicYearGlobal,
      addUserGlobal,
      evaluators,
      fetchEvaluators,
      createEvaluator,
      updateEvaluatorCategories,
      deleteEvaluator,
    }),
    [
      auth,
      activePage,
      selectedAcademicYear,
      activeAcademicYear,
      academicYears,
      setAcademicYear,
      submissionOpen,
      evaluationOpen,
      submissionWindowStart,
      submissionWindowEnd,
      toggleSubmissionOpen,
      toggleEvaluationOpen,
      setSubmissionWindow,
      submission,
      addSubmissionAdapter,
      updateSubmissionAdapter,
      criteria,
      ranking,
      users,
      students,
      userGroups,
      addUser,
      toggleUserApproval,
      addStudent,
      deleteStudent,
      addUserGroup,
      deleteUserGroup,
      addUserToGroup,
      removeUserFromGroup,
      addAcademicYearGlobal,
      deleteAcademicYearGlobal,
      setActiveAcademicYearGlobal,
      addUserGlobal,
      evaluators,
      fetchEvaluators,
      createEvaluator,
      updateEvaluatorCategories,
      deleteEvaluator,
    ]

  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

/**
 * Top-level AppContextProvider composing all domain providers cleanly
 */
export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <CriteriaProvider>
        <SubmissionProvider>
          <RankingProvider>
            <AppProviderInner>{children}</AppProviderInner>
          </RankingProvider>
        </SubmissionProvider>
      </CriteriaProvider>
    </AuthProvider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
};

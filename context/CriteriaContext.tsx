'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CriteriaCategory, CriteriaItem, defaultCriteriaCatalog } from '@/data/initialData';
import { apiClient } from '@/services/apiClient';

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

export interface CriteriaContextType {
  criteriaCatalog: CriteriaCategory[];
  departments: any[];
  courses: Course[];
  classes: any[];
  fetchCriteriaCatalog: () => Promise<void>;
  addCriteriaItem: (categoryId: string | number, item: Omit<CriteriaItem, 'id'>) => Promise<void>;
  updateCriteriaItem: (categoryId: string | number, itemId: number, updates: Partial<CriteriaItem>) => Promise<void>;
  deleteCriteriaItem: (categoryId: string | number, itemId: number) => Promise<void>;
  addCriteriaCategory: (category: Omit<CriteriaCategory, 'id' | 'items'>) => Promise<any>;
  updateCriteriaCategory: (categoryId: string | number, updates: Partial<CriteriaCategory>) => Promise<void>;
  deleteCriteriaCategory: (categoryId: string | number) => Promise<void>;
  assignEvaluatorsToCategory: (categoryId: string, evaluators: string[]) => Promise<void>;
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
  addDepartmentGlobal: (name: string, code: string) => Promise<void>;
  deleteDepartmentGlobal: (code: string) => Promise<void>;
  addClassGlobal: (name: string, deptCode: string) => Promise<void>;
  updateClassMapping: (name: string, teacherEmail: string, dqcEmail: string) => Promise<void>;
  fetchClasses: () => Promise<void>;
}

const CriteriaContext = createContext<CriteriaContextType | undefined>(undefined);

export const CriteriaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [criteriaCatalog, setCriteriaCatalog] = useState<CriteriaCategory[]>(defaultCriteriaCatalog);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  const fetchCriteriaCatalog = useCallback(async () => {
    try {
      const data = await apiClient.get('/criteria-categories/');
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
            items,
          };
        });
        setCriteriaCatalog(merged);
      } else {
        setCriteriaCatalog(defaultCriteriaCatalog);
      }
    } catch (err: any) {
      console.warn('Failed to fetch criteria catalog:', err.message);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const data = await apiClient.get('/departments/');
      if (Array.isArray(data)) setDepartments(data);
    } catch (err: any) {
      console.warn('Failed to fetch departments:', err.message);
    }
  }, []);

  const fetchCourses = useCallback(async (deptId?: number) => {
    try {
      const endpoint = deptId ? `/courses/?department=${deptId}` : '/courses/';
      const data = await apiClient.get(endpoint);
      if (Array.isArray(data)) setCourses(data);
    } catch (err: any) {
      console.warn('Failed to fetch courses:', err.message);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const data = await apiClient.get('/auth/classes/');
      if (Array.isArray(data)) setClasses(data);
    } catch (err: any) {
      console.warn('Failed to fetch classes:', err.message);
    }
  }, []);

  // Initial fetch on mount & listen to login success
  useEffect(() => {
    fetchCriteriaCatalog();
    fetchDepartments();
    fetchCourses();
    fetchClasses();

    if (typeof window === 'undefined') return;
    const handleAuthChange = () => {
      fetchClasses();
      fetchDepartments();
      fetchCourses();
    };
    window.addEventListener('auth:login-success', handleAuthChange);
    return () => {
      window.removeEventListener('auth:login-success', handleAuthChange);
    };
  }, [fetchCriteriaCatalog, fetchDepartments, fetchCourses, fetchClasses]);

  const addCriteriaCategory = useCallback(async (category: Omit<CriteriaCategory, 'id' | 'items'>) => {
    const tempId = Date.now().toString();
    const tempCat = { ...category, id: tempId, items: [] } as CriteriaCategory;
    setCriteriaCatalog((prev) => [...prev, tempCat]);

    try {
      const createdCategory = await apiClient.post('/criteria-categories/', category);
      setCriteriaCatalog((prev) => prev.map((c) => (c.id === tempId ? createdCategory : c)));
      await fetchCriteriaCatalog();
      return createdCategory;
    } catch (e) {
      console.error('Failed to add criteria category:', e);
      return tempCat;
    }
  }, [fetchCriteriaCatalog]);

  const updateCriteriaCategory = useCallback(async (categoryId: string | number, updates: Partial<CriteriaCategory>) => {
    setCriteriaCatalog((prev) => prev.map((cat) => (cat.id == categoryId ? { ...cat, ...updates } : cat)));
    try {
      const updatedCategory = await apiClient.put(`/criteria-categories/${categoryId}/`, updates);
      setCriteriaCatalog((prev) => prev.map((cat) => (cat.id == categoryId ? updatedCategory : cat)));
      await fetchCriteriaCatalog();
    } catch (e) {
      console.error('Failed to update criteria category:', e);
    }
  }, [fetchCriteriaCatalog]);

  const deleteCriteriaCategory = useCallback(async (categoryId: string | number) => {
    setCriteriaCatalog((prev) => prev.filter((cat) => cat.id != categoryId));
    try {
      await apiClient.delete(`/criteria-categories/${categoryId}/`);
      await fetchCriteriaCatalog();
    } catch (e) {
      console.error('Failed to delete criteria category:', e);
    }
  }, [fetchCriteriaCatalog]);

  const addCriteriaItem = useCallback(async (categoryId: string | number, item: Omit<CriteriaItem, 'id'>) => {
    const tempId = Date.now();
    setCriteriaCatalog((prev) =>
      prev.map((cat) => {
        if (cat.id == categoryId) {
          return {
            ...cat,
            items: [...cat.items, { ...item, id: tempId } as CriteriaItem],
          };
        }
        return cat;
      })
    );

    try {
      const createdItem = await apiClient.post('/criteria-items/', {
        category: categoryId,
        title: item.title,
        type: item.type,
        marks: item.marks,
        rules_json: item.rules || (item as any).rules_json || null,
      });

      setCriteriaCatalog((prev) =>
        prev.map((cat) => {
          if (cat.id == categoryId) {
            return {
              ...cat,
              items: cat.items.map((i) => (i.id === tempId ? createdItem : i)),
            };
          }
          return cat;
        })
      );
      await fetchCriteriaCatalog();
    } catch (e) {
      console.error('Failed to add criteria item:', e);
    }
  }, [fetchCriteriaCatalog]);

  const updateCriteriaItem = useCallback(
    async (categoryId: string | number, itemId: number, updates: Partial<CriteriaItem>) => {
      setCriteriaCatalog((prev) =>
        prev.map((cat) => {
          if (cat.id == categoryId) {
            return {
              ...cat,
              items: cat.items.map((i) => (i.id === itemId ? { ...i, ...updates } : i)),
            };
          }
          return cat;
        })
      );

      try {
        const updatedItem = await apiClient.put(`/criteria-items/${itemId}/`, updates);
        setCriteriaCatalog((prev) =>
          prev.map((cat) => {
            if (cat.id == categoryId) {
              return {
                ...cat,
                items: cat.items.map((i) => (i.id === itemId ? updatedItem : i)),
              };
            }
            return cat;
          })
        );
        await fetchCriteriaCatalog();
      } catch (e) {
        console.error('Failed to update criteria item:', e);
      }
    },
    [fetchCriteriaCatalog]
  );

  const deleteCriteriaItem = useCallback(
    async (categoryId: string | number, itemId: number) => {
      setCriteriaCatalog((prev) =>
        prev.map((cat) => {
          if (cat.id == categoryId) {
            return {
              ...cat,
              items: cat.items.filter((i) => i.id !== itemId),
            };
          }
          return cat;
        })
      );

      try {
        await apiClient.delete(`/criteria-items/${itemId}/`);
        await fetchCriteriaCatalog();
      } catch (e) {
        console.error('Failed to delete criteria item:', e);
      }
    },
    [fetchCriteriaCatalog]
  );

  const assignEvaluatorsToCategory = useCallback(
    async (categoryId: string, evaluators: string[]) => {
      setCriteriaCatalog((prev) =>
        prev.map((c) => (c.id === categoryId ? { ...c, evaluators } : c))
      );

      try {
        await apiClient.put(`/criteria-categories/${categoryId}/`, { evaluators });
      } catch (e) {
        console.error('Failed to assign evaluators:', e);
        throw e;
      }
    },
    []
  );

  const createDepartment = useCallback(
    async (data: { name: string; code?: string; email_prefix?: string; level?: string }) => {
      try {
        const newDept = await apiClient.post('/departments/', data);
        await fetchDepartments();
        return { success: true, data: newDept };
      } catch (e: any) {
        return { success: false, error: e.data?.error || e.message || 'Failed to create department' };
      }
    },
    [fetchDepartments]
  );

  const updateDepartment = useCallback(
    async (id: number, data: { name?: string; code?: string; email_prefix?: string; level?: string }) => {
      try {
        const updated = await apiClient.put(`/departments/${id}/`, data);
        await fetchDepartments();
        return { success: true, data: updated };
      } catch (e: any) {
        return { success: false, error: e.data?.error || e.message || 'Failed to update department' };
      }
    },
    [fetchDepartments]
  );

  const deleteDepartmentById = useCallback(
    async (id: number) => {
      try {
        const result = await apiClient.delete(`/departments/${id}/`);
        await fetchDepartments();
        await fetchCourses();
        await fetchClasses();
        return { success: true, ...result };
      } catch (e: any) {
        return { success: false, error: e.data?.error || e.message || 'Failed to delete department' };
      }
    },
    [fetchDepartments, fetchCourses, fetchClasses]
  );

  const createCourse = useCallback(
    async (data: { department: number; name: string; abbreviation: string; email_code: string; is_multi_batch?: boolean; duration_years?: number }) => {
      try {
        const newCourse = await apiClient.post('/courses/', data);
        await fetchCourses();
        await fetchDepartments();
        return { success: true, data: newCourse };
      } catch (e: any) {
        return { success: false, error: e.data?.error || e.message || 'Failed to create course' };
      }
    },
    [fetchCourses, fetchDepartments]
  );

  const updateCourse = useCallback(
    async (id: number, data: { department?: number; name?: string; abbreviation?: string; email_code?: string; is_multi_batch?: boolean; duration_years?: number }) => {
      try {
        const updated = await apiClient.put(`/courses/${id}/`, data);
        await fetchCourses();
        await fetchDepartments();
        return { success: true, data: updated };
      } catch (e: any) {
        return { success: false, error: e.data?.error || e.message || 'Failed to update course' };
      }
    },
    [fetchCourses, fetchDepartments]
  );

  const deleteCourse = useCallback(
    async (id: number) => {
      try {
        const result = await apiClient.delete(`/courses/${id}/`);
        await fetchCourses();
        await fetchDepartments();
        await fetchClasses();
        return { success: true, ...result };
      } catch (e: any) {
        return { success: false, error: e.data?.error || e.message || 'Failed to delete course' };
      }
    },
    [fetchCourses, fetchDepartments, fetchClasses]
  );

  const createClass = useCallback(
    async (data: { course_id?: number; department_code?: string; name?: string; year_number?: number; section?: string; batch_start_year?: number }) => {
      try {
        const newClass = await apiClient.post('/auth/classes/', data);
        await fetchClasses();
        await fetchDepartments();
        return { success: true, data: newClass };
      } catch (e: any) {
        return { success: false, error: e.data?.error || e.message || 'Failed to create class' };
      }
    },
    [fetchClasses, fetchDepartments]
  );

  const updateClass = useCallback(
    async (id: number, data: any) => {
      try {
        const sanitizedData = { ...data };
        if (sanitizedData.negative_points !== undefined) {
          sanitizedData.negative_points = Math.max(0, Math.abs(Number(sanitizedData.negative_points) || 0));
        }
        const updated = await apiClient.put(`/auth/classes/${id}/`, sanitizedData);
        await fetchClasses();
        await fetchDepartments();
        return { success: true, data: updated };
      } catch (e: any) {
        return { success: false, error: e.data?.error || e.message || 'Failed to update class' };
      }
    },
    [fetchClasses, fetchDepartments]
  );

  const deleteClass = useCallback(
    async (id: number) => {
      try {
        await apiClient.delete(`/auth/classes/${id}/`);
        await fetchClasses();
        await fetchDepartments();
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.data?.error || e.message || 'Failed to delete class' };
      }
    },
    [fetchClasses, fetchDepartments]
  );

  const addDepartmentGlobal = useCallback(
    async (name: string, code: string) => {
      try {
        const newDept = await apiClient.post('/departments/', { name, code });
        setDepartments((prev) => [...prev.filter((d) => d.code !== code && d.name !== name), newDept]);
      } catch (e) {
        console.error('Failed to add department to backend API:', e);
      }
    },
    []
  );

  const deleteDepartmentGlobal = useCallback(
    async (code: string) => {
      setDepartments((prev) => prev.filter((d) => d.code !== code && d.name !== code));
      try {
        await apiClient.delete('/departments/', { body: { code } });
      } catch (e) {
        console.error('Failed to delete department from backend API:', e);
      }
    },
    []
  );

  const addClassGlobal = useCallback(
    async (name: string, deptCode: string) => {
      try {
        const newClass = await apiClient.post('/auth/classes/', { name, department_code: deptCode });
        setClasses((prev) => [...prev, newClass]);
      } catch (e) {
        console.error('Failed to add class:', e);
      }
    },
    []
  );

  const updateClassMapping = useCallback(
    async (name: string, teacherEmail: string, dqcEmail: string) => {
      setClasses((prev) =>
        prev.map((c) =>
          c.name === name
            ? { ...c, teacher_email: teacherEmail, dqc_email: dqcEmail }
            : c
        )
      );

      try {
        await apiClient.patch('/auth/classes/update-mapping/', {
          name,
          teacher_email: teacherEmail,
          dqc_email: dqcEmail,
        });
      } catch (e) {
        console.error('Failed to update class mapping:', e);
      }
    },
    []
  );

  return (
    <CriteriaContext.Provider
      value={{
        criteriaCatalog,
        departments,
        courses,
        classes,
        fetchCriteriaCatalog,
        addCriteriaItem,
        updateCriteriaItem,
        deleteCriteriaItem,
        addCriteriaCategory,
        updateCriteriaCategory,
        deleteCriteriaCategory,
        assignEvaluatorsToCategory,
        fetchDepartmentsFull: fetchDepartments,
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
        addDepartmentGlobal,
        deleteDepartmentGlobal,
        addClassGlobal,
        updateClassMapping,
        fetchClasses,
      }}
    >
      {children}
    </CriteriaContext.Provider>
  );
};

export const useCriteria = (): CriteriaContextType => {
  const context = useContext(CriteriaContext);
  if (!context) {
    throw new Error('useCriteria must be used within a CriteriaProvider');
  }
  return context;
};

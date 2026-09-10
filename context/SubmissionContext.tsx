'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Submission, defaultSubmissions } from '@/data/initialData';
import { apiClient } from '@/services/apiClient';

export const normalizeSubmission = (raw: any): Submission => ({
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
  grade_breakdown: raw.grade_breakdown ?? null,
  criteria_version: raw.criteria_version ?? null,
  criteria_version_info: raw.criteria_version_info ?? null,
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

export interface SubmissionContextType {
  submissions: Submission[];
  editingSubId: number | null;
  setEditingSubId: (id: number | null) => void;
  fetchSubmissions: (academicYear?: string) => Promise<void>;
  addSubmission: (newSub: Omit<Submission, 'id'>, academicYear?: string, userEmail?: string) => Promise<void>;
  updateSubmission: (id: number, updates: Partial<Submission>, userEmail?: string) => Promise<void>;
  deleteSubmission: (id: number) => Promise<void>;
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
}

const SubmissionContext = createContext<SubmissionContextType | undefined>(undefined);

export const SubmissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [submissions, setSubmissions] = useState<Submission[]>(defaultSubmissions);
  const [editingSubId, setEditingSubId] = useState<number | null>(null);

  const fetchSubmissions = useCallback(async (academicYear?: string) => {
    try {
      const endpoint = academicYear ? `/submissions/?academicYear=${encodeURIComponent(academicYear)}` : '/submissions/';
      const data = await apiClient.get(endpoint);
      if (Array.isArray(data)) {
        setSubmissions(data.map(normalizeSubmission));
      }
    } catch (err: any) {
      console.error('Failed to fetch submissions:', err.message);
    }
  }, []);

  const addSubmission = useCallback(
    async (newSub: Omit<Submission, 'id'>, academicYear?: string, userEmail?: string) => {
      const tempId = Date.now();
      const createdTempSub: Submission = {
        ...newSub,
        id: tempId,
        marks: newSub.marks ?? null,
        status: newSub.status || 'Pending Rep Verification',
        remarks: newSub.remarks || '',
      };

      // Optimistic insert
      setSubmissions((prev) => [createdTempSub, ...prev]);

      try {
        const payload = {
          email: userEmail || '',
          criteriaId: newSub.criteriaId,
          academicYear: academicYear || '2025-2026',
          description: newSub.description,
          status: newSub.status || 'Pending Rep Verification',
          remarks: newSub.remarks || '',
          marks: newSub.marks || null,
          proof: newSub.proof || '',
          eventId: newSub.eventId || '',
          start_date: newSub.startDate || '',
          end_date: newSub.endDate || '',
          evidence: newSub.evidence || null,
          grade_breakdown: newSub.grade_breakdown || null,
        };

        const createdSub = await apiClient.post('/submissions/', payload);
        setSubmissions((prev) =>
          prev.map((s) => (s.id === tempId ? normalizeSubmission(createdSub) : s))
        );
      } catch (err: any) {
        const errMsg = err.data?.error || err.data?.detail || err.message || 'Failed to create submission.';
        toast.error(errMsg);
        // Rollback optimistic update
        setSubmissions((prev) => prev.filter((s) => s.id !== tempId));
      }
    },
    []
  );

  const updateSubmission = useCallback(
    async (id: number, updates: Partial<Submission>, userEmail?: string) => {
      // Optimistic update
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );

      try {
        const payload = {
          email: userEmail || '',
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
          grade_breakdown: updates.grade_breakdown !== undefined ? updates.grade_breakdown : undefined,
          evaluatorVerified: updates.evaluatorVerified,
          verifiedByName: updates.verifiedByName,
          teacherVerifiedByName: updates.teacherVerifiedByName,
          teacherRemarks: updates.teacherRemarks,
          repVerifiedByName: updates.repVerifiedByName,
          repRemarks: updates.repRemarks,
          evaluatorVerifiedByName: updates.evaluatorVerifiedByName,
          evaluatorRemarks: updates.evaluatorRemarks,
        };

        const updatedSub = await apiClient.put(`/submissions/${id}/`, payload);
        setSubmissions((prev) =>
          prev.map((s) => (s.id === id ? normalizeSubmission(updatedSub) : s))
        );
      } catch (err: any) {
        const errMsg = err.data?.error || err.data?.detail || err.message || 'Failed to update submission.';
        toast.error(errMsg);
        // Re-sync with backend to restore authoritative truth
        fetchSubmissions();
      }
    },
    [fetchSubmissions]
  );

  const deleteSubmission = useCallback(async (id: number) => {
    // Optimistic delete
    setSubmissions((prev) => prev.filter((s) => s.id !== id));

    try {
      await apiClient.delete(`/submissions/${id}/`);
    } catch (err: any) {
      console.error('Failed to delete submission on backend:', err.message);
    }
  }, []);

  return (
    <SubmissionContext.Provider
      value={{
        submissions,
        editingSubId,
        setEditingSubId,
        fetchSubmissions,
        addSubmission,
        updateSubmission,
        deleteSubmission,
        setSubmissions,
      }}
    >
      {children}
    </SubmissionContext.Provider>
  );
};

export const useSubmissions = (): SubmissionContextType => {
  const context = useContext(SubmissionContext);
  if (!context) {
    throw new Error('useSubmissions must be used within a SubmissionProvider');
  }
  return context;
};

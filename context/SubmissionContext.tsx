'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Submission, defaultSubmissions } from '@/data/initialData';
import { apiClient } from '@/services/apiClient';

export const normalizeSubmission = (raw: any): Submission => {
  const logs = raw.verification_logs || raw.verificationLogs || [];
  const repLog = logs.find((l: any) => l.verification_level === 'DQC' || l.verificationLevel === 'DQC');
  const teacherLog = logs.find((l: any) => l.verification_level === 'CLASS_TEACHER' || l.verificationLevel === 'CLASS_TEACHER');
  const evalLog = logs.find((l: any) => l.verification_level === 'EVALUATOR' || l.verificationLevel === 'EVALUATOR');

  const repVerifiedByName = raw.repVerifiedByName ?? raw.rep_verified_by_name ?? (repLog ? (repLog.verified_by_name || repLog.verified_by?.name || repLog.verified_by?.email) : '');
  const repRemarks = raw.repRemarks ?? raw.rep_remarks ?? (repLog ? repLog.remarks : '');

  const teacherVerifiedByName = raw.teacherVerifiedByName ?? raw.teacher_verified_by_name ?? (teacherLog ? (teacherLog.verified_by_name || teacherLog.verified_by?.name || teacherLog.verified_by?.email) : '');
  const teacherRemarks = raw.teacherRemarks ?? raw.teacher_remarks ?? (teacherLog ? teacherLog.remarks : '');

  const evaluatorVerifiedByName = raw.evaluatorVerifiedByName ?? raw.evaluator_verified_by_name ?? (evalLog ? (evalLog.verified_by_name || evalLog.verified_by?.name || evalLog.verified_by?.email) : '');
  const evaluatorRemarks = raw.evaluatorRemarks ?? raw.evaluator_remarks ?? (evalLog ? evalLog.remarks : '');

  return {
    id: raw.id,
    studentId: raw.studentId ?? raw.user ?? raw.student_id ?? 0,
    student_id: raw.student_id ?? raw.studentId ?? raw.user ?? 0,
    classId: raw.classId ?? raw.class_id ?? undefined,
    class_id: raw.class_id ?? raw.classId ?? undefined,
    criteriaId: raw.criteriaId ?? raw.criteria_id ?? 0,
    criteria_id: raw.criteria_id ?? raw.criteriaId ?? 0,
    categoryId: raw.categoryId ?? raw.category_id ?? undefined,
    category_id: raw.category_id ?? raw.categoryId ?? undefined,
    subcategoryId: raw.subcategoryId ?? raw.subcategory_id ?? undefined,
    subcategory_id: raw.subcategory_id ?? raw.subcategoryId ?? undefined,
    submissionDate: raw.submissionDate ?? raw.submission_date ?? raw.created_at ?? '',
    submission_date: raw.submission_date ?? raw.submissionDate ?? raw.created_at ?? '',
    calculatedMarks: raw.calculatedMarks ?? raw.calculated_marks ?? raw.marks ?? null,
    calculated_marks: raw.calculated_marks ?? raw.calculatedMarks ?? raw.marks ?? null,
    isManualEval: raw.isManualEval ?? raw.is_manual_eval ?? false,
    is_manual_eval: raw.is_manual_eval ?? raw.isManualEval ?? false,
    academicYear: raw.academicYear ?? raw.academic_year ?? '',
    description: raw.description ?? '',
    status: raw.status ?? 'Pending',
    remarks: raw.remarks ?? '',
    marks: raw.marks !== undefined ? raw.marks : (raw.calculated_marks ?? null),
    proof: raw.proof ?? raw.proof_url ?? '',
    proofUrl: raw.proofUrl ?? raw.proof_url ?? raw.proof ?? '',
    proof_url: raw.proof_url ?? raw.proofUrl ?? raw.proof ?? '',
    eventId: raw.eventId ?? raw.event_id ?? '',
    startDate: raw.startDate ?? raw.start_date ?? raw.evidence?.startDate ?? '',
    endDate: raw.endDate ?? raw.end_date ?? raw.evidence?.endDate ?? '',
    evaluatorVerified: raw.evaluatorVerified ?? raw.evaluator_verified ?? false,
    evidence: raw.evidence ?? raw.submission_metadata ?? undefined,
    submissionMetadata: raw.submissionMetadata ?? raw.submission_metadata ?? raw.evidence ?? null,
    submission_metadata: raw.submission_metadata ?? raw.submissionMetadata ?? raw.evidence ?? null,
    verificationLogs: logs,
    verification_logs: logs,
    grade_breakdown: raw.grade_breakdown ?? null,
    criteria_version: raw.criteria_version ?? null,
    criteria_version_info: raw.criteria_version_info ?? null,
    verifiedByName: raw.verifiedByName ?? raw.verified_by_name ?? '',
    user_email: raw.user_email ?? '',
    user_name: raw.user_name ?? '',
    className: raw.className ?? raw.class_name ?? '',
    department: raw.department_name ?? raw.department ?? '',
    department_name: raw.department_name ?? raw.department ?? '',
    repVerifiedByName,
    repRemarks,
    teacherVerifiedByName,
    teacherRemarks,
    evaluatorVerifiedByName,
    evaluatorRemarks,
  };
};

export interface SubmissionContextType {
  submissions: Submission[];
  editingSubId: number | null;
  setEditingSubId: (id: number | null) => void;
  fetchSubmissions: () => Promise<void>;
  addSubmission: (newSub: Omit<Submission, 'id'>, academicYear?: string, userEmail?: string) => Promise<void>;
  updateSubmission: (id: number, updates: Partial<Submission>, userEmail?: string) => Promise<void>;
  deleteSubmission: (id: number) => Promise<void>;
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
}

const SubmissionContext = createContext<SubmissionContextType | undefined>(undefined);

export const SubmissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [submissions, setSubmissions] = useState<Submission[]>(defaultSubmissions);
  const [editingSubId, setEditingSubId] = useState<number | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      const data = await apiClient.get('/submissions/');
      if (Array.isArray(data)) {
        setSubmissions(data.map(normalizeSubmission));
      }
    } catch (err: any) {
      console.error('Failed to fetch submissions:', err.message);
    }
  }, []);

  React.useEffect(() => {
    fetchSubmissions();

    if (typeof window === 'undefined') return;
    const handleAuthChange = () => {
      fetchSubmissions();
    };
    window.addEventListener('auth:login-success', handleAuthChange);
    return () => {
      window.removeEventListener('auth:login-success', handleAuthChange);
    };
  }, [fetchSubmissions]);

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
          proof: newSub.proof || newSub.proofUrl || (newSub as any).proof_url || '',
          proof_url: (newSub as any).proof_url || newSub.proof || newSub.proofUrl || '',
          eventId: newSub.eventId || '',
          start_date: newSub.startDate || '',
          end_date: newSub.endDate || '',
          evidence: newSub.evidence || newSub.submissionMetadata || null,
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
          calculated_marks: updates.calculated_marks ?? updates.calculatedMarks,
          proof: updates.proof ?? updates.proofUrl ?? (updates as any).proof_url,
          proof_url: (updates as any).proof_url ?? updates.proof ?? updates.proofUrl,
          eventId: updates.eventId,
          start_date: updates.startDate,
          end_date: updates.endDate,
          evidence: updates.evidence ?? updates.submissionMetadata,
          grade_breakdown: updates.grade_breakdown !== undefined ? updates.grade_breakdown : undefined,
          evaluatorVerified: updates.evaluatorVerified,
          verifiedByName: updates.verifiedByName,
          teacherVerifiedByName: updates.teacherVerifiedByName,
          teacherRemarks: updates.teacherRemarks,
          repVerifiedByName: updates.repVerifiedByName,
          repRemarks: updates.repRemarks,
          evaluatorVerifiedByName: updates.evaluatorVerifiedByName,
          evaluatorRemarks: updates.evaluatorRemarks,
          role_context: (updates as any).role_context || (
            (updates.evaluatorVerifiedByName || updates.evaluatorRemarks || updates.evaluatorVerified || updates.status === 'Evaluated')
              ? 'evaluator'
              : (updates.teacherVerifiedByName || updates.teacherRemarks || updates.status === 'Teacher Verified' ? 'teacher' : undefined)
          ),
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

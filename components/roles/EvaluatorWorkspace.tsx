'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

interface EvaluatorWorkspaceProps {
  view?: 'dashboard' | 'evaluation';
}

interface LockedSubmission {
  id: string;
  student: string;
  category: string;
  item: string;
  status: 'Locked' | 'Pending';
  marks: number;
  dept: string;
}

export interface VerificationDocItem {
  id: string;
  subId: number;
  fileName: string;
  studentName: string;
  studentEmail?: string;
  studentClass?: string;
  studentDept?: string;
  category: string;
  activityTitle: string;
  description?: string;
  date?: string;
  proofUrl?: string;
  proof?: string;
  marks?: number;
  evidence?: any;
  status?: string;
  remarks?: string;
  gradeBreakdown?: any;
}

import { useApp } from '@/context/AppContext';

export const EvaluatorWorkspace: React.FC<EvaluatorWorkspaceProps> = ({ view = 'dashboard' }) => {
  const router = useRouter();
  const {
    evaluationOpen,
    submissions,
    updateSubmission,
    students,
    criteriaCatalog,
    currentUserInfo,
    classes
  } = useApp();

  // Document preview modal and inline remarks state
  const [previewModalDoc, setPreviewModalDoc] = useState<VerificationDocItem | null>(null);
  const [modalRemarks, setModalRemarks] = useState('');
  const [submissionRemarksMap, setSubmissionRemarksMap] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>('pending');
  const [completedStatusFilter, setCompletedStatusFilter] = useState<'all' | 'evaluated' | 'correction' | 'rejected'>('all');

  // Helper to check if submission belongs to a category assigned to the current evaluator
  const isAssignedToEvaluator = (s: any) => {
    const userRole = (currentUserInfo?.role || '').toLowerCase();
    if (userRole === 'admin' || currentUserInfo?.available_roles?.includes('admin')) {
      return true;
    }

    const category = criteriaCatalog.find((cat) => {
      const matchCriteria = cat.items?.some(item => String(item.id) === String(s.criteriaId));
      const matchCategory = s.categoryId && (String(cat.id) === String(s.categoryId) || cat.code === s.categoryId);
      return matchCriteria || matchCategory;
    });
    if (!category) return false;

    const assignedEvaluators = category.evaluators || [];
    const userEmail = currentUserInfo?.email?.toLowerCase().trim();
    if (assignedEvaluators.length === 0) return false; // If no evaluators assigned, no one evaluates it here
    return Boolean(userEmail && assignedEvaluators.some(e => (e || '').toLowerCase().trim() === userEmail));
  };

  const getStudentDept = (student: any, sub?: any) => {
    if (sub?.department || sub?.department_name) return sub.department || sub.department_name;
    if (student?.department) return student.department;
    const className = student?.className || sub?.class_name || sub?.className;
    if (className && classes?.length) {
      const classObj = classes.find((c: any) => c.name === className);
      if (classObj?.department) {
        return typeof classObj.department === 'string' ? classObj.department : classObj.department?.name;
      }
    }
    return 'General';
  };

  // Submissions forwarded from Class Teacher (Round 2) awaiting Evaluator Verification (Round 3)
  const teacherApprovedSubmissions = submissions.filter((s) => {
    const isValidStatus = [
      'Teacher Verified',
      'TEACHER_VERIFIED',
      'EVALUATOR_PENDING',
      'Approved',
      'Verified'
    ].includes(s.status) && !s.evaluatorVerified && s.status !== 'Locked' && s.status !== 'Evaluated';

    const isTeacherVerified = (
      s.status === 'Teacher Verified' ||
      s.status === 'TEACHER_VERIFIED' ||
      s.status === 'EVALUATOR_PENDING' ||
      !!s.teacherVerifiedByName
    );

    return isValidStatus && isTeacherVerified && isAssignedToEvaluator(s);
  });

  const handleVerifySubmissionEvaluator = (subId: number, customRemarks?: string) => {
    if (!evaluationOpen) {
      toast.error('Evaluation access is currently CLOSED by system administrator.');
      return;
    }

    const sub = submissions.find(s => s.id === subId);
    if (!sub) return;

    const item = criteriaCatalog.flatMap(c => c.items).find(it => String(it.id) === String(sub.criteriaId));
    if (!item) {
      toast.error("Criteria item not found in catalog!");
      return;
    }

    let calculatedMarks = item.marks || 0;

    // Academic Grades (Bulk)
    if (item.type === 'academic_grades') {
      const ev = (sub.evidence as any) || {};
      const count90 = Number(ev.count90Above) || 0;
      const count80 = Number(ev.count80to90) || 0;
      const count70 = Number(ev.count70to80) || 0;
      const countFail = Number(ev.failCount) || 0;
      const passPerc = Number(ev.effectivePassPercentage) || 0;

      const rules = item.rules_json || {};
      const m90 = rules['90_above'] !== undefined ? rules['90_above'] : 5;
      const m80 = rules['80_90'] !== undefined ? rules['80_90'] : 4;
      const m70 = rules['70_80'] !== undefined ? rules['70_80'] : 3;
      const mFail = rules['fail'] !== undefined ? rules['fail'] : -2;
      
      let passMarks = 0;
      const ranges = rules['pass_percentage_ranges'] || [];
      for (const range of ranges) {
        if (passPerc >= range.min && passPerc <= range.max) {
          passMarks = range.marks;
          break;
        }
      }

      calculatedMarks = (count90 * m90) + (count80 * m80) + (count70 * m70) + (countFail * mFail) + passMarks;
    } 
    // SubItem mapping (Research, Prizes)
    else if (item.rules_json && item.rules_json.subItems) {
      const ev = (sub.evidence as any) || {};
      const submittedSubItem = ev.subItem || ev.researchSubItem || ev.prizesSubItem;
      if (submittedSubItem) {
         const mapping = item.rules_json.subItems;
         let matchedVal = mapping[submittedSubItem];
         if (matchedVal === undefined) {
           const subNorm = String(submittedSubItem).trim().toLowerCase();
           for (const [k, v] of Object.entries(mapping)) {
             if (k.trim().toLowerCase() === subNorm) {
               matchedVal = v as number;
               break;
             }
           }
         }
         if (matchedVal !== undefined) {
             calculatedMarks = Number(matchedVal);
             
             // Check if it's count-based as well (e.g. multiple publications of same type)
             if (item.type === 'count') {
                 const count = Number(ev.count) || 1;
                 calculatedMarks = calculatedMarks * count;
             }
         }
      }
    }
    // Default count multiplier
    else if (item.type === 'count') {
      const ev = (sub.evidence as any) || {};
      const count = Number(ev.count) || 1;
      calculatedMarks = count * item.marks;
    }

    const isManual = item.isManualEval || item.is_manual_eval || sub.isManualEval || sub.is_manual_eval;
    if (isManual && item.type !== 'academic_grades' && !(item.rules_json && item.rules_json.subItems)) {
      const input = window.prompt(`Enter marks for "${item.title}" (Manual Evaluation):`, String(sub.marks ?? sub.calculatedMarks ?? item.marks ?? 0));
      if (input === null) return;
      const parsed = parseFloat(input);
      if (isNaN(parsed) || parsed < 0) {
        toast.error("Please enter a valid non-negative number for marks.");
        return;
      }
      calculatedMarks = parsed;
    }

    const evaluatorName = currentUserInfo?.name || (currentUserInfo as any)?.username || 'Evaluation Team';
    const inlineRemarks = customRemarks || submissionRemarksMap[subId];
    const defaultRemarks = isManual ? `Manually evaluated: awarded ${calculatedMarks} marks.` : 'Verified and auto-evaluated based on dynamic criteria rules.';
    const finalRemarks = (inlineRemarks && inlineRemarks.trim()) ? inlineRemarks.trim() : defaultRemarks;

    updateSubmission(subId, {
      status: 'Evaluated',
      evaluatorVerified: true,
      evaluatorVerifiedByName: evaluatorName,
      evaluatorRemarks: finalRemarks,
      remarks: finalRemarks,
      marks: calculatedMarks,
      calculated_marks: calculatedMarks,
      calculatedMarks: calculatedMarks,
      role_context: 'evaluator'
    } as any);

    setSubmissionRemarksMap(prev => {
      const copy = { ...prev };
      delete copy[subId];
      return copy;
    });

    if (previewModalDoc?.subId === subId) {
      setPreviewModalDoc(null);
    }

    toast.success(`✓ Submission #${subId} verified and awarded ${calculatedMarks} marks!`);
  };

  const handleCorrectionSubmissionEvaluator = (subId: number, customRemarks?: string) => {
    if (!evaluationOpen) {
      toast.error('Evaluation access is currently CLOSED by system administrator.');
      return;
    }

    const remarks = (customRemarks || submissionRemarksMap[subId] || '').trim();
    if (!remarks) {
      const inputEl = document.getElementById(`evaluator-remarks-${subId}`) as HTMLInputElement;
      if (inputEl) {
        inputEl.reportValidity();
        inputEl.focus();
      }
      toast.error('Remarks/instructions are strictly required for requesting correction.');
      return;
    }

    const sub = submissions.find(s => s.id === subId);
    if (!sub) return;

    const evaluatorName = currentUserInfo?.name || (currentUserInfo as any)?.username || 'Evaluation Team';

    updateSubmission(subId, {
      status: 'Correction Requested',
      evaluatorVerified: false,
      evaluatorVerifiedByName: evaluatorName,
      evaluatorRemarks: remarks,
      remarks: remarks,
      marks: 0,
      calculated_marks: 0,
      calculatedMarks: 0,
      role_context: 'evaluator'
    } as any);

    setSubmissionRemarksMap(prev => {
      const copy = { ...prev };
      delete copy[subId];
      return copy;
    });

    if (previewModalDoc?.subId === subId) {
      setPreviewModalDoc(null);
    }

    toast.warn(`⚠️ Correction requested for submission #${subId}. Feedback sent to student.`);
  };

  const handleRejectSubmissionEvaluator = (subId: number, customRemarks?: string) => {
    if (!evaluationOpen) {
      toast.error('Evaluation access is currently CLOSED by system administrator.');
      return;
    }

    const remarks = (customRemarks || submissionRemarksMap[subId] || '').trim();
    if (!remarks) {
      const inputEl = document.getElementById(`evaluator-remarks-${subId}`) as HTMLInputElement;
      if (inputEl) {
        inputEl.reportValidity();
        inputEl.focus();
      }
      toast.error('Remarks/reason are strictly required for rejecting a submission.');
      return;
    }

    const sub = submissions.find(s => s.id === subId);
    if (!sub) return;

    const evaluatorName = currentUserInfo?.name || (currentUserInfo as any)?.username || 'Evaluation Team';

    updateSubmission(subId, {
      status: 'Rejected',
      evaluatorVerified: false,
      evaluatorVerifiedByName: evaluatorName,
      evaluatorRemarks: remarks,
      remarks: remarks,
      marks: 0,
      calculated_marks: 0,
      calculatedMarks: 0,
      role_context: 'evaluator'
    } as any);

    setSubmissionRemarksMap(prev => {
      const copy = { ...prev };
      delete copy[subId];
      return copy;
    });

    if (previewModalDoc?.subId === subId) {
      setPreviewModalDoc(null);
    }

    toast.error(`✗ Submission #${subId} has been rejected.`);
  };

  // Helper to format clean file name
  const formatFileName = (sub: any) => {
    if (sub.proof && isNaN(Number(sub.proof)) && sub.proof.length > 2) {
      return sub.proof.endsWith('.pdf') ? sub.proof : `${sub.proof}.pdf`;
    }
    const criteriaItem = criteriaCatalog.flatMap((c) => c.items).find((it) => String(it.id) === String(sub.criteriaId));
    if (criteriaItem?.title) {
      const cleanTitle = criteriaItem.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 22);
      return `${cleanTitle}_Proof.pdf`;
    }
    return `Institutional_Proof_${sub.id}.pdf`;
  };

  // Open Document Preview Modal
  const handleOpenPreview = (sub: any) => {
    const student = students.find((st) => st.id === sub.studentId);
    const item = criteriaCatalog.flatMap((c) => c.items).find((it) => String(it.id) === String(sub.criteriaId));
    const cat = criteriaCatalog.find((c) => c.items.some((it) => String(it.id) === String(sub.criteriaId)));

    const doc: VerificationDocItem = {
      id: String(sub.id),
      subId: sub.id,
      fileName: formatFileName(sub),
      studentName: student?.name || (sub as any).user_name || 'Student',
      studentEmail: student?.email || (sub as any).user_email || 'student@mariancollege.org',
      studentClass: student?.className || sub.className || 'General',
      studentDept: getStudentDept(student, sub),
      category: cat?.category || 'Academic & Research',
      activityTitle: item?.title || sub.description || 'Academic Excellence Claim',
      description: sub.description || 'Institutional proof submitted for evaluator assessment.',
      date: sub.submissionDate || sub.submission_date || 'Recent',
      proof: sub.proof,
      proofUrl: sub.proof ? (sub.proof.startsWith('http') ? sub.proof : `/Assets/Proofs/${sub.proof}`) : undefined,
      marks: getSubmissionMarks(sub),
      evidence: sub.evidence,
      status: sub.status,
      remarks: sub.evaluatorRemarks || sub.remarks || '',
      gradeBreakdown: sub.grade_breakdown
    };

    setPreviewModalDoc(doc);
    setModalRemarks(submissionRemarksMap[sub.id] || sub.evaluatorRemarks || '');
  };

  // Handle Modal Decision
  const handleModalAction = (status: 'Approved' | 'Rejected' | 'Correction Requested') => {
    if (!previewModalDoc) return;
    const subId = previewModalDoc.subId;

    if (status === 'Rejected' || status === 'Correction Requested') {
      const textarea = document.getElementById('modal-remarks-textarea') as HTMLTextAreaElement;
      if (!modalRemarks.trim()) {
        if (textarea) {
          textarea.reportValidity();
          textarea.focus();
        }
        toast.error(`A remark or explanation is strictly required when selecting ${status === 'Rejected' ? 'Reject' : 'Correction'}.`);
        return;
      }

      if (status === 'Correction Requested') {
        handleCorrectionSubmissionEvaluator(subId, modalRemarks);
      } else {
        handleRejectSubmissionEvaluator(subId, modalRemarks);
      }
    } else {
      handleVerifySubmissionEvaluator(subId, modalRemarks);
    }
  };

  const getSubmissionMarks = (s: any) => {
    if (s.marks !== null && s.marks !== undefined && !isNaN(Number(s.marks))) {
      return Number(s.marks);
    }
    const item = criteriaCatalog.flatMap(c => c.items).find(it => String(it.id) === String(s.criteriaId));
    if (!item) return 0;
    if (item.rules_json && item.rules_json.subItems) {
      const ev = (s.evidence as any) || {};
      const submittedSubItem = ev.subItem || ev.researchSubItem || ev.prizesSubItem;
      if (submittedSubItem) {
        const mapping = item.rules_json.subItems;
        let matchedVal = mapping[submittedSubItem];
        if (matchedVal === undefined) {
          const subNorm = String(submittedSubItem).trim().toLowerCase();
          for (const [k, v] of Object.entries(mapping)) {
            if (k.trim().toLowerCase() === subNorm) {
              matchedVal = v as number;
              break;
            }
          }
        }
        if (matchedVal !== undefined) {
          const count = item.type === 'count' ? (Number(ev.count) || 1) : 1;
          return Number(matchedVal) * count;
        }
      }
    }
    const count = item.type === 'count' ? (Number((s.evidence as any)?.count) || 1) : 1;
    return (item.marks || 0) * count;
  };

  // Metrics
  const assignedSubmissions = submissions.filter(s => isAssignedToEvaluator(s));
  const totalSubmissionsCount = submissions.length;
  const verifiedSubmissions = submissions.filter(s => (s.status === 'Locked' || s.status === 'Evaluated' || s.evaluatorVerified) && isAssignedToEvaluator(s));
  
  const verifiedCount = verifiedSubmissions.length;
  const pendingCount = teacherApprovedSubmissions.length;
  const rejectedCount = submissions.filter(s => (s.status === 'Rejected' || (s.status as string) === 'Disapproved') && isAssignedToEvaluator(s)).length;
  const correctionCount = submissions.filter(s => (s.status === 'Correction' || s.status === 'Correction Requested' || (s.status as string) === 'Returned') && isAssignedToEvaluator(s)).length;

  const completedSubmissions = submissions.filter(s => {
    const isEvaluated = s.status === 'Locked' || s.status === 'Evaluated' || s.evaluatorVerified;
    const isCorrection = ['Correction Requested', 'Correction'].includes(s.status) && (!!s.evaluatorRemarks || !!s.evaluatorVerifiedByName);
    const isRejected = (s.status === 'Rejected' || (s.status as string) === 'Disapproved') && (!!s.evaluatorRemarks || !!s.evaluatorVerifiedByName);
    return (isEvaluated || isCorrection || isRejected) && isAssignedToEvaluator(s);
  });
  const completedCount = completedSubmissions.length;
  const allCount = assignedSubmissions.length;

  const filteredCompletedSubmissions = completedSubmissions.filter(s => {
    if (completedStatusFilter === 'all') return true;
    if (completedStatusFilter === 'evaluated') return s.status === 'Locked' || s.status === 'Evaluated' || s.evaluatorVerified;
    if (completedStatusFilter === 'correction') return ['Correction Requested', 'Correction'].includes(s.status);
    if (completedStatusFilter === 'rejected') return s.status === 'Rejected' || (s.status as string) === 'Disapproved';
    return true;
  });

  const totalEvaluatedDomainCount = assignedSubmissions.length > 0 ? assignedSubmissions.length : (verifiedCount + pendingCount + rejectedCount + correctionCount);

  const getPct = (cnt: number) => totalEvaluatedDomainCount > 0 ? ((cnt / totalEvaluatedDomainCount) * 100).toFixed(1) : '0.0';
  
  const totalScore = verifiedSubmissions.reduce((sum, s) => {
    return sum + getSubmissionMarks(s);
  }, 0);

  const lockedList = submissions.filter(s => (s.status === 'Locked' || s.status === 'Evaluated' || s.evaluatorVerified) && isAssignedToEvaluator(s)).map(s => {
    const item = criteriaCatalog.flatMap(c => c.items).find(it => String(it.id) === String(s.criteriaId));
    const cat = criteriaCatalog.find(c => c.items.some(it => String(it.id) === String(s.criteriaId)));
    const student = students.find(st => st.id === s.studentId);
    return {
      id: s.id.toString(),
      student: student?.name || s.userEmail || 'Unknown',
      category: cat?.category || 'Unknown',
      item: item?.title || 'Unknown',
      status: s.status,
      marks: getSubmissionMarks(s),
      dept: getStudentDept(student, s)
    };
  });

  // Calculate live scores for leaderboard
  const studentsMap = new Map();
  verifiedSubmissions.forEach(s => {
    const student = students.find(st => st.id === s.studentId);
    if (!student) return;
    const marks = getSubmissionMarks(s);
    
    if (!studentsMap.has(student.id)) {
      studentsMap.set(student.id, {
        name: student.name || student.email,
        class: student.className || 'Unknown',
        dept: getStudentDept(student, s),
        score: 0,
        email: student.email
      });
    }
    studentsMap.get(student.id).score += marks;
  });
  const studentsList = Array.from(studentsMap.values());

  const classesMap = new Map();
  studentsList.forEach(st => {
     if (!classesMap.has(st.class)) {
        classesMap.set(st.class, {
           name: st.class,
           dept: st.dept,
           score: 0,
           mentor: 'Unknown'
        });
     }
     classesMap.get(st.class).score += st.score;
  });
  let classesList = Array.from(classesMap.values());
  
  // Filter only classes that exist in the admin classes list
  classesList = classesList.filter(c => classes.some((ac: any) => ac.name === c.name));
  
  // Optionally update mentor
  classesList.forEach(c => {
    const adminClass = classes.find((ac: any) => ac.name === c.name);
    if (adminClass && adminClass.classTeacherName) {
      c.mentor = adminClass.classTeacherName;
    }
  });

  if (classesList.length === 0) {
      classesList.push({ name: 'N/A', dept: 'N/A', score: 0, mentor: 'N/A' });
  }

  // Evaluation tab active filters (search, dropdowns, expanded)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const [lookupType, setLookupType] = useState<'department' | 'class'>('department');
  const [selectedLookupGroup, setSelectedLookupGroup] = useState<string>('PG Department of Computer Applications');

  const getTopStudent = () => {
    const filtered = studentsList.filter(s => 
      lookupType === 'department' ? s.dept === selectedLookupGroup : s.class === selectedLookupGroup
    );
    if (filtered.length === 0) return null;
    return filtered.reduce((prev, current) => (prev.score > current.score) ? prev : current);
  };

  const allDepts = Array.from(new Set([
    ...students.map(s => getStudentDept(s)),
    ...submissions.map(s => getStudentDept(students.find(st => st.id === s.studentId), s))
  ].filter(d => d && d !== 'Unknown')));
  const deptStats = allDepts.map(deptName => {
     const deptPending = teacherApprovedSubmissions.filter(s => {
         const student = students.find(st => st.id === s.studentId);
         return getStudentDept(student, s) === deptName;
     }).length;
     const deptVerified = verifiedSubmissions.filter(s => {
         const student = students.find(st => st.id === s.studentId);
         return getStudentDept(student, s) === deptName;
     }).length;
     const deptCompleted = completedSubmissions.filter(s => {
         const student = students.find(st => st.id === s.studentId);
         return getStudentDept(student, s) === deptName;
     }).length;
     const deptTotal = assignedSubmissions.filter(s => {
         const student = students.find(st => st.id === s.studentId);
         return getStudentDept(student, s) === deptName;
     }).length;
     
     return {
        name: deptName as string,
        total: activeTab === 'all' ? deptTotal : (activeTab === 'completed' ? deptCompleted : deptPending),
        pending: deptPending,
        verified: deptVerified,
        completed: deptCompleted
     };
  });

  const pendingItems = teacherApprovedSubmissions.map(s => {
    const item = criteriaCatalog.flatMap(c => c.items).find(it => String(it.id) === String(s.criteriaId));
    const cat = criteriaCatalog.find(c => c.items.some(it => String(it.id) === String(s.criteriaId)));
    const student = students.find(st => st.id === s.studentId);
    return {
      id: s.id.toString(),
      student: student?.name || s.userEmail || 'Unknown',
      category: cat?.category || 'Unknown',
      item: item?.title || 'Unknown',
      status: s.status,
      marks: item?.marks || 0,
      dept: getStudentDept(student, s)
    };
  });

  const handleVerifyAndLock = (itemId: string, deptName: string, marks: number, studentName: string) => {
    handleVerifySubmissionEvaluator(parseInt(itemId, 10));
    setExpandedDept(null);
  };

  // Filtering Departments
  const pendingDepts = deptStats.filter((d) => d.pending > 0);
  const completedDepts = deptStats.filter((d) => d.completed > 0);
  const allDomainDepts = deptStats.filter((d) => d.total > 0 || deptStats.length <= 1);

  const activeDepts = activeTab === 'pending'
    ? (pendingDepts.length > 0 ? pendingDepts : deptStats)
    : activeTab === 'completed'
    ? (completedDepts.length > 0 ? completedDepts : deptStats)
    : (allDomainDepts.length > 0 ? allDomainDepts : deptStats);

  const filteredDepts = activeDepts.filter((d) => {
    const matchesDept = selectedDept === 'All Departments' || d.name === selectedDept;
    return matchesDept;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {view === 'dashboard' ? (
        <>
          {/* STATS ROW */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div className="stat-card" style={{ background: '#ffffff', border: '1.5px solid var(--glass-border)', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="stat-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Submissions</span>
                <span className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{totalSubmissionsCount}</span>
              </div>
              <span style={{ fontSize: '1.6rem' }}>📊</span>
            </div>

            <div className="stat-card" style={{ background: '#ffffff', border: '1.5px solid var(--glass-border)', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="stat-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Verified</span>
                <span className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a' }}>{verifiedCount}</span>
              </div>
              <span style={{ fontSize: '1.6rem' }}>✓</span>
            </div>

            <div className="stat-card" style={{ background: '#ffffff', border: '1.5px solid var(--glass-border)', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="stat-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Pending</span>
                <span className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706' }}>{pendingCount}</span>
              </div>
              <span style={{ fontSize: '1.6rem' }}>⌛</span>
            </div>

            <div className="stat-card" style={{ background: '#ffffff', border: '1.5px solid var(--glass-border)', padding: '20px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <span className="stat-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Score</span>
                  <span className="stat-value" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>{totalScore.toFixed(1)} / 11138.0</span>
                </div>
                <span style={{ fontSize: '1.2rem' }}>📈</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a' }}>
                  {totalScore > 0 ? Math.min(100, Math.max(0, (totalScore / 11138.0) * 100)).toFixed(1) : '0.0'}%
                </span>
                <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${totalScore > 0 ? Math.min(100, Math.max(0, (totalScore / 11138.0) * 100)) : 0}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* EVALUATOR DETAILS & LEADERS LOOKUP GRID */}
          <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* EVALUATOR DETAILS CARD */}
            <div className="card" style={{ background: '#ffffff', border: '1.5px solid var(--glass-border)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '1.3rem', fontWeight: 'bold' }}>
                  {(currentUserInfo?.name || 'Evaluator').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{currentUserInfo?.name || (currentUserInfo as any)?.username || 'Evaluator'}</h3>
                  <p className="muted" style={{ fontSize: '0.8rem', margin: 0 }}>{currentUserInfo?.role === 'evaluator' ? 'Senior Evaluator' : (currentUserInfo?.role || 'Evaluator')} | System Auditor</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.86rem', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Email Address:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{currentUserInfo?.email || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Scope Access:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>All Departments & Classes</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Assigned Domain:</span>
                  <span style={{ fontWeight: 700, color: '#3b82f6' }}>
                    {(() => {
                      const evaluatorEmail = currentUserInfo?.email?.toLowerCase().trim() || '';
                      return criteriaCatalog.filter(cat => cat.evaluators?.some(e => e.toLowerCase() === evaluatorEmail)).map(c => c.category).join(', ') || 'All Categories';
                    })()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Last Database Audit:</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>Just now (Synced)</span>
                </div>
              </div>
            </div>

            {/* LEADERBOARD & LOOKUP CARD */}
            <div className="card" style={{ background: '#ffffff', border: '1.5px solid var(--glass-border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Performers Leaderboard</h3>
                  <span style={{ padding: '4px 10px', background: '#fef3c7', color: '#d97706', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 800 }}>🏆 Live Standings</span>
                </div>

                {/* Top Class overall */}
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Top Performing Class</span>
                    <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#1e293b' }}>{classesList.reduce((prev, current) => (prev.score > current.score) ? prev : current).name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>{classesList.reduce((prev, current) => (prev.score > current.score) ? prev : current).score.toFixed(1)} pts</span>
                  </div>
                </div>

                {/* Top Student Lookup Panel */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', display: 'block', textTransform: 'uppercase', marginBottom: '8px' }}>Top Student Lookup</span>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <select 
                      className="select" 
                      style={{ padding: '6px 8px', fontSize: '0.8rem', flex: 1 }}
                      value={lookupType}
                      onChange={(e) => {
                        const val = e.target.value as 'department' | 'class';
                        setLookupType(val);
                        const firstDept = classes.length > 0 ? classes[0].department : 'PG Department of Computer Applications';
                        const firstClass = classes.length > 0 ? classes[0].name : 'I MCA';
                        setSelectedLookupGroup(val === 'department' ? firstDept : firstClass);
                      }}
                    >
                      <option value="department">Department-wise</option>
                      <option value="class">Class-wise</option>
                    </select>

                    <select 
                      className="select" 
                      style={{ padding: '6px 8px', fontSize: '0.8rem', flex: 1.5 }}
                      value={selectedLookupGroup}
                      onChange={(e) => setSelectedLookupGroup(e.target.value)}
                    >
                      {lookupType === 'department' ? (
                        <>
                          {Array.from(new Set(classes.map((c: any) => c.department))).sort().map(dept => (
                            <option key={String(dept)} value={String(dept)}>{String(dept)}</option>
                          ))}
                        </>
                      ) : (
                        <>
                          {classes.map((c: any) => c.name).sort().map(cls => (
                            <option key={String(cls)} value={String(cls)}>{String(cls)}</option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Lookup Result Display */}
              <div>
                {getTopStudent() ? (
                  <div style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#16a34a' }}>⭐ {getTopStudent()?.name}</span>
                      <span style={{ fontSize: '0.74rem', color: '#667085', display: 'block' }}>{getTopStudent()?.class} ({getTopStudent()?.dept})</span>
                    </div>
                    <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#15803d' }}>{getTopStudent()?.score.toFixed(1)} pts</span>
                  </div>
                ) : (
                  <div style={{ background: '#fef2f2', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fecaca', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#991b1b' }}>No students found in this group selection.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CREATIVE & ELEGANT EVALUATION AUDIT PROGRESS PANEL */}
          <div 
            className="card" 
            style={{ 
              padding: '24px', 
              background: '#ffffff', 
              border: '1.5px solid var(--glass-border)', 
              borderRadius: '16px',
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)'
            }}
          >
            {/* Header Title + Stats Pill */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
                    📊
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.12rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      Evaluation Progress & Analytics
                    </h3>
                    <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 500 }}>
                      Real-time audit breakdown across assigned domain submissions
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>Audited:</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#2563eb' }}>{verifiedCount} / {totalEvaluatedDomainCount}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '8px' }}>
                  {getPct(verifiedCount)}%
                </span>
              </div>
            </div>

            {/* Multi-Segment Gradient Bar */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>
                <span>Overall Pipeline Visualizer</span>
                <span>{totalEvaluatedDomainCount} Total Items</span>
              </div>

              <div style={{ height: '14px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', display: 'flex', padding: '2px', boxSizing: 'border-box', border: '1px solid #e2e8f0' }}>
                {totalEvaluatedDomainCount === 0 ? (
                  <div style={{ width: '100%', height: '100%', background: '#cbd5e1', borderRadius: '6px' }} />
                ) : (
                  <>
                    {verifiedCount > 0 && (
                      <div 
                        title={`Verified: ${verifiedCount}`} 
                        style={{ width: `${getPct(verifiedCount)}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '6px 0 0 6px', transition: 'width 0.4s ease' }} 
                      />
                    )}
                    {pendingCount > 0 && (
                      <div 
                        title={`Pending: ${pendingCount}`} 
                        style={{ width: `${getPct(pendingCount)}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #d97706)', transition: 'width 0.4s ease' }} 
                      />
                    )}
                    {correctionCount > 0 && (
                      <div 
                        title={`Correction: ${correctionCount}`} 
                        style={{ width: `${getPct(correctionCount)}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)', transition: 'width 0.4s ease' }} 
                      />
                    )}
                    {rejectedCount > 0 && (
                      <div 
                        title={`Rejected: ${rejectedCount}`} 
                        style={{ width: `${getPct(rejectedCount)}%`, height: '100%', background: 'linear-gradient(90deg, #f43f5e, #e11d48)', borderRadius: '0 6px 6px 0', transition: 'width 0.4s ease' }} 
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 4 Creative Status Metric Cards (2x2 Grid) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* 1. Verified */}
              <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '14px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1rem' }}>🛡️</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#166534', letterSpacing: '0.02em' }}>Verified & Locked</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#15803d', background: '#ffffff', padding: '3px 8px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    {getPct(verifiedCount)}%
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#15803d', lineHeight: 1 }}>{verifiedCount}</span>
                  <span style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 600 }}>items</span>
                </div>
                <div style={{ height: '5px', background: '#bbf7d0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${getPct(verifiedCount)}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '4px' }} />
                </div>
              </div>

              {/* 2. Submitted / Pending */}
              <div style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1px solid #fde68a', padding: '16px', borderRadius: '14px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1rem' }}>⌛</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#92400e', letterSpacing: '0.02em' }}>Pending Audit</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b45309', background: '#ffffff', padding: '3px 8px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    {getPct(pendingCount)}%
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#b45309', lineHeight: 1 }}>{pendingCount}</span>
                  <span style={{ fontSize: '0.74rem', color: '#92400e', fontWeight: 600 }}>awaiting review</span>
                </div>
                <div style={{ height: '5px', background: '#fde68a', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${getPct(pendingCount)}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #d97706)', borderRadius: '4px' }} />
                </div>
              </div>

              {/* 3. Needs Correction */}
              <div style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '1px solid #ddd6fe', padding: '16px', borderRadius: '14px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1rem' }}>🛠️</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#5b21b6', letterSpacing: '0.02em' }}>Correction Req.</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6d28d9', background: '#ffffff', padding: '3px 8px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    {getPct(correctionCount)}%
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#6d28d9', lineHeight: 1 }}>{correctionCount}</span>
                  <span style={{ fontSize: '0.74rem', color: '#5b21b6', fontWeight: 600 }}>in revision</span>
                </div>
                <div style={{ height: '5px', background: '#ddd6fe', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${getPct(correctionCount)}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)', borderRadius: '4px' }} />
                </div>
              </div>

              {/* 4. Rejected */}
              <div style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', border: '1px solid #fecdd3', padding: '16px', borderRadius: '14px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1rem' }}>⛔</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#9f1239', letterSpacing: '0.02em' }}>Rejected</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#be123c', background: '#ffffff', padding: '3px 8px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    {getPct(rejectedCount)}%
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#be123c', lineHeight: 1 }}>{rejectedCount}</span>
                  <span style={{ fontSize: '0.74rem', color: '#9f1239', fontWeight: 600 }}>disapproved</span>
                </div>
                <div style={{ height: '5px', background: '#fecdd3', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${getPct(rejectedCount)}%`, height: '100%', background: 'linear-gradient(90deg, #f43f5e, #e11d48)', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* VERIFIED AND LOCKED SUBMISSIONS TABLE */}
          <div className="card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid var(--glass-border)', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>Verified and Locked Submissions</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Category</th>
                    <th>Item</th>
                    <th>Status</th>
                    <th>Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {lockedList.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700 }}>{item.student}</td>
                      <td>{item.category}</td>
                      <td>{item.item}</td>
                      <td>
                        <span className="badge" style={{ background: '#dcfce7', color: '#16a34a', fontWeight: 700 }}>{item.status}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{item.marks.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button
                className="btn btn-primary"
                style={{ padding: '12px 24px', borderRadius: '10px', cursor: 'pointer' }}
                onClick={() => router.push('/evaluator/evaluation')}
              >
                Open Evaluation
              </button>
            </div>
          </div>
        </>
      ) : (
        /* EVALUATION QUEUE VIEW */
        <div className="card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid var(--glass-border)', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '20px' }}>Evaluation Workspace</h2>

          {/* FILTER CONTROLS */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
            {/* FILTER STATUS TABS (SAME AS CLASS TEACHER WINDOW) */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: activeTab === 'pending' ? 'none' : '1px solid #e2e8f0',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  background: activeTab === 'pending' ? '#4f46e5' : '#f8fafc',
                  color: activeTab === 'pending' ? '#ffffff' : '#475569',
                  boxShadow: activeTab === 'pending' ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => {
                  setActiveTab('pending');
                  setExpandedDept(null);
                }}
              >
                <span>Pending Reviews</span>
                <span style={{
                  padding: '1px 7px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color: activeTab === 'pending' ? '#ffffff' : '#475569'
                }}>
                  {pendingCount}
                </span>
              </button>

              <button
                type="button"
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: activeTab === 'completed' ? 'none' : '1px solid #e2e8f0',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  background: activeTab === 'completed' ? '#4f46e5' : '#f8fafc',
                  color: activeTab === 'completed' ? '#ffffff' : '#475569',
                  boxShadow: activeTab === 'completed' ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => {
                  setActiveTab('completed');
                  setExpandedDept(null);
                }}
              >
                <span>Completed</span>
                <span style={{
                  padding: '1px 7px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: activeTab === 'completed' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color: activeTab === 'completed' ? '#ffffff' : '#475569'
                }}>
                  {completedCount}
                </span>
              </button>

              <button
                type="button"
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: activeTab === 'all' ? 'none' : '1px solid #e2e8f0',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  background: activeTab === 'all' ? '#4f46e5' : '#f8fafc',
                  color: activeTab === 'all' ? '#ffffff' : '#475569',
                  boxShadow: activeTab === 'all' ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => {
                  setActiveTab('all');
                  setExpandedDept(null);
                }}
              >
                <span>All Audited</span>
                <span style={{
                  padding: '1px 7px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: activeTab === 'all' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color: activeTab === 'all' ? '#ffffff' : '#475569'
                }}>
                  {allCount}
                </span>
              </button>
            </div>

            {/* SEARCH */}
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                className="input"
                placeholder="🔍 Search student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>

            {/* DEPT DROPDOWN */}
            <select
              className="select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{ width: '220px' }}
            >
              <option value="All Departments">All Departments</option>
              {allDepts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* CLASS DROPDOWN */}
            <select
              className="select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="All Classes">All Classes</option>
              {classes?.map((c: any) => (
                <option key={c.id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* INNER DEPARTMENT LISTING */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>Departments</h3>
              <span className="muted" style={{ fontSize: '0.84rem' }}>
                Showing 1-{filteredDepts.length} of {filteredDepts.length} records
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredDepts.map((dept) => {
                const isExpanded = expandedDept === dept.name;
                const progressPct = (dept.verified / dept.total) * 100;
                return (
                  <div key={dept.name} style={{ display: 'flex', flexDirection: 'column', border: '1.5px solid var(--glass-border)', borderRadius: '12px', background: '#ffffff', overflow: 'hidden' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        cursor: 'pointer',
                        background: '#ffffff'
                      }}
                      onClick={() => setExpandedDept(isExpanded ? null : dept.name)}
                    >
                      <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{dept.name}</span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '30%' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {dept.verified} / {dept.total} Verified
                        </span>
                        <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${progressPct}%`, height: '100%', background: '#16a34a' }} />
                        </div>
                        <span style={{ fontSize: '1rem', color: 'var(--color-primary)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>&rarr;</span>
                      </div>
                    </div>

                    {/* EXPANDED INNER LIST OF SUBMISSIONS */}
                    {isExpanded && (
                      <div style={{ padding: '20px', background: '#fafaf9', borderTop: '1px solid var(--glass-border)' }}>
                        <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '12px' }}>
                          {activeTab === 'pending' ? `Pending Submissions in ${dept.name}` : activeTab === 'completed' ? `Completed Submissions in ${dept.name}` : `All Submissions in ${dept.name}`}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {/* Submissions in Department */}
                          {(activeTab === 'pending'
                            ? teacherApprovedSubmissions
                            : activeTab === 'completed'
                            ? filteredCompletedSubmissions
                            : assignedSubmissions
                          )
                            .filter(sub => {
                               const studentObj = students.find((s) => s.id === sub.studentId);
                               const matchesDept = getStudentDept(studentObj, sub) === dept.name;
                               const matchesClass = selectedClass === 'All Classes' || (studentObj?.className === selectedClass || sub.className === selectedClass);
                               const matchesSearch = !searchQuery || (
                                 (studentObj?.name && studentObj.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                 (sub.description && sub.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                 (sub.user_name && sub.user_name.toLowerCase().includes(searchQuery.toLowerCase()))
                               );
                               return matchesDept && matchesClass && matchesSearch;
                            })
                            .map((sub) => {
                            const studentObj = students.find((s) => s.id === sub.studentId);
                            const itemObj = criteriaCatalog.flatMap((c) => c.items).find((i) => String(i.id) === String(sub.criteriaId));
                            const catObj = criteriaCatalog.find((c) => c.items.some((i) => String(i.id) === String(sub.criteriaId)));
                            const isDriveUrl = sub.proof?.startsWith('http://') || sub.proof?.startsWith('https://');

                            const isPendingReview = [
                              'Teacher Verified',
                              'TEACHER_VERIFIED',
                              'EVALUATOR_PENDING',
                              'Approved',
                              'Verified'
                            ].includes(sub.status) && !sub.evaluatorVerified && sub.status !== 'Locked' && sub.status !== 'Evaluated';

                            const isEvaluated = sub.evaluatorVerified || sub.status === 'Evaluated' || sub.status === 'Locked';
                            const isCorrection = ['Correction Requested', 'Correction'].includes(sub.status);
                            const isRejected = sub.status === 'Rejected' || (sub.status as string) === 'Disapproved';

                            return (
                              <div
                                key={`live-sub-${sub.id}`}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  background: '#ffffff',
                                  padding: '14px 18px',
                                  border: isPendingReview ? '1.5px solid #6366f1' : '1px solid #e2e8f0',
                                  borderRadius: '12px',
                                  boxShadow: isPendingReview ? '0 2px 8px rgba(99, 102, 241, 0.08)' : 'none',
                                  gap: '16px',
                                  flexWrap: 'wrap'
                                }}
                              >
                                <div style={{ flex: 1, minWidth: '240px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                    <h5 style={{ fontWeight: 800, color: 'var(--text-main)', margin: 0, fontSize: '0.94rem' }}>
                                      {studentObj ? studentObj.name : (sub.user_name || `Student #${sub.studentId}`)}
                                    </h5>
                                    
                                    {isPendingReview ? (
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                        <span className="badge badge-verified" style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe', fontSize: '0.72rem', fontWeight: 800 }}>
                                          ✓ Rep Verified ({sub.repVerifiedByName || 'Rep'})
                                        </span>
                                        <span className="badge badge-verified" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontSize: '0.72rem', fontWeight: 800 }}>
                                          ✓ Teacher Verified ({sub.teacherVerifiedByName || sub.verifiedByName || 'Teacher'})
                                        </span>
                                      </div>
                                    ) : isEvaluated ? (
                                      <span className="badge" style={{ background: '#dcfce7', color: '#16a34a', fontWeight: 800, fontSize: '0.72rem', border: '1px solid #86efac' }}>
                                        ✓ Evaluated ({getSubmissionMarks(sub).toFixed(1)} pts)
                                      </span>
                                    ) : isCorrection ? (
                                      <span className="badge" style={{ background: '#fef3c7', color: '#b45309', fontWeight: 800, fontSize: '0.72rem', border: '1px solid #fde68a' }}>
                                        ⚠️ Correction Requested
                                      </span>
                                    ) : isRejected ? (
                                      <span className="badge" style={{ background: '#fee2e2', color: '#dc2626', fontWeight: 800, fontSize: '0.72rem', border: '1px solid #fca5a5' }}>
                                        ❌ Rejected
                                      </span>
                                    ) : (
                                      <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: '0.72rem' }}>
                                        {sub.status}
                                      </span>
                                    )}

                                    {sub.evaluatorVerifiedByName && (
                                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                        by {sub.evaluatorVerifiedByName}
                                      </span>
                                    )}
                                  </div>

                                  <p className="muted" style={{ fontSize: '0.8rem', margin: 0 }}>
                                    Category: {catObj?.category || 'General'} | Item: {itemObj?.title || sub.description} | Class: {studentObj?.className || sub.className || 'Unknown'}
                                  </p>

                                  {(sub.evaluatorRemarks || sub.remarks) && (
                                    <div style={{ fontSize: '0.78rem', color: '#334155', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: '6px', marginTop: '6px', display: 'inline-block' }}>
                                      <span style={{ fontWeight: 700 }}>Feedback:</span> "{sub.evaluatorRemarks || sub.remarks}"
                                    </div>
                                  )}

                                  {sub.proof && (
                                    <div style={{ fontSize: '0.76rem', marginTop: '4px' }}>
                                      Proof: <a href={isDriveUrl ? sub.proof : `/Assets/Proofs/${sub.proof}`} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{sub.proof}</a>
                                    </div>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                                    {getSubmissionMarks(sub).toFixed(1)} pts
                                  </span>

                                  {/* Preview & Decide Button */}
                                  <button
                                    onClick={() => handleOpenPreview(sub)}
                                    title="Inspect document and record evaluation decision"
                                    style={{
                                      background: '#e0e7ff',
                                      color: '#4338ca',
                                      border: 'none',
                                      borderRadius: '8px',
                                      padding: '6px 12px',
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    👁️ Review
                                  </button>

                                  {/* Action Controls for Pending Submissions */}
                                  {isPendingReview ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                      <input
                                        id={`evaluator-remarks-${sub.id}`}
                                        type="text"
                                        placeholder="Add feedback / reason..."
                                        value={submissionRemarksMap[sub.id] || ''}
                                        onChange={(e) =>
                                          setSubmissionRemarksMap({
                                            ...submissionRemarksMap,
                                            [sub.id]: e.target.value
                                          })
                                        }
                                        style={{
                                          padding: '6px 12px',
                                          borderRadius: '8px',
                                          border: '1px solid #cbd5e1',
                                          fontSize: '0.8rem',
                                          background: '#ffffff',
                                          minWidth: '180px'
                                        }}
                                      />
                                      <button
                                        className="btn btn-sm"
                                        style={{ background: '#4f46e5', color: '#ffffff', fontWeight: 800, padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)' }}
                                        onClick={() => handleVerifySubmissionEvaluator(sub.id)}
                                      >
                                        ✓ Verify & Lock
                                      </button>
                                      <button
                                        className="btn btn-sm"
                                        style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 800, padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}
                                        onClick={() => handleCorrectionSubmissionEvaluator(sub.id)}
                                      >
                                        ⚠️ Correction
                                      </button>
                                      <button
                                        className="btn btn-sm"
                                        style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 800, padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}
                                        onClick={() => handleRejectSubmissionEvaluator(sub.id)}
                                      >
                                        ✗ Reject
                                      </button>
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                                      Decision recorded
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {(activeTab === 'pending'
                            ? teacherApprovedSubmissions
                            : activeTab === 'completed'
                            ? filteredCompletedSubmissions
                            : assignedSubmissions
                          ).filter(sub => {
                               const studentObj = students.find((s) => s.id === sub.studentId);
                               const matchesDept = getStudentDept(studentObj, sub) === dept.name;
                               const matchesClass = selectedClass === 'All Classes' || (studentObj?.className === selectedClass || sub.className === selectedClass);
                               const matchesSearch = !searchQuery || (
                                 (studentObj?.name && studentObj.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                 (sub.description && sub.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                 (sub.user_name && sub.user_name.toLowerCase().includes(searchQuery.toLowerCase()))
                               );
                               return matchesDept && matchesClass && matchesSearch;
                          }).length === 0 && (
                            <p className="muted" style={{ fontSize: '0.84rem', margin: 0, textAlign: 'center', padding: '16px 0' }}>
                              No {activeTab} verification files found for this department.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredDepts.length === 0 && (
                <p className="muted" style={{ textAlign: 'center', padding: '30px' }}>No departments found matching the filter specs.</p>
              )}
            </div>
          </div>

          {/* PAGINATION FOOTER */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
            <button className="btn btn-secondary btn-sm" disabled style={{ opacity: 0.6 }}>Prev</button>
            <button className="btn btn-sm btn-primary">1</button>
            <button className="btn btn-secondary btn-sm" disabled style={{ opacity: 0.6 }}>Next</button>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW & DECISION MODAL (MATCHING CLASS TEACHER WINDOW) */}
      {previewModalDoc && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '20px'
          }}
          onClick={() => setPreviewModalDoc(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '640px',
              width: '100%',
              boxShadow: '0 30px 70px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 26px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: '#e0e7ff',
                    color: '#4338ca',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </span>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Submission Details</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>Review document and record evaluation decision (Round 3)</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewModalDoc(null)}
                style={{
                  background: '#e2e8f0',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 26px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Document Banner Box */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem'
                    }}
                  >
                    📄
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: '#0f172a', display: 'block' }}>
                      {previewModalDoc.fileName}
                    </strong>
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      Submitted {previewModalDoc.date || 'Recent'} • Institutional Proof
                    </span>
                  </div>
                </div>

                <a
                  href={previewModalDoc.proofUrl || `/Assets/Proofs/${previewModalDoc.fileName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Open Proof ↗
                </a>
              </div>

              {/* Student Profile Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '12px 18px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #3730a3)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem' }}>
                    {previewModalDoc.studentName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: '#0f172a' }}>{previewModalDoc.studentName}</h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>{previewModalDoc.studentEmail} • {previewModalDoc.studentClass} ({previewModalDoc.studentDept})</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: 800 }}>
                    {previewModalDoc.category}
                  </span>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#4f46e5', marginTop: '4px' }}>
                    +{previewModalDoc.marks?.toFixed(1) ?? '0.0'} Points
                  </div>
                </div>
              </div>

              {/* Claim Details */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                  Activity / Claim Description
                </span>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                  {previewModalDoc.activityTitle}
                </strong>
                <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0 }}>
                  {previewModalDoc.description || 'Valid institutional proof submitted for evaluation.'}
                </p>
              </div>

              {/* Feedback / Remarks textarea */}
              <div>
                <label style={{ fontSize: '0.76rem', color: '#475569', textTransform: 'uppercase', fontWeight: 800, display: 'block', marginBottom: '6px' }}>
                  Remarks / Feedback (Required for Correction / Reject)
                </label>
                <textarea
                  id="modal-remarks-textarea"
                  className="input"
                  rows={2}
                  placeholder="Enter evaluation notes or correction instructions for the student..."
                  value={modalRemarks}
                  onChange={(e) => setModalRemarks(e.target.value)}
                  style={{ borderRadius: '12px', padding: '10px 14px', width: '100%', fontSize: '0.88rem', resize: 'none' }}
                />
              </div>
            </div>

            {/* Modal Footer with 3 Action Buttons */}
            <div
              style={{
                padding: '18px 26px',
                borderTop: '1px solid #f1f5f9',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <button
                onClick={() => handleModalAction('Rejected')}
                style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fca5a5',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <span>✗</span> Reject
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleModalAction('Correction Requested')}
                  style={{
                    background: '#fef3c7',
                    color: '#b45309',
                    border: '1px solid #fcd34d',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>⚠️</span> Correction
                </button>

                <button
                  onClick={() => handleModalAction('Approved')}
                  style={{
                    background: '#4f46e5',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 22px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>✓</span> Verify & Lock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Student, Submission } from '@/data/initialData';
import { toast } from 'react-toastify';

interface TeacherWorkspaceProps {
  view?: 'dashboard' | 'verification' | 'profile';
}

interface VerificationDocItem {
  id: number;
  fileName: string;
  studentName: string;
  activityTitle: string;
  category: string;
  description?: string;
  marks?: number;
  date?: string;
  eventId?: string;
  proofUrl?: string;
  subId?: number;
  isBulk?: boolean;
  pendingIds?: number[];
}

export const TeacherWorkspace: React.FC<TeacherWorkspaceProps> = ({ view }) => {
  const router = useRouter();
  const {
    submissions,
    fetchSubmissions,
    updateSubmission,
    evaluationOpen,
    students,
    activePage,
    setActivePage,
    criteriaCatalog,
    currentUserInfo,
    classes,
    fetchClasses,
    users,
    fetchUsersAndGroups,
    classIndexData,
    fetchClassIndex,
    smallestClassSize,
    activeAcademicYear,
  } = useApp();

  const activeTab = view || activePage || 'dashboard';

  // Fetch official moderated class index, submissions, classes, and users on mount & academic year change
  React.useEffect(() => {
    fetchClassIndex?.(activeAcademicYear || undefined);
    fetchSubmissions?.();
    fetchClasses?.();
    fetchUsersAndGroups?.();
  }, [activeAcademicYear, fetchClassIndex, fetchSubmissions, fetchClasses, fetchUsersAndGroups]);

  // ----------------------------------------------------
  // QUEUE, MODAL & TOAST STATE
  // ----------------------------------------------------
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isScoreHovered, setIsScoreHovered] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);
  const [previewModalDoc, setPreviewModalDoc] = useState<VerificationDocItem | null>(null);
  const [modalRemarks, setModalRemarks] = useState('');
  const [submissionRemarksMap, setSubmissionRemarksMap] = useState<Record<number, string>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Verification Desk Search & Filter - DEFAULT TO 'pending'
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed' | 'all'>('pending');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [verificationPage, setVerificationPage] = useState(1);
  const verificationPageSize = 5;

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get('search');
      if (searchParam) {
        setStudentSearch(searchParam);
      }
      const statusParam = params.get('status');
      if (statusParam === 'pending' || statusParam === 'completed' || statusParam === 'all') {
        setStatusFilter(statusParam);
      }
    }
  }, []);

  // Bulk Selection for Verification Desk
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);





  // ----------------------------------------------------
  // CLASS STUDENTS & CLASS SUBMISSIONS
  // ----------------------------------------------------
  // Helper to check if two class names match (exact case/spacing normalized, preserves Roman numerals)
  const isSameClass = (c1?: string, c2?: string): boolean => {
    if (!c1 || !c2) return false;
    const clean1 = c1.trim().toLowerCase().replace(/\s+/g, ' ');
    const clean2 = c2.trim().toLowerCase().replace(/\s+/g, ' ');
    if (clean1 === clean2) return true;

    // Handle common punctuation differences like "II-MCA" vs "II MCA" or "B.Sc" vs "BSc"
    const normPunct = (s: string) => s.replace(/[-_.]/g, ' ').replace(/\s+/g, ' ').trim();
    return normPunct(clean1) === normPunct(clean2);
  };

  const classByTeacherEmail = classes?.find((c: any) =>
    (c.classTeacher && currentUserInfo?.email && c.classTeacher.toLowerCase() === currentUserInfo.email.toLowerCase()) ||
    (c.classTeacherEmail && currentUserInfo?.email && c.classTeacherEmail.toLowerCase() === currentUserInfo.email.toLowerCase())
  );

  const rawAssignedClass =
    currentUserInfo?.assigned_class?.name ||
    (currentUserInfo as any)?.class_name_display ||
    (currentUserInfo as any)?.className ||
    (currentUserInfo as any)?.class_name ||
    classByTeacherEmail?.name ||
    '';

  const teacherClass = (typeof rawAssignedClass === 'string' && isNaN(Number(rawAssignedClass)))
    ? rawAssignedClass.trim()
    : (classByTeacherEmail?.name || '');

  const matchedCatalogClass = classes?.find((c: any) => isSameClass(c.name, teacherClass)) || classByTeacherEmail;

  // teacherClassObject merges currentUserInfo.assigned_class (from auth/user profile) with matching catalog class
  const teacherClassObject = currentUserInfo?.assigned_class
    ? {
      ...matchedCatalogClass,
      ...currentUserInfo.assigned_class,
      name: currentUserInfo.assigned_class.name || matchedCatalogClass?.name || teacherClass,
      department: currentUserInfo.assigned_class.department || matchedCatalogClass?.department,
      num_students: currentUserInfo.assigned_class.num_students ?? matchedCatalogClass?.num_students,
      class_teacher_name: currentUserInfo.assigned_class.class_teacher_name || matchedCatalogClass?.classTeacherName || currentUserInfo?.name,
      dqc_member_name: currentUserInfo.assigned_class.dqc_member_name || matchedCatalogClass?.dqcMemberName,
    }
    : (matchedCatalogClass || null);

  const teacherDepartment =
    teacherClassObject?.department ||
    currentUserInfo?.department ||
    'PG Department of Computer Applications';

  const advisorName =
    teacherClassObject?.class_teacher_name ||
    teacherClassObject?.classTeacherName ||
    (teacherClassObject as any)?.class_teacher ||
    currentUserInfo?.name ||
    'Faculty Advisor';

  const dqcRepName =
    teacherClassObject?.dqc_member_name ||
    teacherClassObject?.dqcMemberName ||
    (teacherClassObject as any)?.dqc_member ||
    (teacherClassObject as any)?.dqcMember ||
    '';

  // Base list of students belonging to this teacher's class
  const realStudents = users.filter(u => u.role === 'student').map(u => ({
    id: u.id,
    name: u.name || u.email.split('@')[0],
    className: (u as any).class_name_display || u.className || (u as any).class_name || 'Unknown',
    email: u.email
  }));

  // Also harvest any students directly present in submissions for this class
  const submissionStudents = submissions
    .filter(s => isSameClass(s.className, teacherClass) || (teacherClassObject?.id && (s.classId === teacherClassObject.id || (s as any).class_id === teacherClassObject.id)))
    .map(s => ({
      id: s.studentId || (s as any).student_id || 0,
      name: (s as any).user_name || (s as any).userEmail?.split('@')[0] || (s as any).user_email?.split('@')[0] || `Student ${s.studentId}`,
      className: s.className || teacherClass,
      email: (s as any).user_email || (s as any).userEmail || ''
    }))
    .filter(s => s.id > 0);

  const classStudentsMap = new Map<number, { id: number; name: string; className: string; email: string }>();
  realStudents.forEach(st => {
    if (isSameClass(st.className, teacherClass)) {
      classStudentsMap.set(st.id, st);
    }
  });
  submissionStudents.forEach(st => {
    if (!classStudentsMap.has(st.id)) {
      classStudentsMap.set(st.id, st);
    }
  });

  const classStudents = Array.from(classStudentsMap.values());
  const classStudentIds = new Set(classStudents.map(s => s.id));
  const classStudentEmails = new Set(classStudents.map(s => s.email.toLowerCase()).filter(Boolean));

  // Submissions belonging to this class
  const classSubmissions = submissions.filter(s => {
    if (s.studentId && classStudentIds.has(s.studentId)) return true;
    if ((s as any).student_id && classStudentIds.has((s as any).student_id)) return true;
    const subEmail = ((s as any).user_email || (s as any).userEmail || '').toLowerCase();
    if (subEmail && classStudentEmails.has(subEmail)) return true;
    if (s.className && teacherClass && isSameClass(s.className, teacherClass)) return true;
    if (teacherClassObject?.id && (s.classId === teacherClassObject.id || (s as any).class_id === teacherClassObject.id)) return true;
    return false;
  });

  // Match class in official Class Index / Moderation data
  const matchingClassIndexEntry = React.useMemo(() => {
    if (!classIndexData || !teacherClass) return null;
    const normTarget = teacherClass.trim().toLowerCase();
    return classIndexData.find((e) => {
      const eName = (e.class_name || '').trim().toLowerCase();
      return eName === normTarget || isSameClass(eName, teacherClass);
    }) || null;
  }, [classIndexData, teacherClass]);

  // ----------------------------------------------------
  // METRIC COUNTS
  // ----------------------------------------------------
  const totalSubmissionsDisplay = classSubmissions.length.toString();
  const verifiedDisplay = classSubmissions.filter(s => ['Approved', 'Verified', 'Teacher Verified', 'Evaluated', 'Locked'].includes(s.status)).length.toString();

  const getSubmissionPoints = (s: Submission) => {
    if (s.marks !== null && s.marks !== undefined && !isNaN(Number(s.marks))) {
      return Number(s.marks);
    }
    const criteriaItem = criteriaCatalog.flatMap((c) => c.items).find((it) => String(it.id) === String(s.criteriaId));
    if (!criteriaItem) return 0;
    if (criteriaItem.rules_json && criteriaItem.rules_json.subItems) {
      const ev = (s.evidence as any) || {};
      const subKey = ev.subItem || ev.researchSubItem || ev.prizesSubItem;
      if (subKey) {
        const mapping = criteriaItem.rules_json.subItems;
        let matchedVal = mapping[subKey];
        if (matchedVal === undefined) {
          const subNorm = String(subKey).trim().toLowerCase();
          for (const [k, v] of Object.entries(mapping)) {
            if (k.trim().toLowerCase() === subNorm) {
              matchedVal = v as number;
              break;
            }
          }
        }
        if (matchedVal !== undefined) {
          const count = criteriaItem.type === 'count' ? (Number(ev.count) || 1) : 1;
          return Number(matchedVal) * count;
        }
      }
    }
    const count = criteriaItem.type === 'count' ? (Number((s.evidence as any)?.count) || 1) : 1;
    return (criteriaItem.marks || 0) * count;
  };

  // Calculate total raw points earned by class from evaluated/locked submissions (S)
  const classTotalScore = classSubmissions.reduce((sum, s) => {
    if (['Approved', 'Verified', 'Teacher Verified', 'Evaluated', 'Locked'].includes(s.status)) {
      return sum + getSubmissionPoints(s);
    }
    return sum;
  }, 0);

  // ----------------------------------------------------
  // MODERATION FORMULA M (INDEX) CALCULATION
  // Formula: M = (S − P) / N² × (1 + 100 × (N − n))
  //   where S = Evaluated Marks
  //   P = Penalties (defined in department management)
  //   N = Class Size (defined in department management)
  //   n = 0 (Smallest Class Benchmark defined in department management)
  // ----------------------------------------------------
  const classN = matchingClassIndexEntry?.N && matchingClassIndexEntry.N > 0
    ? matchingClassIndexEntry.N
    : (teacherClassObject?.num_students && teacherClassObject.num_students > 0
      ? teacherClassObject.num_students
      : (classStudents.length > 0 ? classStudents.length : 1));

  const classP = matchingClassIndexEntry?.P !== undefined
    ? matchingClassIndexEntry.P
    : (teacherClassObject?.negative_points || 0);

  const benchmarkN = matchingClassIndexEntry?.n !== undefined
    ? matchingClassIndexEntry.n
    : (smallestClassSize ?? 0);

  const classS = matchingClassIndexEntry?.S !== undefined
    ? matchingClassIndexEntry.S
    : classTotalScore;

  const diff = classN - benchmarkN;
  const computedM = classN > 0
    ? Math.max(0, ((classS - classP) / (classN * classN)) * (1 + 100 * diff))
    : 0;

  const moderatedM = matchingClassIndexEntry && matchingClassIndexEntry.M !== null && matchingClassIndexEntry.M !== undefined
    ? matchingClassIndexEntry.M
    : Math.max(0, computedM);

  const classRank = matchingClassIndexEntry?.rank ?? null;
  const totalScoreVal = moderatedM;
  const targetScoreVal = classStudents.length > 0 ? classStudents.length * 20 : 1000;
  const progressPercent = ((classTotalScore / targetScoreVal) * 100).toFixed(1);

  // Formatted values for hover display: showing ONLY S, P, and M
  const sFormatted = typeof classS === 'number' ? (Number.isInteger(classS) ? String(classS) : classS.toFixed(2)) : String(classS);
  const pFormatted = typeof classP === 'number' ? (Number.isInteger(classP) ? String(classP) : classP.toFixed(2)) : String(classP);
  const mFormatted = typeof moderatedM === 'number' ? moderatedM.toFixed(4) : String(moderatedM);
  const scoreHoverOnlyText = `S (Evaluated Marks): ${sFormatted}\nP (Penalty): ${pFormatted}\nM (Index): ${mFormatted}`;

  // Helper function to get student status and styling
  const getProgressDetails = (percent: number) => {
    if (percent >= 75) {
      return {
        status: 'On Track',
        color: '#047857',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d'
      };
    } else if (percent < 50) {
      return {
        status: 'Attention',
        color: '#dc2626',
        badgeBg: '#fee2e2',
        badgeColor: '#dc2626'
      };
    } else {
      return {
        status: 'In Progress',
        color: '#3730a3',
        badgeBg: '#ede9fe',
        badgeColor: '#6366f1'
      };
    }
  };

  // Category-wise colour palette for the breakdown chips
  const categoryChipColors: Record<string, { bg: string; color: string }> = {
    'Academics': { bg: '#eff6ff', color: '#1d4ed8' },
    'Online Courses': { bg: '#f0fdf4', color: '#15803d' },
    'Internships': { bg: '#fdf4ff', color: '#7e22ce' },
    'Competitive Exams': { bg: '#fff7ed', color: '#c2410c' },
    'Scholarships': { bg: '#fefce8', color: '#854d0e' },
    'Research': { bg: '#f0f9ff', color: '#0369a1' },
    'Prizes': { bg: '#fff1f2', color: '#be123c' },
    'Leadership': { bg: '#faf5ff', color: '#6d28d9' },
    'Programs Organized': { bg: '#f0fdfa', color: '#0f766e' },
    'Social Responsibility': { bg: '#ecfdf5', color: '#047857' },
    'Career Advancement': { bg: '#fff8f1', color: '#9a3412' },
    'Documentation': { bg: '#f8fafc', color: '#475569' },
  };

  // Recent Student Progress list with Recently Submitted Document
  let displayProgressStudents = classStudents.map(student => {
    const studentSubs = classSubmissions.filter(s => {
      if (s.studentId === student.id || (s as any).student_id === student.id) return true;
      const subEmail = ((s as any).user_email || (s as any).userEmail || '').toLowerCase();
      if (subEmail && student.email && subEmail === student.email.toLowerCase()) return true;
      return false;
    });

    const verifiedPoints = studentSubs.filter(s => ['Approved', 'Verified', 'Teacher Verified', 'Evaluated', 'Locked'].includes(s.status)).reduce((sum, s) => {
      return sum + getSubmissionPoints(s);
    }, 0);
    const percent = Math.min(100, Math.round((verifiedPoints / 20) * 100)); // Target 20 per student

    // Sort student's submissions descending by date / ID
    const sortedStudentSubs = [...studentSubs].sort((a, b) => {
      const dateA = a.submissionDate || a.submission_date || '';
      const dateB = b.submissionDate || b.submission_date || '';
      if (dateA && dateB && dateA !== dateB) return dateB.localeCompare(dateA);
      return (b.id || 0) - (a.id || 0);
    });

    const recentSub = sortedStudentSubs.length > 0 ? sortedStudentSubs[0] : null;

    let recentDoc = '';
    let recentActivity = '';
    if (recentSub) {
      const docRaw = recentSub.proof || recentSub.proofUrl || (recentSub as any).proof_url || '';
      if (docRaw && isNaN(Number(docRaw)) && docRaw.length > 2) {
        recentDoc = docRaw.split('/').pop() || docRaw;
      } else {
        recentDoc = `Proof_Sub#${recentSub.id}.pdf`;
      }
      const criteriaItem = criteriaCatalog.flatMap((c) => c.items).find((it) => String(it.id) === String(recentSub.criteriaId));
      recentActivity = criteriaItem?.title || recentSub.description || 'Verified Claim';
    }

    // Build category-wise submission counts
    const categoryCountMap: Record<string, { submitted: number; approved: number }> = {};
    studentSubs.forEach(sub => {
      const catEntry = criteriaCatalog.find(c => c.items.some(it => String(it.id) === String(sub.criteriaId)));
      const cat = catEntry ? catEntry.category : ((sub as any).categoryName || (sub as any).category || 'Academics');
      if (!categoryCountMap[cat]) categoryCountMap[cat] = { submitted: 0, approved: 0 };
      categoryCountMap[cat].submitted += 1;
      if (['Approved', 'Verified', 'Teacher Verified', 'Evaluated', 'Locked'].includes(sub.status)) {
        categoryCountMap[cat].approved += 1;
      }
    });
    const categoryBreakdown = Object.entries(categoryCountMap)
      .filter(([, v]) => v.submitted > 0)
      .map(([cat, v]) => ({ category: cat, submitted: v.submitted, approved: v.approved }));

    return {
      id: student.id,
      name: student.name,
      recentDoc: recentDoc || '',
      recentActivity: recentActivity || '-',
      percent,
      lastActivityId: recentSub ? recentSub.id : 0,
      categoryBreakdown,
      totalSubs: studentSubs.length,
      ...getProgressDetails(percent)
    };
  });

  // Sort by most recent activity descending, then alphabetically
  displayProgressStudents.sort((a, b) => {
    if (b.lastActivityId !== a.lastActivityId) {
      return b.lastActivityId - a.lastActivityId;
    }
    return a.name.localeCompare(b.name);
  });

  // If some students have submissions, prioritize showing them first
  const withSubs = displayProgressStudents.filter(s => s.totalSubs > 0);
  displayProgressStudents = withSubs.length > 0 ? withSubs.slice(0, 6) : displayProgressStudents.slice(0, 6);

  // Merge pending submissions with friendly filenames
  const pendingSubs = classSubmissions.filter((s) =>
    ['Student Rep Verified', 'Verified by Student Rep'].includes(s.status)
  );

  const pendingDisplay = Math.max(0, pendingSubs.length - queueIndex).toString();

  const queueList: VerificationDocItem[] = pendingSubs.length > 0
    ? pendingSubs.map((s, idx) => {
      const student = classStudents.find((st) => st.id === s.studentId) || realStudents.find((st) => st.id === s.studentId);
      let nameToDisplay = s.proof && s.proof.includes('.') ? s.proof : `Assignment_Final_v${idx + 2}.pdf`;
      const criteriaItem = criteriaCatalog.flatMap((c) => c.items).find((it) => String(it.id) === String(s.criteriaId));
      const categoryItem = criteriaCatalog.find((c) => c.items.some((it) => String(it.id) === String(s.criteriaId)));
      return {
        id: s.id,
        fileName: nameToDisplay,
        studentName: student ? student.name : ((s as any).user_name || 'Unknown Student'),
        activityTitle: criteriaItem?.title || s.description || 'Verified Claim',
        category: categoryItem?.category || 'Academics',
        description: s.description || 'Verified class evaluation claim submitted with valid institutional proof.',
        marks: getSubmissionPoints(s) || (criteriaItem?.marks || 5),
        date: (s as any).date || '11 Aug 2026, 02:45 PM',
        subId: s.id
      };
    })
    : [];

  const currentQueueDoc = queueList.length > 0 ? queueList[queueIndex % queueList.length] : { id: 0, fileName: 'No Pending Documents', studentName: '-', activityTitle: '-', category: 'N/A' };
  const teacherName = currentUserInfo?.name || 'Prof. Kochumol Abraham';

  // Quick Action Handlers
  const handleQuickApprove = () => {
    if (currentQueueDoc.subId) {
      updateSubmission(currentQueueDoc.subId, {
        status: 'Teacher Verified',
        teacherVerifiedByName: teacherName,
        verifiedByName: teacherName,
        remarks: 'Verified & Approved via Quick Verification Queue'
      });
    }
    showToast(`✓ Approved "${currentQueueDoc.fileName}" for ${currentQueueDoc.studentName}`);
    setQueueIndex((prev) => (prev + 1) % queueList.length);
  };

  // Open Document Preview Modal
  const handleOpenPreview = (doc?: VerificationDocItem) => {
    const target = doc || currentQueueDoc;
    setPreviewModalDoc(target);
    setModalRemarks('');
  };

  // Handle Modal Decision
  const handleModalAction = (status: 'Approved' | 'Rejected' | 'Correction Requested') => {
    if (!previewModalDoc) return;

    if (status === 'Rejected' || status === 'Correction Requested') {
      const textarea = document.getElementById('modal-remarks-textarea') as HTMLTextAreaElement;
      if (textarea && !modalRemarks.trim()) {
        textarea.reportValidity();
        return;
      }
    }

    if (previewModalDoc.isBulk && previewModalDoc.pendingIds) {
      let count = 0;
      previewModalDoc.pendingIds.forEach((id) => {
        const nextStatus = status === 'Approved' ? 'Teacher Verified' : status;
        updateSubmission(id, {
          status: nextStatus,
          teacherVerifiedByName: teacherName,
          verifiedByName: teacherName,
          remarks: modalRemarks || (status === 'Approved' ? 'Verified & Approved by Class Advisor' : status === 'Rejected' ? 'Rejected by Class Advisor' : 'Correction required by Class Advisor')
        });
        count++;
      });

      if (status === 'Approved') showToast(`✓ Bulk Approved ${count} submissions`);
      else if (status === 'Rejected') showToast(`✗ Bulk Rejected ${count} submissions`);
      else showToast(`⚠️ Bulk Correction requested for ${count} submissions`);
    } else if (previewModalDoc.subId) {
      const nextStatus = status === 'Approved' ? 'Teacher Verified' : status;
      updateSubmission(previewModalDoc.subId, {
        status: nextStatus,
        teacherVerifiedByName: teacherName,
        verifiedByName: teacherName,
        remarks: modalRemarks || (status === 'Approved' ? 'Verified & Approved by Class Advisor' : status === 'Rejected' ? 'Rejected by Class Advisor' : 'Correction required by Class Advisor')
      });

      if (status === 'Approved') {
        showToast(`✓ Approved "${previewModalDoc.fileName}" for ${previewModalDoc.studentName}`);
      } else if (status === 'Rejected') {
        showToast(`✗ Rejected "${previewModalDoc.fileName}"`);
      } else {
        showToast(`⚠️ Correction requested for "${previewModalDoc.fileName}"`);
      }
    }

    setPreviewModalDoc(null);
    setQueueIndex(0);
  };

  // Helper to format clean file name
  const formatFileName = (sub: Submission) => {
    if (sub.proof && isNaN(Number(sub.proof)) && sub.proof.length > 2) {
      return sub.proof.endsWith('.pdf') ? sub.proof : `${sub.proof}.pdf`;
    }
    const criteriaItem = criteriaCatalog.flatMap((c) => c.items).find((it) => it.id === sub.criteriaId);
    if (criteriaItem?.title) {
      const cleanTitle = criteriaItem.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 22);
      return `${cleanTitle}_Proof.pdf`;
    }
    return `Institutional_Proof_${sub.id}.pdf`;
  };

  // Helper to format clean activity title
  const formatActivityTitle = (sub: Submission) => {
    const criteriaItem = criteriaCatalog.flatMap((c) => c.items).find((it) => it.id === sub.criteriaId);
    if (criteriaItem?.title) return criteriaItem.title;
    if (sub.description && isNaN(Number(sub.description)) && sub.description.length > 3) {
      return sub.description;
    }
    return 'Academic Excellence Claim';
  };

  // Calculate status counts for filter buttons based on submissions
  const pendingCount = classSubmissions.filter((s) => ['Student Rep Verified', 'Verified by Student Rep'].includes(s.status)).length;
  const completedCount = classSubmissions.filter((s) => ['Approved', 'Verified', 'Teacher Verified', 'Evaluated', 'Locked', 'Correction Requested', 'Rejected'].includes(s.status)).length;
  const allCount = classSubmissions.length;

  // Filtered submissions list for verification desk
  const filteredTeacherSubmissions = classSubmissions.filter((sub) => {
    const student = classStudents.find((st) => st.id === sub.studentId) || realStudents.find((st) => st.id === sub.studentId);
    const studentName = student ? student.name : ((sub as any).user_name || '');
    const studentEmail = student?.email || (sub as any).user_email || (studentName.toLowerCase().replace(/\s+/g, '.') + '@mariancollege.org');
    const activityTitle = formatActivityTitle(sub);

    const matchesSearch =
      studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      studentEmail.toLowerCase().includes(studentSearch.toLowerCase()) ||
      activityTitle.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (sub.description || '').toLowerCase().includes(studentSearch.toLowerCase());

    const isPending = ['Student Rep Verified', 'Verified by Student Rep'].includes(sub.status);
    const isCompleted = ['Approved', 'Verified', 'Teacher Verified', 'Evaluated', 'Locked', 'Correction Requested', 'Rejected'].includes(sub.status);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && isPending) ||
      (statusFilter === 'completed' && isCompleted);

    const categoryItem = criteriaCatalog.find((c) => c.items.some((it) => it.id === sub.criteriaId));
    const matchesCategory =
      selectedCategoryFilter === 'all' || (categoryItem?.category === selectedCategoryFilter);

    return matchesSearch && matchesStatus && matchesCategory;
  }).sort((a, b) => b.id - a.id);

  const totalVerificationPages = Math.ceil(filteredTeacherSubmissions.length / verificationPageSize) || 1;
  const paginatedTeacherSubmissions = filteredTeacherSubmissions.slice(
    (verificationPage - 1) * verificationPageSize,
    verificationPage * verificationPageSize
  );

  // ----------------------------------------------------
  // BULK SELECTION & APPROVAL ACTIONS
  // ----------------------------------------------------
  const handleToggleSelectSubmission = (subId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const handleToggleSelectAll = () => {
    const visiblePendingIds = paginatedTeacherSubmissions
      .filter((s) => ['Student Rep Verified', 'Verified by Student Rep'].includes(s.status))
      .map((s) => s.id);
    if (visiblePendingIds.length === 0) return;
    const allSelected = visiblePendingIds.every((id) => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !visiblePendingIds.includes(id)));
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...visiblePendingIds])));
    }
  };

  const handleSelectAllPending = () => {
    const pendingIds = filteredTeacherSubmissions
      .filter((s) => ['Student Rep Verified', 'Verified by Student Rep'].includes(s.status))
      .map((s) => s.id);
    setSelectedStudentIds(pendingIds);
    showToast(`Selected ${pendingIds.length} pending submission(s).`);
  };

  const handleBulkApproveSelected = () => {
    if (!evaluationOpen) {
      toast.error('Evaluation access is currently CLOSED by system administrator.');
      return;
    }
    if (selectedStudentIds.length === 0) return;

    let totalApproved = 0;
    selectedStudentIds.forEach((subId) => {
      const sub = classSubmissions.find((s) => s.id === subId);
      if (sub && ['Student Rep Verified', 'Verified by Student Rep'].includes(sub.status)) {
        updateSubmission(subId, {
          status: 'Teacher Verified',
          teacherVerifiedByName: teacherName,
          teacherRemarks: 'Bulk Approved by Class Advisor',
          remarks: 'Verified & Approved by Class Advisor'
        });
        totalApproved++;
      }
    });

    if (totalApproved > 0) {
      showToast(`Successfully verified & approved ${totalApproved} submissions.`);
    } else {
      showToast(`Selected items have no pending submissions to approve.`);
    }
    setSelectedStudentIds([]);
  };





  return (
    <div style={{ position: 'relative', minHeight: '85vh' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '14px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
            fontSize: '0.9rem',
            fontWeight: 600,
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* POPUP MODAL: SUBMISSION DETAILS & VERIFICATION       */}
      {/* ---------------------------------------------------- */}
      {previewModalDoc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '20px',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => setPreviewModalDoc(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '620px',
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
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>Review document and record evaluation decision</p>
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
            <div style={{ padding: '24px 26px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Document Banner Box */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase'
                    }}
                  >
                    PDF
                  </div>
                  <div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                      {previewModalDoc.fileName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      Submitted {previewModalDoc.date || '11 Aug 2026'} • Institutional Proof
                    </div>
                  </div>
                </div>

                {previewModalDoc.isBulk ? (
                  <div
                    style={{
                      background: '#f1f5f9',
                      color: '#64748b',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    Multiple Files
                  </div>
                ) : (
                  <a
                    href={`/Assets/Proofs/${previewModalDoc.fileName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#ffffff',
                      color: '#4338ca',
                      border: '1px solid #c7d2fe',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                  >
                    <span>Open File</span>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}
              </div>

              {/* Metadata Details Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '14px',
                  background: '#ffffff',
                  border: '1px solid #f1f5f9',
                  borderRadius: '16px',
                  padding: '16px'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Student
                  </span>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {previewModalDoc.studentName}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Assigned Class
                  </span>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {teacherClass || 'Assigned Class'}
                  </div>
                </div>

                {!previewModalDoc.isBulk && (
                  <>
                    <div>
                      <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                        Category
                      </span>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#047857', marginTop: '2px' }}>
                        {previewModalDoc.category}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                        Claimed Points
                      </span>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                        +{previewModalDoc.marks ?? 10} Points
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Activity Description */}
              {!previewModalDoc.isBulk && (
                <div>
                  <span style={{ fontSize: '0.76rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Activity / Description
                  </span>
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      fontSize: '0.88rem',
                      color: '#334155',
                      marginTop: '6px',
                      border: '1px solid #f1f5f9'
                    }}
                  >
                    <strong style={{ color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                      {previewModalDoc.activityTitle}
                    </strong>
                    {previewModalDoc.description || 'Valid institutional proof submitted for evaluation.'}
                  </div>
                </div>
              )}

              {/* Feedback / Remarks input */}
              <div>
                <label style={{ fontSize: '0.76rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Remarks / Feedback (Optional)
                </label>
                <textarea
                  id="modal-remarks-textarea"
                  required
                  className="input"
                  rows={2}
                  placeholder="Enter remarks or correction instructions..."
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
                    background: '#047857',
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
                    boxShadow: '0 2px 8px rgba(4, 120, 87, 0.25)',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>✓</span> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* ---------------------------------------------------- */}
        {/* TAB 1: TEACHER DASHBOARD                            */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Header / Assigned Class Overview Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #1e293b 100%)',
                borderRadius: '24px',
                padding: '28px 32px',
                color: '#ffffff',
                boxShadow: '0 10px 30px rgba(30, 27, 75, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '24px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Background ambient glow circles */}
              <div style={{
                position: 'absolute',
                top: '-40px',
                right: '180px',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              {/* Left Column: Class Info & Metadata */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 1, maxWidth: '680px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(8px)',
                    color: '#e0e7ff',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    Assigned Class Overview
                  </span>
                  <span style={{
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    color: '#a5b4fc'
                  }}>
                    {teacherDepartment}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                  <h1 style={{
                    fontSize: '2.4rem',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    margin: 0,
                    color: '#ffffff',
                    lineHeight: 1.1
                  }}>
                    {teacherClass || 'Assigned Class'}
                  </h1>
                  {classRank && (
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: classRank <= 3 ? '#fbbf24' : '#93c5fd',
                      background: classRank <= 3 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                      padding: '4px 14px',
                      borderRadius: '16px',
                      border: `1px solid ${classRank <= 3 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span>{classRank === 1 ? '🥇' : classRank === 2 ? '🥈' : classRank === 3 ? '🥉' : '🏆'}</span>
                      <span>College Rank #{classRank}</span>
                    </span>
                  )}
                </div>

                {/* Metadata Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '6px', fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c7d2fe' }}>
                    <span>👥</span>
                    <span>Enrolled: <strong>{classN} Students</strong></span>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>•</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c7d2fe' }}>
                    <span>👨‍🏫</span>
                    <span>Advisor: <strong>{advisorName}</strong></span>
                  </div>
                  {dqcRepName && (
                    <>
                      <span style={{ color: 'rgba(255,255,255,0.25)' }}>•</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c7d2fe' }}>
                        <span>🛡️</span>
                        <span>DQC Rep: <strong>{dqcRepName}</strong></span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right Column: Formula M Index Card */}
              <div
                style={{
                  zIndex: 1,
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '18px',
                  padding: '16px 24px',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px'
                }}
                title={scoreHoverOnlyText}
              >
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Formula M Index
                  </div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#ffffff', marginTop: '2px', lineHeight: 1 }}>
                    {moderatedM.toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginTop: '4px' }}>
                    Evaluated S: {classS.toFixed(0)} pts
                  </div>
                </div>

                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                  }}
                >
                  ⚖️
                </div>
              </div>
            </div>

            {/* Four KPI Cards Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: '18px'
              }}
            >
              {/* Card 1: TOTAL SUBMISSIONS */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  padding: '24px 26px',
                  border: '1px solid rgba(0,0,0,0.05)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '140px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Total Submissions
                  </span>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#1e293b',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                      <line x1="8" y1="6" x2="16" y2="16" />
                      <line x1="8" y1="10" x2="16" y2="10" />
                      <line x1="8" y1="14" x2="12" y2="14" />
                    </svg>
                  </div>
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', marginTop: '14px', lineHeight: 1 }}>
                  {totalSubmissionsDisplay}
                </div>
              </div>

              {/* Card 2: VERIFIED */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  padding: '24px 26px',
                  border: '1px solid rgba(0,0,0,0.05)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '140px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Verified
                  </span>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#ecfdf5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="9 12 11 14 15 10" />
                    </svg>
                  </div>
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', marginTop: '14px', lineHeight: 1 }}>
                  {verifiedDisplay}
                </div>
              </div>

              {/* Card 3: PENDING REVIEW */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  padding: '24px 26px',
                  border: '1px solid rgba(0,0,0,0.05)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '140px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Pending Review
                  </span>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#7c3aed'
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 22h14" />
                      <path d="M5 2h14" />
                      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                    </svg>
                  </div>
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', marginTop: '14px', lineHeight: 1 }}>
                  {pendingDisplay}
                </div>
              </div>

              {/* Card 4: TOTAL SCORE (MODERATED M INDEX) */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  padding: '24px 26px',
                  border: '1.5px solid rgba(124, 58, 237, 0.15)',
                  boxShadow: isScoreHovered ? '0 10px 30px rgba(124, 58, 237, 0.12)' : '0 4px 20px rgba(124, 58, 237, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '140px',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                title={scoreHoverOnlyText}
                onMouseEnter={() => setIsScoreHovered(true)}
                onMouseLeave={() => setIsScoreHovered(false)}
              >
                {/* Floating Tooltip Box on Hover: Showing ONLY S, P, and M */}
                {isScoreHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 10px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#0f172a',
                      color: '#ffffff',
                      padding: '12px 18px',
                      borderRadius: '14px',
                      boxShadow: '0 14px 35px rgba(15, 23, 42, 0.3)',
                      zIndex: 100,
                      minWidth: '240px',
                      pointerEvents: 'none',
                      fontSize: '0.82rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.12)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
                      <span style={{ color: '#94a3b8', fontWeight: 600 }}>S (Evaluated Marks)</span>
                      <span style={{ fontWeight: 800, color: '#34d399', fontSize: '0.9rem' }}>{sFormatted}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
                      <span style={{ color: '#94a3b8', fontWeight: 600 }}>P (Penalty)</span>
                      <span style={{ fontWeight: 800, color: '#f87171', fontSize: '0.9rem' }}>{pFormatted}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '6px', marginTop: '2px' }}>
                      <span style={{ color: '#c4b5fd', fontWeight: 700 }}>M (Index)</span>
                      <span style={{ fontWeight: 900, color: '#a78bfa', fontSize: '0.95rem' }}>{mFormatted}</span>
                    </div>
                    {/* Tooltip pointer arrow */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-6px',
                        left: '50%',
                        transform: 'translateX(-50%) rotate(45deg)',
                        width: '12px',
                        height: '12px',
                        background: '#0f172a',
                        borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
                      }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Total Score
                  </span>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: '#5b21b6',
                    background: '#ede9fe',
                    padding: '3px 9px',
                    borderRadius: '8px',
                    border: '1px solid #ddd6fe',
                    letterSpacing: '0.02em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>⚖️</span>
                    <span>M (Index)</span>
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span>{moderatedM.toFixed(4)}</span>
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#6d28d9' }}>M</span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600, marginTop: '5px' }}>
                      {classRank ? (
                        <span style={{ color: classRank <= 3 ? '#b45309' : '#1d4ed8', fontWeight: 700 }}>
                          {classRank === 1 ? '🥇 Rank #1 in College' : classRank === 2 ? '🥈 Rank #2 in College' : classRank === 3 ? '🥉 Rank #3 in College' : `Rank #${classRank} in College`}
                        </span>
                      ) : (
                        <span>Formula M Applied</span>
                      )}
                      <span style={{ margin: '0 4px', color: '#cbd5e1' }}>•</span>
                      <span>Raw S: {classS.toFixed(0)} pts</span>
                    </div>
                  </div>
                  {/* Circular Rank / Moderation Badge */}
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      border: classRank && classRank <= 3 ? '3.5px solid #f59e0b' : '3.5px solid #7c3aed',
                      background: classRank && classRank <= 3 ? '#fffbeb' : '#f5f3ff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: classRank && classRank <= 3 ? '#b45309' : '#6d28d9',
                      fontWeight: 800,
                      fontSize: classRank ? (classRank <= 3 ? '1.1rem' : '0.92rem') : '1rem',
                      boxShadow: '0 4px 12px rgba(124, 58, 237, 0.12)'
                    }}
                    title={scoreHoverOnlyText}
                  >
                    {classRank ? (classRank === 1 ? '🥇' : classRank === 2 ? '🥈' : classRank === 3 ? '🥉' : `#${classRank}`) : 'M'}
                  </div>
                </div>
              </div>
            </div>

            {/* Lower Section Grid (2 Columns: Recent Student Progress + Verification Queue) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.25fr 1fr',
                gap: '24px',
                alignItems: 'start'
              }}
            >
              {/* Left Column: Recent Student Progress */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  padding: '28px 30px',
                  border: '1px solid rgba(0,0,0,0.05)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                      Recent Student Progress
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      Click on recent submitted document to view verification details
                    </p>
                  </div>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#4f46e5',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '8px'
                    }}
                    onClick={() => {
                      setStudentSearch('');
                      setStatusFilter('all');
                      setActivePage('verification');
                      router.push('/teacher/verification?status=all');
                    }}
                  >
                    View All
                  </button>
                </div>



                {/* Student Progress List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {displayProgressStudents.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setStudentSearch(s.name);
                        setStatusFilter('all');
                        setActivePage('verification');
                        router.push(`/teacher/verification?search=${encodeURIComponent(s.name)}&status=all`);
                      }}
                      title="Click to view all submissions by this student"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        padding: '14px 16px',
                        borderRadius: '14px',
                        border: '1px solid #f1f5f9',
                        background: '#fafafa',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f0f4ff';
                        e.currentTarget.style.borderColor = '#c7d2fe';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fafafa';
                        e.currentTarget.style.borderColor = '#f1f5f9';
                      }}
                    >
                      {/* Row 1: Name + overall progress + status badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Avatar circle */}
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                          background: s.badgeBg, color: s.badgeColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '0.9rem'
                        }}>
                          {s.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Name and Recent Document info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a' }}>{s.name}</div>
                          {s.recentDoc ? (
                            <div style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', overflow: 'hidden' }}>
                              <span style={{ color: '#4f46e5', fontSize: '0.8rem' }}>📄</span>
                              <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }} title={s.recentDoc}>
                                {s.recentDoc}
                              </span>
                              {s.recentActivity && s.recentActivity !== '-' && (
                                <span style={{ color: '#94a3b8', fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  • {s.recentActivity}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
                              No submissions yet
                            </div>
                          )}
                        </div>

                        {/* Percent label */}
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: s.color, flexShrink: 0 }}>
                          {s.percent}%
                        </span>

                        {/* Status badge */}
                        <span style={{
                          background: s.badgeBg, color: s.badgeColor,
                          padding: '3px 12px', borderRadius: '9999px',
                          fontSize: '0.74rem', fontWeight: 700, flexShrink: 0
                        }}>
                          {s.status}
                        </span>
                      </div>

                      {/* Row 2: overall progress bar */}
                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${s.percent}%`,
                          background: `linear-gradient(90deg, ${s.color}cc, ${s.color})`,
                          borderRadius: '9999px',
                          transition: 'width 0.6s ease'
                        }} />
                      </div>

                      {/* Row 3: category-wise submission chips */}
                      {s.categoryBreakdown.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                          {s.categoryBreakdown.map(({ category, submitted, approved }) => {
                            const chip = categoryChipColors[category] || { bg: '#f1f5f9', color: '#475569' };
                            return (
                              <span
                                key={category}
                                title={`${approved} approved / ${submitted} submitted`}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                                  background: chip.bg, color: chip.color,
                                  padding: '3px 10px', borderRadius: '9999px',
                                  fontSize: '0.72rem', fontWeight: 700,
                                  border: `1px solid ${chip.color}22`,
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <span>{category}</span>
                                <span style={{
                                  background: chip.color, color: '#fff',
                                  borderRadius: '9999px', padding: '1px 6px',
                                  fontSize: '0.68rem', fontWeight: 800
                                }}>
                                  {approved}/{submitted}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          No category submissions yet
                        </div>
                      )}
                    </div>
                  ))}

                  {displayProgressStudents.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      background: '#f8fafc',
                      borderRadius: '16px',
                      border: '1px dashed #cbd5e1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{ fontSize: '2rem' }}>📂</div>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.96rem' }}>
                        No Student Activity Yet
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '320px' }}>
                        Submissions from students in {teacherClass || 'your assigned class'} will show up here automatically.
                      </div>
                    </div>
                  )}
                </div>


              </div>

              {/* Right Column: Verification Queue */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  padding: '28px 30px',
                  border: '1px solid rgba(0,0,0,0.05)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                    Verification Queue
                  </h2>
                  <p style={{ fontSize: '0.86rem', color: '#64748b', marginTop: '3px' }}>
                    {queueList.length} documents awaiting review
                  </p>
                </div>

                {/* Pending submissions list */}
                {queueList.length === 0 ? (
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '14px',
                    padding: '32px 20px',
                    textAlign: 'center',
                    border: '1.5px dashed #e2e8f0'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.94rem' }}>All clear!</div>
                    <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '3px' }}>No pending submissions to review.</div>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0px',
                    maxHeight: '320px',
                    overflowY: 'auto',
                    borderRadius: '14px',
                    border: '1px solid #f1f5f9'
                  }}>
                    {queueList.map((doc, idx) => {
                      const chip = categoryChipColors[doc.category] || { bg: '#f1f5f9', color: '#475569' };
                      return (
                        <div
                          key={doc.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 14px',
                            borderBottom: idx < queueList.length - 1 ? '1px solid #f1f5f9' : 'none',
                            background: '#ffffff',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                        >
                          {/* Index number */}
                          <span style={{
                            width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                            background: '#f1f5f9', color: '#64748b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.72rem', fontWeight: 700
                          }}>
                            {idx + 1}
                          </span>

                          {/* Student name + category */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '0.88rem', fontWeight: 700, color: '#0f172a',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                            }}>
                              {doc.studentName}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                              <span style={{
                                background: chip.bg, color: chip.color,
                                padding: '1px 8px', borderRadius: '9999px',
                                fontSize: '0.7rem', fontWeight: 700
                              }}>
                                {doc.category}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                {doc.activityTitle.length > 28 ? doc.activityTitle.substring(0, 28) + '…' : doc.activityTitle}
                              </span>
                            </div>
                          </div>

                          {/* Points */}
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857', flexShrink: 0 }}>
                            +{doc.marks ?? 5} pts
                          </span>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenPreview(doc); }}
                              title="Preview & decide"
                              style={{
                                background: '#e0e7ff', color: '#4338ca',
                                border: 'none', borderRadius: '8px',
                                padding: '5px 10px', fontSize: '0.76rem', fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Review
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (doc.subId) {
                                  updateSubmission(doc.subId, {
                                    status: 'Teacher Verified',
                                    teacherVerifiedByName: teacherName,
                                    verifiedByName: teacherName,
                                    remarks: 'Approved via Quick Queue'
                                  });
                                  showToast(`✓ Approved submission for ${doc.studentName}`);
                                }
                              }}
                              title="Quick approve"
                              style={{
                                background: '#dcfce7', color: '#15803d',
                                border: 'none', borderRadius: '8px',
                                padding: '5px 10px', fontSize: '0.76rem', fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              ✓
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}


              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: VERIFICATION DESK                            */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'verification' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>Verification Desk</h1>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                Select students to bulk approve or click individual rows to inspect submissions.
              </p>
            </div>

            {/* Filter Section: Search, Status Toggle Buttons, Category Dropdown */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '22px 28px',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                display: 'grid',
                gridTemplateColumns: '1.4fr 1.6fr 1fr',
                gap: '18px',
                alignItems: 'flex-end'
              }}
            >
              {/* 1. Search */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', color: '#475569' }}>Search Students</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Search name or email..."
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setVerificationPage(1);
                  }}
                  style={{ borderRadius: '12px', padding: '10px 14px' }}
                />
              </div>

              {/* 2. Status Buttons: Pending Reviews, Completed, All */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#475569' }}>Filter Status</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('pending');
                      setVerificationPage(1);
                    }}
                    style={{
                      flex: 1.1,
                      padding: '10px 12px',
                      borderRadius: '12px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: statusFilter === 'pending' ? 'none' : '1px solid #e2e8f0',
                      background: statusFilter === 'pending' ? '#047857' : '#f8fafc',
                      color: statusFilter === 'pending' ? '#ffffff' : '#475569',
                      boxShadow: statusFilter === 'pending' ? '0 2px 8px rgba(4, 120, 87, 0.25)' : 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>Pending Reviews</span>
                    <span
                      style={{
                        padding: '1px 7px',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: statusFilter === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                        color: statusFilter === 'pending' ? '#ffffff' : '#475569'
                      }}
                    >
                      {pendingCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('completed');
                      setVerificationPage(1);
                    }}
                    style={{
                      flex: 0.95,
                      padding: '10px 12px',
                      borderRadius: '12px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: statusFilter === 'completed' ? 'none' : '1px solid #e2e8f0',
                      background: statusFilter === 'completed' ? '#047857' : '#f8fafc',
                      color: statusFilter === 'completed' ? '#ffffff' : '#475569',
                      boxShadow: statusFilter === 'completed' ? '0 2px 8px rgba(4, 120, 87, 0.25)' : 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>Completed</span>
                    <span
                      style={{
                        padding: '1px 7px',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: statusFilter === 'completed' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                        color: statusFilter === 'completed' ? '#ffffff' : '#475569'
                      }}
                    >
                      {completedCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('all');
                      setVerificationPage(1);
                    }}
                    style={{
                      flex: 0.7,
                      padding: '10px 12px',
                      borderRadius: '12px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: statusFilter === 'all' ? 'none' : '1px solid #e2e8f0',
                      background: statusFilter === 'all' ? '#047857' : '#f8fafc',
                      color: statusFilter === 'all' ? '#ffffff' : '#475569',
                      boxShadow: statusFilter === 'all' ? '0 2px 8px rgba(4, 120, 87, 0.25)' : 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>All</span>
                    <span
                      style={{
                        padding: '1px 7px',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: statusFilter === 'all' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                        color: statusFilter === 'all' ? '#ffffff' : '#475569'
                      }}
                    >
                      {allCount}
                    </span>
                  </button>
                </div>
              </div>

              {/* 3. Category Dropdown */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', color: '#475569' }}>Filter Category</label>
                <select
                  className="select"
                  value={selectedCategoryFilter}
                  onChange={(e) => {
                    setSelectedCategoryFilter(e.target.value);
                    setVerificationPage(1);
                  }}
                  style={{ borderRadius: '12px', padding: '10px 14px' }}
                >
                  <option value="all">All Categories</option>
                  <option value="Academics">Academics</option>
                  <option value="Online Courses">Online Courses</option>
                  <option value="Internships">Internships</option>
                  <option value="Competitive Exams">Competitive Exams</option>
                  <option value="Scholarships">Scholarships</option>
                  <option value="Research">Research</option>
                  <option value="Prizes">Prizes</option>
                  <option value="Leadership">Leadership</option>
                  <option value="Programs Organized">Programs Organized</option>
                  <option value="Social Responsibility">Social Responsibility</option>
                  <option value="Career Advancement">Career Advancement</option>
                  <option value="Documentation">Documentation</option>
                </select>
              </div>
            </div>

            {/* Floating Selection Banner when items are checked */}
            {selectedStudentIds.length > 0 && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #047857, #065f46)',
                  color: '#ffffff',
                  padding: '14px 24px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  boxShadow: '0 6px 24px rgba(4, 120, 87, 0.28)',
                  animation: 'fadeIn 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800
                    }}
                  >
                    ✓
                  </span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>
                      {selectedStudentIds.length} student(s) selected
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                      Approve all pending document submissions for the selected students in a single action.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => setSelectedStudentIds([])}
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={handleBulkApproveSelected}
                    style={{
                      background: '#ffffff',
                      color: '#047857',
                      border: 'none',
                      padding: '9px 20px',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    <span>✓</span> Approve Selected
                  </button>
                </div>
              </div>
            )}

            {/* Student Table */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '24px 28px',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
              }}
            >
              <div className="table-container">
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '42px', padding: '12px 12px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={
                            paginatedTeacherSubmissions.some((s) => ['Student Rep Verified', 'Verified by Student Rep'].includes(s.status)) &&
                            paginatedTeacherSubmissions.filter((s) => ['Student Rep Verified', 'Verified by Student Rep'].includes(s.status)).every((s) => selectedStudentIds.includes(s.id))
                          }
                          onChange={handleToggleSelectAll}
                          style={{
                            width: '17px',
                            height: '17px',
                            cursor: 'pointer',
                            accentColor: '#047857',
                            borderRadius: '4px'
                          }}
                          title="Select all visible submissions on this page"
                        />
                      </th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: '0.82rem' }}>Student</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: '0.82rem' }}>Category</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: '0.82rem' }}>Item</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: '0.82rem' }}>Proof File</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: '0.82rem' }}>Status</th>
                      <th style={{ textAlign: 'right', padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: '0.82rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTeacherSubmissions.map((sub) => {
                      const studentObj = classStudents.find((s) => s.id === sub.studentId) || realStudents.find((st) => st.id === sub.studentId);
                      const displayName = studentObj ? studentObj.name : ((sub as any).user_name || `Student #${sub.studentId}`);
                      const displayClass = studentObj?.className || teacherClass;

                      const item = criteriaCatalog.flatMap((c) => c.items).find((i) => i.id === sub.criteriaId);
                      const cat = criteriaCatalog.find((c) => c.items.some((i) => i.id === sub.criteriaId));
                      const isDriveUrl = sub.proof?.startsWith('http://') || sub.proof?.startsWith('https://');
                      const isEventId = sub.eventId || sub.proof?.startsWith('Event ID:');
                      const displayEventId = sub.eventId || (sub.proof?.startsWith('Event ID:') ? sub.proof.replace('Event ID: ', '') : sub.proof);
                      const isChecked = selectedStudentIds.includes(sub.id);

                      const canVerify = ['Student Rep Verified', 'Verified by Student Rep'].includes(sub.status);

                      const getStatusBadgeStyle = (st: string) => {
                        if (['Approved', 'Verified', 'Teacher Verified', 'Evaluated', 'Locked'].includes(st)) {
                          return { bg: '#dcfce7', color: '#15803d', label: st === 'Teacher Verified' ? 'Teacher Verified' : 'Approved' };
                        }
                        if (st === 'Rejected') {
                          return { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' };
                        }
                        if (st === 'Correction Requested') {
                          return { bg: '#fef3c7', color: '#b45309', label: 'Correction Required' };
                        }
                        return { bg: '#ede9fe', color: '#6366f1', label: 'Pending Review' };
                      };

                      const statusStyle = getStatusBadgeStyle(sub.status);

                      return (
                        <tr
                          key={sub.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            background: isChecked ? '#ecfdf5' : 'transparent',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <td style={{ width: '42px', padding: '14px 12px', textAlign: 'center' }}>
                            {canVerify && (
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleSelectSubmission(sub.id)}
                                style={{
                                  width: '17px',
                                  height: '17px',
                                  cursor: 'pointer',
                                  accentColor: '#047857',
                                  borderRadius: '4px'
                                }}
                              />
                            )}
                          </td>
                          <td style={{ fontWeight: 700, padding: '14px 16px', color: '#0f172a' }}>
                            {displayName}
                            <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 500 }}>{displayClass}</div>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#0f172a', fontWeight: 600, fontSize: '0.9rem' }}>
                            {cat?.category || 'General'}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#475569', fontSize: '0.86rem' }}>
                            {sub.evidence?.submissionType ? (
                              <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '4px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.76rem' }}>
                                📊 {sub.evidence.submissionType}
                              </span>
                            ) : (
                              item?.title || 'Activity'
                            )}
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', maxWidth: '220px' }}>
                              {(sub.startDate || sub.evidence?.startDate || sub.evidence?.examDate) && (
                                <div style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span>📅</span> {sub.startDate || sub.evidence?.startDate || sub.evidence?.examDate}
                                  {(sub.endDate || sub.evidence?.endDate) ? ` to ${sub.endDate || sub.evidence?.endDate}` : ''}
                                </div>
                              )}
                              {sub.description || 'No additional description.'}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {isEventId ? (
                              <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', border: '1px solid #bfdbfe' }}>
                                🎫 Event ID: {displayEventId}
                              </span>
                            ) : sub.proof ? (
                              <a
                                href={isDriveUrl ? sub.proof : `/Assets/Proofs/${sub.proof}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#4f46e5', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '0.86rem' }}
                                title="Open Proof Document"
                              >
                                📁 {sub.proof.length > 18 ? sub.proof.substring(0, 18) + '...' : sub.proof}
                              </a>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>-</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '4px 12px', borderRadius: '9999px', fontSize: '0.76rem', fontWeight: 700 }}>
                              {statusStyle.label}
                            </span>
                            {sub.repRemarks && (
                              <div style={{ fontSize: '0.74rem', color: '#64748b', fontStyle: 'italic', marginTop: '4px', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', border: '1px dashed #e2e8f0', maxWidth: '160px' }}>
                                💬 Rep: {sub.repRemarks}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            {canVerify ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <input
                                  id={`teacher-remarks-${sub.id}`}
                                  type="text"
                                  placeholder="Add remarks (required for Correction/Reject)..."
                                  value={submissionRemarksMap[sub.id] || ''}
                                  onChange={(e) => setSubmissionRemarksMap((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                                  required
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.82rem',
                                    outline: 'none',
                                    background: '#ffffff',
                                    minWidth: '220px'
                                  }}
                                />
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                  <button
                                    onClick={() => {
                                      const teacherRemarks = submissionRemarksMap[sub.id] || 'Verified & Approved by Class Advisor';
                                      updateSubmission(sub.id, {
                                        status: 'Teacher Verified',
                                        teacherVerifiedByName: teacherName,
                                        teacherRemarks,
                                        remarks: teacherRemarks
                                      });
                                    }}
                                    style={{ background: '#047857', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 6px rgba(4, 120, 87, 0.2)' }}
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      const inputEl = document.getElementById(`teacher-remarks-${sub.id}`) as HTMLInputElement;
                                      const teacherRemarks = submissionRemarksMap[sub.id]?.trim();
                                      if (!teacherRemarks) {
                                        inputEl?.reportValidity();
                                        return;
                                      }
                                      updateSubmission(sub.id, {
                                        status: 'Correction Requested',
                                        teacherVerifiedByName: teacherName,
                                        teacherRemarks,
                                        remarks: teacherRemarks
                                      });
                                    }}
                                    style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Correction
                                  </button>
                                  <button
                                    onClick={() => {
                                      const inputEl = document.getElementById(`teacher-remarks-${sub.id}`) as HTMLInputElement;
                                      const teacherRemarks = submissionRemarksMap[sub.id]?.trim();
                                      if (!teacherRemarks) {
                                        inputEl?.reportValidity();
                                        return;
                                      }
                                      updateSubmission(sub.id, {
                                        status: 'Rejected',
                                        teacherVerifiedByName: teacherName,
                                        teacherRemarks,
                                        remarks: teacherRemarks
                                      });
                                    }}
                                    style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                <span style={{ color: ['Approved', 'Verified', 'Teacher Verified', 'Evaluated', 'Locked'].includes(sub.status) ? '#16a34a' : '#1e40af' }}>
                                  {sub.status === 'Approved' ? '✓ Evaluated' : sub.status === 'Teacher Verified' ? '✓ Teacher Verified' : 'Reviewed'}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {paginatedTeacherSubmissions.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                          <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>🔍</div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>No submissions found</div>
                          <div style={{ fontSize: '0.82rem', marginTop: '2px' }}>
                            No submissions match the current status and category filters.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="pagination-container" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <button
                  className="pagination-btn"
                  disabled={verificationPage <= 1}
                  onClick={() => setVerificationPage((p) => Math.max(1, p - 1))}
                  style={{ borderRadius: '8px', padding: '6px 14px' }}
                >
                  Prev
                </button>
                {Array.from({ length: totalVerificationPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`pagination-num ${verificationPage === pageNum ? 'active' : ''}`}
                    onClick={() => setVerificationPage(pageNum)}
                    style={{ borderRadius: '8px', width: '34px', height: '34px' }}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  className="pagination-btn"
                  disabled={verificationPage >= totalVerificationPages}
                  onClick={() => setVerificationPage((p) => Math.min(totalVerificationPages, p + 1))}
                  style={{ borderRadius: '8px', padding: '6px 14px' }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}



        {/* ---------------------------------------------------- */}
        {/* TAB 4: MY PROFILE                                   */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>My Profile</h1>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                View your personal teacher profile details derived from your official institutional account.
              </p>
            </div>

            <div
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                padding: '36px 40px',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px'
              }}
            >
              <div
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #047857, #065f46)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 14px rgba(4, 120, 87, 0.25)',
                  overflow: 'hidden'
                }}
              >
                {currentUserInfo?.picture ? (
                  <img
                    src={currentUserInfo.picture}
                    alt={currentUserInfo.name || 'Profile'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span>{(currentUserInfo?.name || currentUserInfo?.email || '?').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>
                  {currentUserInfo?.name || 'Prof. Kochumol Abraham'}
                </h2>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
                  {currentUserInfo?.email || 'kochumol.abraham@mariancollege.org'}
                </p>
              </div>

              <div style={{ width: '100%', height: '1px', background: '#f1f5f9', margin: '8px 0' }} />

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Role</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#047857', background: '#d1fae5', padding: '4px 12px', borderRadius: '9999px' }}>
                    Class Teacher
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Department</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                    {teacherDepartment}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Assigned Class</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                    {teacherClass || 'Assigned Class'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

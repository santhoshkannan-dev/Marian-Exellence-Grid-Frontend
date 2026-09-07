'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Submission, CriteriaItem } from '@/data/initialData';
import { toast } from 'react-toastify';
import { CustomModal } from '@/components/CustomModal';

interface StudentWorkspaceProps {
  view?: 'dashboard' | 'submit' | 'submissions' | 'verification' | 'profile';
}

const matchCategory = (c: any, val: any) => {
  if (!c || val === undefined || val === null) return false;
  const sVal = String(val).toLowerCase().trim();
  const sId = String(c.id || '').toLowerCase().trim();
  const sCode = String(c.code || '').toLowerCase().trim();
  const sName = String(c.category || '').toLowerCase().trim();
  return sVal === sId || sVal === sCode || sVal === sName;
};

const matchItem = (item: any, val: any) => {
  if (!item || val === undefined || val === null) return false;
  const sVal = String(val).toLowerCase().trim();
  const sId = String(item.id || '').toLowerCase().trim();
  const sTitle = String(item.title || '').toLowerCase().trim();
  return sVal === sId || sVal === sTitle;
};

export const StudentWorkspace: React.FC<StudentWorkspaceProps> = ({ view }) => {
  const router = useRouter();
  const [deleteSubIdModal, setDeleteSubIdModal] = useState<number | null>(null);
  const {
    submissions,
    fetchSubmissions,
    criteriaCatalog,
    submissionOpen,
    submissionWindowStart,
    submissionWindowEnd,
    addSubmission,
    updateSubmission,
    deleteSubmission,
    currentUserId,
    currentStudentId,
    students,
    users,
    activePage,
    setActivePage,
    isStudentRep,
    currentUserInfo,
    updateUserProfile,
    editingSubId,
    setEditingSubId
  } = useApp();

  const activeTab = view || activePage || 'dashboard';

  // Auto-fetch latest class submissions from backend when verification or submissions tab is active
  React.useEffect(() => {
    if (activeTab === 'verification' || activeTab === 'submissions') {
      fetchSubmissions();
    }
  }, [activeTab]);

  // Filter available categories based on role access (Normal Student: 10 student categories; Student Rep / DQC: All categories)
  const availableCriteriaCatalog = React.useMemo(() => {
    if (isStudentRep) {
      return criteriaCatalog;
    }

    // Normal students get student-level categories (excluding Academics, Documentation & Programs Organized / class-wide audit categories)
    return criteriaCatalog.filter((cat) => {
      const name = String(cat.category || '').toLowerCase().trim();
      const code = String(cat.code || '').toLowerCase().trim();
      const id = String(cat.id || '').toLowerCase().trim();

      const isRestrictedForNormalStudent =
        name === 'academics' ||
        code === 'cat-academics' ||
        id === 'cat-academics' ||
        id === '1' ||
        name === 'documentation' ||
        code === 'cat-documentation' ||
        id === 'cat-documentation' ||
        id === '12' ||
        name === 'programs organized' ||
        code === 'cat-programs-organized' ||
        id === 'cat-programs-organized' ||
        id === '9' ||
        id === '900' ||
        id === 'cat-9';

      return !isRestrictedForNormalStudent;
    });
  }, [criteriaCatalog, isStudentRep]);

  const { activeAcademicYear } = useApp();

  // Form State for Submit Activity
  const [selectedCategory, setSelectedCategory] = useState(availableCriteriaCatalog[0]?.id || 'cat-online-courses');
  const [selectedCriteriaId, setSelectedCriteriaId] = useState<number>(availableCriteriaCatalog[0]?.items[0]?.id || 201);

  const currentCategory = React.useMemo(() => {
    if (!availableCriteriaCatalog || availableCriteriaCatalog.length === 0) return null;
    return availableCriteriaCatalog.find((c) => matchCategory(c, selectedCategory)) || availableCriteriaCatalog[0];
  }, [availableCriteriaCatalog, selectedCategory]);

  const selectCategoryValue = React.useMemo(() => {
    if (!currentCategory) return 'cat-online-courses';
    return currentCategory.code || String(currentCategory.id) || currentCategory.category;
  }, [currentCategory]);

  const availableCategoryItems = React.useMemo(() => {
    if (!currentCategory || !currentCategory.items) return [];
    const catName = String(currentCategory.category || '').toLowerCase().trim();
    const catCode = String(currentCategory.code || '').toLowerCase().trim();
    const catId = String(currentCategory.id || '').toLowerCase().trim();
    const isCareerAdvancement = catName.includes('career advancement') || catCode === 'cat-career-advancement' || catId === 'cat-career-advancement' || catId === '11';
    const isLeadership = catName.includes('leadership') || catCode === 'cat-leadership' || catId === 'cat-leadership' || catId === '8';
    const isSocialResponsibility = catName.includes('social responsibilit') || catCode === 'cat-social-responsibility' || catId === 'cat-social-responsibility' || catId === '9';

    let items = currentCategory.items;

    if (isCareerAdvancement && !isStudentRep) {
      items = items.filter((i) =>
        String(i.title || '').toLowerCase().includes('linkedin')
      );
    }

    if (isLeadership && !isStudentRep) {
      items = items.filter((i) => {
        const title = String(i.title || '').toLowerCase().trim();
        return !title.includes('innovative') && !title.includes('sustainable') && title !== 'any other';
      });
    }

    if (isSocialResponsibility && !isStudentRep) {
      items = items.filter((i) =>
        String(i.title || '').toLowerCase().includes('participation')
      );
    }

    return items;
  }, [currentCategory, isStudentRep]);

  const currentItem: CriteriaItem | undefined = React.useMemo(() => {
    if (!currentCategory || !availableCategoryItems || availableCategoryItems.length === 0) return undefined;
    return availableCategoryItems.find((i) => matchItem(i, selectedCriteriaId)) || availableCategoryItems[0];
  }, [currentCategory, availableCategoryItems, selectedCriteriaId]);

  const isLinkedInItem = React.useMemo(() => {
    if (!currentItem) return false;
    const title = String(currentItem.title || '').toLowerCase().trim();
    return title.includes('linkedin');
  }, [currentItem]);

  // Academic Category State (Submission Types & Mark Breakdown)
  const [academicSubmissionType, setAcademicSubmissionType] = useState<'Sem Result' | 'SAVE Sem Result'>('Sem Result');
  const [count90Above, setCount90Above] = useState<number>(0);
  const [count80to90, setCount80to90] = useState<number>(0);
  const [count70to80, setCount70to80] = useState<number>(0);
  const [count60to70, setCount60to70] = useState<number>(0);
  const [count50to60, setCount50to60] = useState<number>(0);
  const [count40to50, setCount40to50] = useState<number>(0);
  const [countOtherPass, setCountOtherPass] = useState<number>(0);
  const [failCount, setFailCount] = useState<number>(0);
  const [passPercentage, setPassPercentage] = useState<number>(0);

  const isAcademicCategory = React.useMemo(() => {
    if (!currentCategory) return false;
    const catName = String(currentCategory.category || '').toLowerCase().trim();
    const catCode = String(currentCategory.code || '').toLowerCase().trim();
    const catId = String(currentCategory.id || '').toLowerCase().trim();
    return catName === 'academics' || catCode === 'cat-academics' || catId === 'cat-academics' || catId === '1';
  }, [currentCategory]);

  const isOnlineCoursesCategory = React.useMemo(() => {
    if (!currentCategory) return false;
    const catName = String(currentCategory.category || '').toLowerCase().trim();
    const catCode = String(currentCategory.code || '').toLowerCase().trim();
    const catId = String(currentCategory.id || '').toLowerCase().trim();
    return catName.includes('online course') || catCode === 'cat-online-courses' || catId === 'cat-online-courses' || catId === '2';
  }, [currentCategory]);

  const isStartupsCategory = React.useMemo(() => {
    if (!currentCategory) return false;
    const catName = String(currentCategory.category || '').toLowerCase().trim();
    const catCode = String(currentCategory.code || '').toLowerCase().trim();
    const catId = String(currentCategory.id || '').toLowerCase().trim();
    return catName.includes('startup') || catCode === 'cat-startups' || catId === 'cat-startups' || catId === '7';
  }, [currentCategory]);

  const isResearchCategory = React.useMemo(() => {
    if (!currentCategory) return false;
    const catName = String(currentCategory.category || '').toLowerCase().trim();
    const catCode = String(currentCategory.code || '').toLowerCase().trim();
    const catId = String(currentCategory.id || '').toLowerCase().trim();
    return catName.includes('research') || catCode === 'cat-research' || catId === 'cat-research' || catId === '6';
  }, [currentCategory]);

  const isPrizesCategory = React.useMemo(() => {
    if (!currentCategory) return false;
    const catName = String(currentCategory.category || '').toLowerCase().trim();
    const catCode = String(currentCategory.code || '').toLowerCase().trim();
    const catId = String(currentCategory.id || '').toLowerCase().trim();
    return catName.includes('prize') || catCode === 'cat-prizes' || catId === 'cat-prizes' || catId === '701';
  }, [currentCategory]);

  const isCompetitiveExamsCategory = React.useMemo(() => {
    if (!currentCategory) return false;
    const catName = String(currentCategory.category || '').toLowerCase().trim();
    const catCode = String(currentCategory.code || '').toLowerCase().trim();
    const catId = String(currentCategory.id || '').toLowerCase().trim();
    return catName.includes('competitive exam') || catCode === 'cat-competitive-exams' || catId === 'cat-competitive-exams' || catId === '3';
  }, [currentCategory]);

  const isInternshipsCategory = React.useMemo(() => {
    if (!currentCategory) return false;
    const catName = String(currentCategory.category || '').toLowerCase().trim();
    const catCode = String(currentCategory.code || '').toLowerCase().trim();
    const catId = String(currentCategory.id || '').toLowerCase().trim();
    return catName.includes('internship') || catCode === 'cat-internships' || catId === 'cat-internships' || catId === '5';
  }, [currentCategory]);

  const isScholarshipsCategory = React.useMemo(() => {
    if (!currentCategory) return false;
    const catName = String(currentCategory.category || '').toLowerCase().trim();
    const catCode = String(currentCategory.code || '').toLowerCase().trim();
    const catId = String(currentCategory.id || '').toLowerCase().trim();
    return catName.includes('scholarship') || catCode === 'cat-scholarships' || catId === 'cat-scholarships';
  }, [currentCategory]);

  const isLeadershipCategory = React.useMemo(() => {
    if (!currentCategory) return false;
    const catName = String(currentCategory.category || '').toLowerCase().trim();
    const catCode = String(currentCategory.code || '').toLowerCase().trim();
    const catId = String(currentCategory.id || '').toLowerCase().trim();
    return catName.includes('leadership') || catCode === 'cat-leadership' || catId === 'cat-leadership';
  }, [currentCategory]);

  const isSocialResponsibilityCategory = React.useMemo(() => {
    if (!currentCategory) return false;
    const catName = String(currentCategory.category || '').toLowerCase().trim();
    const catCode = String(currentCategory.code || '').toLowerCase().trim();
    const catId = String(currentCategory.id || '').toLowerCase().trim();
    return catName.includes('social responsibility') || catCode === 'cat-social-responsibility' || catId === 'cat-social-responsibility';
  }, [currentCategory]);

  const isCareerAdvancementCategory = React.useMemo(() => {
    if (!currentCategory) return false;
    const catName = String(currentCategory.category || '').toLowerCase().trim();
    const catCode = String(currentCategory.code || '').toLowerCase().trim();
    const catId = String(currentCategory.id || '').toLowerCase().trim();
    return catName.includes('career advancement') || catCode === 'cat-career-advancement' || catId === 'cat-career-advancement';
  }, [currentCategory]);

  const availableResearchSubItems = React.useMemo(() => {
    if (!isResearchCategory || !currentItem) return [];
    const itemTitle = String(currentItem.title || '').toLowerCase().trim();

    if (itemTitle.includes('publication') && !itemTitle.includes('book')) {
      return [
        'Scopus / Web of Science',
        'Conference Proceeding / Peer reviewed article'
      ];
    }
    if (itemTitle.includes('paper presentation') || itemTitle.includes('presentation')) {
      return [
        'Outside Marian College',
        'Inside Marian College'
      ];
    }
    if (itemTitle.includes('patent')) {
      return [
        'Utility',
        'Design'
      ];
    }
    if (itemTitle.includes('book')) {
      return [
        'Book',
        'Book Chapter',
        'Article'
      ];
    }
    if (itemTitle.includes('funded project') || itemTitle.includes('project')) {
      return [
        'International',
        'National',
        'State',
        'Any Other'
      ];
    }

    return ['Option 1', 'Option 2'];
  }, [isResearchCategory, currentItem]);

  const availablePrizesSubItems = React.useMemo(() => {
    if (!isPrizesCategory || !currentItem) return [];
    const itemTitle = String(currentItem.title || '').toLowerCase().trim();

    if (itemTitle.includes('outside')) {
      return [
        '1st Prize (Individual)',
        '2nd Prize (Individual)',
        '3rd Prize (Individual)',
        '1st Prize (Group)',
        '2nd Prize (Group)',
        '3rd Prize (Group)',
        'Participation (Individual)',
        'Participation (Group)'
      ];
    }

    return [
      '1st Prize (Individual)',
      '2nd Prize (Individual)',
      '3rd Prize (Individual)',
      '1st Prize (Group)',
      '2nd Prize (Group)',
      '3rd Prize (Group)'
    ];
  }, [isPrizesCategory, currentItem]);

  const dynamicSubItems = React.useMemo(() => {
    if (currentItem?.rules_json?.subItems && typeof currentItem.rules_json.subItems === 'object') {
      const keys = Object.keys(currentItem.rules_json.subItems);
      if (keys.length > 0) return keys;
    }
    return [];
  }, [currentItem]);

  const itemCustomFields = React.useMemo(() => {
    return currentItem?.rules_json?.fields || null;
  }, [currentItem]);

  const existingAcademicSubmission = React.useMemo(() => {
    if (!isAcademicCategory) return null;
    return submissions.find(
      (s) =>
        (!s.academicYear || s.academicYear === activeAcademicYear) &&
        s.evidence?.submissionType === academicSubmissionType &&
        s.id !== editingSubId
    );
  }, [isAcademicCategory, submissions, activeAcademicYear, academicSubmissionType, editingSubId]);

  // Sync selected category if current selection is not available in catalog
  React.useEffect(() => {
    if (availableCriteriaCatalog && availableCriteriaCatalog.length > 0) {
      if (!availableCriteriaCatalog.some((c) => matchCategory(c, selectedCategory))) {
        const defaultCat = availableCriteriaCatalog[0];
        setSelectedCategory(defaultCat.id || defaultCat.code || 'cat-academics');
        if (defaultCat.items && defaultCat.items[0]) {
          setSelectedCriteriaId(defaultCat.items[0].id);
        }
      }
    }
  }, [availableCriteriaCatalog, selectedCategory]);

  // Pre-select category and item when navigating from dashboard or via URL query parameters
  React.useEffect(() => {
    if (activeTab === 'submit' && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCat = urlParams.get('category') || sessionStorage.getItem('preselect_category');
      const urlItem = urlParams.get('item') || sessionStorage.getItem('preselect_item');

      if (urlCat && availableCriteriaCatalog && availableCriteriaCatalog.length > 0) {
        const cat = availableCriteriaCatalog.find((c) => matchCategory(c, urlCat));
        if (cat) {
          const catVal = cat.id || cat.code || cat.category;
          setSelectedCategory(catVal);

          if (urlItem && cat.items) {
            const foundItem = cat.items.find((i) => matchItem(i, urlItem));
            if (foundItem) {
              setSelectedCriteriaId(foundItem.id);
            } else if (cat.items.length > 0) {
              setSelectedCriteriaId(cat.items[0].id);
            }
          } else if (cat.items && cat.items.length > 0) {
            setSelectedCriteriaId(cat.items[0].id);
          }
        }
        sessionStorage.removeItem('preselect_category');
        sessionStorage.removeItem('preselect_item');
      }
    }
  }, [activeTab, availableCriteriaCatalog]);

  const [countValue, setCountValue] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [examDate, setExamDate] = useState<string>('');
  const [proofFile, setProofFile] = useState<string>('');
  const [eventId, setEventId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [startupName, setStartupName] = useState<string>('');
  const [startupDate, setStartupDate] = useState<string>('');
  const [startupGovtId, setStartupGovtId] = useState<string>('');
  const [researchSubItem, setResearchSubItem] = useState<string>('');
  const [prizesSubItem, setPrizesSubItem] = useState<string>('');
  const [eventName, setEventName] = useState<string>('');
  const [dynamicSubItem, setDynamicSubItem] = useState<string>('');
  const [customFieldText, setCustomFieldText] = useState<string>('');
  const [customFieldDate, setCustomFieldDate] = useState<string>('');

  React.useEffect(() => {
    if (dynamicSubItems.length > 0) {
      if (!dynamicSubItems.includes(dynamicSubItem)) {
        setDynamicSubItem(dynamicSubItems[0]);
      }
    } else {
      setDynamicSubItem('');
    }
  }, [dynamicSubItems, dynamicSubItem]);

  React.useEffect(() => {
    if (isResearchCategory && availableResearchSubItems.length > 0) {
      if (!availableResearchSubItems.includes(researchSubItem)) {
        setResearchSubItem(availableResearchSubItems[0]);
      }
    }
  }, [isResearchCategory, availableResearchSubItems, researchSubItem]);

  React.useEffect(() => {
    if (isPrizesCategory && availablePrizesSubItems.length > 0) {
      if (!availablePrizesSubItems.includes(prizesSubItem)) {
        setPrizesSubItem(availablePrizesSubItems[0]);
      }
    }
  }, [isPrizesCategory, availablePrizesSubItems, prizesSubItem]);

  const [submissionRemarksMap, setSubmissionRemarksMap] = useState<Record<number, string>>({});

  // Synchronize form states when editing a pending submission
  React.useEffect(() => {
    if (editingSubId) {
      const sub = submissions.find((s) => s.id === editingSubId);
      if (sub) {
        const cat = availableCriteriaCatalog.find((c) => c.items.some((i) => i.id === sub.criteriaId));
        if (cat) setSelectedCategory(cat.id);
        setSelectedCriteriaId(sub.criteriaId);
        setDescription(sub.description);
        if (sub.startDate) setStartDate(sub.startDate);
        else if (sub.evidence?.startDate) setStartDate(sub.evidence.startDate);
        if (sub.endDate) setEndDate(sub.endDate);
        else if (sub.evidence?.endDate) setEndDate(sub.evidence.endDate);
        if (sub.evidence?.count) setCountValue(sub.evidence.count);
        if (sub.evidence?.submissionType) {
          setAcademicSubmissionType(sub.evidence.submissionType as 'Sem Result' | 'SAVE Sem Result');
        }
        if (sub.evidence?.markBreakdown || sub.evidence?.grades) {
          const mb = sub.evidence.markBreakdown || sub.evidence.grades || {};
          setCount90Above(mb.count90Above ?? mb['90Above'] ?? mb.S ?? 0);
          setCount80to90(mb.count80to90 ?? mb['80to90'] ?? mb.APlus ?? 0);
          setCount70to80(mb.count70to80 ?? mb['70to80'] ?? mb.A ?? 0);
          setCount60to70(mb.count60to70 ?? mb['60to70'] ?? 0);
          setCount50to60(mb.count50to60 ?? mb['50to60'] ?? 0);
          setCount40to50(mb.count40to50 ?? mb['40to50'] ?? 0);
          setCountOtherPass(mb.countOtherPass ?? mb.otherPassCount ?? mb.OtherPass ?? ((mb.count60to70 || 0) + (mb.count50to60 || 0) + (mb.count40to50 || 0)));
          setFailCount(mb.failCount ?? mb['below40'] ?? mb.Fail ?? 0);
        }
        if (sub.evidence?.classPassPercentage !== undefined) {
          setPassPercentage(sub.evidence.classPassPercentage);
        }
        if (sub.evidence?.startupName) setStartupName(sub.evidence.startupName);
        else setStartupName('');
        if (sub.evidence?.startupDate) setStartupDate(sub.evidence.startupDate);
        else setStartupDate('');
        if (sub.evidence?.startupGovtId) setStartupGovtId(sub.evidence.startupGovtId);
        else setStartupGovtId('');
        if (sub.evidence?.subItem || sub.evidence?.researchSubItem || sub.evidence?.prizesSubItem) {
          setResearchSubItem(sub.evidence.subItem || sub.evidence.researchSubItem || '');
          setPrizesSubItem(sub.evidence.subItem || sub.evidence.prizesSubItem || '');
        }
        if (sub.evidence?.eventName) setEventName(sub.evidence.eventName);
        else setEventName('');
        if (sub.startDate) setExamDate(sub.startDate);
        else if (sub.evidence?.examDate) setExamDate(sub.evidence.examDate);
        else if (sub.evidence?.startDate) setExamDate(sub.evidence.startDate);
        else setExamDate('');

        if (sub.eventId) {
          setEventId(sub.eventId);
          setProofFile('');
        } else if (sub.proof?.startsWith('Event ID:')) {
          setEventId(sub.proof.replace('Event ID: ', ''));
          setProofFile('');
        } else {
          setEventId('');
          setProofFile(sub.proof || '');
        }
      }
    }
  }, [editingSubId, submissions, availableCriteriaCatalog]);

  // Search & Filter State for My Submissions
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Verification Desk Search & Filter State for Student Representative
  const [repSearchQuery, setRepSearchQuery] = useState('');
  const [repStatusFilter, setRepStatusFilter] = useState('pending');
  const [repPage, setRepPage] = useState(1);
  const repPageSize = 5;

  // Profile View States
  const [profileName, setProfileName] = useState(currentUserInfo?.name || '');
  const [profileClass, setProfileClass] = useState(currentUserInfo?.class_name || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [classList, setClassList] = useState<{ name: string, department: string }[]>([]);

  // Sync state if currentUserInfo changes
  React.useEffect(() => {
    if (currentUserInfo) {
      setProfileName(currentUserInfo.name);
      setProfileClass(currentUserInfo.class_name || '');
    }
  }, [currentUserInfo]);

  // Fetch classes dynamically from backend when profile tab is active
  React.useEffect(() => {
    if (activeTab === 'profile') {
      fetch('http://localhost:8000/api/auth/classes/')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setClassList(data);
          }
        })
        .catch(err => console.error("Failed to fetch classes:", err));
    }
  }, [activeTab]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    setProfileErrorMsg('');
    setProfileSaving(true);

    const result = await updateUserProfile(profileName, profileClass);
    setProfileSaving(false);

    if (result.success) {
      setProfileSuccessMsg('Profile updated successfully in database!');
    } else {
      setProfileErrorMsg(result.error || 'Failed to update profile.');
    }
  };

  // Category Checklist Pagination
  const [checklistPage, setChecklistPage] = useState(1);
  const checklistPageSize = 5;

  const isProgramsOrganized = currentCategory?.id === 'cat-programs-organized' || currentCategory?.category.toLowerCase().trim() === 'programs organized';

  const currentEmail = (currentUserInfo?.email || '').toLowerCase().trim();
  const loggedInUser = users.find((u) => u.email.toLowerCase().trim() === currentEmail);
  const loggedInStudent = students.find(
    (st) =>
      (st as any).email?.toLowerCase().trim() === currentEmail ||
      (loggedInUser && st.name.toLowerCase().trim() === loggedInUser.name.toLowerCase().trim())
  );

  // My Submissions (Strictly OWN submissions submitted by the logged-in user)
  const mySubmissions = submissions.filter((s) => {
    const subEmail = (
      (s as any).user_email ||
      (s as any).userEmail ||
      (s as any).email ||
      ''
    ).toLowerCase().trim();

    // 1. If submission has an associated email, strictly match with logged-in user email
    if (subEmail && currentEmail) {
      return subEmail === currentEmail;
    }

    // 2. If logged-in user email is present, match studentId to logged-in user / student record ID
    if (currentEmail) {
      if (loggedInUser && s.studentId === loggedInUser.id) return true;
      if (loggedInStudent && s.studentId === loggedInStudent.id) return true;
      if (currentUserId && s.studentId === currentUserId) return true;
      return false;
    }

    // 3. Fallback for unauthenticated dev mode: match active studentId
    return s.studentId === currentStudentId;
  });

  const onlineCourseSubmissionsCount = React.useMemo(() => {
    const onlineCategory = criteriaCatalog.find((c) => {
      const name = (c.category || '').toLowerCase().trim();
      const code = (c.code || '').toLowerCase().trim();
      const id = String(c.id || '').toLowerCase().trim();
      return name.includes('online course') || code === 'cat-online-courses' || id === 'cat-online-courses' || id === '2';
    });

    const onlineItemIds = new Set(
      onlineCategory?.items.map((it) => String(it.id)) || ['201', '202', '203']
    );

    return mySubmissions.filter((s) => {
      if (s.status === 'Rejected') return false;
      if (editingSubId && s.id === editingSubId) return false;
      return onlineItemIds.has(String(s.criteriaId));
    }).length;
  }, [criteriaCatalog, mySubmissions, editingSubId]);

  const isUpscExamItem = React.useMemo(() => {
    if (!currentItem) return false;
    const title = String(currentItem.title || '').toLowerCase();
    const id = String(currentItem.id || '');
    return id === '404' || title.includes('upsc') || title.includes('psc') || (title.includes('participation') && title.includes('exam'));
  }, [currentItem]);

  const upscExamSubmissionsCount = React.useMemo(() => {
    const upscItemIds = new Set(['404']);
    criteriaCatalog.forEach((cat) => {
      cat.items.forEach((it) => {
        const t = (it.title || '').toLowerCase();
        if (t.includes('upsc') || t.includes('psc') || (t.includes('participation') && t.includes('exam'))) {
          upscItemIds.add(String(it.id));
        }
      });
    });

    return mySubmissions.filter((s) => {
      if (s.status === 'Rejected') return false;
      if (editingSubId && s.id === editingSubId) return false;
      return upscItemIds.has(String(s.criteriaId));
    }).length;
  }, [criteriaCatalog, mySubmissions, editingSubId]);

  const totalChecklistPages = Math.ceil(availableCriteriaCatalog.length / checklistPageSize) || 1;
  const paginatedChecklist = availableCriteriaCatalog.slice((checklistPage - 1) * checklistPageSize, checklistPage * checklistPageSize);

  // Category completion calculation
  const completedCategoryIds = new Set<string>();
  mySubmissions.forEach((sub) => {
    if (['Approved', 'Verified', 'Student Rep Verified', 'Evaluated', 'Locked'].includes(sub.status)) {
      const cat = availableCriteriaCatalog.find((c) => c.items.some((i) => i.id === sub.criteriaId));
      if (cat) completedCategoryIds.add(cat.id);
    }
  });

  const totalCategories = availableCriteriaCatalog.length;
  const completedCount = completedCategoryIds.size;
  const remainingCount = totalCategories - completedCount;

  // Filtered submissions
  const filteredSubmissions = mySubmissions.filter((sub) => {
    const item = criteriaCatalog.flatMap((c) => c.items).find((i) => i.id === sub.criteriaId);
    const cat = criteriaCatalog.find((c) => c.items.some((i) => i.id === sub.criteriaId));

    const matchesSearch =
      !searchQuery ||
      sub.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cat && cat.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || sub.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSubmissions.length / pageSize) || 1;
  const paginatedSubmissions = filteredSubmissions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Helper to check if two class names match (handling prefixes like II MCA vs MCA)
  const isSameClass = (c1?: string, c2?: string) => {
    if (!c1 || !c2) return false;
    const norm1 = c1.toLowerCase().trim();
    const norm2 = c2.toLowerCase().trim();
    if (norm1 === norm2) return true;

    // Check if section letters match if present (e.g. BSc CS A vs BSc CS B)
    const section1 = norm1.match(/\s+([a-z])$/);
    const section2 = norm2.match(/\s+([a-z])$/);
    if (section1 && section2 && section1[1] !== section2[1]) {
      return false;
    }

    const stripped1 = norm1.replace(/^(i|ii|iii|iv|v|\d+)(st|nd|rd|th)?\s+/, '').trim();
    const stripped2 = norm2.replace(/^(i|ii|iii|iv|v|\d+)(st|nd|rd|th)?\s+/, '').trim();
    return stripped1 === stripped2;
  };

  // Determine current logged in Student Representative's class
  const currentStudentObj = students.find((s) => s.id === currentStudentId);
  const repClass =
    (currentUserInfo as any)?.className ||
    (currentUserInfo as any)?.class_name ||
    currentStudentObj?.className ||
    'II MCA';

  // Peer Submissions for Group Verification Desk (Includes ALL users' submissions from the same class as Student Representative ONLY for verification)
  const peerSubmissions = submissions.filter((sub) => {
    // Exclude draft submissions from verification desk
    if (sub.status === 'Draft') return false;

    const subEmail = (
      (sub as any).user_email ||
      (sub as any).userEmail ||
      (sub as any).email ||
      ''
    ).toLowerCase().trim();

    const isOwnSubmission = Boolean(currentEmail && subEmail && subEmail === currentEmail);

    const studentObj = students.find((s) => s.id === sub.studentId);
    const userObj = users.find(
      (u) =>
        (u.email && subEmail && u.email.toLowerCase().trim() === subEmail) ||
        u.id === sub.studentId
    );

    const studentClass =
      (sub as any).className ||
      (sub as any).class_name ||
      (sub as any).studentClass ||
      (sub as any).user_class ||
      (isOwnSubmission ? ((currentUserInfo as any)?.className || (currentUserInfo as any)?.class_name) : '') ||
      (userObj as any)?.className ||
      (userObj as any)?.class_name ||
      studentObj?.className ||
      '';

    if (!studentClass || !repClass) return false;
    return isSameClass(studentClass, repClass);
  });

  const filteredRepSubmissions = peerSubmissions.filter((sub) => {
    const studentObj = students.find((s) => s.id === sub.studentId);
    const userObj = users.find((u) => u.id === sub.studentId || (sub as any).user_email === u.email || (sub as any).userEmail === u.email);
    const studentName =
      (sub as any).user_name ||
      studentObj?.name ||
      userObj?.name ||
      ((userObj as any)?.first_name ? `${(userObj as any).first_name} ${(userObj as any).last_name || ''}`.trim() : '') ||
      currentUserInfo?.name ||
      `Student #${sub.studentId}`;

    const item = criteriaCatalog.flatMap((c) => c.items).find((i) => i.id === sub.criteriaId);
    const cat = criteriaCatalog.find((c) => c.items.some((i) => i.id === sub.criteriaId));

    const matchesSearch =
      !repSearchQuery ||
      studentName.toLowerCase().includes(repSearchQuery.toLowerCase()) ||
      sub.description.toLowerCase().includes(repSearchQuery.toLowerCase()) ||
      (item && item.title.toLowerCase().includes(repSearchQuery.toLowerCase())) ||
      (cat && cat.category.toLowerCase().includes(repSearchQuery.toLowerCase()));

    const matchesStatus =
      repStatusFilter === 'all' ||
      (repStatusFilter === 'pending' && (sub.status === 'Pending Rep Verification' || sub.status === 'Pending' || sub.status === 'Submitted' || sub.status === 'Pending Verification')) ||
      (repStatusFilter === 'verified' && (sub.status === 'Student Rep Verified' || sub.status === 'Verified by Student Rep')) ||
      (repStatusFilter === 'approved' && (sub.status === 'Approved' || sub.status === 'Verified' || sub.status === 'Evaluated' || sub.status === 'Locked')) ||
      (repStatusFilter === 'correction' && (sub.status === 'Correction Requested' || sub.status === 'Correction')) ||
      (repStatusFilter === 'rejected' && sub.status === 'Rejected');

    return matchesSearch && matchesStatus;
  });

  const totalRepPages = Math.ceil(filteredRepSubmissions.length / repPageSize) || 1;
  const paginatedRepSubmissions = filteredRepSubmissions.slice((repPage - 1) * repPageSize, repPage * repPageSize);

  const handleNavToSubmit = (catId: string, itemId?: number) => {
    const cat = availableCriteriaCatalog.find((c) => matchCategory(c, catId));
    const catVal = cat ? (cat.id || cat.code || cat.category) : catId;
    const targetItem = cat && cat.items && cat.items.length
      ? (itemId ? cat.items.find((i) => matchItem(i, itemId)) : cat.items[0])
      : null;
    const targetItemId = targetItem ? targetItem.id : itemId;

    setSelectedCategory(catVal);
    if (targetItemId) {
      setSelectedCriteriaId(targetItemId);
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('preselect_category', String(catVal));
      if (targetItemId) {
        sessionStorage.setItem('preselect_item', String(targetItemId));
      }
    }

    setActivePage('submit');
    router.push(`/student/submit?category=${encodeURIComponent(catVal)}${targetItemId ? `&item=${targetItemId}` : ''}`);
  };

  const handleFormSubmit = (status: 'Submitted' | 'Draft') => {
    const isAcademicCategory =
      currentCategory?.id === 'cat-academics' ||
      currentCategory?.category.toLowerCase().trim() === 'academics';

    const isOnlineCourses =
      currentCategory?.id === 'cat-online-courses' ||
      currentCategory?.code === 'cat-online-courses' ||
      currentCategory?.category.toLowerCase().trim() === 'online courses';

    const isProgramsOrganized =
      currentCategory?.id === 'cat-programs-organized' ||
      currentCategory?.category.toLowerCase().trim() === 'programs organized';

    const isStartups =
      currentCategory?.id === 'cat-startups' ||
      currentCategory?.code === 'cat-startups' ||
      currentCategory?.category.toLowerCase().trim().includes('startup');

    const isResearch =
      currentCategory?.id === 'cat-research' ||
      currentCategory?.code === 'cat-research' ||
      currentCategory?.category.toLowerCase().trim().includes('research');

    const isPrizes =
      currentCategory?.id === 'cat-prizes' ||
      currentCategory?.code === 'cat-prizes' ||
      currentCategory?.category.toLowerCase().trim().includes('prize');

    if (isAcademicCategory && existingAcademicSubmission && !editingSubId) {
      toast.warning(`"${academicSubmissionType}" has already been updated for this evaluation cycle. Only one submission per type is allowed.`);
      return;
    }

    if (isOnlineCourses) {
      if (onlineCourseSubmissionsCount >= 3 && !editingSubId) {
        toast.warning("A maximum of 3 online courses can be submitted per student. You have already reached the submission limit (3/3).");
        return;
      }
      if (!startDate || !endDate) {
        toast.error("Please select both a Starting Date and an End Date for the online course.");
        return;
      }
    }

    if (isInternshipsCategory) {
      if (!startDate || !endDate) {
        toast.error("Please select both a Starting Date and an End Date for the internship.");
        return;
      }
    }

    if (isStartups && status === 'Submitted') {
      if (!startupName.trim() || !startupDate || !startupGovtId.trim()) {
        toast.error("Please enter Startup Name, Registration Date, and Government Registration ID before submitting.");
        return;
      }
    }

    if (isResearch && status === 'Submitted') {
      if (!researchSubItem) {
        toast.error("Please select a Sub Item for the Research activity before submitting.");
        return;
      }
    }

    if (isPrizes && status === 'Submitted') {
      if (!prizesSubItem) {
        toast.error("Please select a Sub Item for the Prize activity before submitting.");
        return;
      }
    }

    if (isProgramsOrganized && status === 'Submitted') {
      if (!eventName.trim()) {
        toast.error("Please enter the Name of Event before submitting.");
        return;
      }
    }

    if (isCompetitiveExamsCategory || isUpscExamItem) {
      if (isUpscExamItem && upscExamSubmissionsCount >= 3 && !editingSubId) {
        toast.warning("Maximum 3 submissions allowed for UPSC / PSC Exam Participation. You have reached the submission limit (3/3).");
        return;
      }
      if (!examDate) {
        toast.error("Please select the Exam Date for the competitive exam.");
        return;
      }
    }

    if (dynamicSubItems.length > 0 && !isResearchCategory && !isPrizesCategory && status === 'Submitted') {
      if (!dynamicSubItem) {
        toast.error("Please select a Sub Item before submitting.");
        return;
      }
    }

    if (itemCustomFields && status === 'Submitted') {
      if (itemCustomFields.text && !customFieldText.trim()) {
        toast.error("Please enter the Activity Details before submitting.");
        return;
      }
      if (itemCustomFields.date && !customFieldDate) {
        toast.error("Please select the Activity Date before submitting.");
        return;
      }
    }

    const totalStudents = count90Above + count80to90 + count70to80 + countOtherPass + failCount;
    const passedStudents = totalStudents - failCount;
    const autoPassPercentage = totalStudents > 0 ? parseFloat(((passedStudents / totalStudents) * 100).toFixed(2)) : 0;
    const effectivePassPercentage = passPercentage > 0 ? passPercentage : autoPassPercentage;

    let finalDescription = description.trim();
    if (isAcademicCategory && !finalDescription) {
      finalDescription = `${academicSubmissionType} Mark Summary — ≥90%: ${count90Above}, 80-90%: ${count80to90}, 70-80%: ${count70to80}, Other Pass: ${countOtherPass}, Fail: ${failCount} (Pass: ${effectivePassPercentage}%, Total: ${totalStudents} students)`;
    } else if (isStartups && !finalDescription) {
      finalDescription = `Startup: ${startupName.trim()} | Reg. Date: ${startupDate} | Govt ID: ${startupGovtId.trim()}`;
    } else if (isResearch && !finalDescription) {
      finalDescription = `${currentItem?.title || 'Research'} — ${researchSubItem}`;
    } else if (isPrizes && !finalDescription) {
      finalDescription = `${currentItem?.title || 'Prizes'} — ${prizesSubItem}`;
    } else if (isProgramsOrganized && !finalDescription) {
      finalDescription = `${currentItem?.title || 'Program Organized'}: ${eventName.trim()}`;
    } else if (isLeadershipCategory && (String(currentItem?.title || '').toLowerCase().trim().includes('innovative') || String(currentItem?.title || '').toLowerCase().trim().includes('sustainable') || String(currentItem?.title || '').toLowerCase().trim() === 'any other') && !finalDescription) {
      finalDescription = `Innovative / Sustainable Suggestion: ${eventName.trim()}`;
    } else if (isLinkedInItem && !finalDescription) {
      finalDescription = `${currentItem?.title || 'LinkedIn Advancement'}: ${proofFile.trim()}`;
    } else if ((isCompetitiveExamsCategory || isUpscExamItem) && !finalDescription) {
      finalDescription = `${currentItem?.title || 'Competitive Exam'} — Exam Date: ${examDate}`;
    } else if (isInternshipsCategory && !finalDescription) {
      finalDescription = `${currentItem?.title || 'Internship'} — ${startDate} to ${endDate}`;
    } else if ((dynamicSubItem || customFieldText || customFieldDate) && !finalDescription) {
      const parts = [
        currentItem?.title,
        dynamicSubItem ? `Sub Item: ${dynamicSubItem}` : '',
        customFieldText ? `Details: ${customFieldText.trim()}` : '',
        customFieldDate ? `Date: ${customFieldDate}` : ''
      ].filter(Boolean);
      finalDescription = parts.join(' | ');
    }

    if (!finalDescription) {
      finalDescription = `${currentItem?.title || currentCategory?.category || 'Activity Submission'}`;
    }

    const isDriveUrl = (str: string) => {
      const s = str.trim().toLowerCase();
      return (s.startsWith('http://') || s.startsWith('https://')) &&
        (s.includes('drive.google.com') || s.includes('docs.google.com'));
    };

    if (isProgramsOrganized && !eventId.trim() && !proofFile.trim()) {
      toast.error("Please provide an Event ID or Google Drive proof link before submitting.");
      return;
    }

    if (!isProgramsOrganized && !proofFile.trim()) {
      toast.error("Please provide a Google Drive proof link before submitting.");
      return;
    }

    if (proofFile.trim() && !isLinkedInItem && !isDriveUrl(proofFile)) {
      toast.error("Please provide a valid Google Drive link URL (e.g., https://drive.google.com/...) as proof document.");
      return;
    }

    const initialStatus = status === 'Draft' ? 'Draft' : 'Pending Rep Verification';
    const computedEventId = isProgramsOrganized ? (eventId.trim() || undefined) : undefined;
    const computedProof = isProgramsOrganized
      ? (eventId.trim() ? `Event ID: ${eventId.trim()}` : proofFile.trim())
      : proofFile.trim();

    const computedEvidence = isAcademicCategory
      ? {
        type: 'academic_marks',
        submissionType: academicSubmissionType,
        markBreakdown: {
          count90Above,
          count80to90,
          count70to80,
          countOtherPass,
          failCount
        },
        grades: { S: count90Above, APlus: count80to90, A: count70to80, OtherPass: countOtherPass, Fail: failCount },
        classPassPercentage: effectivePassPercentage,
        totalStudents
      }
      : isOnlineCourses
        ? {
          type: 'online_course_dates',
          startDate,
          endDate
        }
        : isInternshipsCategory
          ? {
            type: 'internship_dates',
            startDate,
            endDate
          }
        : isStartups
          ? {
            type: 'startup_details',
            startupName: startupName.trim(),
            startupDate: startupDate,
            startupGovtId: startupGovtId.trim(),
            count: countValue
          }
          : isResearch
            ? {
              type: 'research_subitem',
              subItem: researchSubItem,
              count: countValue || 1
            }
            : isPrizes
              ? {
                type: 'prizes_subitem',
                subItem: prizesSubItem,
                count: countValue || 1
              }
              : isProgramsOrganized
                ? {
                  type: 'program_organized',
                  eventName: eventName.trim(),
                  eventId: eventId.trim() || undefined,
                  count: countValue || 1
                }
                : (isLeadershipCategory && (String(currentItem?.title || '').toLowerCase().trim().includes('innovative') || String(currentItem?.title || '').toLowerCase().trim().includes('sustainable') || String(currentItem?.title || '').toLowerCase().trim() === 'any other'))
                  ? {
                    type: 'leadership_innovative_suggestion',
                    suggestionName: eventName.trim(),
                    positionName: eventName.trim(),
                    eventName: eventName.trim(),
                    count: 1
                  }
                : isLinkedInItem
                  ? {
                    type: 'linkedin_advancement',
                    linkedinUrl: proofFile.trim(),
                    count: countValue || 1
                  }
                : (isCompetitiveExamsCategory || isUpscExamItem)
                  ? {
                    type: 'upsc_exam_date',
                    examDate,
                  startDate: examDate
                }
              : {
                type: currentItem?.type || 'count',
                count: countValue,
                subItem: dynamicSubItem || undefined,
                activityDetails: customFieldText.trim() || undefined,
                activityDate: customFieldDate || undefined,
              };

    // Enforce Admin Settings: Submission Status & Submission Time Window
    if (status === 'Submitted') {
      if (!submissionOpen) {
        toast.error('Activity submissions are currently CLOSED by system administrator.');
        return;
      }

      if (submissionWindowStart || submissionWindowEnd) {
        const now = new Date();
        if (submissionWindowStart && new Date(submissionWindowStart) > now) {
          toast.warning(`Submissions have not opened yet. Opening time: ${new Date(submissionWindowStart).toLocaleString()}`);
          return;
        }
        if (submissionWindowEnd && new Date(submissionWindowEnd) < now) {
          toast.error(`Submissions closed at ${new Date(submissionWindowEnd).toLocaleString()}`);
          return;
        }
      }
    }

    if (editingSubId) {
      updateSubmission(editingSubId, {
        criteriaId: selectedCriteriaId,
        description: finalDescription,
        proof: computedProof,
        eventId: computedEventId,
        startDate: (isOnlineCourses || isInternshipsCategory) ? startDate : (isCompetitiveExamsCategory || isUpscExamItem) ? examDate : undefined,
        endDate: (isOnlineCourses || isInternshipsCategory) ? endDate : undefined,
        status: initialStatus,
        evidence: computedEvidence
      });
      setEditingSubId(null);
    } else {
      addSubmission({
        studentId: currentUserInfo?.id || currentUserId || currentStudentId,
        criteriaId: selectedCriteriaId,
        description: finalDescription,
        status: initialStatus,
        remarks: status === 'Submitted' ? 'Awaiting Student Rep verification' : 'Saved as draft',
        proof: computedProof,
        eventId: computedEventId,
        startDate: (isOnlineCourses || isInternshipsCategory) ? startDate : (isCompetitiveExamsCategory || isUpscExamItem) ? examDate : undefined,
        endDate: (isOnlineCourses || isInternshipsCategory) ? endDate : undefined,
        evaluatorVerified: false,
        evidence: computedEvidence
      });
    }

    setDescription('');
    setProofFile('');
    setEventId('');
    setStartDate('');
    setEndDate('');
    setExamDate('');
    setCountValue(1);
    setCount90Above(0);
    setCount80to90(0);
    setCount70to80(0);
    setCount60to70(0);
    setCount50to60(0);
    setCount40to50(0);
    setFailCount(0);
    setPassPercentage(0);
    setActivePage('submissions');
    router.push('/student/submissions');
  };

  const handleEdit = (sub: Submission) => {
    setEditingSubId(sub.id);
    setActivePage('submit');
    router.push('/student/submit');
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('approved') || s.includes('verified') || s.includes('locked')) {
      return <span className="badge badge-verified">{status}</span>;
    }
    if (s.includes('pending') || s.includes('submitted')) {
      return <span className="badge badge-submitted">{status}</span>;
    }
    if (s.includes('correction')) {
      return <span className="badge badge-correction">{status}</span>;
    }
    if (s.includes('rejected')) {
      return <span className="badge badge-rejected">{status}</span>;
    }
    return <span className="badge badge-draft">{status}</span>;
  };

  return (
    <div style={{ position: 'relative', minHeight: '85vh', padding: '10px 0' }}>
      {/* Slightly Blurred Marian Background Image Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'url("/Assets/Images/Marian_College_Kuttikkanam.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.05,
          filter: 'blur(6px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: DASHBOARD                                    */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Student Dashboard</h1>

            {/* Progress Card */}
            <div className="card">
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '12px' }}>Progress</h2>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                {completedCount} out of {totalCategories} categories completed
              </div>
              <div className="muted" style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
                Progress: {completedCount} / {totalCategories}
              </div>

              {/* Progress Bar */}
              <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden', marginBottom: '16px' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(completedCount / totalCategories) * 100}%`,
                    background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                    borderRadius: '5px',
                    transition: 'width 0.6s ease'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <span className="badge badge-verified" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                  ✓ Completed {completedCount}
                </span>
                <span className="badge badge-correction" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                  ⏳ Remaining {remainingCount}
                </span>
              </div>
            </div>

            {/* Category Checklist Card */}
            <div className="card">
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>Category Checklist</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {paginatedChecklist.map((cat) => {
                  const isDone = completedCategoryIds.has(cat.id);
                  return (
                    <div
                      key={cat.id}
                      className="checklist-row"
                      style={{ cursor: isDone ? 'default' : 'pointer' }}
                      onClick={() => {
                        if (!isDone) handleNavToSubmit(cat.id);
                      }}
                    >
                      <div className="checklist-left">
                        <span style={{ color: isDone ? 'var(--color-success)' : 'var(--color-text-soft)' }}>
                          {isDone ? '✓' : 'Σ'}
                        </span>
                        <span style={{ fontWeight: 600 }}>{cat.category}</span>
                      </div>

                      {isDone ? (
                        <span className="badge badge-verified" style={{ padding: '6px 14px' }}>Done</span>
                      ) : (
                        <button
                          className="btn btn-sm btn-secondary checklist-add-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavToSubmit(cat.id);
                          }}
                          title={`Submit claim under ${cat.category}`}
                        >
                          +
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Checklist Pagination */}
              <div className="pagination-container">
                <button
                  className="pagination-btn"
                  disabled={checklistPage <= 1}
                  onClick={() => setChecklistPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                {Array.from({ length: totalChecklistPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`pagination-num ${checklistPage === pageNum ? 'active' : ''}`}
                    onClick={() => setChecklistPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  className="pagination-btn"
                  disabled={checklistPage >= totalChecklistPages}
                  onClick={() => setChecklistPage((p) => Math.min(totalChecklistPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: SUBMIT ACTIVITY                               */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'submit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              {editingSubId ? 'Edit Pending Submission' : 'Submit Activity'}
            </h1>

            <div className="card" style={{ maxWidth: '860px' }}>
              {editingSubId && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    color: '#92400e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ✏️ <strong>Editing Pending Submission #{editingSubId}</strong>
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setEditingSubId(null);
                      setDescription('');
                      setProofFile('');
                      setEventId('');
                      setCountValue(1);
                    }}
                    style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                  >
                    Cancel Edit
                  </button>
                </div>
              )}
              {/* Category Availability Notice */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: isStudentRep ? 'rgba(99, 102, 241, 0.08)' : 'rgba(234, 179, 8, 0.1)',
                  border: isStudentRep ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(234, 179, 8, 0.25)',
                  color: isStudentRep ? '#3730a3' : '#854d0e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span>{isStudentRep ? '⭐' : 'ℹ️'}</span>
                <div>
                  {isStudentRep ? (
                    <>
                      <strong>⭐ Student Representative / DQC Access:</strong> All {availableCriteriaCatalog.length} evaluation categories (including <em>Academics</em> and <em>Documentation</em>) are fully unlocked for class submissions.
                    </>
                  ) : (
                    <>
                      <strong>ℹ️ Student Access:</strong> All {availableCriteriaCatalog.length} evaluation categories are fully accessible for your claim submissions.
                    </>
                  )}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleFormSubmit('Submitted');
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="select"
                      value={String(selectedCategory)}
                      onChange={(e) => {
                        const catVal = e.target.value;
                        setSelectedCategory(catVal);
                        const cat = availableCriteriaCatalog.find((c) => matchCategory(c, catVal));
                        if (cat && cat.items && Array.isArray(cat.items) && cat.items.length > 0) {
                          setSelectedCriteriaId(cat.items[0].id);
                        }
                      }}
                    >
                      {availableCriteriaCatalog.map((cat) => {
                        const optionVal = String(cat.id || cat.code || cat.category);
                        return (
                          <option key={cat.id || cat.code || cat.category} value={optionVal}>
                            {cat.category}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {isAcademicCategory ? (
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 800 }}>Type of Academic Submission</label>
                      <select
                        className="select"
                        value={academicSubmissionType}
                        onChange={(e) => setAcademicSubmissionType(e.target.value as 'Sem Result')}
                      >
                        <option value="Sem Result">Sem Result (End Semester Examination)</option>
                      </select>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Item</label>
                      <select
                        className="select"
                        value={selectedCriteriaId}
                        onChange={(e) => setSelectedCriteriaId(Number(e.target.value))}
                      >
                        {availableCategoryItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {existingAcademicSubmission && !editingSubId && (
                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      background: '#fef2f2',
                      border: '1.5px solid #fecaca',
                      color: '#991b1b',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <span>⚠️</span>
                    <div>
                      <strong>One-Time Limit Reached:</strong> &ldquo;{academicSubmissionType}&rdquo; has already been submitted for active evaluation cycle. <em>Sem Result</em> can only be updated once per evaluation cycle.
                    </div>
                  </div>
                )}

                {/* Academic Category Mark Breakdown Box */}
                {isAcademicCategory ? (
                  <div style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.04)', border: '1.5px solid rgba(99, 102, 241, 0.2)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
                        📊 Class Pass Percentage % ({academicSubmissionType})
                      </h4>
                      <span className="badge badge-verified" style={{ padding: '6px 14px', fontSize: '0.82rem', background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' }}>
                        Total Students: {count90Above + count80to90 + count70to80 + failCount}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                      {(() => {
                        // Dynamically read labels from criteriaCatalog Academics items
                        const academicsCat = criteriaCatalog.find((c) =>
                          String(c.category).toLowerCase() === 'academics' ||
                          String(c.code).toLowerCase() === 'cat-academics' ||
                          String(c.id).toLowerCase() === 'cat-academics'
                        );
                        const acItems = academicsCat?.items || [];
                        // Match items by type — order: count items by marks desc, then negative, then academic_grades
                        const countItems = acItems
                          .filter((i: any) => i.type === 'count')
                          .sort((a: any, b: any) => (b.marks || 0) - (a.marks || 0));
                        const failItem = acItems.find((i: any) => i.type === 'negative');
                        const passItem = acItems.find((i: any) => i.type === 'academic_grades');

                        const label90 = countItems[0]?.title || '90% and Above';
                        const label80 = countItems[1]?.title || '80% to 90%';
                        const label70 = countItems[2]?.title || '70% to 80%';
                        const labelFail = failItem?.title || 'Fail';
                        const labelPass = 'Class Pass Percentage %';

                        return (
                          <>
                            <div className="form-group">
                              <label className="form-label" style={{ color: '#4f46e5', fontWeight: 800, fontSize: '0.8rem' }}>
                                ⭐ {label90}
                              </label>
                              <input
                                type="number"
                                className="input"
                                min={0}
                                placeholder="0"
                                value={count90Above === 0 ? '' : count90Above}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setCount90Above(Math.max(0, parseInt(e.target.value) || 0))}
                                required
                              />
                            </div>

                            <div className="form-group">
                              <label className="form-label" style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.8rem' }}>
                                {label80}
                              </label>
                              <input
                                type="number"
                                className="input"
                                min={0}
                                placeholder="0"
                                value={count80to90 === 0 ? '' : count80to90}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setCount80to90(Math.max(0, parseInt(e.target.value) || 0))}
                                required
                              />
                            </div>

                            <div className="form-group">
                              <label className="form-label" style={{ color: '#059669', fontWeight: 800, fontSize: '0.8rem' }}>
                                {label70}
                              </label>
                              <input
                                type="number"
                                className="input"
                                min={0}
                                placeholder="0"
                                value={count70to80 === 0 ? '' : count70to80}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setCount70to80(Math.max(0, parseInt(e.target.value) || 0))}
                                required
                              />
                            </div>

                            <div className="form-group">
                              <label className="form-label" style={{ color: '#0d9488', fontWeight: 800, fontSize: '0.8rem' }}>
                                Other Pass (40%–70% / B, C, D)
                              </label>
                              <input
                                type="number"
                                className="input"
                                min={0}
                                placeholder="0"
                                value={countOtherPass === 0 ? '' : countOtherPass}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setCountOtherPass(Math.max(0, parseInt(e.target.value) || 0))}
                                required
                              />
                            </div>

                            <div className="form-group">
                              <label className="form-label" style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.8rem' }}>
                                {labelFail}
                              </label>
                              <input
                                type="number"
                                className="input"
                                min={0}
                                placeholder="0"
                                value={failCount === 0 ? '' : failCount}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setFailCount(Math.max(0, parseInt(e.target.value) || 0))}
                                required
                              />
                            </div>

                            <div className="form-group">
                              <label className="form-label" style={{ color: '#7c3aed', fontWeight: 800, fontSize: '0.8rem' }}>
                                {labelPass}
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                className="input"
                                min={0}
                                max={100}
                                placeholder="0.00"
                                value={passPercentage === 0 ? '' : passPercentage}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setPassPercentage(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                                required
                              />
                            </div>

                            <div style={{ gridColumn: '1 / -1', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                              <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                                👥 Total Accounted: <strong style={{ color: '#0f172a' }}>{count90Above + count80to90 + count70to80 + countOtherPass + failCount}</strong> students
                              </span>
                              <span style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>
                                ✅ Passed: <strong style={{ color: '#059669' }}>{count90Above + count80to90 + count70to80 + countOtherPass}</strong>
                              </span>
                              <span style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: 600 }}>
                                ❌ Failed: <strong style={{ color: '#dc2626' }}>{failCount}</strong>
                              </span>
                              <span style={{ fontSize: '0.82rem', color: '#7c3aed', fontWeight: 700 }}>
                                Calculated Pass: {(count90Above + count80to90 + count70to80 + countOtherPass + failCount) > 0 ? (((count90Above + count80to90 + count70to80 + countOtherPass) / (count90Above + count80to90 + count70to80 + countOtherPass + failCount)) * 100).toFixed(2) : '0'}%
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Selected Criteria Rule Box */}
                    {currentItem && (
                      <div style={{ padding: '16px', background: 'rgba(79, 70, 229, 0.04)', border: '1px solid rgba(79, 70, 229, 0.15)', borderRadius: '14px' }}>
                        <span className="badge badge-submitted" style={{ marginBottom: '8px' }}>
                          {currentItem.type.toUpperCase()} BASED
                        </span>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginTop: '4px' }}>{currentItem.title}</h3>
                      </div>
                    )}
                  </>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {(isOnlineCoursesCategory || isInternshipsCategory) ? (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {isOnlineCoursesCategory && (
                        <div
                          style={{
                            background: onlineCourseSubmissionsCount >= 3 && !editingSubId ? '#fff1f2' : 'rgba(99, 102, 241, 0.06)',
                            border: `1.5px solid ${onlineCourseSubmissionsCount >= 3 && !editingSubId ? '#fecdd3' : 'rgba(99, 102, 241, 0.25)'}`,
                            borderRadius: '14px',
                            padding: '14px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: onlineCourseSubmissionsCount >= 3 && !editingSubId ? '#9f1239' : '#3730a3' }}>
                              Online Course Limit: {onlineCourseSubmissionsCount} / 3 Submitted
                            </div>
                            <div style={{ fontSize: '0.78rem', color: onlineCourseSubmissionsCount >= 3 && !editingSubId ? '#e11d48' : '#4338ca', marginTop: '2px' }}>
                              {onlineCourseSubmissionsCount >= 3 && !editingSubId
                                ? 'Maximum limit reached (3 courses). You cannot submit additional online courses.'
                                : 'Each student can submit a maximum of 3 online courses per evaluation cycle.'}
                            </div>
                          </div>
                          <span
                            className="badge"
                            style={{
                              background: onlineCourseSubmissionsCount >= 3 && !editingSubId ? '#ffe4e6' : '#e0e7ff',
                              color: onlineCourseSubmissionsCount >= 3 && !editingSubId ? '#e11d48' : '#3730a3',
                              fontWeight: 800,
                              fontSize: '0.82rem',
                              whiteSpace: 'nowrap',
                              border: `1px solid ${onlineCourseSubmissionsCount >= 3 && !editingSubId ? '#fca5a5' : '#c7d2fe'}`
                            }}
                          >
                            {onlineCourseSubmissionsCount} / 3 Max
                          </span>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', background: 'rgba(59, 130, 246, 0.04)', border: '1.5px solid rgba(59, 130, 246, 0.2)', borderRadius: '14px' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 800, color: '#1d4ed8' }}>
                            Starting Date
                          </label>
                          <input
                            type="date"
                            className="input"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 800, color: '#1d4ed8' }}>
                            End Date
                          </label>
                          <input
                            type="date"
                            className="input"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ) : isStartupsCategory ? (
                    <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', padding: '20px', background: 'rgba(236, 72, 153, 0.04)', border: '1.5px solid rgba(236, 72, 153, 0.2)', borderRadius: '16px' }}>
                      <div style={{ gridColumn: '1 / -1', marginBottom: '2px' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#be185d', margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          Government-Registered Startup Details
                        </h4>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 800, color: '#be185d' }}>
                          Startup Name
                        </label>
                        <input
                          type="text"
                          className="input"
                          placeholder="Enter Registered Startup / Company Name..."
                          value={startupName}
                          onChange={(e) => setStartupName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 800, color: '#be185d' }}>
                          Registration Date
                        </label>
                        <input
                          type="date"
                          className="input"
                          value={startupDate}
                          onChange={(e) => setStartupDate(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 800, color: '#be185d' }}>
                          Government ID / Reg. No.
                        </label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. CIN / MSME / UDYAM / DPIIT-12345..."
                          value={startupGovtId}
                          onChange={(e) => setStartupGovtId(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  ) : isResearchCategory ? (
                    <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr', gap: '16px', padding: '20px', background: 'rgba(79, 70, 229, 0.04)', border: '1.5px solid rgba(79, 70, 229, 0.2)', borderRadius: '16px' }}>
                      <div style={{ marginBottom: '2px' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#4f46e5', margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          Research Sub Item Details
                        </h4>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 800, color: '#4f46e5' }}>
                          Sub Item
                        </label>
                        <select
                          className="select"
                          value={researchSubItem}
                          onChange={(e) => setResearchSubItem(e.target.value)}
                          required
                        >
                          {availableResearchSubItems.map((subOpt) => (
                            <option key={subOpt} value={subOpt}>
                              {subOpt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (isCompetitiveExamsCategory || isUpscExamItem) ? (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {isUpscExamItem && (
                        <div
                          style={{
                            background: upscExamSubmissionsCount >= 3 && !editingSubId ? '#fff1f2' : 'rgba(99, 102, 241, 0.06)',
                            border: `1.5px solid ${upscExamSubmissionsCount >= 3 && !editingSubId ? '#fecdd3' : 'rgba(99, 102, 241, 0.25)'}`,
                            borderRadius: '14px',
                            padding: '14px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: upscExamSubmissionsCount >= 3 && !editingSubId ? '#9f1239' : '#3730a3' }}>
                              UPSC / PSC Exam Participation Limit: {upscExamSubmissionsCount} / 3 Submitted
                            </div>
                            <div style={{ fontSize: '0.78rem', color: upscExamSubmissionsCount >= 3 && !editingSubId ? '#e11d48' : '#4338ca', marginTop: '2px' }}>
                              {upscExamSubmissionsCount >= 3 && !editingSubId
                                ? 'Maximum limit reached (3 exam submissions). You cannot submit additional UPSC / PSC exam participations.'
                                : 'Each student can submit a maximum of 3 UPSC / PSC exam participations per evaluation cycle.'}
                            </div>
                          </div>
                          <span
                            className="badge"
                            style={{
                              background: upscExamSubmissionsCount >= 3 && !editingSubId ? '#ffe4e6' : '#e0e7ff',
                              color: upscExamSubmissionsCount >= 3 && !editingSubId ? '#e11d48' : '#3730a3',
                              fontWeight: 800,
                              fontSize: '0.82rem',
                              whiteSpace: 'nowrap',
                              border: `1px solid ${upscExamSubmissionsCount >= 3 && !editingSubId ? '#fca5a5' : '#c7d2fe'}`
                            }}
                          >
                            {upscExamSubmissionsCount} / 3 Max
                          </span>
                        </div>
                      )}

                      <div className="form-group" style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.04)', border: '1.5px solid rgba(59, 130, 246, 0.2)', borderRadius: '14px' }}>
                        <label className="form-label" style={{ fontWeight: 800, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          📅 Exam Date
                        </label>
                        <input
                          type="date"
                          className="input"
                          value={examDate}
                          onChange={(e) => setExamDate(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  ) : isPrizesCategory ? (
                    <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr', gap: '16px', padding: '20px', background: 'rgba(79, 70, 229, 0.04)', border: '1.5px solid rgba(79, 70, 229, 0.2)', borderRadius: '16px' }}>
                      <div style={{ marginBottom: '2px' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#4f46e5', margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          Prize Category Details
                        </h4>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 800, color: '#4f46e5' }}>
                          Sub Item
                        </label>
                        <select
                          className="select"
                          value={prizesSubItem}
                          onChange={(e) => setPrizesSubItem(e.target.value)}
                          required
                        >
                          {availablePrizesSubItems.map((subOpt) => (
                            <option key={subOpt} value={subOpt}>
                              {subOpt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : isProgramsOrganized ? (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div
                        style={{
                          background: '#fff1f2',
                          border: '1.5px solid #fecdd3',
                          borderRadius: '12px',
                          padding: '14px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          color: '#9f1239',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                        }}
                      >
                        <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                        <span>There will NO marks awarded for any events conducted during the dates of SAHYA and CALIGO</span>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 800, color: '#1d4ed8' }}>
                          Name of Event
                        </label>
                        <input
                          type="text"
                          className="input"
                          placeholder="Enter the official Name of Event..."
                          value={eventName}
                          onChange={(e) => setEventName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  ) : null}

                  {/* Dynamic Sub-Categories Selector */}
                  {dynamicSubItems.length > 0 && !isResearchCategory && !isPrizesCategory && (
                    <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr', gap: '16px', padding: '20px', background: 'rgba(79, 70, 229, 0.04)', border: '1.5px solid rgba(79, 70, 229, 0.2)', borderRadius: '16px' }}>
                      <div style={{ marginBottom: '2px' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#4f46e5', margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          {currentItem?.title || 'Item'} Sub-Categories
                        </h4>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 800, color: '#4f46e5' }}>
                          Sub Item <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select
                          className="select"
                          value={dynamicSubItem}
                          onChange={(e) => setDynamicSubItem(e.target.value)}
                          required
                        >
                          <option value="" disabled>Select Sub-Item / Option</option>
                          {dynamicSubItems.map((subOpt) => {
                            const subMarks = currentItem?.rules_json?.subItems?.[subOpt];
                            return (
                              <option key={subOpt} value={subOpt}>
                                {subOpt} {subMarks !== undefined ? `(${subMarks} marks)` : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Custom Date Field */}
                  {itemCustomFields?.date && (
                    <div className="form-group" style={{ gridColumn: '1 / -1', padding: '16px', background: 'rgba(59, 130, 246, 0.04)', border: '1.5px solid rgba(59, 130, 246, 0.2)', borderRadius: '14px' }}>
                      <label className="form-label" style={{ fontWeight: 800, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        📅 Activity / Event Date <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="date"
                        className="input"
                        value={customFieldDate}
                        onChange={(e) => setCustomFieldDate(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {/* Dynamic Custom Text Field */}
                  {itemCustomFields?.text && (
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label" style={{ fontWeight: 800, color: '#4f46e5' }}>
                        Activity Details / Title / Topic <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Enter details, title, or topic for this submission..."
                        value={customFieldText}
                        onChange={(e) => setCustomFieldText(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {/* Dynamic Count Field if specified or standard non-specialized category */}
                  {((itemCustomFields?.count) || (!itemCustomFields && !isAcademicCategory && !isResearchCategory && !isPrizesCategory && !isScholarshipsCategory && !isLeadershipCategory && !isSocialResponsibilityCategory && !isCareerAdvancementCategory && !isProgramsOrganized && !isStartupsCategory && !isOnlineCoursesCategory && !isCompetitiveExamsCategory && !isInternshipsCategory)) && (
                    <div className="form-group">
                      <label className="form-label">Count / Frequency</label>
                      <input
                        type="number"
                        className="input"
                        min={1}
                        value={countValue}
                        onChange={(e) => setCountValue(Number(e.target.value))}
                        required
                      />
                    </div>
                  )}

                  {isLeadershipCategory && currentItem && (String(currentItem.title || '').toLowerCase().trim().includes('innovative') || String(currentItem.title || '').toLowerCase().trim().includes('sustainable') || String(currentItem.title || '').toLowerCase().trim() === 'any other') && (
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label className="form-label" style={{ fontWeight: 800, color: '#4f46e5' }}>
                        Details of Innovative / Sustainable Suggestion
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Enter details of the innovative or sustainable suggestion..."
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {isProgramsOrganized ? (
                    <div className="form-group">
                      <label className="form-label">Event ID</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Enter Event ID (e.g. EVT-2026-001, EVT-901)..."
                        value={eventId}
                        onChange={(e) => setEventId(e.target.value)}
                        required
                      />
                      <p className="muted" style={{ fontSize: '0.78rem', marginTop: '6px' }}>
                        Include the official Event ID for this organized program instead of uploading a proof document.
                      </p>
                    </div>
                  ) : isLinkedInItem ? (
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 800, color: '#0077b5' }}>
                        🔗 LinkedIn Profile / Activity URL
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Paste your LinkedIn profile or activity post URL (e.g. https://www.linkedin.com/in/username)..."
                        value={proofFile}
                        onChange={(e) => setProofFile(e.target.value)}
                        required
                      />
                      <p className="muted" style={{ fontSize: '0.78rem', marginTop: '6px' }}>
                        Provide the direct LinkedIn URL (profile link, skill badge post, or micro-credential link) as proof.
                      </p>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Proof Document (Google Drive Upload)</label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <a
                          href="https://drive.google.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            whiteSpace: 'nowrap',
                            background: '#ffffff',
                            border: '1.5px solid #cbd5e1',
                            color: '#0f172a',
                            fontWeight: 700,
                            padding: '10px 16px',
                            borderRadius: '10px',
                            textDecoration: 'none',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                            transition: 'all 0.2s ease'
                          }}
                          title="Open Google Drive to upload proof document"
                        >
                          <svg width="20" height="20" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
                            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
                            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 10.15z" fill="#ea4335" />
                            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
                            <path d="m59.8 53h27.5c0-1.55-.4-3.1-1.2-4.5l-25.4-44c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8z" fill="#ffba00" />
                            <path d="m73.55 76.8h-59.8c1.55.8 3.25 1.2 4.95 1.2h49.9c1.7 0 3.4-.4 4.95-1.2z" fill="#2684fc" />
                          </svg>
                          Upload Proof to Google Drive
                        </a>
                        <input
                          type="url"
                          className="input"
                          style={{ flex: 1, minWidth: '220px' }}
                          placeholder="Paste Google Drive link (e.g. https://drive.google.com/...)..."
                          value={proofFile}
                          onChange={(e) => setProofFile(e.target.value)}
                          required
                        />
                      </div>
                      <p className="muted" style={{ fontSize: '0.78rem', marginTop: '6px' }}>
                        Click the button above to upload your document to Google Drive, then paste the file share link here.
                      </p>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Description <span className="muted" style={{ fontWeight: 400, fontSize: '0.82rem' }}>(Optional)</span></label>
                  <textarea
                    className="textarea"
                    rows={4}
                    placeholder="Describe the activity, details, dates, and achievements (Optional)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required={false}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleFormSubmit('Draft')}
                    disabled={Boolean((isOnlineCoursesCategory && onlineCourseSubmissionsCount >= 3 && !editingSubId) || (isUpscExamItem && upscExamSubmissionsCount >= 3 && !editingSubId))}
                  >
                    Save Draft
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={Boolean((isOnlineCoursesCategory && onlineCourseSubmissionsCount >= 3 && !editingSubId) || (isUpscExamItem && upscExamSubmissionsCount >= 3 && !editingSubId))}
                    style={{
                      opacity: ((isOnlineCoursesCategory && onlineCourseSubmissionsCount >= 3) || (isUpscExamItem && upscExamSubmissionsCount >= 3)) && !editingSubId ? 0.5 : 1,
                      cursor: ((isOnlineCoursesCategory && onlineCourseSubmissionsCount >= 3) || (isUpscExamItem && upscExamSubmissionsCount >= 3)) && !editingSubId ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {editingSubId
                      ? 'Update Submission'
                      : (isOnlineCoursesCategory && onlineCourseSubmissionsCount >= 3) || (isUpscExamItem && upscExamSubmissionsCount >= 3)
                        ? 'Limit Reached (3/3 Max)'
                        : 'Submit Activity'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: MY SUBMISSIONS                                */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'submissions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>My Submissions</h1>

            <div className="card">
              {/* Search & Filter Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Search Item</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Search item or category..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status Filter</label>
                  <select
                    className="select"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved / Verified</option>
                    <option value="correction">Correction Requested</option>
                    <option value="rejected">Rejected</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="muted" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
                Showing {paginatedSubmissions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, filteredSubmissions.length)} of {filteredSubmissions.length} records
              </div>

              {/* Table */}
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Item</th>
                      <th>Evidence & Proof</th>
                      <th>Description</th>
                      <th>Student Rep Review (Round 1)</th>
                      <th>Class Advisor Review (Round 2)</th>
                      <th>Evaluation Status (Round 3)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSubmissions.map((sub) => {
                      const item = criteriaCatalog.flatMap((c) => c.items).find((i) => i.id === sub.criteriaId);
                      const cat = criteriaCatalog.find((c) => c.items.some((i) => i.id === sub.criteriaId));
                      const isPending = ['Pending', 'Pending Rep Verification', 'Submitted', 'Draft', 'Correction Requested'].includes(sub.status) || sub.status.toLowerCase().includes('pending');
                      const isDriveUrl = sub.proof?.startsWith('http://') || sub.proof?.startsWith('https://');
                      const isEventId = sub.eventId || sub.proof?.startsWith('Event ID:');
                      const displayEventId = sub.eventId || (sub.proof?.startsWith('Event ID:') ? sub.proof.replace('Event ID: ', '') : sub.proof);

                      const isRepApproved = sub.status === 'Student Rep Verified' || ['Approved', 'Verified', 'Evaluated', 'Locked'].includes(sub.status) || (sub.repVerifiedByName && !['Correction Requested', 'Correction', 'Rejected'].includes(sub.status));
                      const isRepCorrection = ['Correction Requested', 'Correction'].includes(sub.status) && (!!sub.repRemarks || (!!sub.repVerifiedByName && !sub.teacherVerifiedByName) || (!!sub.remarks && !sub.teacherRemarks && !sub.teacherVerifiedByName));
                      const isRepRejected = sub.status === 'Rejected' && (!!sub.repRemarks || (!!sub.repVerifiedByName && !sub.teacherVerifiedByName) || (!!sub.remarks && !sub.teacherRemarks && !sub.teacherVerifiedByName));

                      const isTeacherApproved = ['Approved', 'Verified', 'Evaluated', 'Locked'].includes(sub.status);
                      const isTeacherCorrection = ['Correction Requested', 'Correction'].includes(sub.status) && !isRepCorrection;
                      const isTeacherRejected = sub.status === 'Rejected' && !isRepRejected;

                      const isEvaluated = sub.evaluatorVerified || sub.status === 'Evaluated' || sub.status === 'Locked' || (sub.marks !== null && sub.marks !== undefined);

                      return (
                        <tr key={sub.id}>
                          <td style={{ fontWeight: 700 }}>{cat?.category || 'General'}</td>
                          <td>
                            {sub.evidence?.submissionType ? (
                              <span className="badge badge-verified" style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', fontWeight: 800 }}>
                                📊 {sub.evidence.submissionType}
                              </span>
                            ) : (
                              item?.title || 'Activity'
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {sub.evidence?.type === 'academic_marks' || sub.evidence?.type === 'academic_grades' || sub.evidence?.markBreakdown || sub.evidence?.grades ? (
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                  <span style={{ color: '#4f46e5' }}>≥90%: {sub.evidence.markBreakdown?.count90Above ?? sub.evidence.grades?.S ?? 0}</span> |
                                  <span style={{ color: '#0284c7' }}>80-90%: {sub.evidence.markBreakdown?.count80to90 ?? sub.evidence.grades?.APlus ?? 0}</span> |
                                  <span style={{ color: '#059669' }}>70-80%: {sub.evidence.markBreakdown?.count70to80 ?? sub.evidence.grades?.A ?? 0}</span> |
                                  <span style={{ color: '#0d9488' }}>Other Pass: {sub.evidence.markBreakdown?.countOtherPass ?? sub.evidence.grades?.OtherPass ?? 0}</span> |
                                  <span style={{ color: '#dc2626' }}>Fail: {sub.evidence.markBreakdown?.failCount ?? sub.evidence.grades?.Fail ?? 0}</span> |
                                  <span style={{ color: '#7c3aed' }}>Pass: {sub.evidence.classPassPercentage !== undefined ? `${sub.evidence.classPassPercentage}%` : '-'}</span>
                                </div>
                              ) : sub.evidence?.type === 'startup_details' || sub.evidence?.startupName ? (
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#be185d', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span>Startup: {sub.evidence.startupName}</span>
                                  <span>Reg: {sub.evidence.startupDate} | ID: {sub.evidence.startupGovtId}</span>
                                </div>
                              ) : sub.evidence?.type === 'program_organized' || sub.evidence?.eventName ? (
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1d4ed8', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span>Event: {sub.evidence.eventName}</span>
                                </div>
                              ) : sub.evidence?.type === 'prizes_subitem' || sub.evidence?.type === 'research_subitem' || sub.evidence?.subItem ? (
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4f46e5', background: '#e0e7ff', border: '1px solid #c7d2fe', padding: '2px 8px', borderRadius: '6px', width: 'fit-content' }}>
                                  {sub.evidence.subItem || sub.evidence.prizesSubItem || sub.evidence.researchSubItem}
                                </span>
                              ) : (sub.startDate || sub.evidence?.startDate || sub.evidence?.examDate) ? (
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: '6px', width: 'fit-content' }}>
                                  {sub.startDate || sub.evidence?.startDate || sub.evidence?.examDate}{(sub.endDate || sub.evidence?.endDate) ? ` to ${sub.endDate || sub.evidence?.endDate}` : ''}
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{sub.evidence?.count ? `Count: ${sub.evidence.count}` : ''}</span>
                              )}

                              {isEventId ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: '#eff6ff',
                                    color: '#1d4ed8',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontWeight: 700,
                                    fontSize: '0.78rem',
                                    border: '1px solid #bfdbfe',
                                    width: 'fit-content'
                                  }}
                                >
                                  🎫 Event ID: {displayEventId}
                                </span>
                              ) : sub.proof ? (
                                <a
                                  href={isDriveUrl ? sub.proof : 'https://drive.google.com/'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                                  title="Open Proof Document in Google Drive"
                                >
                                  📁 {sub.proof.length > 20 ? sub.proof.substring(0, 20) + '...' : sub.proof}
                                </a>
                              ) : null}
                            </div>
                          </td>
                          <td style={{ maxWidth: '200px', fontSize: '0.84rem' }}>{sub.description}</td>

                          {/* Round 1: Student Representative Review */}
                          <td>
                            {isRepCorrection ? (
                              <div>
                                <span className="badge badge-correction" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5', fontWeight: 800 }}>
                                  ⚠️ Correction Requested
                                </span>
                                {(sub.repRemarks || sub.remarks) && (
                                  <div style={{ fontSize: '0.74rem', color: '#c2410c', fontStyle: 'italic', marginTop: '2px' }}>
                                    💬 &ldquo;{sub.repRemarks || sub.remarks}&rdquo;
                                  </div>
                                )}
                              </div>
                            ) : isRepRejected ? (
                              <div>
                                <span className="badge badge-correction" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', fontWeight: 800 }}>
                                  ❌ Rejected
                                </span>
                                {(sub.repRemarks || sub.remarks) && (
                                  <div style={{ fontSize: '0.74rem', color: '#dc2626', fontStyle: 'italic', marginTop: '2px' }}>
                                    💬 &ldquo;{sub.repRemarks || sub.remarks}&rdquo;
                                  </div>
                                )}
                              </div>
                            ) : sub.repVerifiedByName ? (
                              <div>
                                <span className="badge badge-verified" style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', fontWeight: 800 }}>
                                  ✓ Verified (Rep)
                                </span>
                                <div style={{ fontSize: '0.78rem', color: '#3730a3', fontWeight: 700, marginTop: '4px' }}>
                                  by {sub.repVerifiedByName}
                                </div>
                                {sub.repRemarks && (
                                  <div style={{ fontSize: '0.74rem', color: '#475569', fontStyle: 'italic', marginTop: '2px' }}>
                                    💬 &ldquo;{sub.repRemarks}&rdquo;
                                  </div>
                                )}
                              </div>
                            ) : isRepApproved ? (
                              <div>
                                <span className="badge badge-verified" style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', fontWeight: 800 }}>
                                  ✓ Verified (Rep)
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span className="badge badge-submitted" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 800 }}>
                                  ⏳ Pending Rep Review
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Round 2: Class Advisor Review */}
                          <td>
                            {sub.teacherVerifiedByName ? (
                              <div>
                                <span className={`badge ${isTeacherApproved ? 'badge-verified' : isTeacherCorrection ? 'badge-correction' : 'badge-danger'}`} style={{
                                  background: isTeacherApproved ? '#dcfce7' : isTeacherCorrection ? '#fff7ed' : '#fee2e2',
                                  color: isTeacherApproved ? '#15803d' : isTeacherCorrection ? '#c2410c' : '#dc2626',
                                  border: `1px solid ${isTeacherApproved ? '#86efac' : isTeacherCorrection ? '#ffedd5' : '#fca5a5'}`,
                                  fontWeight: 800
                                }}>
                                  {isTeacherApproved ? '✓ Approved' : isTeacherCorrection ? '⚠️ Correction' : '❌ Rejected'}
                                </span>
                                <div style={{ fontSize: '0.78rem', color: isTeacherApproved ? '#15803d' : isTeacherCorrection ? '#c2410c' : '#dc2626', fontWeight: 700, marginTop: '4px' }}>
                                  by {sub.teacherVerifiedByName}
                                </div>
                                {(sub.teacherRemarks || sub.remarks) && (
                                  <div style={{ fontSize: '0.74rem', color: '#475569', fontStyle: 'italic', marginTop: '2px' }}>
                                    💬 &ldquo;{sub.teacherRemarks || sub.remarks}&rdquo;
                                  </div>
                                )}
                              </div>
                            ) : isTeacherApproved ? (
                              <div>
                                <span className="badge badge-verified" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontWeight: 800 }}>
                                  ✓ Approved
                                </span>
                              </div>
                            ) : isTeacherCorrection ? (
                              <div>
                                <span className="badge badge-correction" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5', fontWeight: 800 }}>
                                  ⚠️ Correction Requested
                                </span>
                                {sub.remarks && (
                                  <div style={{ fontSize: '0.74rem', color: '#c2410c', fontStyle: 'italic', marginTop: '2px' }}>
                                    💬 &ldquo;{sub.remarks}&rdquo;
                                  </div>
                                )}
                              </div>
                            ) : isTeacherRejected ? (
                              <div>
                                <span className="badge badge-correction" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', fontWeight: 800 }}>
                                  ❌ Rejected
                                </span>
                                {sub.remarks && (
                                  <div style={{ fontSize: '0.74rem', color: '#dc2626', fontStyle: 'italic', marginTop: '2px' }}>
                                    💬 &ldquo;{sub.remarks}&rdquo;
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <span className="badge badge-submitted" style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', fontWeight: 700 }}>
                                  ⏳ Pending Advisor Review
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Round 3: Evaluation Status */}
                          <td>
                            {isEvaluated ? (
                              <div>
                                <span className="badge badge-verified" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontWeight: 800 }}>
                                  🎯 Evaluated
                                </span>
                                <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 800, marginTop: '4px' }}>
                                  Marks: {sub.marks !== null && sub.marks !== undefined ? sub.marks : 'Scored'}
                                </div>
                                {sub.evaluatorVerifiedByName && (
                                  <div style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 700 }}>
                                    by {sub.evaluatorVerifiedByName}
                                  </div>
                                )}
                              </div>
                            ) : isTeacherRejected ? (
                              <div>
                                <span className="badge badge-correction" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', fontWeight: 800 }}>
                                  ❌ Rejected
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span className="badge badge-submitted" style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', fontWeight: 700 }}>
                                  ⏳ Pending Evaluation
                                </span>
                              </div>
                            )}
                          </td>
                          <td>
                            {isPending ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => handleEdit(sub)}
                                  title="Edit Pending Submission"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => setDeleteSubIdModal(sub.id)}
                                  title="Delete Pending Submission"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            ) : (
                              <span className="badge badge-verified" style={{ fontSize: '0.74rem', padding: '4px 8px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
                                🔒 Locked
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {paginatedSubmissions.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-soft)' }}>
                          No submissions matched your search filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination-container">
                <button
                  className="pagination-btn"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`pagination-num ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  className="pagination-btn"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: GROUP VERIFICATION (STUDENT REPRESENTATIVE)   */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'verification' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Group Submissions Verification Desk</h1>
                <p className="muted" style={{ fontSize: '0.88rem' }}>
                  Review and verify activity claims submitted by students belonging to your class ({repClass}). Once verified, claims move forward to Class Advisor verification.
                </p>
              </div>
              <span className="badge badge-verified" style={{ padding: '8px 16px', fontSize: '0.86rem', background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', fontWeight: 800 }}>
                🎓 Class: {repClass}
              </span>
            </div>

            <div className="card">
              {/* Search & Filter Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Search Student / Claim</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Search student name, item, or description..."
                    value={repSearchQuery}
                    onChange={(e) => {
                      setRepSearchQuery(e.target.value);
                      setRepPage(1);
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Verification Status Filter</label>
                  <select
                    className="select"
                    value={repStatusFilter}
                    onChange={(e) => {
                      setRepStatusFilter(e.target.value);
                      setRepPage(1);
                    }}
                  >
                    <option value="pending">Pending Student Rep Verification</option>
                    <option value="all">All Peer Submissions</option>
                    <option value="verified">Verified by Student Rep</option>
                    <option value="approved">Teacher Approved</option>
                    <option value="correction">Correction Requested</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Category</th>
                      <th>Item</th>
                      <th>Proof File</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRepSubmissions.map((sub) => {
                      const studentObj = students.find((s) => s.id === sub.studentId);
                      const userObj = users.find((u) => u.id === sub.studentId || (sub as any).user_email === u.email || (sub as any).userEmail === u.email);
                      const displayName = (sub as any).user_name || studentObj?.name || userObj?.name || ((userObj as any)?.first_name ? `${(userObj as any).first_name} ${(userObj as any).last_name || ''}`.trim() : `Student #${sub.studentId}`);
                      const displayClass = studentObj?.className || (userObj as any)?.className || (userObj as any)?.class_name || repClass;

                      const item = criteriaCatalog.flatMap((c) => c.items).find((i) => i.id === sub.criteriaId);
                      const cat = criteriaCatalog.find((c) => c.items.some((i) => i.id === sub.criteriaId));
                      const isDriveUrl = sub.proof?.startsWith('http://') || sub.proof?.startsWith('https://');
                      const isEventId = sub.eventId || sub.proof?.startsWith('Event ID:');
                      const displayEventId = sub.eventId || (sub.proof?.startsWith('Event ID:') ? sub.proof.replace('Event ID: ', '') : sub.proof);

                      const canVerify = sub.status === 'Pending Rep Verification' || sub.status === 'Pending' || sub.status === 'Submitted';

                      return (
                        <tr key={sub.id}>
                          <td style={{ fontWeight: 700 }}>
                            {displayName}
                            <div className="muted" style={{ fontSize: '0.76rem' }}>{displayClass}</div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{cat?.category || 'General'}</td>
                          <td>
                            {sub.evidence?.submissionType ? (
                              <span className="badge badge-verified" style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', fontWeight: 800 }}>
                                📊 {sub.evidence.submissionType}
                              </span>
                            ) : (
                              item?.title || 'Activity'
                            )}
                          </td>
                          <td>
                            {isEventId ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  fontWeight: 700,
                                  fontSize: '0.82rem',
                                  border: '1px solid #bfdbfe'
                                }}
                              >
                                🎫 Event ID: {displayEventId}
                              </span>
                            ) : sub.proof ? (
                              <a
                                href={isDriveUrl ? sub.proof : 'https://drive.google.com/'}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                                title="Open Proof Document"
                              >
                                📁 {sub.proof.length > 18 ? sub.proof.substring(0, 18) + '...' : sub.proof}
                              </a>
                            ) : (
                              <span className="muted">-</span>
                            )}
                          </td>
                          <td style={{ maxWidth: '220px' }}>{sub.description}</td>
                          <td>
                            {getStatusBadge(sub.status)}
                            {sub.verifiedByName && (
                              <div style={{
                                fontSize: '0.78rem',
                                color: ['Approved', 'Verified', 'Student Rep Verified', 'Evaluated', 'Locked'].includes(sub.status) ? '#16a34a' : sub.status === 'Rejected' ? '#dc2626' : '#ea580c',
                                fontWeight: 700,
                                marginTop: '4px'
                              }}>
                                👤 {['Approved', 'Verified', 'Student Rep Verified', 'Evaluated', 'Locked'].includes(sub.status) ? 'Verified' : sub.status === 'Rejected' ? 'Rejected' : 'Reviewed'} by {sub.verifiedByName}
                              </div>
                            )}
                            {sub.remarks && (
                              <div style={{
                                fontSize: '0.76rem',
                                color: 'var(--text-muted)',
                                fontStyle: 'italic',
                                marginTop: '4px',
                                background: '#f8fafc',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px dashed #e2e8f0',
                                maxWidth: '180px',
                                wordBreak: 'break-word'
                              }}>
                                💬 &ldquo;{sub.remarks}&rdquo;
                              </div>
                            )}
                          </td>
                          <td>
                            {canVerify ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <input
                                  id={`rep-remarks-${sub.id}`}
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
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => {
                                      const repName = currentUserInfo?.name || 'Santhosh (Student Rep)';
                                      const repRemarks = submissionRemarksMap[sub.id] || 'Verified by Student Representative and forwarded to Class Advisor.';
                                      updateSubmission(sub.id, {
                                        status: 'Student Rep Verified',
                                        repVerifiedByName: repName,
                                        repRemarks,
                                        remarks: repRemarks
                                      });
                                    }}
                                    title="Verify and forward to Class Teacher"
                                    style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700 }}
                                  >
                                    ✓ Verify & Forward
                                  </button>
                                  <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => {
                                      const inputEl = document.getElementById(`rep-remarks-${sub.id}`) as HTMLInputElement;
                                      const repRemarks = submissionRemarksMap[sub.id]?.trim();
                                      if (!repRemarks) {
                                        inputEl?.reportValidity();
                                        return;
                                      }
                                      const repName = currentUserInfo?.name || 'Santhosh (Student Rep)';
                                      updateSubmission(sub.id, {
                                        status: 'Correction Requested',
                                        repVerifiedByName: repName,
                                        repRemarks,
                                        remarks: repRemarks
                                      });
                                    }}
                                    title="Request correction"
                                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                  >
                                    Correction
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => {
                                      const inputEl = document.getElementById(`rep-remarks-${sub.id}`) as HTMLInputElement;
                                      const repRemarks = submissionRemarksMap[sub.id]?.trim();
                                      if (!repRemarks) {
                                        inputEl?.reportValidity();
                                        return;
                                      }
                                      const repName = currentUserInfo?.name || 'Santhosh (Student Rep)';
                                      updateSubmission(sub.id, {
                                        status: 'Rejected',
                                        repVerifiedByName: repName,
                                        repRemarks,
                                        remarks: repRemarks
                                      });
                                    }}
                                    title="Reject submission"
                                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                <span className="muted" style={{ color: ['Approved', 'Verified', 'Evaluated', 'Locked'].includes(sub.status) ? '#16a34a' : '#1e40af' }}>
                                  {sub.status === 'Student Rep Verified' ? '✓ Forwarded to Teacher' : sub.status}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {paginatedRepSubmissions.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '28px', color: 'var(--color-text-soft)' }}>
                          No peer group submissions match your filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Rep Pagination Controls */}
              <div className="pagination-container">
                <button
                  className="pagination-btn"
                  disabled={repPage <= 1}
                  onClick={() => setRepPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                {Array.from({ length: totalRepPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`pagination-num ${repPage === pageNum ? 'active' : ''}`}
                    onClick={() => setRepPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  className="pagination-btn"
                  disabled={repPage >= totalRepPages}
                  onClick={() => setRepPage((p) => Math.min(totalRepPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 5: MY PROFILE                                    */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>My Profile</h1>
              <p className="muted" style={{ fontSize: '0.88rem' }}>
                View your personal student profile details derived from your official institutional account.
              </p>
            </div>

            {/* Profile Card Summary */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '36px 40px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary, #3b82f6), #1d4ed8)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.25)',
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
                  <span>{currentUserInfo?.name ? currentUserInfo.name.charAt(0).toUpperCase() : 'S'}</span>
                )}
              </div>

              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>{currentUserInfo?.name || 'Student'}</h2>
                <p className="muted" style={{ fontSize: '0.86rem', marginTop: '4px' }}>{currentUserInfo?.email}</p>
              </div>

              <div style={{ width: '100%', height: '1px', background: '#e2e8f0', margin: '4px 0' }} />

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.92rem' }}>
                  <span className="muted" style={{ color: '#64748b' }}>Role</span>
                  <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{currentUserInfo?.role || 'Student'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', fontSize: '0.92rem' }}>
                  <span className="muted" style={{ color: '#64748b', whiteSpace: 'nowrap' }}>Department</span>
                  <span style={{ fontWeight: 700, textAlign: 'right' }}>{currentUserInfo?.department || 'Not Assigned'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.92rem' }}>
                  <span className="muted" style={{ color: '#64748b' }}>Current Class</span>
                  <span style={{ fontWeight: 700 }}>{currentUserInfo?.class_name || 'Not Assigned'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Submission Confirm Modal */}
      <CustomModal
        isOpen={deleteSubIdModal !== null}
        onClose={() => setDeleteSubIdModal(null)}
        title="Delete Pending Submission"
        icon="🗑️"
        description="Are you sure you want to delete this pending submission? This action cannot be undone."
        confirmText="Delete Submission"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={() => {
          if (deleteSubIdModal !== null) {
            deleteSubmission(deleteSubIdModal);
            setDeleteSubIdModal(null);
            toast.info('Submission deleted.');
          }
        }}
      />
    </div>
  );
};

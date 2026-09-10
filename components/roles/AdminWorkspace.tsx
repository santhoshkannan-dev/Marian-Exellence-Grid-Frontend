'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { toast } from 'react-toastify';
import { DepartmentHierarchyManager } from '@/components/admin/DepartmentHierarchyManager';
import { CustomModal } from '@/components/CustomModal';

interface AdminWorkspaceProps {
  view?: 'years' | 'criteria' | 'users' | 'departments' | 'settings' | 'champions';
}

interface AcademicYear {
  year: string;
  status: 'Active' | 'Inactive';
}

interface CriteriaCategory {
  id: string;
  title: string;
  desc: string;
  icon: string;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  className: string;
  approval: 'Approved' | 'Pending';
}

interface AdminDept {
  name: string;
  classes: string[];
}

export interface CategoryItemDraft {
  id: string;
  title: string;
  type: string;
  marks: number;
  details: string;
  hasSubItems: boolean;
  subItems: Array<{ key: string; marks: number }>;
  newSubKeyInput: string;
  newSubMarksInput: number;
  fields: {
    url: boolean;
    date: boolean;
    text: boolean;
    count: boolean;
    description: boolean;
  };
}

const createDefaultItemDraft = (id = '1'): CategoryItemDraft => ({
  id,
  title: '',
  type: 'Count Based',
  marks: 5,
  details: '',
  hasSubItems: false,
  subItems: [],
  newSubKeyInput: '',
  newSubMarksInput: 5,
  fields: {
    url: true,
    date: true,
    text: true,
    count: false,
    description: true,
  },
});

export const AdminWorkspace: React.FC<AdminWorkspaceProps> = ({ view }) => {
  const { activePage } = useApp();
  const activeTab = view || activePage || 'years';

  const {
    submissionOpen,
    toggleSubmissionOpen,
    evaluationOpen,
    toggleEvaluationOpen,
    submissionWindowStart,
    submissionWindowEnd,
    setSubmissionWindow,
    academicYears: globalYears,
    activeAcademicYear: globalActiveYear,
    addAcademicYearGlobal,
    deleteAcademicYearGlobal,
    setActiveAcademicYearGlobal,
    departments,
    classes,
    addDepartmentGlobal,
    deleteDepartmentGlobal,
    addClassGlobal,
    updateClassMapping,
    users,
    userGroups,
    addUserGlobal,
    criteriaCatalog,
    addCriteriaCategory,
    addCriteriaItem,
    updateCriteriaItem,
    deleteCriteriaItem,
    deleteCriteriaCategory,
    updateClassModeration,
    updateSmallestClassSize,
    smallestClassSize,
  } = useApp();

  const [confirmSubmissionModal, setConfirmSubmissionModal] = useState<boolean>(false);
  const [confirmEvaluationModal, setConfirmEvaluationModal] = useState<boolean>(false);
  const [editItemModal, setEditItemModal] = useState<any>(null);
  const [newSubKey, setNewSubKey] = useState<string>('');

  // ----------------------------------------------------
  // DATASET 1: ACADEMIC YEARS
  // ----------------------------------------------------
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [newYearInput, setNewYearInput] = useState('');

  // Synchronize Academic Years from global AppContext
  useEffect(() => {
    if (globalYears && globalYears.length > 0) {
      setAcademicYears(
        globalYears.map((y) => ({
          year: y,
          status: y === globalActiveYear ? 'Active' : 'Inactive'
        }))
      );
    }
  }, [globalYears, globalActiveYear]);

  const handleAddYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearInput.trim() || !/^\d{4}-\d{4}$/.test(newYearInput.trim())) {
      toast.error('Please enter year in YYYY-YYYY format (e.g. 2026-2027)');
      return;
    }
    const exists = academicYears.some((y) => y.year === newYearInput.trim());
    if (exists) {
      toast.warning('This academic year already exists.');
      return;
    }
    const formatted = newYearInput.trim();
    addAcademicYearGlobal(formatted);
    setActiveAcademicYearGlobal(formatted, true);
    setNewYearInput('');
  };

  const handleToggleYearStatus = (targetYear: string, isActive: boolean) => {
    setActiveAcademicYearGlobal(targetYear, isActive);
  };

  const handleDeleteYear = (targetYear: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Academic Year',
      description: `Are you sure you want to delete academic year "${targetYear}"? This action cannot be undone.`,
      confirmText: 'Delete Year',
      confirmVariant: 'danger',
      onConfirm: () => {
        deleteAcademicYearGlobal(targetYear);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        toast.info(`Academic year "${targetYear}" deleted.`);
      },
    });
  };

  // ----------------------------------------------------
  // DATASET 2: CRITERIA MANAGEMENT
  // ----------------------------------------------------

  // Criteria Items detailed view states
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState('Count Based');
  const [newItemMarks, setNewItemMarks] = useState(5);
  const [newItemDetails, setNewItemDetails] = useState('');
  const [newItemHasSubItems, setNewItemHasSubItems] = useState(false);
  const [newItemSubItems, setNewItemSubItems] = useState<Array<{ key: string; marks: number }>>([]);
  const [newItemSubKey, setNewItemSubKey] = useState('');
  const [newItemSubMarks, setNewItemSubMarks] = useState(5);
  const [newItemFields, setNewItemFields] = useState({
    url: true,
    date: true,
    text: true,
    count: false,
    description: true,
  });

  // Custom Modal States
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatTitleModal, setNewCatTitleModal] = useState('');
  const [newCatDescModal, setNewCatDescModal] = useState('');
  const [newCatAccessModal, setNewCatAccessModal] = useState<'all_students' | 'student_rep_only'>('all_students');
  const [catItemsDraft, setCatItemsDraft] = useState<CategoryItemDraft[]>([createDefaultItemDraft('1')]);

  const updateDraftItem = (index: number, updates: Partial<CategoryItemDraft>) => {
    setCatItemsDraft(prev => prev.map((item, idx) => idx === index ? { ...item, ...updates } : item));
  };

  const addDraftItem = () => {
    setCatItemsDraft(prev => [...prev, createDefaultItemDraft(Date.now().toString())]);
  };

  const removeDraftItem = (index: number) => {
    if (catItemsDraft.length <= 1) {
      toast.warning('A category must have at least one evaluation item.');
      return;
    }
    setCatItemsDraft(prev => prev.filter((_, idx) => idx !== index));
  };

  const addSubItemToDraft = (itemIndex: number) => {
    const item = catItemsDraft[itemIndex];
    if (!item.newSubKeyInput || !item.newSubKeyInput.trim()) {
      toast.warning('Please enter a sub-item name');
      return;
    }
    const key = item.newSubKeyInput.trim();
    const marks = Number(item.newSubMarksInput) || 0;
    updateDraftItem(itemIndex, {
      subItems: [...item.subItems, { key, marks }],
      newSubKeyInput: '',
      newSubMarksInput: 5,
    });
  };

  const removeSubItemFromDraft = (itemIndex: number, subIndex: number) => {
    const item = catItemsDraft[itemIndex];
    updateDraftItem(itemIndex, {
      subItems: item.subItems.filter((_, idx) => idx !== subIndex),
    });
  };

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserNameModal, setNewUserNameModal] = useState('');
  const [newUserEmailModal, setNewUserEmailModal] = useState('');
  const [newUserRoleModal, setNewUserRoleModal] = useState('student');
  const [newUserDeptModal, setNewUserDeptModal] = useState('CS');
  const [newUserClassModal, setNewUserClassModal] = useState('BCA A');

  // Generic Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    confirmVariant?: 'primary' | 'danger' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Delete',
    confirmVariant: 'danger',
    onConfirm: () => {},
  });

  // State to hold pending teacher selections before confirmation
  const [pendingClassTeachers, setPendingClassTeachers] = useState<Record<string, string>>({});

  interface CriteriaItemDetail {
    id: string;
    title: string;
    type: string;
    marks: number;
    details: string;
  }

  const handleOpenAddCategoryModal = () => {
    setNewCatTitleModal('');
    setNewCatDescModal('');
    setNewCatAccessModal('all_students');
    setCatItemsDraft([createDefaultItemDraft('1')]);
    setShowAddCategoryModal(true);
  };

  const handleCreateCriteriaItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !newItemTitle.trim()) return;

    const rules_json: any = {};
    if (newItemHasSubItems && newItemSubItems.length > 0) {
      rules_json.subItems = {};
      newItemSubItems.forEach(s => {
        if (s.key.trim()) rules_json.subItems[s.key.trim()] = s.marks;
      });
    }
    rules_json.fields = newItemFields;

    addCriteriaItem(selectedCategory.id, {
      title: newItemTitle.trim(),
      type: newItemType as any,
      marks: newItemMarks,
      details: newItemDetails.trim() || `${newItemType} evaluation item`,
      rules_json
    });

    setNewItemTitle('');
    setNewItemDetails('');
    setNewItemHasSubItems(false);
    setNewItemSubItems([]);
    setNewItemSubKey('');
    setNewItemSubMarks(5);
    setNewItemFields({
      url: true,
      date: true,
      text: true,
      count: false,
      description: true,
    });
    setShowAddItemForm(false);
    toast.success(`Item "${newItemTitle.trim()}" added to category!`);
  };

  const handleDeleteCriteriaItem = (catId: string, itemId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Evaluation Item',
      description: 'Are you sure you want to delete this evaluation item?',
      confirmText: 'Delete Item',
      confirmVariant: 'danger',
      onConfirm: () => {
        deleteCriteriaItem(catId, parseInt(itemId, 10));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        toast.info('Evaluation item deleted.');
      },
    });
  };

  const handleEditCriteriaItemPrompt = (catId: string, itemId: string) => {
    const cat = criteriaCatalog.find(c => String(c.id) === String(catId));
    if (!cat) return;
    const item = cat.items.find((i: any) => String(i.id) === String(itemId));
    if (!item) return;

    setEditItemModal({
      catId,
      itemId,
      title: item.title,
      marks: item.marks,
      details: item.details,
      rules_json: item.rules_json ? JSON.stringify(item.rules_json, null, 2) : ''
    });
  };

  // ----------------------------------------------------
  // DATASET 3: USER MANAGEMENT
  // ----------------------------------------------------
  const [usersList, setUsersList] = useState<AdminUser[]>([]);

  // Synchronize Users list from global AppContext
  useEffect(() => {
    if (users && users.length > 0) {
      setUsersList(
        users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          department: u.department || 'General',
          className: u.className || 'General',
          approval: u.isApproved ? 'Approved' : 'Pending'
        }))
      );
    }
  }, [users]);

  const [userSearch, setUserSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [classFilter, setClassFilter] = useState('All Classes');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [userPage, setUserPage] = useState(1);
  const userPageSize = 5;

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesDept = deptFilter === 'All Departments' || u.department === deptFilter;
    const matchesClass = classFilter === 'All Classes' || u.className === classFilter;
    const matchesRole = roleFilter === 'All Roles' || u.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All Statuses' || u.approval === statusFilter;

    return matchesSearch && matchesDept && matchesClass && matchesRole && matchesStatus;
  });

  const totalUserPages = Math.ceil(filteredUsers.length / userPageSize) || 1;
  const paginatedUsers = filteredUsers.slice((userPage - 1) * userPageSize, userPage * userPageSize);

  const handleOpenAddUserModal = () => {
    setNewUserNameModal('');
    setNewUserEmailModal('');
    setNewUserRoleModal('student');
    setNewUserDeptModal('CS');
    setNewUserClassModal('BCA A');
    setShowAddUserModal(true);
  };

  // ----------------------------------------------------
  // DATASET 4: DEPARTMENT MANAGEMENT
  // ----------------------------------------------------
  const [deptsList, setDeptsList] = useState<AdminDept[]>([]);

  // Synchronize Departments & Classes from global AppContext
  useEffect(() => {
    if (departments) {
      setDeptsList(
        departments.map((d) => {
          const deptClasses = (classes || []).filter((c) => {
            if (!c || !c.name) return false;
            const cDept = (c.department || '').toLowerCase().trim();
            const cCode = (c.department_code || '').toLowerCase().trim();
            const dName = (d.name || '').toLowerCase().trim();
            const dCode = (d.code || '').toLowerCase().trim();

            return (
              (cCode && dCode && cCode === dCode) ||
              (cDept && dName && cDept === dName) ||
              (cDept && dCode && cDept === dCode) ||
              (cCode && dName && cCode === dName)
            );
          });
          return {
            name: d.name,
            code: d.code,
            classes: deptClasses.map((c) => c.name)
          };
        })
      );
    }
  }, [departments, classes]);

  const [newDeptInput, setNewDeptInput] = useState('');
  const [newClassInputs, setNewClassInputs] = useState<Record<string, string>>({});

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptInput.trim()) return;
    const code = newDeptInput.trim().toUpperCase().split(' ').map(w => w[0]).join('').substring(0, 5);
    addDepartmentGlobal(newDeptInput.trim(), code);
    setNewDeptInput('');
  };

  const handleDeleteDept = (deptName: string) => {
    const dept = departments?.find(d => d.name === deptName || d.code === deptName);
    const code = dept ? dept.code : deptName;
    setConfirmModal({
      isOpen: true,
      title: 'Delete Department',
      description: `Are you sure you want to delete department ${code}?`,
      confirmText: 'Delete Department',
      confirmVariant: 'danger',
      onConfirm: () => {
        deleteDepartmentGlobal(code);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        toast.info(`Department "${code}" deleted.`);
      },
    });
  };

  const handleAddClass = (deptName: string) => {
    const classVal = newClassInputs[deptName]?.trim();
    if (!classVal) return;
    const dept = departments?.find(d => d.name === deptName || d.code === deptName);
    const code = dept ? dept.code : deptName;
    addClassGlobal(classVal, code);
    setNewClassInputs(prev => ({ ...prev, [deptName]: '' }));
  };

  // ----------------------------------------------------
  // DATASET 5: SETTINGS
  // ----------------------------------------------------
  const [startTimeWindow, setStartTimeWindow] = useState(submissionWindowStart || '');
  const [endTimeWindow, setEndTimeWindow] = useState(submissionWindowEnd || '');

  React.useEffect(() => {
    setStartTimeWindow(submissionWindowStart || '');
    setEndTimeWindow(submissionWindowEnd || '');
  }, [submissionWindowStart, submissionWindowEnd]);

  // ----------------------------------------------------
  // DATASET 6: MODERATION SETTINGS (per-class N/P edits)
  // ----------------------------------------------------
  // Local state to track unsaved edits for each class's N and P
  const [classModerationEdits, setClassModerationEdits] = useState<
    Record<number, { num_students: number; negative_points: number }>
  >({});
  const [localSmallestClassSize, setLocalSmallestClassSize] = useState<number>(smallestClassSize);
  React.useEffect(() => {
    setLocalSmallestClassSize(smallestClassSize);
  }, [smallestClassSize]);


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
        {/* TAB 1: ACADEMIC YEARS                                */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'years' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Section Intro */}
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Academic Year Management</h1>
              <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#6B7280', marginTop: '4px', margin: 0 }}>Add new academic years and activate the current session.</p>
            </div>

            {/* Card 1 — Create / Add Section */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid #E5E7EB',
              padding: '28px',
              boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginTop: 0, marginBottom: '20px' }}>Add Academic Year</h3>
              <form onSubmit={handleAddYear} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#9CA3AF',
                    marginBottom: '8px'
                  }}>
                    YEAR FORMAT (E.G. 2026-2027)
                  </label>
                  <input
                    type="text"
                    placeholder="YYYY-YYYY"
                    value={newYearInput}
                    onChange={(e) => setNewYearInput(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      borderRadius: '9999px',
                      padding: '12px 22px',
                      border: '1px solid #E5E7EB',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#1F2937',
                      background: '#F9FAFB',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    style={{
                      background: '#FF6B2C',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      borderRadius: '9999px',
                      padding: '12px 30px',
                      fontSize: '0.88rem',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(255, 107, 44, 0.25)',
                      transition: 'all 0.2s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>+</span> Add Year
                  </button>
                </div>
              </form>
            </div>

            {/* Card 2 — Data Table Section */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid #E5E7EB',
              padding: '28px',
              boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginTop: 0, marginBottom: '20px' }}>Academic Years List</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <th style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', paddingBottom: '16px' }}>ACADEMIC YEAR</th>
                      <th style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', paddingBottom: '16px' }}>STATUS</th>
                      <th style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', paddingBottom: '16px', textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {academicYears.map((y) => (
                      <tr key={y.year} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '16px 0', fontWeight: 700, color: '#111827', fontSize: '0.92rem' }}>{y.year}</td>
                        <td style={{ padding: '16px 0' }}>
                          {y.status === 'Active' ? (
                            <span style={{
                              background: '#DCFCE7',
                              color: '#15803D',
                              borderRadius: '9999px',
                              padding: '5px 16px',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#15803D' }} />
                              Active
                            </span>
                          ) : (
                            <span style={{
                              background: '#FFEDD5',
                              color: '#C2410C',
                              borderRadius: '9999px',
                              padding: '5px 16px',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C2410C' }} />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '16px 0', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
                            {y.status === 'Active' ? (
                              <button
                                style={{
                                  border: '1px solid #EF4444',
                                  color: '#EF4444',
                                  background: 'transparent',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  padding: '8px 18px',
                                  borderRadius: '9999px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={() => handleToggleYearStatus(y.year, false)}
                              >
                                Set Inactive
                              </button>
                            ) : (
                              <button
                                style={{
                                  background: '#10B981',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  padding: '8px 18px',
                                  borderRadius: '9999px',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={() => handleToggleYearStatus(y.year, true)}
                              >
                                Set Active
                              </button>
                            )}
                            <button
                              style={{
                                background: '#EF4444',
                                color: '#FFFFFF',
                                border: 'none',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                padding: '8px 18px',
                                borderRadius: '9999px',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => handleDeleteYear(y.year)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: CRITERIA MANAGEMENT                           */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'criteria' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {selectedCategory ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Back & Add Item Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    className="btn"
                    style={{
                      background: '#ffffff',
                      color: '#ea580c',
                      border: '1.5px solid #ea580c',
                      fontWeight: 700,
                      padding: '8px 20px',
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setSelectedCategory(null);
                      setShowAddItemForm(false);
                    }}
                  >
                    ← Back to Modules
                  </button>

                  <button
                    className="btn"
                    style={{
                      background: '#ea580c',
                      color: '#ffffff',
                      fontWeight: 700,
                      padding: '10px 22px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: 'none'
                    }}
                    onClick={() => setShowAddItemForm(!showAddItemForm)}
                  >
                    + Add Item
                  </button>
                </div>

                <div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>{selectedCategory.title}</h1>
                  <p className="muted" style={{ fontSize: '0.88rem', margin: 0 }}>Detailed view of evaluation items for this module.</p>
                </div>

                {/* Add Item form */}
                {showAddItemForm && (
                  <div className="card" style={{ border: '1.5px solid var(--primary)', background: '#ffffff', borderRadius: '16px', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                        Add Criteria Item to {selectedCategory.category}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowAddItemForm(false)}
                        style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleCreateCriteriaItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 800, fontSize: '0.84rem' }}>
                          ITEM TITLE <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. From Marian College, Paper Presentation, Workshop..."
                          value={newItemTitle}
                          onChange={(e) => setNewItemTitle(e.target.value)}
                          required
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 800, fontSize: '0.84rem' }}>TYPE</label>
                          <select
                            className="select"
                            value={newItemType}
                            onChange={(e) => setNewItemType(e.target.value)}
                          >
                            <option value="Count Based">Count Based</option>
                            <option value="Fixed">Fixed</option>
                            <option value="Range Based">Range Based</option>
                            <option value="Negative Marks">Negative Marks</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 800, fontSize: '0.84rem' }}>MARKS / VALUE</label>
                          <input
                            type="number"
                            className="input"
                            value={newItemMarks}
                            onChange={(e) => setNewItemMarks(Number(e.target.value))}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 800, fontSize: '0.84rem' }}>DETAILS / DESCRIPTION</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. per award / presentation"
                          value={newItemDetails}
                          onChange={(e) => setNewItemDetails(e.target.value)}
                        />
                      </div>

                      {/* Sub-Categories toggle & list */}
                      <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>
                          <input
                            type="checkbox"
                            checked={newItemHasSubItems}
                            onChange={(e) => setNewItemHasSubItems(e.target.checked)}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                          />
                          <span>⚡ Enable Sub-Categories / Sub-Items (e.g. 1st Prize, 2nd Prize, etc.)</span>
                        </label>

                        {newItemHasSubItems && (
                          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {newItemSubItems.map((sub, sIdx) => (
                              <div key={sIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                  type="text"
                                  className="input"
                                  value={sub.key}
                                  readOnly
                                  style={{ flex: 1, background: '#ffffff', fontWeight: 600 }}
                                />
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>
                                  {sub.marks} marks
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setNewItemSubItems(prev => prev.filter((_, idx) => idx !== sIdx))}
                                  style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}

                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                              <input
                                type="text"
                                className="input"
                                placeholder="Sub-category name (e.g. 1st Prize Individual)..."
                                value={newItemSubKey}
                                onChange={(e) => setNewItemSubKey(e.target.value)}
                                style={{ flex: 1 }}
                              />
                              <input
                                type="number"
                                className="input"
                                placeholder="Marks"
                                value={newItemSubMarks}
                                onChange={(e) => setNewItemSubMarks(Number(e.target.value))}
                                style={{ width: '90px', textAlign: 'center' }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (!newItemSubKey.trim()) {
                                    toast.warning('Please enter sub-category name');
                                    return;
                                  }
                                  setNewItemSubItems(prev => [...prev, { key: newItemSubKey.trim(), marks: newItemSubMarks }]);
                                  setNewItemSubKey('');
                                  setNewItemSubMarks(5);
                                }}
                                style={{ background: '#6366f1', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}
                              >
                                + Add
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Fields Wanted for Student Submissions */}
                      <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
                        <label style={{ display: 'block', fontWeight: 800, fontSize: '0.86rem', color: '#1e293b', marginBottom: '8px' }}>
                          📋 Fields Wanted for Student Submissions:
                        </label>
                        <p className="muted" style={{ fontSize: '0.78rem', margin: '0 0 12px 0' }}>
                          Check what fields students must fill out when submitting this item:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={newItemFields.url}
                              onChange={(e) => setNewItemFields(prev => ({ ...prev, url: e.target.checked }))}
                              style={{ accentColor: 'var(--primary)' }}
                            />
                            🔗 Google Drive Link URL
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={newItemFields.date}
                              onChange={(e) => setNewItemFields(prev => ({ ...prev, date: e.target.checked }))}
                              style={{ accentColor: 'var(--primary)' }}
                            />
                            📅 Date Field
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={newItemFields.text}
                              onChange={(e) => setNewItemFields(prev => ({ ...prev, text: e.target.checked }))}
                              style={{ accentColor: 'var(--primary)' }}
                            />
                            📝 Text Field (Activity / Title / Topic)
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={newItemFields.count}
                              onChange={(e) => setNewItemFields(prev => ({ ...prev, count: e.target.checked }))}
                              style={{ accentColor: 'var(--primary)' }}
                            />
                            🔢 Count / Frequency Field
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={newItemFields.description}
                              onChange={(e) => setNewItemFields(prev => ({ ...prev, description: e.target.checked }))}
                              style={{ accentColor: 'var(--primary)' }}
                            />
                            📄 Description / Notes Field
                          </label>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                        <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>Save Item</button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddItemForm(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Items list card */}
                <div className="card">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {((criteriaCatalog.find(c => c.id === selectedCategory.id)?.items) || []).map((item: any) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingBottom: '16px',
                          borderBottom: '1px solid var(--glass-border)'
                        }}
                      >
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>{item.title}</h3>
                          <p className="muted" style={{ fontSize: '0.8rem', margin: '0 0 4px 0' }}>
                            Type: {item.type} | Marks: {item.marks} {item.type === 'Count Based' ? '/ count' : ''}
                          </p>
                          <p className="muted" style={{ fontSize: '0.78rem', margin: 0, fontWeight: 600 }}>{item.details}</p>
                          {item.rules_json && item.rules_json.subItems && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                              {Object.entries(item.rules_json.subItems).map(([subKey, subMarks]) => (
                                <span key={subKey} style={{
                                  background: '#f1f5f9',
                                  border: '1px solid #e2e8f0',
                                  color: '#334155',
                                  padding: '4px 10px',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}>
                                  {subKey}
                                  <span style={{
                                    background: '#ffffff',
                                    color: '#ea580c',
                                    padding: '2px 6px',
                                    borderRadius: '9999px',
                                    fontSize: '0.7rem',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                  }}>{String(subMarks)} marks</span>
                                </span>
                              ))}
                            </div>
                          )}
                          {item.rules_json && item.rules_json.fields && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                              {item.rules_json.fields.url && (
                                <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px' }}>
                                  🔗 Drive Link
                                </span>
                              )}
                              {item.rules_json.fields.date && (
                                <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px' }}>
                                  📅 Date
                                </span>
                              )}
                              {item.rules_json.fields.text && (
                                <span style={{ background: '#faf5ff', color: '#7c3aed', border: '1px solid #e9d5ff', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px' }}>
                                  📝 Activity Details
                                </span>
                              )}
                              {item.rules_json.fields.count && (
                                <span style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px' }}>
                                  🔢 Count
                                </span>
                              )}
                              {item.rules_json.fields.description && (
                                <span style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px' }}>
                                  📄 Description
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            style={{ fontWeight: 700 }}
                            onClick={() => handleEditCriteriaItemPrompt(selectedCategory.id, item.id)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', fontWeight: 700 }}
                            onClick={() => handleDeleteCriteriaItem(selectedCategory.id, item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    {((criteriaCatalog.find(c => c.id === selectedCategory.id)?.items) || []).length === 0 && (
                      <p className="muted" style={{ fontSize: '0.88rem', textAlign: 'center', padding: '20px' }}>No evaluation items added to this module yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="admin-header-row">
                  <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Criteria Categories</h1>
                    <p className="muted" style={{ fontSize: '0.88rem' }}>Manage and organize evaluation criteria hierarchies.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                      className="btn"
                      style={{ background: '#f97316', color: '#ffffff', fontWeight: 700 }}
                      onClick={handleOpenAddCategoryModal}
                    >
                      + Add Category
                    </button>
                  </div>
                </div>

                {/* Criteria Grid */}
                <div className="criteria-grid-wrapper">
                  {criteriaCatalog.map((c) => (
                    <div
                      key={c.id}
                      className="card"
                      style={{
                        padding: '20px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: '1.5px solid var(--glass-border)',
                        boxShadow: 'none',
                        borderRadius: '14px',
                        minHeight: '140px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedCategory(c)}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '1.5rem' }}>⚡</span>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                className="btn btn-sm"
                                style={{ background: 'transparent', color: '#ef4444', border: 'none', padding: 0 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmModal({
                                    isOpen: true,
                                    title: 'Delete Category',
                                    description: `Are you sure you want to delete category "${c.category}"?`,
                                    confirmText: 'Delete Category',
                                    confirmVariant: 'danger',
                                    onConfirm: () => {
                                      deleteCriteriaCategory(c.id);
                                      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                                      toast.info(`Category "${c.category}" deleted.`);
                                    },
                                  });
                                }}
                            >
                                Delete
                            </button>
                            <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>&rarr;</span>
                          </div>
                        </div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 6px 0', color: '#0f172a' }}>{c.category}</h3>
                        <p className="muted" style={{ fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>{(c as any).desc || 'No description provided.'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: USER MANAGEMENT                               */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>User Management</h1>
              <p className="muted" style={{ fontSize: '0.88rem' }}>Manage users, approvals, and quick CSV upload.</p>
            </div>

            {/* Action Buttons Top Bar */}
            <div className="admin-actions-bar">
              <button
                className="btn"
                style={{ background: '#f97316', color: '#ffffff', fontWeight: 700 }}
                onClick={handleOpenAddUserModal}
              >
                Add User
              </button>
              <button className="btn btn-secondary" onClick={() => toast.info('Simulated CSV import file picker')}>
                Upload CSV
              </button>
              <button className="btn btn-secondary" onClick={() => toast.info('Downloading user template CSV...')}>
                Download Sample
              </button>
            </div>

            {/* User Filters List */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>Hierarchy View</h3>
              <div className="filters-grid">
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Search</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Search name, category"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(1);
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Department</label>
                  <select
                    className="select"
                    value={deptFilter}
                    onChange={(e) => {
                      setDeptFilter(e.target.value);
                      setUserPage(1);
                    }}
                  >
                    <option value="All Departments">All Departments</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Commerce">Commerce</option>
                    <option value="The Under-Graduate Department of Computer Applications">The Under-Graduate Department of Computer Applications</option>
                    <option value="The Post-Graduate Department of Computer Applications">The Post-Graduate Department of Computer Applications</option>
                    <option value="Business Administration">Business Administration</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Class</label>
                  <select
                    className="select"
                    value={classFilter}
                    onChange={(e) => {
                      setClassFilter(e.target.value);
                      setUserPage(1);
                    }}
                  >
                    <option value="All Classes">All Classes</option>
                    <option value="BSc Math B">BSc Math B</option>
                    <option value="BCom A">BCom A</option>
                    <option value="BCom B">BCom B</option>
                    <option value="BCom C">BCom C</option>
                    <option value="BCA A">BCA A</option>
                    <option value="BBA A">BBA A</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Role</label>
                  <select
                    className="select"
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setUserPage(1);
                    }}
                  >
                    <option value="All Roles">All Roles</option>
                    <option value="Student">Student</option>
                    <option value="Teacher">Teacher</option>
                    <option value="IQAC">IQAC</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Status</label>
                  <select
                    className="select"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setUserPage(1);
                    }}
                  >
                    <option value="All Statuses">All Statuses</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Class</th>
                      <th>Approval</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((u) => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 700 }}>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                        <td>{u.department}</td>
                        <td>{u.className}</td>
                        <td>
                          <span className="badge badge-verified">{u.approval}</span>
                        </td>
                        <td style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => toast.info(`Editing user: ${u.name}`)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', fontWeight: 700 }}
                            onClick={() => toast.warning('Role delete action is currently blocked.')}
                          >
                            Delete Blocked
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* User Pagination */}
              <div className="pagination-container">
                <button
                  className="pagination-btn"
                  disabled={userPage <= 1}
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                {Array.from({ length: totalUserPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`pagination-num ${userPage === pageNum ? 'active' : ''}`}
                    onClick={() => setUserPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  className="pagination-btn"
                  disabled={userPage >= totalUserPages}
                  onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: DEPARTMENT MANAGEMENT                         */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'departments' && (
          <DepartmentHierarchyManager />
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 5: SETTINGS                                      */}
        {/* ---------------------------------------------------- */}
        {/* TAB 5: SYSTEM SETTINGS                               */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Settings</h1>
              <p className="muted" style={{ fontSize: '0.88rem' }}>Manage submission status, evaluation access, time windows, and active academic year.</p>
            </div>

            {/* Split Status Toggles row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 6px 0' }}>Submission Status</h3>
                  <p className="muted" style={{ fontSize: '0.8rem', margin: 0 }}>Accept new claims from students system-wide.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  {submissionOpen ? (
                    <span className="badge badge-verified">ON</span>
                  ) : (
                    <span className="badge badge-correction">OFF</span>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setConfirmSubmissionModal(true)}
                  >
                    Toggle Submission ({submissionOpen ? 'ON' : 'OFF'})
                  </button>
                </div>
              </div>

              <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 6px 0' }}>Evaluation Status</h3>
                  <p className="muted" style={{ fontSize: '0.8rem', margin: 0 }}>Permit class advisors and evaluators to score claims.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  {evaluationOpen ? (
                    <span className="badge badge-verified">ON</span>
                  ) : (
                    <span className="badge badge-correction">OFF</span>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setConfirmEvaluationModal(true)}
                  >
                    Toggle Evaluation ({evaluationOpen ? 'ON' : 'OFF'})
                  </button>
                </div>
              </div>
            </div>

            {/* Submission Time Window Card */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '6px' }}>📅 Submission Time Window</h3>
              <p className="muted" style={{ fontSize: '0.82rem', marginBottom: '20px' }}>
                Set the start and end date/time for the submission period. Students can only submit claims within this window.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={startTimeWindow}
                    onChange={(e) => setStartTimeWindow(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date & Time</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={endTimeWindow}
                    onChange={(e) => setEndTimeWindow(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn"
                  style={{ background: '#f97316', color: '#ffffff', fontWeight: 700 }}
                  onClick={() => {
                    setSubmissionWindow(startTimeWindow, endTimeWindow);
                    toast.success(`Submission window saved: ${startTimeWindow || 'Immediately'} to ${endTimeWindow || 'Open'}`);
                  }}
                >
                  Save Time Window
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setStartTimeWindow('');
                    setEndTimeWindow('');
                    setSubmissionWindow('', '');
                    toast.info('Submission time window cleared.');
                  }}
                >
                  Clear Time Window
                </button>
              </div>
            </div>

            {/* Bottom Row Academic Year Info */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '6px' }}>Academic Year</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 700, margin: '0 0 6px 0' }}>
                Active Year: {globalActiveYear || '2025-2026'}
              </p>
              <p className="muted" style={{ fontSize: '0.8rem', margin: 0 }}>
                Manage academic years in the Academic Years module. Changing the active academic year updates the active year system-wide.
              </p>
            </div>
            {/* Confirmation Modal for Submission Status */}
            {confirmSubmissionModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(4px)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}>
                <div className="card" style={{
                  maxWidth: '480px',
                  width: '100%',
                  padding: '28px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                  borderRadius: '16px',
                  background: '#ffffff',
                  border: '1px solid rgba(15, 23, 42, 0.12)',
                  animation: 'fadeIn 0.2s ease-out'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: submissionOpen ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: submissionOpen ? '#ef4444' : '#16a34a',
                      fontWeight: 800,
                      fontSize: '1.2rem'
                    }}>
                      ⚠️
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                        Confirm Submission Status Change
                      </h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                        Admin authorization required
                      </p>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.5, marginBottom: '20px' }}>
                    {submissionOpen ? (
                      <>Are you sure you want to turn <strong style={{ color: '#ef4444' }}>OFF</strong> system-wide submissions? Students will be blocked from submitting new activity claims until re-opened.</>
                    ) : (
                      <>Are you sure you want to turn <strong style={{ color: '#16a34a' }}>ON</strong> system-wide submissions? Students will be able to submit new activity claims.</>
                    )}
                  </p>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#f8fafc',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    marginBottom: '24px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Status Transition:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${submissionOpen ? 'badge-verified' : 'badge-correction'}`}>
                        {submissionOpen ? 'ON' : 'OFF'}
                      </span>
                      <span style={{ color: '#94a3b8', fontWeight: 700 }}>➔</span>
                      <span className={`badge ${!submissionOpen ? 'badge-verified' : 'badge-correction'}`}>
                        {!submissionOpen ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setConfirmSubmissionModal(false)}
                      style={{ fontWeight: 600 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        background: submissionOpen ? '#dc2626' : '#16a34a',
                        color: '#ffffff',
                        fontWeight: 700
                      }}
                      onClick={() => {
                        toggleSubmissionOpen();
                        setConfirmSubmissionModal(false);
                      }}
                    >
                      Confirm & Update Status
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Modal for Evaluation Status */}
            {confirmEvaluationModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(4px)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}>
                <div className="card" style={{
                  maxWidth: '480px',
                  width: '100%',
                  padding: '28px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                  borderRadius: '16px',
                  background: '#ffffff',
                  border: '1px solid rgba(15, 23, 42, 0.12)',
                  animation: 'fadeIn 0.2s ease-out'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: evaluationOpen ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: evaluationOpen ? '#ef4444' : '#16a34a',
                      fontWeight: 800,
                      fontSize: '1.2rem'
                    }}>
                      ⚠️
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                        Confirm Evaluation Status Change
                      </h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                        Admin authorization required
                      </p>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.5, marginBottom: '20px' }}>
                    {evaluationOpen ? (
                      <>Are you sure you want to turn <strong style={{ color: '#ef4444' }}>OFF</strong> evaluation access? Class advisors and evaluators will be restricted from scoring claims.</>
                    ) : (
                      <>Are you sure you want to turn <strong style={{ color: '#16a34a' }}>ON</strong> evaluation access? Class advisors and evaluators will be allowed to score student claims.</>
                    )}
                  </p>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#f8fafc',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    marginBottom: '24px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Status Transition:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${evaluationOpen ? 'badge-verified' : 'badge-correction'}`}>
                        {evaluationOpen ? 'ON' : 'OFF'}
                      </span>
                      <span style={{ color: '#94a3b8', fontWeight: 700 }}>➔</span>
                      <span className={`badge ${!evaluationOpen ? 'badge-verified' : 'badge-correction'}`}>
                        {!evaluationOpen ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setConfirmEvaluationModal(false)}
                      style={{ fontWeight: 600 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        background: evaluationOpen ? '#dc2626' : '#16a34a',
                        color: '#ffffff',
                        fontWeight: 700
                      }}
                      onClick={() => {
                        toggleEvaluationOpen();
                        setConfirmEvaluationModal(false);
                      }}
                    >
                      Confirm & Update Status
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================
          ROOT-LEVEL EDIT ITEM MODAL — always overlays everything
          ============================================================ */}
      {editItemModal && (() => {
        // Parse rules_json safely
        let parsedRules: any = {};
        try { parsedRules = editItemModal.rules_json ? JSON.parse(editItemModal.rules_json) : {}; } catch(e) {}
        const subItems: Record<string, number> = parsedRules.subItems || {};
        const subEntries = Object.entries(subItems) as [string, number][];

        const handleSubChange = (key: string, val: number) => {
          const next = { ...parsedRules, subItems: { ...subItems, [key]: val } };
          setEditItemModal({ ...editItemModal, rules_json: JSON.stringify(next, null, 2) });
        };

        const handleSubRemove = (key: string) => {
          const nextSubs = { ...subItems };
          delete nextSubs[key];
          const next = Object.keys(nextSubs).length > 0
            ? { ...parsedRules, subItems: nextSubs }
            : { ...parsedRules };
          if (!Object.keys(nextSubs).length) delete next.subItems;
          setEditItemModal({ ...editItemModal, rules_json: Object.keys(next).length ? JSON.stringify(next, null, 2) : '' });
        };

        const handleSubAdd = () => {
          if (!newSubKey.trim()) return;
          handleSubChange(newSubKey.trim(), 0);
          setNewSubKey('');
        };

        const handleSave = () => {
          let finalRules = null;
          if (editItemModal.rules_json && editItemModal.rules_json.trim()) {
            try { finalRules = JSON.parse(editItemModal.rules_json); }
            catch { return; } // silently block save on bad JSON
          }
          updateCriteriaItem(editItemModal.catId, parseInt(editItemModal.itemId, 10), {
            title: editItemModal.title,
            marks: editItemModal.marks,
            details: editItemModal.details,
            rules_json: finalRules
          });
          setEditItemModal(null);
          setNewSubKey('');
        };

        return (
          <div
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(15,23,42,0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 99999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px'
            }}
            onClick={(e) => { if (e.target === e.currentTarget) { setEditItemModal(null); setNewSubKey(''); } }}
          >
            <div style={{
              background: '#fff',
              width: '100%', maxWidth: '560px',
              borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              maxHeight: '90vh'
            }}>
              {/* Header */}
              <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Edit Criteria Item</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Modify title, marks, sub-categories, then save.</p>
                </div>
                <button
                  onClick={() => { setEditItemModal(null); setNewSubKey(''); }}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', fontSize: '1.1rem', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >✕</button>
              </div>

              {/* Scrollable Body */}
              <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>

                {/* Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Title</label>
                  <input
                    type="text" className="input"
                    value={editItemModal.title}
                    onChange={(e) => setEditItemModal({ ...editItemModal, title: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Marks */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Marks</label>
                  <input
                    type="number" className="input"
                    value={editItemModal.marks}
                    onChange={(e) => setEditItemModal({ ...editItemModal, marks: Number(e.target.value) })}
                    style={{ width: '160px' }}
                  />
                </div>

                {/* Details */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Details / Description</label>
                  <input
                    type="text" className="input"
                    value={editItemModal.details || ''}
                    onChange={(e) => setEditItemModal({ ...editItemModal, details: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Sub-Categories */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sub-Categories</label>

                  {subEntries.length === 0 && (
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 12px' }}>No sub-categories — this item uses its base marks directly.</p>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {subEntries.map(([key, val]) => (
                      <div key={key} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text" className="input"
                          value={key} readOnly
                          style={{ flex: 1, background: '#f1f5f9', color: '#334155', fontWeight: 600 }}
                        />
                        <input
                          type="number" className="input"
                          value={val}
                          onChange={(e) => handleSubChange(key, Number(e.target.value))}
                          style={{ width: '80px', textAlign: 'center' }}
                        />
                        <button
                          onClick={() => handleSubRemove(key)}
                          style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }}
                        >✕</button>
                      </div>
                    ))}
                  </div>

                  {/* Add new sub-category row */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <input
                      type="text" className="input"
                      placeholder="New sub-category name…"
                      value={newSubKey}
                      onChange={(e) => setNewSubKey(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSubAdd(); }}
                      style={{ flex: 1 }}
                    />
                    <button
                      onClick={handleSubAdd}
                      style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 16px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >+ Add</button>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div style={{ padding: '16px 28px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', justifyContent: 'flex-end', background: '#f8fafc' }}>
                <button
                  onClick={() => { setEditItemModal(null); setNewSubKey(''); }}
                  style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '10px', padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
                >Cancel</button>
                <button
                  onClick={handleSave}
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 28px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}
                >💾 Save Changes</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ---------------------------------------------------- */}
      {/* ADD CATEGORY & ITEMS MODAL                           */}
      {/* ---------------------------------------------------- */}
      <CustomModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        title="Add Criteria Category & Items"
        icon="⚡"
        description="Create a new evaluation category and define its items, sub-categories, and student submission fields."
        confirmText="💾 Create Category & Items"
        cancelText="Cancel"
        maxWidth="720px"
        onConfirm={async () => {
          if (!newCatTitleModal.trim()) {
            toast.warning('Please enter a category name');
            return;
          }
          const validItems = catItemsDraft.filter(it => it.title.trim());
          if (validItems.length === 0) {
            toast.warning('Please add at least one item title for this category');
            return;
          }

          const categoryCode = `cat-${Date.now()}`;
          const createdCat = await addCriteriaCategory({
            code: categoryCode,
            category: newCatTitleModal.trim(),
            accessLevel: newCatAccessModal,
            desc: newCatDescModal.trim() || 'Custom category description.'
          } as any);

          const targetCatId = createdCat?.id || categoryCode;

          for (const item of validItems) {
            const rules_json: any = {};
            if (item.hasSubItems && item.subItems.length > 0) {
              rules_json.subItems = {};
              item.subItems.forEach(s => {
                if (s.key.trim()) rules_json.subItems[s.key.trim()] = s.marks;
              });
            }
            rules_json.fields = item.fields;

            await addCriteriaItem(targetCatId, {
              title: item.title.trim(),
              type: item.type as any,
              marks: item.marks,
              details: item.details.trim() || `${item.type} evaluation item`,
              rules_json
            });
          }

          setShowAddCategoryModal(false);
          toast.success(`Category "${newCatTitleModal}" and ${validItems.length} item(s) created!`);
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '12px' }}>
          {/* Section 1: Category Info */}
          <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              📁 Category Details
            </h4>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                CATEGORY NAME <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Prizes, Innovative Suggestions, Academic Projects..."
                value={newCatTitleModal}
                onChange={(e) => setNewCatTitleModal(e.target.value)}
                style={{ width: '100%' }}
                autoFocus
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  ACCESS LEVEL
                </label>
                <select
                  className="select"
                  value={newCatAccessModal}
                  onChange={(e: any) => setNewCatAccessModal(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="all_students">All Students</option>
                  <option value="student_rep_only">Student Rep Only</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  DESCRIPTION
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Short description of this category..."
                  value={newCatDescModal}
                  onChange={(e) => setNewCatDescModal(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Items & Sub-Categories Builder */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                  ⚡ Category Items & Sub-Categories
                </h4>
                <p className="muted" style={{ margin: '2px 0 0 0', fontSize: '0.8rem' }}>
                  Add the items, sub-items, and required input fields for this category.
                </p>
              </div>
              <button
                type="button"
                onClick={addDraftItem}
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: 'var(--primary)',
                  border: '1.5px solid rgba(99, 102, 241, 0.3)',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                + Add Another Item
              </button>
            </div>

            {catItemsDraft.map((item, itemIdx) => (
              <div
                key={item.id}
                style={{
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '18px',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📌 Item #{itemIdx + 1}
                  </span>
                  {catItemsDraft.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDraftItem(itemIdx)}
                      style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      ✕ Remove Item
                    </button>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    ITEM TITLE <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. From Marian College, Outside Marian College, Workshop..."
                    value={item.title}
                    onChange={(e) => updateDraftItem(itemIdx, { title: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      TYPE
                    </label>
                    <select
                      className="select"
                      value={item.type}
                      onChange={(e) => updateDraftItem(itemIdx, { type: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      <option value="Count Based">Count Based</option>
                      <option value="Fixed">Fixed</option>
                      <option value="Range Based">Range Based</option>
                      <option value="Negative Marks">Negative Marks</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      BASE MARKS
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={item.marks}
                      onChange={(e) => updateDraftItem(itemIdx, { marks: Number(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      DETAILS / NOTE
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. per award"
                      value={item.details}
                      onChange={(e) => updateDraftItem(itemIdx, { details: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                {/* Sub-Items Toggle & Builder */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                    <input
                      type="checkbox"
                      checked={item.hasSubItems}
                      onChange={(e) => updateDraftItem(itemIdx, { hasSubItems: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                    <span>⚡ Has Sub-Categories / Sub-Items (e.g. 1st Prize, 2nd Prize, Outside Marian, etc.)</span>
                  </label>

                  {item.hasSubItems && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {item.subItems.map((sub, sIdx) => (
                        <div key={sIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="input"
                            value={sub.key}
                            readOnly
                            style={{ flex: 1, background: '#ffffff', fontWeight: 600, fontSize: '0.85rem' }}
                          />
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>
                            {sub.marks} marks
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSubItemFromDraft(itemIdx, sIdx)}
                            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', fontWeight: 700 }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <input
                          type="text"
                          className="input"
                          placeholder="Sub-item name (e.g. 1st Prize Individual)..."
                          value={item.newSubKeyInput || ''}
                          onChange={(e) => updateDraftItem(itemIdx, { newSubKeyInput: e.target.value })}
                          style={{ flex: 1, fontSize: '0.85rem' }}
                        />
                        <input
                          type="number"
                          className="input"
                          placeholder="Marks"
                          value={item.newSubMarksInput ?? 5}
                          onChange={(e) => updateDraftItem(itemIdx, { newSubMarksInput: Number(e.target.value) })}
                          style={{ width: '80px', textAlign: 'center', fontSize: '0.85rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => addSubItemToDraft(itemIdx)}
                          style={{ background: '#6366f1', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                        >
                          + Add Sub-Item
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Required Fields Selector */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.82rem', color: '#334155', marginBottom: '8px' }}>
                    📋 Fields Wanted for Student Submissions:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={item.fields.url}
                        onChange={(e) => updateDraftItem(itemIdx, { fields: { ...item.fields, url: e.target.checked } })}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      🔗 Drive Link URL
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={item.fields.date}
                        onChange={(e) => updateDraftItem(itemIdx, { fields: { ...item.fields, date: e.target.checked } })}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      📅 Date Field
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={item.fields.text}
                        onChange={(e) => updateDraftItem(itemIdx, { fields: { ...item.fields, text: e.target.checked } })}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      📝 Text Field (Activity Details / Topic)
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={item.fields.count}
                        onChange={(e) => updateDraftItem(itemIdx, { fields: { ...item.fields, count: e.target.checked } })}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      🔢 Count / Frequency
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, background: '#ffffff', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={item.fields.description}
                        onChange={(e) => updateDraftItem(itemIdx, { fields: { ...item.fields, description: e.target.checked } })}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      📄 Description
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CustomModal>

      {/* ---------------------------------------------------- */}
      {/* ADD USER MODAL                                       */}
      {/* ---------------------------------------------------- */}
      <CustomModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        title="Add New User"
        icon="👤"
        description="Register a new user account in the system."
        confirmText="Add User"
        cancelText="Cancel"
        onConfirm={() => {
          if (!newUserNameModal.trim() || !newUserEmailModal.trim()) {
            toast.warning('Please fill in both Name and Email');
            return;
          }
          addUserGlobal(
            newUserEmailModal.trim(),
            newUserRoleModal.toLowerCase(),
            newUserNameModal.trim(),
            newUserDeptModal.trim(),
            newUserClassModal.trim()
          );
          setShowAddUserModal(false);
          toast.success(`User "${newUserNameModal}" added successfully!`);
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              FULL NAME <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Santhosh Kannan"
              value={newUserNameModal}
              onChange={(e) => setNewUserNameModal(e.target.value)}
              style={{ width: '100%' }}
              autoFocus
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              EMAIL ADDRESS <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="email"
              className="input"
              placeholder="e.g. santhosh.25pmc152@mariancollege.org"
              value={newUserEmailModal}
              onChange={(e) => setNewUserEmailModal(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                ROLE
              </label>
              <select
                className="select"
                value={newUserRoleModal}
                onChange={(e) => setNewUserRoleModal(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty / Class Teacher</option>
                <option value="evaluation">Evaluator</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                DEPARTMENT CODE
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. CS"
                value={newUserDeptModal}
                onChange={(e) => setNewUserDeptModal(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              CLASS NAME
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. BCA A or II MCA"
              value={newUserClassModal}
              onChange={(e) => setNewUserClassModal(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </CustomModal>

      {/* ---------------------------------------------------- */}
      {/* GENERIC CONFIRMATION MODAL                           */}
      {/* ---------------------------------------------------- */}
      <CustomModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        title={confirmModal.title}
        icon="⚠️"
        description={confirmModal.description}
        confirmText={confirmModal.confirmText || 'Confirm'}
        cancelText="Cancel"
        confirmVariant={confirmModal.confirmVariant || 'danger'}
        onConfirm={confirmModal.onConfirm}
      />

    </div>
  );
};

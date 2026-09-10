'use client';

import React, { useState, useMemo } from 'react';
import { useApp, Department, Course } from '@/context/AppContext';

export function DepartmentHierarchyManager() {
  const {
    departments,
    courses,
    classes,
    users,
    userGroups,
    createDepartment,
    updateDepartment,
    deleteDepartmentById,
    createCourse,
    updateCourse,
    deleteCourse,
    createClass,
    updateClass,
    deleteClass,
    smallestClassSize,
    updateSmallestClassSize,
  } = useApp();

  // Accordion open states
  const [expandedDepts, setExpandedDepts] = useState<Record<number, boolean>>({});
  const [expandedCourses, setExpandedCourses] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Smallest class size state for moderation settings
  const [localSmallestClassSize, setLocalSmallestClassSize] = useState<number>(smallestClassSize);
  React.useEffect(() => {
    setLocalSmallestClassSize(smallestClassSize);
  }, [smallestClassSize]);

  // Modals state
  const [deptModal, setDeptModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    dept?: Department;
  }>({ isOpen: false, mode: 'add' });

  const [courseModal, setCourseModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    deptId?: number;
    course?: Course;
  }>({ isOpen: false, mode: 'add' });

  const [classModal, setClassModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    courseId?: number;
    deptId?: number;
    cls?: any;
  }>({ isOpen: false, mode: 'add' });

  // Delete confirmations
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'department' | 'course' | 'class';
    id: number;
    name: string;
    courseCount?: number;
    classCount?: number;
  } | null>(null);

  // Form states for modals
  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    email_prefix: '',
    level: 'UG' as 'UG' | 'PG' | 'Professional' | 'Other',
  });

  const [courseForm, setCourseForm] = useState({
    department: 0,
    name: '',
    abbreviation: '',
    email_code: '',
    is_multi_batch: false,
    duration_years: 2,
  });

  const [classForm, setClassForm] = useState({
    course_id: 0,
    year_number: 1,
    section: '',
    classTeacher: '',
    num_students: 50,
    negative_points: 0,
  });

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // Inline class moderation/advisor edit state: classId -> { num_students, negative_points, classTeacher }
  const [classEdits, setClassEdits] = useState<Record<number, { num_students?: number; negative_points?: number; classTeacher?: string }>>({});

  // Faculty and Council groups
  const classTeachersGroup = useMemo(
    () => (userGroups || []).find((g) => g.name === 'Class Teachers Council' || g.id === 'grp-class-teachers'),
    [userGroups]
  );

  const availableFaculty = useMemo(() => {
    return users
      .filter((u) => u.role === 'teacher' || u.role === 'faculty')
      .sort((a, b) => {
        const aInGroup = classTeachersGroup?.emails.some((e) => e.toLowerCase().trim() === a.email.toLowerCase().trim());
        const bInGroup = classTeachersGroup?.emails.some((e) => e.toLowerCase().trim() === b.email.toLowerCase().trim());
        if (aInGroup && !bInGroup) return -1;
        if (!aInGroup && bInGroup) return 1;
        return (a.name || a.email).localeCompare(b.name || b.email);
      });
  }, [users, classTeachersGroup]);

  // Toggle accordions
  const toggleDept = (deptId: number) => {
    setExpandedDepts((prev) => ({ ...prev, [deptId]: !prev[deptId] }));
  };

  const toggleCourse = (courseId: number) => {
    setExpandedCourses((prev) => ({ ...prev, [courseId]: !prev[courseId] }));
  };

  // Filtered departments
  const filteredDepts = useMemo(() => {
    if (!searchQuery.trim()) return departments;
    const q = searchQuery.toLowerCase().trim();
    return departments.filter((d) => {
      const matchDept = (d.name || '').toLowerCase().includes(q) || (d.code || '').toLowerCase().includes(q);
      const matchCourse = courses.some(
        (c) => c.department === d.id && ((c.name || '').toLowerCase().includes(q) || (c.abbreviation || '').toLowerCase().includes(q))
      );
      const matchClass = classes.some(
        (cls) => (cls.department_code === d.code || cls.department === d.name) && (cls.name || '').toLowerCase().includes(q)
      );
      return matchDept || matchCourse || matchClass;
    });
  }, [departments, courses, classes, searchQuery]);

  // Modal open handlers
  const openAddDept = () => {
    setDeptForm({ name: '', code: '', email_prefix: '', level: 'UG' });
    setDeptModal({ isOpen: true, mode: 'add' });
  };

  const openEditDept = (dept: Department) => {
    setDeptForm({
      name: dept.name,
      code: dept.code,
      email_prefix: dept.email_prefix || '',
      level: (dept.level as any) || 'UG',
    });
    setDeptModal({ isOpen: true, mode: 'edit', dept });
  };

  const openAddCourse = (deptId: number) => {
    setCourseForm({
      department: deptId,
      name: '',
      abbreviation: '',
      email_code: '',
      is_multi_batch: false,
      duration_years: 2,
    });
    setCourseModal({ isOpen: true, mode: 'add', deptId });
  };

  const openEditCourse = (course: Course) => {
    setCourseForm({
      department: course.department,
      name: course.name,
      abbreviation: course.abbreviation,
      email_code: course.email_code,
      is_multi_batch: course.is_multi_batch,
      duration_years: course.duration_years,
    });
    setCourseModal({ isOpen: true, mode: 'edit', course });
  };

  const openAddClass = (course: Course) => {
    setClassForm({
      course_id: course.id,
      year_number: 1,
      section: course.is_multi_batch ? 'A' : '',
      classTeacher: '',
      num_students: 50,
      negative_points: 0,
    });
    setClassModal({ isOpen: true, mode: 'add', courseId: course.id, deptId: course.department });
  };

  const openEditClass = (cls: any) => {
    setClassForm({
      course_id: cls.course || 0,
      year_number: cls.year_number || 1,
      section: cls.section || '',
      classTeacher: cls.classTeacher || cls.class_teacher_email || '',
      num_students: cls.num_students || 0,
      negative_points: cls.negative_points || 0,
    });
    setClassModal({ isOpen: true, mode: 'edit', cls });
  };

  // Submission handlers
  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name.trim()) return;
    const code = deptForm.code.trim() || deptForm.name.trim().toUpperCase().split(' ').map(w => w[0]).join('').substring(0, 5);

    if (deptModal.mode === 'add') {
      const res = await createDepartment({
        name: deptForm.name.trim(),
        code,
        email_prefix: deptForm.email_prefix.trim().toLowerCase(),
        level: deptForm.level,
      });
      if (res.success) {
        showStatus(`Department "${deptForm.name}" created successfully.`);
        setDeptModal({ isOpen: false, mode: 'add' });
      } else {
        showStatus(res.error || 'Failed to create department', 'error');
      }
    } else if (deptModal.dept) {
      const res = await updateDepartment(deptModal.dept.id, {
        name: deptForm.name.trim(),
        code,
        email_prefix: deptForm.email_prefix.trim().toLowerCase(),
        level: deptForm.level,
      });
      if (res.success) {
        showStatus(`Department "${deptForm.name}" updated successfully.`);
        setDeptModal({ isOpen: false, mode: 'edit' });
      } else {
        showStatus(res.error || 'Failed to update department', 'error');
      }
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.name.trim() || !courseForm.abbreviation.trim() || !courseForm.email_code.trim()) {
      showStatus('All course fields are required.', 'error');
      return;
    }

    if (courseModal.mode === 'add') {
      const res = await createCourse({
        department: courseForm.department,
        name: courseForm.name.trim(),
        abbreviation: courseForm.abbreviation.trim().toUpperCase(),
        email_code: courseForm.email_code.trim().toLowerCase(),
        is_multi_batch: courseForm.is_multi_batch,
        duration_years: Number(courseForm.duration_years),
      });
      if (res.success) {
        showStatus(`Course "${courseForm.abbreviation}" created.`);
        setExpandedDepts((prev) => ({ ...prev, [courseForm.department]: true }));
        setCourseModal({ isOpen: false, mode: 'add' });
      } else {
        showStatus(res.error || 'Failed to create course', 'error');
      }
    } else if (courseModal.course) {
      const res = await updateCourse(courseModal.course.id, {
        name: courseForm.name.trim(),
        abbreviation: courseForm.abbreviation.trim().toUpperCase(),
        email_code: courseForm.email_code.trim().toLowerCase(),
        is_multi_batch: courseForm.is_multi_batch,
        duration_years: Number(courseForm.duration_years),
      });
      if (res.success) {
        showStatus(`Course "${courseForm.abbreviation}" updated.`);
        setCourseModal({ isOpen: false, mode: 'edit' });
      } else {
        showStatus(res.error || 'Failed to update course', 'error');
      }
    }
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const course = courses.find((c) => c.id === classForm.course_id);
    const roman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'][classForm.year_number] || String(classForm.year_number);
    const generatedName = course
      ? `${roman} ${course.abbreviation}${classForm.section ? ' ' + classForm.section.trim().toUpperCase() : ''}`
      : `Year ${classForm.year_number}`;

    if (classModal.mode === 'add') {
      const res = await createClass({
        course_id: classForm.course_id,
        year_number: Number(classForm.year_number),
        section: classForm.section.trim().toUpperCase(),
        name: generatedName,
      });
      if (res.success) {
        // If class advisor, students count or penalty points provided, save them
        if ((classForm.classTeacher || classForm.num_students || classForm.negative_points) && res.data?.id) {
          await updateClass(res.data.id, {
            classTeacher: classForm.classTeacher,
            num_students: classForm.num_students,
            negative_points: classForm.negative_points,
          });
        }
        showStatus(`Class "${generatedName}" created.`);
        setExpandedCourses((prev) => ({ ...prev, [classForm.course_id]: true }));
        setClassModal({ isOpen: false, mode: 'add' });
      } else {
        showStatus(res.error || 'Failed to create class', 'error');
      }
    } else if (classModal.cls) {
      const res = await updateClass(classModal.cls.id, {
        name: generatedName,
        year_number: Number(classForm.year_number),
        section: classForm.section.trim().toUpperCase(),
        classTeacher: classForm.classTeacher,
        num_students: classForm.num_students,
        negative_points: classForm.negative_points,
      });
      if (res.success) {
        showStatus(`Class "${generatedName}" updated.`);
        setClassModal({ isOpen: false, mode: 'edit' });
      } else {
        showStatus(res.error || 'Failed to update class', 'error');
      }
    }
  };

  // Delete execution
  const executeDelete = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'department') {
      const res = await deleteDepartmentById(deleteConfirm.id);
      if (res.success) {
        showStatus(`Department "${deleteConfirm.name}" and associated courses/classes deleted.`);
      } else {
        showStatus(res.error || 'Failed to delete department', 'error');
      }
    } else if (deleteConfirm.type === 'course') {
      const res = await deleteCourse(deleteConfirm.id);
      if (res.success) {
        showStatus(`Course "${deleteConfirm.name}" and associated classes deleted.`);
      } else {
        showStatus(res.error || 'Failed to delete course', 'error');
      }
    } else if (deleteConfirm.type === 'class') {
      const res = await deleteClass(deleteConfirm.id);
      if (res.success) {
        showStatus(`Class "${deleteConfirm.name}" deleted.`);
      } else {
        showStatus(res.error || 'Failed to delete class', 'error');
      }
    }
    setDeleteConfirm(null);
  };

  // Helper for Roman numerals
  const getRoman = (num: number) => ['', 'I', 'II', 'III', 'IV', 'V', 'VI'][num] || String(num);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-main, #0f172a)' }}>
            Departments, Courses & Classes
          </h1>
          <p className="muted" style={{ fontSize: '0.88rem', marginTop: '4px', marginBottom: 0 }}>
            Configure the 3-level academic hierarchy. Student Google logins automatically detect department, course, and class based on email shortforms.
          </p>
        </div>

        <button
          onClick={openAddDept}
          className="btn"
          style={{
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            color: '#fff',
            fontWeight: 700,
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)',
          }}
        >
          <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Add Department
        </button>
      </div>

      {/* Status Toast */}
      {statusMsg && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.88rem',
            background: statusMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: statusMsg.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${statusMsg.type === 'success' ? '#86efac' : '#fca5a5'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{statusMsg.text}</span>
          <button
            onClick={() => setStatusMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Mark Moderation Settings Card */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          borderRadius: '12px',
          border: '1.5px solid #6366f125',
          background: 'linear-gradient(135deg, #f0f4ff 0%, #fafafa 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 4px 0', color: '#4338CA' }}>
              📐 Mark Moderation Global Settings
            </h3>
            <p className="muted" style={{ fontSize: '0.8rem', margin: 0 }}>
              Smallest class size (<strong>n</strong>) used in the formula:{' '}
              <code style={{ background: '#e0e7ff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                M = (S − P) / N² × (1 + 100 × (N − n))
              </code>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Smallest Size (n):</label>
            <input
              type="number"
              min={0}
              value={localSmallestClassSize}
              onChange={(e) => setLocalSmallestClassSize(Number(e.target.value))}
              className="input"
              style={{ width: '90px', padding: '6px 10px', fontSize: '0.85rem' }}
            />
            <button
              className="btn btn-sm"
              style={{ background: '#4F46E5', color: '#fff', fontWeight: 700, padding: '6px 14px' }}
              onClick={() => {
                updateSmallestClassSize(localSmallestClassSize);
                showStatus(`Global smallest class size set to ${localSmallestClassSize}`);
              }}
            >
              Save n
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="text"
          className="input"
          placeholder="Search by department name, code, course abbreviation, or class..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', fontSize: '0.9rem', borderRadius: '8px' }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="btn btn-sm btn-secondary"
            style={{ padding: '8px 14px' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Departments Accordion List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {filteredDepts.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#64748b',
              borderRadius: '12px',
              border: '1px dashed #cbd5e1',
            }}
          >
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#334155' }}>No Departments Found</h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem' }}>
              {searchQuery ? 'No departments match your search.' : 'Get started by creating your first department.'}
            </p>
            <button onClick={openAddDept} className="btn btn-primary" style={{ fontWeight: 700 }}>
              + Add First Department
            </button>
          </div>
        ) : (
          filteredDepts.map((dept) => {
            const isDeptExpanded = !!expandedDepts[dept.id];
            const deptCourses = courses.filter((c) => c.department === dept.id);
            const deptClasses = classes.filter(
              (cls) =>
                (cls.course && deptCourses.some((dc) => dc.id === cls.course)) ||
                cls.department === dept.name ||
                cls.department_code === dept.code
            );

            const levelColor =
              dept.level === 'PG'
                ? { bg: '#ede9fe', text: '#6b21a8', border: '#c4b5fd' }
                : dept.level === 'UG'
                ? { bg: '#ccfbf1', text: '#0f766e', border: '#99f6e4' }
                : { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };

            return (
              <div
                key={dept.id}
                className="card"
                style={{
                  borderRadius: '12px',
                  border: isDeptExpanded ? '1.5px solid #ea580c44' : '1px solid #e2e8f0',
                  boxShadow: isDeptExpanded ? '0 8px 20px rgba(0,0,0,0.06)' : '0 2px 4px rgba(0,0,0,0.02)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  background: '#ffffff',
                }}
              >
                {/* Department Header */}
                <div
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    background: isDeptExpanded ? 'linear-gradient(180deg, #fff7ed 0%, #ffffff 100%)' : '#ffffff',
                    borderBottom: isDeptExpanded ? '1px solid #fed7aa' : 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleDept(dept.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
                    <span
                      style={{
                        transform: isDeptExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        fontSize: '0.9rem',
                        color: '#ea580c',
                        display: 'inline-block',
                      }}
                    >
                      ▶
                    </span>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                          {dept.name}
                        </h3>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          {dept.code}
                        </span>
                      </div>

                      {/* Badges */}
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            background: levelColor.bg,
                            color: levelColor.text,
                            border: `1px solid ${levelColor.border}`,
                          }}
                        >
                          {dept.level || 'UG'}
                        </span>

                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            background: '#fff1f2',
                            color: '#be123c',
                            border: '1px solid #fecdd3',
                          }}
                        >
                          Prefix: <strong>{dept.email_prefix ? `"${dept.email_prefix}"` : 'None'}</strong>
                        </span>

                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            background: '#f8fafc',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          {deptCourses.length} {deptCourses.length === 1 ? 'Course' : 'Courses'}
                        </span>

                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            background: '#f8fafc',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          {deptClasses.length} {deptClasses.length === 1 ? 'Class' : 'Classes'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Department */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="btn btn-sm"
                      style={{ background: '#ea580c', color: '#fff', fontWeight: 700, borderRadius: '6px' }}
                      onClick={() => openAddCourse(dept.id)}
                    >
                      + Add Course
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      style={{ borderRadius: '6px' }}
                      onClick={() => openEditDept(dept)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '6px' }}
                      onClick={() =>
                        setDeleteConfirm({
                          type: 'department',
                          id: dept.id,
                          name: dept.name,
                          courseCount: deptCourses.length,
                          classCount: deptClasses.length,
                        })
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Level 2: Courses inside Department */}
                {isDeptExpanded && (
                  <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#fafbfc' }}>
                    {deptCourses.length === 0 ? (
                      <div
                        style={{
                          padding: '24px',
                          textAlign: 'center',
                          borderRadius: '8px',
                          border: '1px dashed #cbd5e1',
                          background: '#ffffff',
                          color: '#64748b',
                        }}
                      >
                        <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem' }}>No courses added to this department yet.</p>
                        <button
                          className="btn btn-sm"
                          style={{ background: '#ea580c', color: '#fff', fontWeight: 700 }}
                          onClick={() => openAddCourse(dept.id)}
                        >
                          + Add First Course
                        </button>
                      </div>
                    ) : (
                      deptCourses.map((course) => {
                        const isCourseExpanded = !!expandedCourses[course.id];
                        const courseClasses = classes.filter((cls) => cls.course === course.id);

                        return (
                          <div
                            key={course.id}
                            style={{
                              borderRadius: '10px',
                              border: isCourseExpanded ? '1.5px solid #6366f144' : '1px solid #e2e8f0',
                              background: '#ffffff',
                              overflow: 'hidden',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            }}
                          >
                            {/* Course Header */}
                            <div
                              style={{
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '10px',
                                background: isCourseExpanded ? '#f5f3ff' : '#ffffff',
                                borderBottom: isCourseExpanded ? '1px solid #e0e7ff' : 'none',
                                cursor: 'pointer',
                              }}
                              onClick={() => toggleCourse(course.id)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '220px' }}>
                                <span
                                  style={{
                                    transform: isCourseExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s ease',
                                    fontSize: '0.8rem',
                                    color: '#4f46e5',
                                    display: 'inline-block',
                                  }}
                                >
                                  ▶
                                </span>

                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>
                                      {course.name} ({course.abbreviation})
                                    </span>
                                    <span
                                      style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        background: '#dbeafe',
                                        color: '#1e40af',
                                        border: '1px solid #bfdbfe',
                                      }}
                                    >
                                      code: {course.email_code}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                      Duration: <strong>{course.duration_years} yrs</strong>
                                    </span>
                                    <span style={{ color: '#cbd5e1' }}>•</span>
                                    <span style={{ fontSize: '0.72rem', color: course.is_multi_batch ? '#047857' : '#64748b' }}>
                                      {course.is_multi_batch ? 'Multi-batch (Sections A/B/C)' : 'Single Batch'}
                                    </span>
                                    <span style={{ color: '#cbd5e1' }}>•</span>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#4338ca' }}>
                                      {courseClasses.length} {courseClasses.length === 1 ? 'Class' : 'Classes'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Actions for Course */}
                              <div
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="btn btn-sm"
                                  style={{ background: '#4f46e5', color: '#fff', fontWeight: 700, borderRadius: '6px', fontSize: '0.75rem', padding: '4px 10px' }}
                                  onClick={() => openAddClass(course)}
                                >
                                  + Add Class
                                </button>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  style={{ borderRadius: '6px', fontSize: '0.75rem', padding: '4px 10px' }}
                                  onClick={() => openEditCourse(course)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-sm"
                                  style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '0.75rem', padding: '4px 10px' }}
                                  onClick={() =>
                                    setDeleteConfirm({
                                      type: 'course',
                                      id: course.id,
                                      name: course.abbreviation,
                                      classCount: courseClasses.length,
                                    })
                                  }
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            {/* Level 3: Classes inside Course */}
                            {isCourseExpanded && (
                              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc' }}>
                                {courseClasses.length === 0 ? (
                                  <div
                                    style={{
                                      padding: '16px',
                                      textAlign: 'center',
                                      borderRadius: '6px',
                                      border: '1px dashed #cbd5e1',
                                      background: '#ffffff',
                                      color: '#64748b',
                                      fontSize: '0.8rem',
                                    }}
                                  >
                                    <span>No classes configured under {course.abbreviation} yet. </span>
                                    <button
                                      onClick={() => openAddClass(course)}
                                      style={{ color: '#4f46e5', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                      Add Class
                                    </button>
                                  </div>
                                ) : (
                                  courseClasses.map((cls) => {
                                    const edits = classEdits[cls.id] || {};
                                    const currentN = edits.num_students !== undefined ? edits.num_students : (cls.num_students ?? 50);
                                    const currentP = Math.max(0, Math.abs(edits.negative_points !== undefined ? edits.negative_points : (cls.negative_points ?? 0)));
                                    const currentAdvisor = edits.classTeacher !== undefined ? edits.classTeacher : (cls.classTeacher || cls.class_teacher_email || '');
                                    const hasPendingEdits =
                                      edits.num_students !== undefined ||
                                      edits.negative_points !== undefined ||
                                      edits.classTeacher !== undefined;

                                    return (
                                      <div
                                        key={cls.id}
                                        style={{
                                          padding: '12px 16px',
                                          borderRadius: '8px',
                                          border: '1px solid #e2e8f0',
                                          background: '#ffffff',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '10px',
                                        }}
                                      >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                                              {cls.name}
                                            </span>
                                            {cls.year_number && (
                                              <span
                                                style={{
                                                  padding: '1px 6px',
                                                  borderRadius: '4px',
                                                  fontSize: '0.68rem',
                                                  fontWeight: 700,
                                                  background: '#e0e7ff',
                                                  color: '#3730a3',
                                                }}
                                              >
                                                Year {getRoman(cls.year_number)}
                                              </span>
                                            )}
                                          </div>

                                          <div style={{ display: 'flex', gap: '6px' }}>
                                            <button
                                              className="btn btn-sm btn-secondary"
                                              style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                                              onClick={() => openEditClass(cls)}
                                            >
                                              Edit Details
                                            </button>
                                            <button
                                              className="btn btn-sm"
                                              style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', fontSize: '0.72rem', padding: '3px 8px' }}
                                              onClick={() =>
                                                setDeleteConfirm({
                                                  type: 'class',
                                                  id: cls.id,
                                                  name: cls.name,
                                                })
                                              }
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </div>

                                        {/* Class Advisor and Moderation Controls */}
                                        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                          {/* Faculty Advisor select */}
                                          <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                            <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b' }}>
                                              CLASS ADVISOR (FACULTY)
                                            </label>
                                            <select
                                              value={currentAdvisor}
                                              onChange={(e) =>
                                                setClassEdits((prev) => ({
                                                  ...prev,
                                                  [cls.id]: { ...prev[cls.id], classTeacher: e.target.value },
                                                }))
                                              }
                                              style={{
                                                padding: '6px 8px',
                                                fontSize: '0.8rem',
                                                borderRadius: '6px',
                                                border: '1px solid #cbd5e1',
                                                background: '#fff',
                                              }}
                                            >
                                              <option value="">Select Faculty Advisor</option>
                                              {availableFaculty.map((f) => {
                                                const isCouncil = classTeachersGroup?.emails.some(
                                                  (e) => e.toLowerCase().trim() === f.email.toLowerCase().trim()
                                                );
                                                return (
                                                  <option key={f.email} value={f.email}>
                                                    {isCouncil ? '⭐ ' : ''}{f.name} ({f.email})
                                                  </option>
                                                );
                                              })}
                                            </select>
                                          </div>

                                          {/* Students N */}
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                            <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7c3aed' }}>
                                              N — STUDENTS
                                            </label>
                                            <input
                                              type="number"
                                              min={0}
                                              value={currentN}
                                              onChange={(e) =>
                                                setClassEdits((prev) => ({
                                                  ...prev,
                                                  [cls.id]: { ...prev[cls.id], num_students: Number(e.target.value) },
                                                }))
                                              }
                                              style={{
                                                width: '80px',
                                                padding: '6px 8px',
                                                fontSize: '0.82rem',
                                                borderRadius: '6px',
                                                border: '1px solid #c4b5fd',
                                                background: '#faf5ff',
                                                color: '#4c1d95',
                                                fontWeight: 700,
                                              }}
                                            />
                                          </div>

                                          {/* Penalty Points P */}
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                            <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#dc2626' }}>
                                              P — PENALTY
                                            </label>
                                            <input
                                              type="number"
                                              min={0}
                                              step={0.1}
                                              value={currentP}
                                              onChange={(e) => {
                                                const val = e.target.value === '' ? 0 : Math.max(0, Math.abs(Number(e.target.value)));
                                                setClassEdits((prev) => ({
                                                  ...prev,
                                                  [cls.id]: { ...prev[cls.id], negative_points: val },
                                                }));
                                              }}
                                              style={{
                                                width: '80px',
                                                padding: '6px 8px',
                                                fontSize: '0.82rem',
                                                borderRadius: '6px',
                                                border: '1px solid #fca5a5',
                                                background: '#fff5f5',
                                                color: '#7f1d1d',
                                                fontWeight: 700,
                                              }}
                                            />
                                          </div>

                                          {/* Save button if pending edits */}
                                          {hasPendingEdits && (
                                            <button
                                              className="btn btn-sm"
                                              style={{ background: '#7c3aed', color: '#fff', fontWeight: 700, padding: '6px 12px' }}
                                              onClick={async () => {
                                                const res = await updateClass(cls.id, {
                                                  classTeacher: currentAdvisor,
                                                  num_students: currentN,
                                                  negative_points: currentP,
                                                });
                                                if (res.success) {
                                                  showStatus(`Class "${cls.name}" updated.`);
                                                  setClassEdits((prev) => {
                                                    const next = { ...prev };
                                                    delete next[cls.id];
                                                    return next;
                                                  });
                                                } else {
                                                  showStatus(res.error || 'Failed to update class', 'error');
                                                }
                                              }}
                                            >
                                              Save
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── MODAL: Add / Edit Department ── */}
      {deptModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setDeptModal({ isOpen: false, mode: 'add' })}
        >
          <div
            className="card"
            style={{
              maxWidth: '500px',
              width: '100%',
              borderRadius: '16px',
              padding: '28px',
              background: '#ffffff',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 16px 0', color: '#0f172a' }}>
              {deptModal.mode === 'add' ? 'Add New Department' : `Edit Department: ${deptModal.dept?.code}`}
            </h2>

            <form onSubmit={handleSaveDept} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  Department Name *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Department of Computer Applications"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    Department Code
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. DCA"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Leave blank to auto-generate</span>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    Email Prefix (e.g. 'u' or 'p') *
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="u or p"
                    maxLength={3}
                    value={deptForm.email_prefix}
                    onChange={(e) => setDeptForm({ ...deptForm, email_prefix: e.target.value.toLowerCase() })}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>'u' for UG, 'p' for PG</span>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  Academic Level *
                </label>
                <select
                  className="input"
                  value={deptForm.level}
                  onChange={(e) => setDeptForm({ ...deptForm, level: e.target.value as any })}
                >
                  <option value="UG">UG (Undergraduate)</option>
                  <option value="PG">PG (Postgraduate)</option>
                  <option value="Professional">Professional</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeptModal({ isOpen: false, mode: 'add' })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#ea580c', color: '#fff', fontWeight: 700 }}
                >
                  {deptModal.mode === 'add' ? 'Create Department' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Add / Edit Course ── */}
      {courseModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setCourseModal({ isOpen: false, mode: 'add' })}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              borderRadius: '16px',
              padding: '28px',
              background: '#ffffff',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 16px 0', color: '#0f172a' }}>
              {courseModal.mode === 'add' ? 'Add Course to Department' : `Edit Course: ${courseModal.course?.abbreviation}`}
            </h2>

            <form onSubmit={handleSaveCourse} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  Course Full Name *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Master of Computer Applications"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    Abbreviation *
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. MCA or BCA"
                    value={courseForm.abbreviation}
                    onChange={(e) => setCourseForm({ ...courseForm, abbreviation: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    Email Code *
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. mc, bc, cm, ba"
                    maxLength={5}
                    value={courseForm.email_code}
                    onChange={(e) => setCourseForm({ ...courseForm, email_code: e.target.value.toLowerCase() })}
                    required
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Appears in student email: 25p<strong>mc</strong>114</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    Duration (Years) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    className="input"
                    value={courseForm.duration_years}
                    onChange={(e) => setCourseForm({ ...courseForm, duration_years: Number(e.target.value) })}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={courseForm.is_multi_batch}
                      onChange={(e) => setCourseForm({ ...courseForm, is_multi_batch: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Multi-Batch (A / B / C)
                  </label>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                    Derives sections from roll number series
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCourseModal({ isOpen: false, mode: 'add' })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#4f46e5', color: '#fff', fontWeight: 700 }}
                >
                  {courseModal.mode === 'add' ? 'Create Course' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Add / Edit Class ── */}
      {classModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setClassModal({ isOpen: false, mode: 'add' })}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              borderRadius: '16px',
              padding: '28px',
              background: '#ffffff',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const selectedCourse = courses.find((c) => c.id === classForm.course_id);
              const roman = getRoman(classForm.year_number);
              const previewName = selectedCourse
                ? `${roman} ${selectedCourse.abbreviation}${classForm.section ? ' ' + classForm.section.trim().toUpperCase() : ''}`
                : `Year ${classForm.year_number}`;

              return (
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>
                    {classModal.mode === 'add' ? `Add Class to ${selectedCourse?.abbreviation || 'Course'}` : `Edit Class: ${classModal.cls?.name}`}
                  </h2>
                  <p className="muted" style={{ fontSize: '0.8rem', margin: '0 0 16px 0' }}>
                    Preview Name: <strong style={{ color: '#ea580c' }}>{previewName}</strong>
                  </p>

                  <form onSubmit={handleSaveClass} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                          Year Number (I - VI) *
                        </label>
                        <select
                          className="input"
                          value={classForm.year_number}
                          onChange={(e) => setClassForm({ ...classForm, year_number: Number(e.target.value) })}
                        >
                          {Array.from({ length: selectedCourse?.duration_years || 4 }, (_, i) => i + 1).map((yr) => (
                            <option key={yr} value={yr}>
                              Year {getRoman(yr)} ({yr})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                          Section (e.g. A, B, C)
                        </label>
                        <input
                          type="text"
                          className="input"
                          placeholder={selectedCourse?.is_multi_batch ? 'e.g. A or B' : 'Optional'}
                          value={classForm.section}
                          onChange={(e) => setClassForm({ ...classForm, section: e.target.value.toUpperCase() })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                          Students Count (N)
                        </label>
                        <input
                          type="number"
                          min={0}
                          className="input"
                          value={classForm.num_students}
                          onChange={(e) => setClassForm({ ...classForm, num_students: Number(e.target.value) })}
                        />
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                          Penalty Points (P)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          className="input"
                          value={classForm.negative_points}
                          onChange={(e) => setClassForm({ ...classForm, negative_points: e.target.value === '' ? 0 : Math.max(0, Math.abs(Number(e.target.value))) })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                        Class Advisor (Faculty)
                      </label>
                      <select
                        className="input"
                        value={classForm.classTeacher}
                        onChange={(e) => setClassForm({ ...classForm, classTeacher: e.target.value })}
                      >
                        <option value="">Select Faculty Advisor (optional)</option>
                        {availableFaculty.map((f) => {
                          const isCouncil = classTeachersGroup?.emails.some(
                            (e) => e.toLowerCase().trim() === f.email.toLowerCase().trim()
                          );
                          return (
                            <option key={f.email} value={f.email}>
                              {isCouncil ? '⭐ ' : ''}{f.name} ({f.email})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setClassModal({ isOpen: false, mode: 'add' })}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ background: '#ea580c', color: '#fff', fontWeight: 700 }}
                      >
                        {classModal.mode === 'add' ? 'Create Class' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── MODAL: Cascade Delete Confirmation ── */}
      {deleteConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: '440px',
              width: '100%',
              borderRadius: '16px',
              padding: '24px',
              background: '#ffffff',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto',
                fontSize: '1.4rem',
              }}
            >
              ⚠️
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px 0', color: '#0f172a' }}>
              Confirm Deletion
            </h3>

            <p style={{ fontSize: '0.88rem', color: '#475569', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Are you sure you want to delete {deleteConfirm.type}{' '}
              <strong style={{ color: '#0f172a' }}>"{deleteConfirm.name}"</strong>?
              {deleteConfirm.type === 'department' && (
                <span style={{ display: 'block', marginTop: '8px', color: '#b91c1c', fontWeight: 600 }}>
                  ⚠️ This will permanently delete <strong>{deleteConfirm.courseCount || 0} courses</strong> and{' '}
                  <strong>{deleteConfirm.classCount || 0} classes</strong> associated with this department.
                </span>
              )}
              {deleteConfirm.type === 'course' && (
                <span style={{ display: 'block', marginTop: '8px', color: '#b91c1c', fontWeight: 600 }}>
                  ⚠️ This will permanently delete <strong>{deleteConfirm.classCount || 0} classes</strong> under this course.
                </span>
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                style={{ minWidth: '100px' }}
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="btn"
                style={{ background: '#dc2626', color: '#fff', fontWeight: 700, minWidth: '100px' }}
                onClick={executeDelete}
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import type { ClassIndexEntry } from '@/context/AppContext';
import { Submission } from '@/data/initialData';
import { PodiumSkeleton, TableSkeleton, LoadingButton } from '@/components/loading';

export default function ClassRankingsPage() {
  const {
    academicYears,
    selectedAcademicYear,
    classIndexData,
    fetchClassIndex,
    smallestClassSize,
    submissions,
    fetchSubmissions,
    students,
    users,
    criteriaCatalog,
  } = useApp();

  const [year, setYear] = useState(selectedAcademicYear || '');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Class expansion and filtering state
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [onlyAwardedMarks, setOnlyAwardedMarks] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const refresh = async (y?: string) => {
    setLoading(true);
    await Promise.all([
      fetchClassIndex(y ?? year ?? undefined),
      fetchSubmissions()
    ]);
    setLastUpdated(new Date());
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    refresh(year || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch whenever year filter changes
  useEffect(() => {
    refresh(year || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refresh(year || undefined);
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const ranked = (classIndexData || []).filter((e) => e.rank !== null) as (ClassIndexEntry & { rank: number })[];
  const unranked = (classIndexData || []).filter((e) => e.rank === null);

  const podiumColors: Record<number, { bg: string; border: string; emoji: string; label: string }> = {
    1: { bg: 'linear-gradient(135deg,#fef9c3,#fffbeb)', border: '#FCD34D', emoji: '🥇', label: 'Champion' },
    2: { bg: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)', border: '#94A3B8', emoji: '🥈', label: '1st Runner-Up' },
    3: { bg: 'linear-gradient(135deg,#fff7ed,#ffedd5)', border: '#FDBA74', emoji: '🥉', label: '2nd Runner-Up' },
  };

  // -------------------------------------------------------------
  // Helpers to resolve criteria details and match class submissions
  // -------------------------------------------------------------
  const getCriteriaInfo = (criteriaId: number) => {
    const item = criteriaCatalog.flatMap((c) => c.items).find((it) => String(it.id) === String(criteriaId));
    const cat = criteriaCatalog.find((c) => c.items.some((it) => String(it.id) === String(criteriaId)));
    return {
      title: item?.title || `Criteria #${criteriaId}`,
      category: cat?.category || 'General',
      type: item?.type || 'count',
      marks: item?.marks ?? 0,
      rules_json: item?.rules_json,
    };
  };

  const getSubcategory = (s: Submission) => {
    const ev = (s.evidence as any) || {};
    return ev.subItem || ev.researchSubItem || ev.prizesSubItem || (ev.type && !['count', 'academic_grades'].includes(ev.type) ? ev.type : '');
  };

  // Match all submissions belonging to a given class
  const getClassSubmissions = (className: string) => {
    if (!submissions || !className) return [];
    const normTarget = className.trim().toLowerCase();

    return submissions.filter((s) => {
      // 1. Direct class match on submission
      const directClass = (s.className || (s as any).class_name || '').trim().toLowerCase();
      if (directClass && directClass === normTarget) {
        if (year && s.academicYear && s.academicYear !== year) return false;
        return true;
      }

      // 2. Email-based user/student lookup
      const email = (s.user_email || s.userEmail || '').trim().toLowerCase();
      if (email) {
        const u = users.find((user) => user.email?.trim().toLowerCase() === email);
        if (u && u.className && u.className.trim().toLowerCase() === normTarget) {
          if (year && s.academicYear && s.academicYear !== year) return false;
          return true;
        }
        const st = students.find((stud) => stud.email?.trim().toLowerCase() === email);
        if (st && st.className && st.className.trim().toLowerCase() === normTarget) {
          if (year && s.academicYear && s.academicYear !== year) return false;
          return true;
        }
      }

      // 3. ID-based user/student lookup
      const uById = users.find((user) => user.id === s.studentId);
      if (uById && uById.className && uById.className.trim().toLowerCase() === normTarget) {
        if (year && s.academicYear && s.academicYear !== year) return false;
        return true;
      }

      const stById = students.find((stud) => stud.id === s.studentId);
      if (stById && stById.className && stById.className.trim().toLowerCase() === normTarget) {
        if (year && s.academicYear && s.academicYear !== year) return false;
        return true;
      }

      return false;
    });
  };

  // Group submissions by Student
  interface StudentGroup {
    key: string;
    studentId: number;
    studentName: string;
    studentEmail: string;
    totalMarksAwarded: number;
    submissions: Submission[];
  }

  const getStudentGroupsForClass = (className: string) => {
    const rawSubs = getClassSubmissions(className);
    
    // Filter by marks awarded if enabled
    const filteredSubs = onlyAwardedMarks
      ? rawSubs.filter((s) => s.marks !== null && s.marks !== undefined && !isNaN(Number(s.marks)))
      : rawSubs;

    const map = new Map<string, StudentGroup>();

    filteredSubs.forEach((s) => {
      const email = (s.user_email || s.userEmail || '').trim().toLowerCase();
      const groupKey = email || `id_${s.studentId}`;

      const matchedUser = users.find((u) => (email && u.email?.trim().toLowerCase() === email) || u.id === s.studentId);
      const matchedStudent = students.find((st) => (email && st.email?.trim().toLowerCase() === email) || st.id === s.studentId);

      const studentName = s.user_name || matchedUser?.name || matchedStudent?.name || (email ? email.split('@')[0] : `Student #${s.studentId}`);
      const studentEmail = email || matchedUser?.email || matchedStudent?.email || '';

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          key: groupKey,
          studentId: s.studentId,
          studentName,
          studentEmail,
          totalMarksAwarded: 0,
          submissions: [],
        });
      }

      const group = map.get(groupKey)!;
      group.submissions.push(s);
      const markNum = s.marks !== null && s.marks !== undefined ? Number(s.marks) : 0;
      if (!isNaN(markNum)) {
        group.totalMarksAwarded += markNum;
      }
    });

    let groups = Array.from(map.values()).sort((a, b) => b.totalMarksAwarded - a.totalMarksAwarded);

    // Apply search query filter if user typed in search box
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      groups = groups.filter((g) => {
        const matchesStudent = g.studentName.toLowerCase().includes(q) || g.studentEmail.toLowerCase().includes(q);
        const matchesSub = g.submissions.some((s) => {
          const crit = getCriteriaInfo(s.criteriaId);
          const subcat = getSubcategory(s);
          return (
            crit.title.toLowerCase().includes(q) ||
            crit.category.toLowerCase().includes(q) ||
            (s.description || '').toLowerCase().includes(q) ||
            subcat.toLowerCase().includes(q)
          );
        });
        return matchesStudent || matchesSub;
      });
    }

    return { rawSubs, filteredSubs, groups };
  };

  const toggleClassExpansion = (className: string) => {
    if (expandedClass === className) {
      setExpandedClass(null);
    } else {
      setExpandedClass(className);
      setSearchQuery('');
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '85vh', padding: '10px 0' }}>
      <div
        style={{
          position: 'fixed', inset: 0,
          backgroundImage: 'url("/Assets/Images/Marian_College_Kuttikkanam.jpg")',
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.05, filter: 'blur(6px)', pointerEvents: 'none', zIndex: 0,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
              Class Rankings
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#6B7280', marginTop: '4px', margin: 0 }}>
              Moderated class index based on evaluator-locked submissions. Click any class row to view all evaluated student submissions and awarded marks.
            </p>
          </div>

          {/* Live badge + last updated */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#dcfce7', color: '#16a34a', borderRadius: '9999px',
              padding: '5px 13px', fontSize: '0.76rem', fontWeight: 800, border: '1px solid #bbf7d0'
            }}>
              <span style={{
                width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a',
                display: 'inline-block',
                animation: 'pulse 1.8s ease-in-out infinite'
              }} />
              LIVE
            </span>
            {lastUpdated && (
              <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600 }}>
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <LoadingButton
              onClick={() => refresh(year || undefined)}
              disabled={loading}
              loading={loading}
              loadingText="Refreshing…"
              title="Refresh now"
              style={{
                background: loading ? '#e0e7ff' : '#EDE9FE', color: loading ? '#a5b4fc' : '#5B21B6',
                border: '1.5px solid #c4b5fd', borderRadius: '9999px', padding: '6px 16px',
                fontWeight: 800, fontSize: '0.78rem', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              ↻ Refresh
            </LoadingButton>
          </div>
        </div>

        {/* Formula and Controls */}
        <div style={{ background: 'linear-gradient(135deg,#f0f4ff,#fafafe)', border: '1.5px solid #c7d2fe', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#4338CA', margin: '0 0 8px 0' }}>
            Authoritative Moderation Formula
          </h3>
          <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#3730a3', margin: '0 0 6px', fontFamily: 'monospace' }}>
            M = (S − P) / N² × (1 + 100 × (N − n))
          </p>
          <p style={{ fontSize: '0.78rem', color: '#6366f1', margin: '0 0 18px' }}>
            S = Evaluated Marks | P = Penalties (defined in department management) | N = Class Size (defined in department management) | n = {smallestClassSize ?? 0} (Smallest Class Benchmark defined in department management)
          </p>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '8px' }}>
                Academic Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                style={{ padding: '10px 16px', fontSize: '0.88rem', fontWeight: 600, borderRadius: '9999px', border: '1px solid #c7d2fe', background: '#fff', color: '#1F2937', cursor: 'pointer' }}
              >
                <option value="">All Years</option>
                {academicYears.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <p style={{ margin: 0, fontSize: '0.76rem', color: '#9CA3AF', fontWeight: 600 }}>
              Rankings refresh automatically every 30 seconds. Click any row below to inspect student submissions.
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && classIndexData === null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', margin: '20px 0' }}>
            <PodiumSkeleton />
            <TableSkeleton rows={5} columns={6} />
          </div>
        )}

        {/* Empty state */}
        {!loading && classIndexData !== null && classIndexData.length === 0 && (
          <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #E5E7EB', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>No data yet</div>
            <p style={{ color: '#6B7280', margin: 0, fontSize: '0.88rem' }}>Set N and P for classes in Department Management, then wait for submissions to be evaluated.</p>
          </div>
        )}

        {/* Podium top 3 */}
        {ranked.length >= 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '16px' }}>
            {ranked.slice(0, 3).map((entry) => {
              const pod = podiumColors[entry.rank] || {
                bg: 'linear-gradient(135deg,#f8fafc,#f1f5f9)',
                border: '#cbd5e1',
                emoji: '🏅',
                label: `Rank #${entry.rank}`
              };
              const isExpanded = expandedClass === entry.class_name;
              return (
                <div
                  key={entry.class_name}
                  onClick={() => toggleClassExpansion(entry.class_name)}
                  title="Click to view student submissions for this class"
                  style={{
                    background: pod.bg,
                    border: `2px solid ${isExpanded ? '#4F46E5' : pod.border}`,
                    borderRadius: '20px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    boxShadow: isExpanded ? '0 10px 25px -5px rgba(79, 70, 229, 0.25)' : 'none',
                    transform: isExpanded ? 'translateY(-2px)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.8rem' }}>{pod.emoji}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{pod.label}</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#111827', margin: '0 0 2px' }}>{entry.class_name}</h3>
                    <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: 0, fontWeight: 600 }}>{entry.department}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                    <div><div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase' }}>Index M</div><div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#4F46E5' }}>{entry.M?.toFixed(2)}</div></div>
                    <div><div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase' }}>Sum S</div><div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#374151' }}>{entry.S}</div></div>
                    <div><div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase' }}>N</div><div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#374151' }}>{entry.N}</div></div>
                  </div>
                  <div style={{
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px dashed rgba(0,0,0,0.12)',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: isExpanded ? '#4338CA' : '#6B7280',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{isExpanded ? '▲ Viewing Submissions' : '▶ Click to View Submissions'}</span>
                    <span style={{ fontSize: '0.7rem', textDecoration: 'underline' }}>{isExpanded ? 'Hide' : 'Expand'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full table with Expandable Accordion Submissions View */}
        {(ranked.length > 0 || unranked.length > 0) && (
          <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #E5E7EB', padding: '28px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)', opacity: loading ? 0.6 : 1, transition: 'opacity 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: 0 }}>Full Class Rankings</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#6B7280' }}>
                  Click on any class row to expand and view student activity claims with awarded marks.
                </p>
              </div>
              {expandedClass && (
                <button
                  onClick={() => setExpandedClass(null)}
                  style={{
                    background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB',
                    borderRadius: '9999px', padding: '5px 14px', fontSize: '0.75rem', fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ✕ Collapse Details
                </button>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                    {['Rank', 'Class (Click to Expand)', 'Department', 'N (Students)', 'S (Evaluated Marks)', 'P (Penalty)', 'M (Index)'].map((h) => (
                      <th key={h} style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', paddingBottom: '14px', paddingRight: '16px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((entry) => {
                    const isExpanded = expandedClass === entry.class_name;
                    const { rawSubs, filteredSubs, groups } = getStudentGroupsForClass(entry.class_name);

                    return (
                      <React.Fragment key={entry.class_name}>
                        {/* Class Row */}
                        <tr
                          onClick={() => toggleClassExpansion(entry.class_name)}
                          style={{
                            borderBottom: isExpanded ? 'none' : '1px solid #F3F4F6',
                            background: isExpanded ? '#F0F4FF' : undefined,
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                          }}
                          title="Click to view submissions and marks awarded for this class"
                        >
                          <td style={{ padding: '14px 16px 14px 0', fontWeight: 900, fontSize: '1.1rem', color: entry.rank <= 3 ? '#4F46E5' : '#374151' }}>
                            {entry.rank <= 3 && podiumColors[entry.rank] ? podiumColors[entry.rank].emoji : '#' + entry.rank}
                          </td>
                          <td style={{ padding: '14px 16px 14px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '20px',
                                height: '20px',
                                borderRadius: '6px',
                                background: isExpanded ? '#4F46E5' : '#EEF2FF',
                                color: isExpanded ? '#ffffff' : '#4F46E5',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                transition: 'all 0.2s ease'
                              }}>
                                {isExpanded ? '▼' : '▶'}
                              </span>
                              <div>
                                <span style={{ fontWeight: 800, color: '#111827', fontSize: '0.96rem' }}>
                                  {entry.class_name}
                                </span>
                                <span style={{ display: 'block', fontSize: '0.72rem', color: isExpanded ? '#4338CA' : '#6366f1', fontWeight: 600 }}>
                                  {isExpanded ? 'Hide submissions' : `${rawSubs.length} submission${rawSubs.length !== 1 ? 's' : ''} • click to inspect`}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px 14px 0', color: '#6B7280', fontSize: '0.88rem' }}>{entry.department}</td>
                          <td style={{ padding: '14px 16px 14px 0', fontWeight: 700, color: '#374151' }}>{entry.N}</td>
                          <td style={{ padding: '14px 16px 14px 0', fontWeight: 800, color: '#16a34a' }}>
                            ★ {entry.S} pts
                          </td>
                          <td style={{ padding: '14px 16px 14px 0', fontWeight: 700, color: '#DC2626' }}>{entry.P}</td>
                          <td style={{ padding: '14px 16px 14px 0' }}>
                            <span style={{ background: '#EDE9FE', color: '#5B21B6', borderRadius: '9999px', padding: '4px 14px', fontSize: '0.9rem', fontWeight: 800 }}>
                              {entry.M?.toFixed(4)}
                            </span>
                          </td>
                        </tr>

                        {/* Expandable Submissions Accordion Row */}
                        {isExpanded && (
                          <tr key={`${entry.class_name}-expanded`}>
                            <td colSpan={7} style={{ padding: '0 0 20px 0', background: '#F0F4FF', borderBottom: '2px solid #C7D2FE' }}>
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  background: '#ffffff',
                                  border: '1.5px solid #C7D2FE',
                                  borderRadius: '16px',
                                  margin: '4px 12px 16px 12px',
                                  padding: '22px',
                                  boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.1)'
                                }}
                              >
                                {/* Class Header within Expanded Section */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #E5E7EB' }}>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <span style={{ fontSize: '1.2rem' }}>📌</span>
                                      <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>
                                        {entry.class_name} — Student Submissions & Marks Awarded
                                      </h4>
                                      <span style={{ background: '#EEF2FF', color: '#4338CA', padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700 }}>
                                        {entry.department}
                                      </span>
                                    </div>
                                    <p style={{ margin: '4px 0 0 32px', fontSize: '0.8rem', color: '#6B7280' }}>
                                      Below are the submissions submitted by students of {entry.class_name} with evaluated marks awarded towards Best Class standing.
                                    </p>
                                  </div>

                                  {/* Quick Metrics Bar */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 800 }}>
                                      🏆 {entry.S} Total Evaluated Marks (Sum S)
                                    </span>
                                    <span style={{ background: '#EDE9FE', color: '#5B21B6', border: '1px solid #C4B5FD', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 800 }}>
                                      👥 {groups.length} Contributing Student{groups.length !== 1 ? 's' : ''}
                                    </span>
                                    <span style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 800 }}>
                                      📝 {filteredSubs.length} Scored Claim{filteredSubs.length !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </div>

                                {/* Controls: Search & Awarded Filter Toggle */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                                  <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '450px' }}>
                                    <input
                                      type="text"
                                      value={searchQuery}
                                      onChange={(e) => setSearchQuery(e.target.value)}
                                      placeholder="🔍 Filter by student, activity, or subcategory..."
                                      style={{
                                        width: '100%',
                                        padding: '8px 14px',
                                        fontSize: '0.82rem',
                                        borderRadius: '8px',
                                        border: '1px solid #D1D5DB',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                      }}
                                    />
                                    {searchQuery && (
                                      <button
                                        onClick={() => setSearchQuery('')}
                                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 700 }}
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ display: 'inline-flex', background: '#F3F4F6', borderRadius: '8px', padding: '3px' }}>
                                      <button
                                        onClick={() => setOnlyAwardedMarks(true)}
                                        style={{
                                          background: onlyAwardedMarks ? '#4F46E5' : 'transparent',
                                          color: onlyAwardedMarks ? '#ffffff' : '#4B5563',
                                          border: 'none',
                                          borderRadius: '6px',
                                          padding: '5px 12px',
                                          fontSize: '0.76rem',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          transition: 'all 0.15s ease'
                                        }}
                                      >
                                        ★ Awarded Marks Only ({rawSubs.filter(s => s.marks !== null && s.marks !== undefined).length})
                                      </button>
                                      <button
                                        onClick={() => setOnlyAwardedMarks(false)}
                                        style={{
                                          background: !onlyAwardedMarks ? '#4F46E5' : 'transparent',
                                          color: !onlyAwardedMarks ? '#ffffff' : '#4B5563',
                                          border: 'none',
                                          borderRadius: '6px',
                                          padding: '5px 12px',
                                          fontSize: '0.76rem',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          transition: 'all 0.15s ease'
                                        }}
                                      >
                                        All Submissions ({rawSubs.length})
                                      </button>
                                    </div>

                                    <button
                                      onClick={() => setExpandedClass(null)}
                                      style={{ background: '#F3F4F6', color: '#4B5563', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '6px 12px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                      ✕ Close
                                    </button>
                                  </div>
                                </div>

                                {/* Student Groupings List */}
                                {groups.length === 0 ? (
                                  <div style={{ background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1', padding: '32px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📂</div>
                                    <h5 style={{ margin: '0 0 4px 0', fontSize: '0.96rem', fontWeight: 800, color: '#334155' }}>
                                      No submissions matching criteria found
                                    </h5>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>
                                      {onlyAwardedMarks
                                        ? `No evaluated submissions with marks awarded exist for ${entry.class_name} in ${year || 'all years'}. Try selecting "All Submissions".`
                                        : `No activity submissions have been created by students of ${entry.class_name}.`}
                                    </p>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {groups.map((group) => {
                                      // Get student initials
                                      const initials = group.studentName
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .substring(0, 2)
                                        .toUpperCase() || 'ST';

                                      return (
                                        <div
                                          key={group.key}
                                          style={{
                                            background: '#ffffff',
                                            border: '1.5px solid #E2E8F0',
                                            borderRadius: '14px',
                                            padding: '16px 20px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                          }}
                                        >
                                          {/* Student Info Card Header */}
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                              <div style={{
                                                width: '38px',
                                                height: '38px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                                                color: '#ffffff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 800,
                                                fontSize: '0.88rem',
                                                letterSpacing: '0.04em'
                                              }}>
                                                {initials}
                                              </div>
                                              <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                  <span style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0F172A' }}>
                                                    {group.studentName}
                                                  </span>
                                                  <span style={{ fontSize: '0.72rem', background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                                    {entry.class_name}
                                                  </span>
                                                </div>
                                                {group.studentEmail && (
                                                  <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block', marginTop: '1px' }}>
                                                    ✉ {group.studentEmail}
                                                  </span>
                                                )}
                                              </div>
                                            </div>

                                            {/* Student Total Awarded Score */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              <span style={{
                                                background: '#EDE9FE',
                                                color: '#5B21B6',
                                                border: '1.5px solid #C4B5FD',
                                                padding: '6px 14px',
                                                borderRadius: '9999px',
                                                fontWeight: 900,
                                                fontSize: '0.88rem'
                                              }}>
                                                🏆 {group.totalMarksAwarded.toFixed(1)} pts Awarded
                                              </span>
                                              <span style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.76rem', fontWeight: 700 }}>
                                                {group.submissions.length} submission{group.submissions.length !== 1 ? 's' : ''}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Submissions of this Student */}
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {group.submissions.map((sub, sIdx) => {
                                              const crit = getCriteriaInfo(sub.criteriaId);
                                              const subcat = getSubcategory(sub);
                                              const hasMarks = sub.marks !== null && sub.marks !== undefined && !isNaN(Number(sub.marks));
                                              const count = (sub.evidence as any)?.count ? Number((sub.evidence as any).count) : 1;
                                              const isDriveUrl = sub.proof && (sub.proof.startsWith('http://') || sub.proof.startsWith('https://') || sub.proof.includes('drive.google.com'));

                                              return (
                                                <div
                                                  key={sub.id || sIdx}
                                                  style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    background: '#F8FAFC',
                                                    border: '1px solid #E2E8F0',
                                                    borderRadius: '10px',
                                                    padding: '12px 16px',
                                                    gap: '14px',
                                                    flexWrap: 'wrap'
                                                  }}
                                                >
                                                  {/* Activity & Details */}
                                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '260px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                      <span style={{
                                                        background: '#EEF2FF',
                                                        color: '#4338CA',
                                                        border: '1px solid #C7D2FE',
                                                        padding: '2px 8px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.72rem',
                                                        fontWeight: 800
                                                      }}>
                                                        {crit.category}
                                                      </span>
                                                      <span style={{ fontWeight: 800, color: '#1E293B', fontSize: '0.9rem' }}>
                                                        {crit.title}
                                                      </span>
                                                      {subcat && (
                                                        <span style={{
                                                          background: '#FEF3C7',
                                                          color: '#92400E',
                                                          border: '1px solid #FDE68A',
                                                          padding: '2px 8px',
                                                          borderRadius: '6px',
                                                          fontSize: '0.72rem',
                                                          fontWeight: 800
                                                        }}>
                                                          📌 {subcat}
                                                        </span>
                                                      )}
                                                      {count > 1 && (
                                                        <span style={{ background: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                                                          Count: {count}
                                                        </span>
                                                      )}
                                                    </div>

                                                    {sub.description && (
                                                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569' }}>
                                                        {sub.description}
                                                      </p>
                                                    )}

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.74rem', color: '#64748B', flexWrap: 'wrap' }}>
                                                      {sub.academicYear && (
                                                        <span>Year: <strong>{sub.academicYear}</strong></span>
                                                      )}
                                                      {sub.proof && (
                                                        <span>
                                                          📄 Proof: <a href={isDriveUrl ? sub.proof : `/Assets/Proofs/${sub.proof}`} target="_blank" rel="noreferrer" style={{ color: '#4F46E5', fontWeight: 700 }}>{sub.proof}</a>
                                                        </span>
                                                      )}
                                                      {(sub.evaluatorVerifiedByName || sub.verifiedByName) && (
                                                        <span>
                                                          Evaluator: <strong>{sub.evaluatorVerifiedByName || sub.verifiedByName}</strong>
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>

                                                  {/* Marks Awarded & Status Badge */}
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{
                                                      background: sub.status === 'Evaluated' || sub.status === 'Locked' ? '#DCFCE7' : '#EFF6FF',
                                                      color: sub.status === 'Evaluated' || sub.status === 'Locked' ? '#15803D' : '#1D4ED8',
                                                      border: `1px solid ${sub.status === 'Evaluated' || sub.status === 'Locked' ? '#86EFAC' : '#BFDBFE'}`,
                                                      padding: '3px 9px',
                                                      borderRadius: '6px',
                                                      fontSize: '0.72rem',
                                                      fontWeight: 800
                                                    }}>
                                                      {sub.status === 'Evaluated' || sub.status === 'Locked' ? '✓ ' + sub.status : sub.status}
                                                    </span>

                                                    <span style={{
                                                      background: hasMarks ? '#DCFCE7' : '#F1F5F9',
                                                      color: hasMarks ? '#15803D' : '#64748B',
                                                      border: `1.5px solid ${hasMarks ? '#86EFAC' : '#CBD5E1'}`,
                                                      padding: '6px 14px',
                                                      borderRadius: '9999px',
                                                      fontWeight: 900,
                                                      fontSize: '0.92rem',
                                                      minWidth: '85px',
                                                      textAlign: 'center'
                                                    }}>
                                                      {hasMarks ? `+${Number(sub.marks).toFixed(1)} pts` : '0.0 pts'}
                                                    </span>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {unranked.length > 0 && ranked.length > 0 && (
                    <tr><td colSpan={7} style={{ padding: '10px 0 6px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', borderTop: '2px dashed #E5E7EB' }}>Classes without N set (unranked)</td></tr>
                  )}

                  {unranked.map((entry) => {
                    const isExpanded = expandedClass === entry.class_name;
                    const { rawSubs, filteredSubs, groups } = getStudentGroupsForClass(entry.class_name);

                    return (
                      <React.Fragment key={entry.class_name}>
                        <tr
                          onClick={() => toggleClassExpansion(entry.class_name)}
                          style={{
                            borderBottom: isExpanded ? 'none' : '1px solid #F3F4F6',
                            background: isExpanded ? '#F0F4FF' : undefined,
                            opacity: isExpanded ? 1 : 0.7,
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease'
                          }}
                          title="Click to view submissions for this class"
                        >
                          <td style={{ padding: '12px 16px 12px 0', fontWeight: 700, color: '#9CA3AF' }}>-</td>
                          <td style={{ padding: '12px 16px 12px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.7rem', color: '#6366f1' }}>{isExpanded ? '▼' : '▶'}</span>
                              <span style={{ fontWeight: 700, color: '#374151' }}>{entry.class_name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px 12px 0', color: '#6B7280', fontSize: '0.88rem' }}>{entry.department}</td>
                          <td style={{ padding: '12px 16px 12px 0', color: '#9CA3AF' }}>N/A</td>
                          <td style={{ padding: '12px 16px 12px 0', fontWeight: 600, color: '#374151' }}>{entry.S}</td>
                          <td style={{ padding: '12px 16px 12px 0', fontWeight: 600, color: '#DC2626' }}>{entry.P}</td>
                          <td style={{ padding: '12px 16px 12px 0', color: '#9CA3AF' }}>N/A</td>
                        </tr>

                        {isExpanded && (
                          <tr key={`${entry.class_name}-expanded`}>
                            <td colSpan={7} style={{ padding: '0 0 20px 0', background: '#F0F4FF', borderBottom: '2px solid #C7D2FE' }}>
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  background: '#ffffff',
                                  border: '1.5px solid #C7D2FE',
                                  borderRadius: '16px',
                                  margin: '4px 12px 16px 12px',
                                  padding: '20px',
                                  boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.1)'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #E5E7EB' }}>
                                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#111827' }}>
                                    {entry.class_name} — Student Submissions ({groups.length} students)
                                  </h4>
                                  <button
                                    onClick={() => setExpandedClass(null)}
                                    style={{ background: '#F3F4F6', color: '#4B5563', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '5px 10px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    ✕ Close
                                  </button>
                                </div>

                                {groups.length === 0 ? (
                                  <p className="muted" style={{ fontSize: '0.84rem', margin: 0, textAlign: 'center', padding: '16px' }}>
                                    No submissions recorded for {entry.class_name}.
                                  </p>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {groups.map((group) => (
                                      <div key={group.key} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                          <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.94rem' }}>
                                            👤 {group.studentName} {group.studentEmail && `(${group.studentEmail})`}
                                          </span>
                                          <span style={{ background: '#EDE9FE', color: '#5B21B6', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 800 }}>
                                            Total: {group.totalMarksAwarded.toFixed(1)} pts
                                          </span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                          {group.submissions.map((sub, sIdx) => {
                                            const crit = getCriteriaInfo(sub.criteriaId);
                                            const hasMarks = sub.marks !== null && sub.marks !== undefined;
                                            return (
                                              <div key={sub.id || sIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px' }}>
                                                <div>
                                                  <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.86rem' }}>{crit.title}</span>
                                                  {sub.description && <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>{sub.description}</p>}
                                                </div>
                                                <span style={{ background: hasMarks ? '#DCFCE7' : '#F1F5F9', color: hasMarks ? '#15803D' : '#64748B', padding: '4px 10px', borderRadius: '9999px', fontWeight: 800, fontSize: '0.84rem' }}>
                                                  {hasMarks ? `+${Number(sub.marks).toFixed(1)} pts` : '0.0 pts'}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p style={{ margin: '16px 0 0', fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600 }}>
              {ranked.length} class{ranked.length !== 1 ? 'es' : ''} ranked | {unranked.length} without N set | n = {smallestClassSize}
            </p>
          </div>
        )}

        {/* Pulse animation */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.8); }
          }
        `}</style>
      </div>
    </div>
  );
}

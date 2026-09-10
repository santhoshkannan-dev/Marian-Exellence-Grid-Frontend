'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { apiClient } from '@/services/apiClient';
import { UserGroup, UserGroupMemberDetail } from '@/data/initialData';

// Strict definition of the 4 Official User Groups
const OFFICIAL_GROUPS = [
  {
    id: 'grp-evaluation-committee',
    name: 'Evaluation Committee',
    description: 'Evaluator members assigned to review activity submissions. Categories are allocated through Evaluator Management.',
    policy: 'staff_only' as const,
    policyLabel: 'Only Staff Email Permitted',
    roleLabel: 'Evaluator Access',
    icon: '⚖️',
    placeholder: 'name.name@mariancollege.org'
  },
  {
    id: 'grp-class-teachers',
    name: 'Class Teachers Council',
    description: 'Faculty members acting as class advisors. Specified class is allocated through Department Management.',
    policy: 'staff_only' as const,
    policyLabel: 'Only Staff Email Permitted',
    roleLabel: 'Class Teacher Access',
    icon: '👨‍🏫',
    placeholder: 'name.name@mariancollege.org'
  },
  {
    id: 'grp-dqc-student-rep',
    name: 'DQC Student Rep Group',
    description: 'Data Quality Cell student representatives responsible for initial verification of peer submissions across all categories.',
    policy: 'student_only' as const,
    policyLabel: 'Only Student Email Permitted',
    roleLabel: 'Badge: DQC member',
    icon: '🛡️',
    placeholder: 'name.YYLCCDXX@mariancollege.org'
  },
  {
    id: 'grp-student-reps',
    name: 'Student Representatives',
    description: 'Class representatives responsible for initial verification of peer submissions of the class they belong to only.',
    policy: 'student_only' as const,
    policyLabel: 'Only Student Email Permitted',
    roleLabel: 'Badge: Student Rep',
    icon: '🎓',
    placeholder: 'name.YYLCCDXX@mariancollege.org'
  }
];

export default function AdminGroupsPage() {
  const [groupsData, setGroupsData] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInputs, setEmailInputs] = useState<{ [groupId: string]: string }>({});
  const [statusMsgs, setStatusMsgs] = useState<{ [groupId: string]: { type: 'success' | 'error'; msg: string } }>({});
  const [submitting, setSubmitting] = useState<{ [groupId: string]: boolean }>({});

  // Fetch official user groups from backend
  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/user-groups/');
      if (Array.isArray(data)) {
        // Filter strictly to the 4 official groups and merge default definitions
        const mapped = OFFICIAL_GROUPS.map((og) => {
          const found = data.find((g: any) => g.id === og.id || g.group_id === og.id);
          return {
            id: og.id,
            name: found?.name || og.name,
            description: found?.description || og.description,
            emails: found?.members || found?.emails || [],
            policy: og.policy,
            member_details: found?.member_details || []
          };
        });
        setGroupsData(mapped);
      }
    } catch (err: any) {
      console.error('Failed to load user groups:', err);
      toast.error('Failed to load user groups from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Client-side email validation per Marian College Policy
  const validateEmailPolicy = (email: string, policy: 'staff_only' | 'student_only'): { valid: boolean; error?: string } => {
    const clean = email.trim().toLowerCase();
    if (!clean) return { valid: false, error: 'Email address is required.' };
    if (!clean.endsWith('@mariancollege.org')) {
      return { valid: false, error: 'Email must belong to Marian College domain (@mariancollege.org).' };
    }

    const localPart = clean.slice(0, -'@mariancollege.org'.length);
    const parts = localPart.split('.');
    if (parts.length < 2) {
      return { valid: false, error: 'Invalid Marian College email structure (must be name.suffix@mariancollege.org).' };
    }

    const lastPart = parts[parts.length - 1];
    const isStudentEmail = /^\d{2}[upi][a-z]{2}\d\d+$/.test(lastPart) || /\d/.test(lastPart);

    if (policy === 'staff_only') {
      if (isStudentEmail) {
        return {
          valid: false,
          error: 'Only staff emails (name.name@mariancollege.org) are permitted in this group. Student emails are prohibited.'
        };
      }
    } else if (policy === 'student_only') {
      if (!isStudentEmail) {
        return {
          valid: false,
          error: 'Only student emails (name.YYLCCDXX@mariancollege.org) are permitted in this group. Staff emails are prohibited.'
        };
      }
    }

    return { valid: true };
  };

  const handleAddMember = async (groupId: string, policy: 'staff_only' | 'student_only', e: React.FormEvent) => {
    e.preventDefault();
    const rawEmail = emailInputs[groupId]?.trim().toLowerCase();

    if (!rawEmail) {
      setStatusMsgs((prev) => ({ ...prev, [groupId]: { type: 'error', msg: 'Please enter an email address.' } }));
      return;
    }

    const validation = validateEmailPolicy(rawEmail, policy);
    if (!validation.valid) {
      setStatusMsgs((prev) => ({ ...prev, [groupId]: { type: 'error', msg: validation.error || 'Invalid email.' } }));
      return;
    }

    try {
      setSubmitting((prev) => ({ ...prev, [groupId]: true }));
      setStatusMsgs((prev) => ({ ...prev, [groupId]: { type: 'success', msg: '' } }));

      // Call dedicated add member endpoint
      await apiClient.post(`/user-groups/${groupId}/add_member/`, { email: rawEmail });
      
      toast.success(`Added ${rawEmail} successfully!`);
      setStatusMsgs((prev) => ({ ...prev, [groupId]: { type: 'success', msg: `Added ${rawEmail} to group.` } }));
      setEmailInputs((prev) => ({ ...prev, [groupId]: '' }));
      await fetchGroups();
    } catch (err: any) {
      const errorMsg = err.data?.error || err.message || 'Failed to add user to group.';
      setStatusMsgs((prev) => ({ ...prev, [groupId]: { type: 'error', msg: errorMsg } }));
      toast.error(errorMsg);
    } finally {
      setSubmitting((prev) => ({ ...prev, [groupId]: false }));
    }
  };

  const handleRemoveMember = async (groupId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from this group?`)) {
      return;
    }

    try {
      await apiClient.delete(`/user-groups/${groupId}/remove_member/`, { body: { email } });
      toast.info(`Removed ${email} from group.`);
      await fetchGroups();
    } catch (err: any) {
      const errorMsg = err.data?.error || err.message || 'Failed to remove member.';
      toast.error(errorMsg);
    }
  };

  const totalMembersCount = groupsData.reduce((acc, g) => acc + (g.emails?.length || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Heading & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            User Groups & Access Management
          </h1>
          <p className="muted" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
            Manage institutional access, review councils, and verification rights across the 4 official user groups.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <div className="card" style={{ padding: '12px 24px', minWidth: '140px', textAlign: 'center', background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Official Groups</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>4</div>
          </div>
          <div className="card" style={{ padding: '12px 24px', minWidth: '140px', textAlign: 'center', background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Members</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{totalMembersCount}</div>
          </div>
          <div className="card" style={{ padding: '12px 24px', minWidth: '180px', textAlign: 'center', background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Domain Policy</span>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#6366f1', marginTop: '4px' }}>@mariancollege.org</div>
          </div>
        </div>
      </div>

      {/* Official Groups List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {OFFICIAL_GROUPS.map((og) => {
          const group = groupsData.find((g) => g.id === og.id) || {
            id: og.id,
            name: og.name,
            description: og.description,
            emails: [],
            policy: og.policy,
            member_details: []
          };
          const status = statusMsgs[og.id];
          const isStaffOnly = og.policy === 'staff_only';
          const memberList: UserGroupMemberDetail[] = group.member_details && group.member_details.length > 0
            ? group.member_details
            : (group.emails || []).map((em) => ({ name: em.split('@')[0], email: em }));

          return (
            <div
              key={og.id}
              className="card"
              style={{
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              {/* Group Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: isStaffOnly ? 'rgba(79, 70, 229, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem'
                    }}
                  >
                    {og.icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                        {og.name}
                      </h2>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background: isStaffOnly ? '#ede9fe' : '#d1fae5',
                          color: isStaffOnly ? '#6d28d9' : '#047857',
                          border: `1px solid ${isStaffOnly ? '#ddd6fe' : '#a7f3d0'}`
                        }}
                      >
                        {og.policyLabel}
                      </span>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background: '#f1f5f9',
                          color: '#475569'
                        }}
                      >
                        {og.roleLabel}
                      </span>
                    </div>
                    <p className="muted" style={{ fontSize: '0.86rem', marginTop: '6px', maxWidth: '800px', lineHeight: 1.5 }}>
                      {og.description}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    background: 'var(--bg-light)',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem',
                    fontWeight: 800
                  }}
                >
                  {memberList.length} {memberList.length === 1 ? 'Member' : 'Members'}
                </div>
              </div>

              {/* Add Member Bar */}
              <div
                style={{
                  padding: '16px 20px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    ➕ Add Member by Email ID
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Policy: {isStaffOnly ? 'Only staff accounts (@mariancollege.org)' : 'Only student roll accounts (@mariancollege.org)'}
                  </span>
                </div>

                <form onSubmit={(e) => handleAddMember(og.id, og.policy, e)} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    type="email"
                    className="input"
                    style={{ flex: 1, minWidth: '280px', height: '40px', fontSize: '0.88rem' }}
                    placeholder={og.placeholder}
                    value={emailInputs[og.id] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEmailInputs((prev) => ({ ...prev, [og.id]: val }));
                      setStatusMsgs((prev) => ({ ...prev, [og.id]: { type: 'success', msg: '' } }));
                    }}
                    required
                  />

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting[og.id] || loading}
                    style={{ height: '40px', padding: '0 20px', fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap' }}
                  >
                    {submitting[og.id] ? 'Adding...' : '+ Add Member'}
                  </button>
                </form>

                {status?.msg && (
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: status.type === 'error' ? '#dc2626' : '#16a34a',
                      padding: '4px 0'
                    }}
                  >
                    {status.msg}
                  </div>
                )}
              </div>

              {/* Members Table */}
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Enrolled Members & Allocation Details
                </h3>

                {memberList.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                    <p className="muted" style={{ fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>
                      No members enrolled in this group yet. Use the form above to add an authorized email.
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                          <th style={{ padding: '10px 14px', fontWeight: 700 }}>Name</th>
                          <th style={{ padding: '10px 14px', fontWeight: 700 }}>Email ID</th>
                          <th style={{ padding: '10px 14px', fontWeight: 700 }}>Department</th>
                          {og.id === 'grp-class-teachers' && (
                            <th style={{ padding: '10px 14px', fontWeight: 700 }}>Assigned Class</th>
                          )}
                          {(og.id === 'grp-dqc-student-rep' || og.id === 'grp-student-reps') && (
                            <>
                              <th style={{ padding: '10px 14px', fontWeight: 700 }}>Class</th>
                              <th style={{ padding: '10px 14px', fontWeight: 700 }}>Badge</th>
                            </>
                          )}
                          {og.id === 'grp-evaluation-committee' && (
                            <th style={{ padding: '10px 14px', fontWeight: 700 }}>Allocated Categories</th>
                          )}
                          <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center', width: '80px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberList.map((m, idx) => (
                          <tr
                            key={m.email || idx}
                            style={{
                              borderBottom: idx === memberList.length - 1 ? 'none' : '1px solid #f1f5f9',
                              transition: 'background 0.15s ease'
                            }}
                          >
                            <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)' }}>
                              {m.name || m.email.split('@')[0]}
                            </td>
                            <td style={{ padding: '12px 14px', color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.84rem' }}>
                              {m.email}
                            </td>
                            <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                              {m.department || '—'}
                            </td>

                            {/* Class Teachers assigned class */}
                            {og.id === 'grp-class-teachers' && (
                              <td style={{ padding: '12px 14px' }}>
                                {m.assigned_class ? (
                                  <span style={{ padding: '3px 10px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700 }}>
                                    {m.assigned_class}
                                  </span>
                                ) : (
                                  <span className="muted" style={{ fontSize: '0.78rem', fontStyle: 'italic' }}>Unassigned (Dept Mgmt)</span>
                                )}
                              </td>
                            )}

                            {/* DQC & Student Reps class and badge */}
                            {(og.id === 'grp-dqc-student-rep' || og.id === 'grp-student-reps') && (
                              <>
                                <td style={{ padding: '12px 14px' }}>
                                  {m.assigned_class ? (
                                    <span style={{ padding: '3px 10px', background: '#fef3c7', color: '#b45309', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700 }}>
                                      {m.assigned_class}
                                    </span>
                                  ) : (
                                    <span className="muted" style={{ fontSize: '0.78rem' }}>—</span>
                                  )}
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                  <span
                                    style={{
                                      padding: '3px 10px',
                                      background: og.id === 'grp-dqc-student-rep' ? '#e0e7ff' : '#ecfdf5',
                                      color: og.id === 'grp-dqc-student-rep' ? '#4338ca' : '#047857',
                                      borderRadius: '12px',
                                      fontSize: '0.76rem',
                                      fontWeight: 800
                                    }}
                                  >
                                    {og.id === 'grp-dqc-student-rep' ? 'DQC member' : 'Student Rep'}
                                  </span>
                                </td>
                              </>
                            )}

                            {/* Evaluation Committee categories */}
                            {og.id === 'grp-evaluation-committee' && (
                              <td style={{ padding: '12px 14px' }}>
                                {m.categories && m.categories.length > 0 ? (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {m.categories.map((c, cIdx) => {
                                      const catName = typeof c === 'object' && c !== null ? (c.name || c.code || '') : String(c);
                                      return (
                                        <span
                                          key={cIdx}
                                          style={{
                                            padding: '2px 8px',
                                            background: '#f3e8ff',
                                            color: '#7e22ce',
                                            borderRadius: '8px',
                                            fontSize: '0.72rem',
                                            fontWeight: 700
                                          }}
                                        >
                                          {catName}
                                        </span>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="muted" style={{ fontSize: '0.78rem', fontStyle: 'italic' }}>
                                    None assigned (Evaluator Mgmt)
                                  </span>
                                )}
                              </td>
                            )}

                            {/* Remove button */}
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(og.id, m.email)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#ef4444',
                                  fontSize: '1.1rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  transition: 'background 0.15s ease'
                                }}
                                title={`Remove ${m.email} from ${og.name}`}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

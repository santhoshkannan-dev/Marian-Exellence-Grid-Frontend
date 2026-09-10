'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { CustomModal } from '@/components/CustomModal';

export default function AdminGroupsPage() {
  const { userGroups, users, addUserGroup, deleteUserGroup, addUserToGroup, removeUserFromGroup } = useApp();
  const [deleteGroupModal, setDeleteGroupModal] = useState<{ id: string; name: string } | null>(null);

  // Create Group State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  // Add Email State per Group
  const [emailInputs, setEmailInputs] = useState<{ [groupId: string]: string }>({});
  const [statusMsgs, setStatusMsgs] = useState<{ [groupId: string]: { type: 'success' | 'error'; msg: string } }>({});

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    addUserGroup({
      name: newGroupName.trim(),
      description: newGroupDesc.trim(),
      emails: []
    });

    setNewGroupName('');
    setNewGroupDesc('');
  };

  const handleAddEmail = (groupId: string, e: React.FormEvent) => {
    e.preventDefault();
    const emailToAdd = emailInputs[groupId]?.trim().toLowerCase();

    if (!emailToAdd) {
      setStatusMsgs((prev) => ({ ...prev, [groupId]: { type: 'error', msg: 'Please enter a valid email address.' } }));
      return;
    }

    if (!emailToAdd.includes('@')) {
      setStatusMsgs((prev) => ({ ...prev, [groupId]: { type: 'error', msg: 'Invalid email format.' } }));
      return;
    }

    const success = addUserToGroup(groupId, emailToAdd);
    if (success) {
      setStatusMsgs((prev) => ({ ...prev, [groupId]: { type: 'success', msg: `Added ${emailToAdd} to group!` } }));
      setEmailInputs((prev) => ({ ...prev, [groupId]: '' }));
    } else {
      setStatusMsgs((prev) => ({ ...prev, [groupId]: { type: 'error', msg: 'Email is already in this group.' } }));
    }
  };

  const totalMembersCount = userGroups.reduce((acc, g) => acc + g.emails.length, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Heading & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>User Groups & Access Management</h1>
          <p className="muted" style={{ fontSize: '0.88rem' }}>Create custom user groups and assign users by Email ID</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="card" style={{ padding: '12px 20px', minWidth: '130px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Groups</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{userGroups.length}</div>
          </div>
          <div className="card" style={{ padding: '12px 20px', minWidth: '130px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Group Members</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{totalMembersCount}</div>
          </div>
        </div>
      </div>

      {/* Create New Group Card */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px' }}>👥 Create New Group</h2>
        <form onSubmit={handleCreateGroup} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr auto', gap: '16px', alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label">Group Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. DQC Evaluation Panel"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="input"
              placeholder="Describe group scope, responsibilities, or access level..."
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ height: '44px', padding: '0 24px', fontWeight: 700 }}>
            + Create Group
          </button>
        </form>
      </div>

      {/* User Groups List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Configured User Groups</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
          {userGroups.map((group) => {
            const status = statusMsgs[group.id];

            return (
              <div
                key={group.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative',
                  border: '1px solid rgba(0,0,0,0.08)',
                  background: '#ffffff'
                }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>{group.name}</h3>
                    <p className="muted" style={{ fontSize: '0.84rem', marginTop: '4px' }}>
                      {group.description || 'No description provided.'}
                    </p>
                  </div>
                  <span
                    style={{
                      padding: '4px 12px',
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: 'var(--primary)',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {group.emails.length} Members
                  </span>
                </div>

                {/* Add User to Group Form */}
                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>
                    ➕ Add User to Group by Email ID
                  </label>

                  <form onSubmit={(e) => handleAddEmail(group.id, e)} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="email"
                      className="input"
                      style={{ fontSize: '0.85rem', height: '38px', flex: 1 }}
                      placeholder="e.g. user@mariancollege.org"
                      value={emailInputs[group.id] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEmailInputs((prev) => ({ ...prev, [group.id]: val }));
                        setStatusMsgs((prev) => ({ ...prev, [group.id]: { type: 'success', msg: '' } }));
                      }}
                      list={`user-suggestions-${group.id}`}
                      required
                    />

                    {/* Quick suggestion dropdown list of existing users */}
                    <datalist id={`user-suggestions-${group.id}`}>
                      {users.map((u) => (
                        <option key={u.id} value={u.email}>{u.name} ({u.role})</option>
                      ))}
                    </datalist>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ height: '38px', padding: '0 14px', fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' }}
                    >
                      Add Email
                    </button>
                  </form>

                  {/* Quick Select Buttons from Registered Database Users */}
                  <div style={{ marginTop: '10px' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick Add Registered Users:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {users.slice(0, 5).map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => addUserToGroup(group.id, u.email)}
                          style={{
                            padding: '3px 8px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            color: '#334155'
                          }}
                          title={`Add ${u.email} (${u.role})`}
                        >
                          + {u.email.split('@')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {status?.msg && (
                    <div
                      style={{
                        marginTop: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: status.type === 'error' ? '#dc2626' : '#16a34a'
                      }}
                    >
                      {status.msg}
                    </div>
                  )}
                </div>

                {/* Member Emails List */}
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>
                    Group Member Emails:
                  </span>

                  {group.emails.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '160px', overflowY: 'auto', padding: '4px 0' }}>
                      {group.emails.map((email) => (
                        <div
                          key={email}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '16px',
                            fontSize: '0.78rem',
                            color: '#1e40af',
                            fontWeight: 600
                          }}
                        >
                          <span>{email}</span>
                          <button
                            type="button"
                            onClick={() => removeUserFromGroup(group.id, email)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              fontWeight: 800,
                              cursor: 'pointer',
                              padding: '0 2px',
                              lineHeight: 1
                            }}
                            title={`Remove ${email} from group`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted" style={{ fontSize: '0.82rem', fontStyle: 'italic' }}>
                      No user emails added to this group yet. Use the form above to add members.
                    </p>
                  )}
                </div>

                {/* Card Footer Action */}
                <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700 }}
                    onClick={() => setDeleteGroupModal({ id: group.id, name: group.name })}
                  >
                    🗑️ Delete Group
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Group Custom Modal */}
      <CustomModal
        isOpen={deleteGroupModal !== null}
        onClose={() => setDeleteGroupModal(null)}
        title="Delete User Group"
        icon="🗑️"
        description={deleteGroupModal ? `Are you sure you want to delete the group "${deleteGroupModal.name}"? This action cannot be undone.` : ''}
        confirmText="Delete Group"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={() => {
          if (deleteGroupModal) {
            deleteUserGroup(deleteGroupModal.id);
            setDeleteGroupModal(null);
          }
        }}
      />
    </div>
  );
}

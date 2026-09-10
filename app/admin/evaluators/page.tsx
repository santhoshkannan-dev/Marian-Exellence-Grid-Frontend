'use client';

import React, { useState } from 'react';
import { useApp, EvaluatorUser } from '@/context/AppContext';
import { isStaffEmail } from '@/data/initialData';
import { toast } from 'react-toastify';
import { CustomModal } from '@/components/CustomModal';

export default function EvaluatorManagementPage() {
  const {
    evaluators,
    criteriaCatalog,
    fetchEvaluators,
    createEvaluator,
    updateEvaluatorCategories,
    deleteEvaluator,
  } = useApp();

  // Refresh evaluators list when page is visited
  React.useEffect(() => {
    fetchEvaluators();
  }, []);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvaluator, setEditingEvaluator] = useState<EvaluatorUser | null>(null);
  const [deleteConfirmEvaluator, setDeleteConfirmEvaluator] = useState<EvaluatorUser | null>(null);

  // Add Evaluator Form State
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategories, setNewCategories] = useState<string[]>([]);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit Evaluator Categories State
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  const isMarianEmail = (email: string) => {
    return email.trim().toLowerCase().endsWith('@mariancollege.org');
  };

  const handleOpenAddModal = () => {
    setNewEmail('');
    setNewName('');
    setNewCategories([]);
    setAddError('');
    setIsAddModalOpen(true);
  };

  const handleToggleNewCategory = (catCode: string) => {
    setNewCategories(prev =>
      prev.includes(catCode) ? prev.filter(c => c !== catCode) : [...prev, catCode]
    );
  };

  const handleSelectAllNew = () => {
    setNewCategories(criteriaCatalog.map(c => c.id || c.code));
  };

  const handleClearAllNew = () => {
    setNewCategories([]);
  };

  const handleCreateEvaluator = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    const emailClean = newEmail.trim().toLowerCase();
    if (!emailClean) {
      setAddError('Email address is required.');
      return;
    }

    if (!isStaffEmail(emailClean)) {
      setAddError('Only staff emails in name.name@mariancollege.org format (e.g. allen.george@mariancollege.org) are permitted as evaluators. Student emails are not allowed.');
      return;
    }

    setIsSubmittingAdd(true);
    const result = await createEvaluator({
      email: emailClean,
      name: newName.trim(),
      assigned_categories: newCategories,
    });
    setIsSubmittingAdd(false);

    if (result.success) {
      toast.success(`Evaluator ${emailClean} added successfully!`);
      setIsAddModalOpen(false);
      setNewEmail('');
      setNewName('');
      setNewCategories([]);
    } else {
      setAddError(result.error || 'Failed to add evaluator.');
      toast.error(result.error || 'Failed to add evaluator.');
    }
  };

  const handleOpenEditModal = (evaluator: EvaluatorUser) => {
    setEditingEvaluator(evaluator);
    setEditCategories(evaluator.assigned_categories || []);
  };

  const handleToggleEditCategory = (catCode: string) => {
    setEditCategories(prev =>
      prev.includes(catCode) ? prev.filter(c => c !== catCode) : [...prev, catCode]
    );
  };

  const handleSelectAllEdit = () => {
    setEditCategories(criteriaCatalog.map(c => c.id || c.code));
  };

  const handleClearAllEdit = () => {
    setEditCategories([]);
  };

  const handleSaveEditCategories = async () => {
    if (!editingEvaluator) return;
    setIsSubmittingEdit(true);

    const result = await updateEvaluatorCategories(
      editingEvaluator.email,
      editCategories
    );
    setIsSubmittingEdit(false);

    if (result.success) {
      toast.success(`Updated assigned categories for ${editingEvaluator.email}!`);
      setEditingEvaluator(null);
    } else {
      toast.error(result.error || 'Failed to update categories.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmEvaluator) return;
    const emailToDelete = deleteConfirmEvaluator.email;
    const result = await deleteEvaluator(emailToDelete);
    if (result.success) {
      toast.success(`Evaluator ${emailToDelete} removed successfully.`);
      setDeleteConfirmEvaluator(null);
    } else {
      toast.error(result.error || 'Failed to remove evaluator.');
    }
  };

  // Category name resolver
  const getCategoryName = (catCode: string) => {
    const found = criteriaCatalog.find(c => c.id === catCode || c.code === catCode);
    return found ? found.category : catCode;
  };

  // Filtered evaluators
  const filteredEvaluators = evaluators.filter(e => {
    const q = searchTerm.toLowerCase();
    return (
      e.email.toLowerCase().includes(q) ||
      (e.name && e.name.toLowerCase().includes(q)) ||
      (e.department && e.department.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Evaluator Management
          </h1>
          <p className="muted" style={{ fontSize: '0.88rem', marginTop: '4px' }}>
            Add evaluation team members using @mariancollege.org accounts and configure their assigned criteria categories.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          id="btn-add-evaluator"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 22px',
            background: 'linear-gradient(135deg, var(--primary, #4f46e5), #6366f1)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
            transition: 'all 0.2s ease',
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Evaluator
        </button>
      </div>

      {/* Overview Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '16px 20px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Evaluators
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
            {evaluators.length}
          </div>
        </div>
        <div className="card" style={{ padding: '16px 20px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Available Categories
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            {criteriaCatalog.length}
          </div>
        </div>
        <div className="card" style={{ padding: '16px 20px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Allowed Domain
          </span>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#3b82f6', marginTop: '6px' }}>
            @mariancollege.org
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
          <input
            type="text"
            className="input"
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '38px', height: '42px', fontSize: '0.9rem' }}
          />
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', left: '12px', top: '12px' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {/* Evaluator List */}
      {filteredEvaluators.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚖️</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
            {evaluators.length === 0 ? 'No Evaluators Registered Yet' : 'No Evaluators Match Your Search'}
          </h3>
          <p className="muted" style={{ fontSize: '0.88rem', maxWidth: '460px', margin: '0 auto 20px' }}>
            {evaluators.length === 0
              ? 'Click "+ Add Evaluator" to create an evaluator using their official @mariancollege.org email and assign criteria categories.'
              : 'Try searching with a different email address or name.'}
          </p>
          {evaluators.length === 0 && (
            <button
              onClick={handleOpenAddModal}
              style={{
                padding: '10px 20px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              + Add First Evaluator
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
          {filteredEvaluators.map((evaluator) => {
            const assignedCount = evaluator.assigned_categories?.length || 0;
            const initials = (evaluator.name || evaluator.email)
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2);

            return (
              <div
                key={evaluator.email}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '24px',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: '14px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div>
                  {/* Top row: Avatar, Info, and Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.25 }}>
                          {evaluator.name || evaluator.email.split('@')[0]}
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', wordBreak: 'break-all' }}>
                          {evaluator.email}
                        </p>
                        {evaluator.department && (
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                            {evaluator.department}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '4px 10px',
                        background: assignedCount > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        color: assignedCount > 0 ? '#059669' : '#d97706',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {assignedCount} {assignedCount === 1 ? 'Category' : 'Categories'}
                    </span>
                  </div>

                  {/* Assigned Categories List */}
                  <div style={{ marginTop: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
                        Assigned Categories
                      </span>
                    </div>

                    {assignedCount === 0 ? (
                      <div
                        style={{
                          padding: '12px',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          color: '#94a3b8',
                          fontStyle: 'italic',
                          textAlign: 'center',
                          border: '1px dashed #e2e8f0',
                        }}
                      >
                        No categories currently assigned.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                        {evaluator.assigned_categories.map((catCode) => (
                          <span
                            key={catCode}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 10px',
                              background: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                            {getCategoryName(catCode)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                    gap: '10px',
                  }}
                >
                  <button
                    onClick={() => handleOpenEditModal(evaluator)}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      background: '#ffffff',
                      color: 'var(--primary)',
                      border: '1px solid var(--primary)',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit Categories
                  </button>

                  <button
                    onClick={() => setDeleteConfirmEvaluator(evaluator)}
                    title="Remove Evaluator"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px 12px',
                      background: 'transparent',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. ADD EVALUATOR MODAL                                    */}
      {/* ========================================================= */}
      <CustomModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Evaluator"
        icon="⚖️"
        description="Register a new evaluation committee member using their official Marian College account."
        confirmText={isSubmittingAdd ? "Adding..." : "Add Evaluator"}
        cancelText="Cancel"
        onConfirm={() => {
          // Trigger form submit
          const btn = document.getElementById('hidden-add-evaluator-submit');
          if (btn) btn.click();
        }}
        maxWidth="680px"
      >
        <form onSubmit={handleCreateEvaluator} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {addError && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '0.86rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {addError}
            </div>
          )}

          {/* Email input with domain validator */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
              Evaluator Email <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                className="input"
                placeholder="name@mariancollege.org"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                style={{
                  borderColor: newEmail
                    ? isStaffEmail(newEmail)
                      ? '#10b981'
                      : '#ef4444'
                    : undefined,
                  paddingRight: '36px',
                }}
              />
              {newEmail && (
                <div
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                >
                  {isStaffEmail(newEmail) ? (
                    <span title="Valid Staff Email (name.name@mariancollege.org)" style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
                  ) : (
                    <span title="Must be staff email (name.name@mariancollege.org)" style={{ color: '#ef4444', fontWeight: 800 }}>✗</span>
                  )}
                </div>
              )}
            </div>
            <p
              style={{
                fontSize: '0.78rem',
                marginTop: '6px',
                color: newEmail && !isStaffEmail(newEmail) ? '#ef4444' : 'var(--text-muted)',
                fontWeight: newEmail && !isStaffEmail(newEmail) ? 600 : 400,
              }}
            >
              {newEmail && !isStaffEmail(newEmail)
                ? '⚠️ Only staff emails (name.name@mariancollege.org, e.g. allen.george@mariancollege.org) are permitted. Student emails are not allowed.'
                : 'Evaluators must be faculty/staff members with official name.name@mariancollege.org email addresses (e.g. allen.george@mariancollege.org).'}
            </p>
          </div>

          {/* Optional Name input */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
              Full Name <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Dr. Allen George"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>

          {/* Assigned Categories */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', display: 'block' }}>
                  Assign Initial Categories
                </label>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Selected categories ({newCategories.length}/{criteriaCatalog.length})
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleSelectAllNew}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#334155',
                  }}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleClearAllNew}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#64748b',
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '8px',
                maxHeight: '220px',
                overflowY: 'auto',
                padding: '10px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: '#f8fafc',
              }}
            >
              {criteriaCatalog.map((category) => {
                const catCode = category.id || category.code;
                const isSelected = newCategories.includes(catCode);
                return (
                  <button
                    key={catCode}
                    type="button"
                    onClick={() => handleToggleNewCategory(catCode)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: isSelected ? 'rgba(99, 102, 241, 0.08)' : '#ffffff',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: isSelected ? 'none' : '1.5px solid #cbd5e1',
                        background: isSelected ? 'var(--primary)' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isSelected && (
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                      }}
                    >
                      {category.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button id="hidden-add-evaluator-submit" type="submit" style={{ display: 'none' }} />
        </form>
      </CustomModal>

      {/* ========================================================= */}
      {/* 2. EDIT EVALUATOR CATEGORIES MODAL                        */}
      {/* ========================================================= */}
      <CustomModal
        isOpen={Boolean(editingEvaluator)}
        onClose={() => setEditingEvaluator(null)}
        title="Edit Assigned Categories"
        icon="📝"
        description={`Update criteria categories assigned to ${editingEvaluator?.name || editingEvaluator?.email}.`}
        confirmText={isSubmittingEdit ? "Saving..." : "Save Categories"}
        cancelText="Cancel"
        onConfirm={handleSaveEditCategories}
        maxWidth="680px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Assigned ({editCategories.length}/{criteriaCatalog.length})
            </span>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleSelectAllEdit}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: '#334155',
                }}
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClearAllEdit}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                Clear All
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '8px',
              maxHeight: '320px',
              overflowY: 'auto',
              padding: '12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              background: '#f8fafc',
            }}
          >
            {criteriaCatalog.map((category) => {
              const catCode = category.id || category.code;
              const isAssigned = editCategories.includes(catCode);
              return (
                <button
                  key={catCode}
                  type="button"
                  onClick={() => handleToggleEditCategory(catCode)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    background: isAssigned ? 'rgba(99, 102, 241, 0.08)' : '#ffffff',
                    border: isAssigned ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      border: isAssigned ? 'none' : '1.5px solid #cbd5e1',
                      background: isAssigned ? 'var(--primary)' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isAssigned && (
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: isAssigned ? 700 : 500,
                      color: isAssigned ? 'var(--primary)' : 'var(--text-main)',
                    }}
                  >
                    {category.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </CustomModal>

      {/* ========================================================= */}
      {/* 3. DELETE EVALUATOR CONFIRMATION MODAL                    */}
      {/* ========================================================= */}
      <CustomModal
        isOpen={Boolean(deleteConfirmEvaluator)}
        onClose={() => setDeleteConfirmEvaluator(null)}
        title="Remove Evaluator"
        icon="⚠️"
        description={`Are you sure you want to remove ${deleteConfirmEvaluator?.name || deleteConfirmEvaluator?.email} from the evaluation team? All category assignments for this evaluator will be revoked.`}
        confirmText="Yes, Remove Evaluator"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { toast } from 'react-toastify';

export default function EvaluatorManagementPage() {
  const { criteriaCatalog, userGroups, assignEvaluatorsToCategory } = useApp();

  // Local state for category assignments
  // categoryAssignments[categoryId] = [evaluatorEmails...]
  const [categoryAssignments, setCategoryAssignments] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize state when criteriaCatalog loads
  useEffect(() => {
    const initial: Record<string, string[]> = {};
    criteriaCatalog.forEach((cat) => {
      initial[cat.id] = cat.evaluators || [];
    });
    setCategoryAssignments(initial);
  }, [criteriaCatalog]);

  // Find evaluators from the evaluator groups
  const evaluatorGroups = userGroups.filter(
    (g) => g.id === 'grp-evaluation-committee' || g.id === 'grp-evaluators' || g.name.toLowerCase().includes('evaluat')
  );
  
  // Get unique list of all evaluator emails
  const allEvaluators = Array.from(new Set(evaluatorGroups.flatMap((g) => g.emails)));

  const toggleCategoryForEvaluator = (evaluatorEmail: string, categoryId: string) => {
    setCategoryAssignments(prev => {
      const currentEvaluators = prev[categoryId] || [];
      const isAssigned = currentEvaluators.includes(evaluatorEmail);
      
      let newEvaluators;
      if (isAssigned) {
        newEvaluators = currentEvaluators.filter(e => e !== evaluatorEmail);
      } else {
        newEvaluators = [...currentEvaluators, evaluatorEmail];
      }
      
      return {
        ...prev,
        [categoryId]: newEvaluators
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Execute saves sequentially for all categories in state
      for (const [categoryId, evaluators] of Object.entries(categoryAssignments)) {
        await assignEvaluatorsToCategory(categoryId, evaluators);
      }
      toast.success('Changes saved successfully to the database!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>Evaluator Management</h1>
          <p className="muted" style={{ fontSize: '0.88rem' }}>Assign specific categories to each member of the Evaluation Committee.</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            padding: '10px 24px',
            background: isSaving ? '#94a3b8' : 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
        >
          {isSaving ? 'Saving...' : 'Confirm & Save Changes'}
        </button>
      </div>

      {allEvaluators.length === 0 ? (
        <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No evaluators found. Please add users to the "Evaluation Committee" group in the User Groups page first.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          {allEvaluators.map((evaluatorEmail) => {
            // Calculate how many categories are currently assigned to this evaluator
            const assignedCount = Object.values(categoryAssignments).filter(evaluators => evaluators.includes(evaluatorEmail)).length;
            
            return (
              <div key={evaluatorEmail} className="card" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>{evaluatorEmail}</h3>
                    <p className="muted" style={{ fontSize: '0.8rem' }}>Evaluation Committee Member</p>
                  </div>
                  <span
                    style={{
                      padding: '4px 12px',
                      background: assignedCount > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: assignedCount > 0 ? '#10b981' : '#f59e0b',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                    }}
                  >
                    {assignedCount} Categories Assigned
                  </span>
                </div>
                
                <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-main)' }}>
                  Assigned Categories:
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {criteriaCatalog.map((category) => {
                    const isAssigned = (categoryAssignments[category.id] || []).includes(evaluatorEmail);
                    return (
                      <button
                        key={category.id}
                        onClick={() => toggleCategoryForEvaluator(evaluatorEmail, category.id)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: isAssigned ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                          background: isAssigned ? 'rgba(99, 102, 241, 0.05)' : '#ffffff',
                          color: isAssigned ? 'var(--primary)' : 'var(--text-muted)',
                          fontSize: '0.85rem',
                          fontWeight: isAssigned ? 700 : 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            border: isAssigned ? 'none' : '1px solid #cbd5e1',
                            background: isAssigned ? 'var(--primary)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isAssigned && (
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </div>
                        {category.category}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

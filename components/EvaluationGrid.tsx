'use client';

import React from 'react';
import { policyCategories, PolicyCategory } from './policyData';

interface EvaluationGridProps {
  onViewDetails?: (category: PolicyCategory) => void;
}

export const EvaluationGrid: React.FC<EvaluationGridProps> = ({ onViewDetails }) => {
  // Duplicate categories to ensure a seamless infinite scrolling loop
  const duplicatedCategories = [...policyCategories, ...policyCategories];

  return (
    <section style={{ padding: '60px 0', maxWidth: '100%', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px', padding: '0 24px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>Best Class Evaluation Criteria</h2>
        <p className="muted" style={{ fontSize: '0.96rem', marginTop: '6px' }}>
          Hover to pause auto-scrolling, or swipe to explore category standards.
        </p>
      </div>

      {/* Infinite Marquee Container */}
      <div className="marquee-container">
        <div className="marquee-track">
          {duplicatedCategories.map((c, index) => (
            <div
              key={`${c.id}-${index}`}
              className="card"
              style={{
                width: '320px',
                flexShrink: 0,
                background: 'rgba(255, 255, 255, 0.75)',
                border: '1.5px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'none',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                minHeight: '220px',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(79, 70, 229, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '1.4rem' }}>{c.icon}</span>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: '#4f46e5',
                      background: 'rgba(79, 70, 229, 0.06)',
                      padding: '4px 10px',
                      borderRadius: '12px'
                    }}
                  >
                    {c.detailsLabel}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>{c.title}</h3>
                <p className="muted" style={{ fontSize: '0.84rem', lineHeight: 1.5, margin: '0 0 16px 0' }}>{c.description}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)' }}>Interactive Metrics</span>
                <span
                  style={{ fontSize: '0.82rem', fontWeight: 800, color: '#4f46e5', cursor: 'pointer' }}
                  onClick={() => {
                    if (onViewDetails) onViewDetails(c);
                  }}
                >
                  View Details &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

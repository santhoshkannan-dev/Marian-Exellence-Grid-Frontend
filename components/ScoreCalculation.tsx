'use client';

import React from 'react';

export const ScoreCalculation: React.FC = () => {
  return (
    <section style={{ padding: '60px 24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>Score Calculation & Grading</h2>
        <p className="muted" style={{ fontSize: '0.96rem', marginTop: '6px' }}>Official indexing process used to normalize performance and rank student batches.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'stretch' }}>
        {/* Score formulation card */}
        <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#ffffff', borderRadius: '24px', border: '1.5px solid var(--glass-border)' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              Authoritative Indexing Formula
            </h3>
            <div style={{ background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: '14px', padding: '16px', marginTop: '16px' }}>
              <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.05rem', color: '#3730a3' }}>
                M = (S − P) / N² × (1 + 100 × (N − n))
              </div>
              <p style={{ fontSize: '0.78rem', color: '#6366f1', margin: '8px 0 0 0' }}>
                S = Evaluated Marks | P = Penalties (defined in department management) | N = Class Size (defined in department management) | n = 0 (Smallest Class Benchmark defined in department management)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: '#ffffff', fontWeight: 800, fontSize: '0.84rem', flexShrink: 0 }}>1</span>
              <div>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2px 0' }}>Obtained Net Score (S − P)</h4>
                <p className="muted" style={{ fontSize: '0.84rem', margin: 0 }}>Evaluated marks across all categories minus class penalties defined in department management.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: '#ffffff', fontWeight: 800, fontSize: '0.84rem', flexShrink: 0 }}>2</span>
              <div>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2px 0' }}>Cohort Normalization (N²)</h4>
                <p className="muted" style={{ fontSize: '0.84rem', margin: 0 }}>
                  Normalizes the net score against class size squared (N²) to establish a per-capita baseline.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: '#ffffff', fontWeight: 800, fontSize: '0.84rem', flexShrink: 0 }}>3</span>
              <div>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2px 0' }}>Benchmark Multiplier (1 + 100 × (N − n))</h4>
                <p className="muted" style={{ fontSize: '0.84rem', margin: 0 }}>Class size benchmark multiplier scaling with cohort size relative to benchmark n (default 0).</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: '#ffffff', fontWeight: 800, fontSize: '0.84rem', flexShrink: 0 }}>4</span>
              <div>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2px 0' }}>Class Index Mark (M)</h4>
                <p className="muted" style={{ fontSize: '0.84rem', margin: 0 }}>
                  Final institutional ranking index M = (S − P) / N² × (1 + 100 × (N − n)).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Grade Classification card */}
        <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#ffffff', borderRadius: '24px', border: '1.5px solid var(--glass-border)', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              Grade Classification
            </h3>
            <p className="muted" style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '16px' }}>
              Final class tags and performance categories are assigned strictly based on the Class Index percentile.
            </p>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Percentile Classification</span>
              <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Grade Tagging
              </p>
              <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '0.82rem' }}>
                Class tags are calculated dynamically relative to other classes based on Index percentile.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

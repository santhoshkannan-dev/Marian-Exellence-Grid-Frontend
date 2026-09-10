'use client';

import React from 'react';

interface TimelineStep {
  id: number;
  title: string;
  subtitle: string;
  desc: string;
}

export const WorkflowTimeline: React.FC = () => {
  const steps: TimelineStep[] = [
    {
      id: 1,
      title: 'Student Claims',
      subtitle: 'Submission',
      desc: 'Students submit proof documents and achievement claims for evaluation catalog items.'
    },
    {
      id: 2,
      title: 'DQAC Member Verification',
      subtitle: 'Student Rep Audit',
      desc: 'DQAC student representatives conduct initial verification of class and group achievement claims.'
    },
    {
      id: 3,
      title: 'Class Teacher Verification',
      subtitle: 'Faculty Advisor Review',
      desc: 'Class Teachers inspect uploaded files, verify claims, or request correction.'
    },
    {
      id: 4,
      title: 'Evaluation',
      subtitle: 'Evaluator Auditing',
      desc: 'Central evaluators audit materials, verify compliance, and award item marks.'
    },
    {
      id: 5,
      title: 'Mark Moderation',
      subtitle: 'Administrative Review',
      desc: 'Administrative team reviews metrics, moderates marks, and locks indexes.'
    },
    {
      id: 6,
      title: 'Class Index',
      subtitle: 'Score Aggregation',
      desc: 'The dynamic index calculates total class points divided by student strength.'
    },
    {
      id: 7,
      title: 'Final Grade',
      subtitle: 'Final Classification',
      desc: 'Best Class trophies and ratings are assigned based on final class indexes.'
    }
  ];

  return (
    <section style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>Evaluation Workflow</h2>
        <p className="muted" style={{ fontSize: '0.96rem', marginTop: '6px' }}>Step-by-step verification pipeline for class submissions.</p>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '20px',
          position: 'relative'
        }}
      >
        {/* Horizontal Connector Line for desktop */}
        <div
          style={{
            position: 'absolute',
            top: '30px',
            left: '40px',
            right: '40px',
            height: '2px',
            background: 'linear-gradient(to right, #4f46e5, #ec4899, #10b981)',
            zIndex: 0,
            opacity: 0.3
          }}
          className="timeline-line-desktop"
        />

        {steps.map((step) => (
          <div
            key={step.id}
            style={{
              flex: '1 1 130px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              zIndex: 1,
              position: 'relative',
              minWidth: '120px'
            }}
          >
            {/* Step circle */}
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#ffffff',
                border: '3px solid #4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: 800,
                color: '#4f46e5',
                boxShadow: '0 8px 24px rgba(79, 70, 229, 0.12)',
                marginBottom: '16px',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
              }}
            >
              {step.id}
            </div>

            {/* Step Label */}
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>{step.title}</h3>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>{step.subtitle}</span>
            <p className="muted" style={{ fontSize: '0.8rem', lineHeight: 1.4, margin: 0 }}>{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

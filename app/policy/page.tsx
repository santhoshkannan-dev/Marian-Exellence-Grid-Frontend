'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Hero } from '@/components/Hero';
import { PolicyCarousel } from '@/components/PolicyCarousel';
import { EvaluationGrid } from '@/components/EvaluationGrid';
import { WorkflowTimeline } from '@/components/WorkflowTimeline';
import { ScoreCalculation } from '@/components/ScoreCalculation';
import { OutcomesGrid } from '@/components/OutcomesGrid';
import { PolicyCategory } from '@/components/policyData';

export default function PolicyPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<PolicyCategory | null>(null);

  const handleOpenDetails = (category: PolicyCategory) => {
    setActiveCategory(category);
  };

  const handleCloseDetails = () => {
    setActiveCategory(null);
  };

  // Render modal details without any point values or scoring details
  const renderModalDetails = (categoryId: string) => {
    switch (categoryId) {
      case '1': // Academics
        return (
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Individual Performance</h4>
            <p className="muted" style={{ fontSize: '0.88rem', marginBottom: '12px' }}>
              Academic evaluation considers individual student grade achievements:
            </p>
            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-main)' }}>
                <li><strong>S Grade</strong> — Outstanding performance</li>
                <li><strong>A+ Grade</strong> — Excellent performance</li>
                <li><strong>A Grade</strong> — Very good performance</li>
                <li><strong>FAIL Grade</strong> — Course backlog (leads to score penalty)</li>
              </ul>
            </div>
            
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Class Pass Percentage</h4>
            <p className="muted" style={{ fontSize: '0.88rem', marginBottom: '12px' }}>
              Overall evaluation of the class pass percentage is mapped across these brackets:
            </p>
            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-main)' }}>
                <li>90.01% – 100.00%</li>
                <li>80.01% – 90.00%</li>
                <li>70.01% – 80.00%</li>
                <li>60.01% – 70.00%</li>
                <li>50.01% – 60.00%</li>
                <li>Below 50.00%</li>
              </ul>
            </div>

            <div style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '12px 16px', borderRadius: '12px', fontSize: '0.84rem', fontWeight: 600 }}>
              ℹ Note: Batches with a separate grade scheme will be marked and evaluated accordingly.
            </div>
          </div>
        );

      case '2': // Online Courses
        return (
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Recognized Courses</h4>
            <p className="muted" style={{ fontSize: '0.88rem', marginBottom: '12px' }}>
              Recognized SWAYAM, NPTEL and MOOC courses completed during the evaluation period.
            </p>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-main)' }}>
              <div>• <strong>SWAYAM / NPTEL Certifications</strong></div>
              <div>• <strong>MOOC Platforms</strong></div>
            </div>

            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Rules & Guidelines</h4>
            <ul style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '20px', margin: 0, color: 'var(--text-main)' }}>
              <li>Evaluations are counted on a per-course basis.</li>
              <li>A maximum of 3 courses will be evaluated per student.</li>
              <li>Courses should have credits that can be added to the Academic Bank of Credits (ABC).</li>
              <li>The evaluation period falls between June and February.</li>
              <li><strong>Only certificates successfully uploaded in DigiLocker will be considered.</strong></li>
            </ul>
          </div>
        );

      case '3': // Competitive Exams
        return (
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Qualifying Examinations</h4>
            <p className="muted" style={{ fontSize: '0.88rem', marginBottom: '16px' }}>
              Rewards qualification and participation in relevant competitive examinations:
            </p>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0', color: 'var(--text-main)' }}>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>JRF</strong> (Joint Research Fellowship) Qualification</li>
                <li><strong>NET</strong> (National Eligibility Test) Qualification</li>
                <li><strong>Other Relevant Examinations</strong> — IELTS, PET, language-specific exams, etc.</li>
                <li><strong>Civil Service Examinations</strong> — Active participation in UPSC/PSC exams.</li>
              </ul>
            </div>

            <div style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '12px 16px', borderRadius: '12px', fontSize: '0.84rem', fontWeight: 600 }}>
              ℹ Rule: Maximum of 3 examinations will be evaluated per student.
            </div>
          </div>
        );

      case '4': // Internships
        return (
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Eligible Internship Formats</h4>
            <p className="muted" style={{ fontSize: '0.88rem', marginBottom: '16px' }}>
              Eligible offline and online internships completed outside the syllabus:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', color: 'var(--text-main)' }}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 700 }}>
                🏢 Offline Internship
              </div>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 700 }}>
                🌐 Online Internship
              </div>
            </div>

            <div style={{ background: '#fff7ed', border: '1.5px solid #ffedd5', padding: '16px', borderRadius: '16px', color: '#c2410c' }}>
              <h5 style={{ fontSize: '0.92rem', fontWeight: 800, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.02em' }}>⚠️ Eligibility Conditions</h5>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.86rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><strong>Only internships that are NOT part of the official syllabus are considered.</strong></li>
                <li>Minimum duration of the internship must be at least one month.</li>
                <li>The internship duration must fall within the timeframe of June 1 to February 28.</li>
                <li style={{ fontWeight: 700 }}>This eligibility information is critical because an internship is not automatically eligible just because a certificate exists.</li>
              </ul>
            </div>
          </div>
        );

      case '5': // Scholarships
        return (
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Eligible Merit Scholarships</h4>
            <p className="muted" style={{ fontSize: '0.88rem', marginBottom: '16px' }}>
              Recognizes merit scholarships secured by class students across local, state, or national levels:
            </p>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0', color: 'var(--text-main)' }}>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>🌍 International level scholarships</li>
                <li>🏛️ National level scholarships</li>
                <li>🏢 State level scholarships</li>
                <li>📍 District level scholarships</li>
              </ul>
            </div>

            <div style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #ffe4e6', padding: '12px 16px', borderRadius: '12px', fontSize: '0.84rem', fontWeight: 700 }}>
              ⚠️ Important: Scholarships availed directly from Marian College will not be considered.
            </div>
          </div>
        );

      case '6': // Research
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--text-main)' }}>
            <div>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 800, margin: '0 0 6px 0', color: '#0f172a' }}>Publications</h4>
              <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.86rem' }}>
                • Scopus / Web of Science indexed journals<br />
                • Conference Proceedings / Peer-reviewed articles
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 800, margin: '0 0 6px 0', color: '#0f172a' }}>Paper Presentation</h4>
              <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.86rem' }}>
                • Presentation at venues outside Marian College<br />
                • Presentation at venues inside Marian College
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 800, margin: '0 0 6px 0', color: '#0f172a' }}>Patents</h4>
              <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.86rem' }}>
                • Utility patents and Design patents
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 800, margin: '0 0 6px 0', color: '#0f172a' }}>Publications / Books</h4>
              <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.86rem' }}>
                • Books, Book Chapters, or Articles
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 800, margin: '0 0 6px 0', color: '#0f172a' }}>Funded Projects</h4>
              <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.86rem' }}>
                • Projects secured at International, National, State, or other levels
              </div>
            </div>

            <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: '12px 16px', borderRadius: '12px', fontSize: '0.84rem', color: '#c2410c', fontWeight: 700 }}>
              ⚠️ Important Rule: Consider only the number of publications, books and paper presentations, not the number of student co-authors. (e.g., one publication with four student authors counts as a single unit).
            </div>
          </div>
        );

      case '7': // Startups
        return (
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Government-Registered Startup</h4>
            <p className="muted" style={{ fontSize: '0.88rem', marginBottom: '16px' }}>
              Recognizes official government-registered student startups.
            </p>

            <div style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '16px', borderRadius: '12px', fontSize: '0.86rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><strong>Important Rule: Evaluation is calculated per startup, not per student.</strong></div>
              <div>One startup created by several students counts as a single startup unit, rather than multiplying by the number of students.</div>
            </div>
          </div>
        );

      case '8': // Prizes Won
        return (
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>From Marian College</h4>
            <p className="muted" style={{ fontSize: '0.88rem', marginBottom: '12px' }}>
              Achievements inside Marian College:
            </p>
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0', fontSize: '0.88rem', color: 'var(--text-main)' }}>
              • First Position (Individual & Group Tiers)<br />
              • Second Position (Individual & Group Tiers)<br />
              • Third Position (Individual & Group Tiers)
            </div>

            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Outside Marian College</h4>
            <p className="muted" style={{ fontSize: '0.88rem', marginBottom: '12px' }}>
              Achievements in external events:
            </p>
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0', fontSize: '0.88rem', color: 'var(--text-main)' }}>
              • First Position (Individual & Group Tiers)<br />
              • Second Position (Individual & Group Tiers)<br />
              • Third Position (Individual & Group Tiers)<br />
              • Participation (Individual & Group Tiers)
            </div>

            <div style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '12px 16px', borderRadius: '12px', fontSize: '0.84rem', fontWeight: 600 }}>
              ℹ Note: The same marking system applies to all types of events, including cultural, sports, and other co-curricular activities.
            </div>
          </div>
        );

      case '9': // Leaderships
        return (
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Elected Positions</h4>
            <p className="muted" style={{ fontSize: '0.88rem', marginBottom: '16px' }}>
              Recognition for democratically elected student representative positions other than class-level positions, including:
            </p>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0', color: 'var(--text-main)' }}>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>MCSC Representatives</li>
                <li>SAHYA Executive Body</li>
                <li>Clubs and Associations leadership roles</li>
              </ul>
            </div>

            <div style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #ffe4e6', padding: '12px 16px', borderRadius: '12px', fontSize: '0.84rem', fontWeight: 700 }}>
              ⚠️ Exclusion: Class representative positions are not eligible for leadership credits.
            </div>
          </div>
        );

      case '10': // Programs Organized
        return (
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Organizing Roles</h4>
            <p className="muted" style={{ fontSize: '0.88rem', marginBottom: '16px' }}>
              Recognition for organizing intercollegiate and intra-collegiate events:
            </p>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0', color: 'var(--text-main)' }}>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Intercollegiate Events</li>
                <li>Intra-collegiate / Department Events</li>
                <li>Class Magazine Editor or Coordinator roles</li>
              </ul>
            </div>

            <div style={{ background: '#fff1f2', color: '#b91c1c', border: '1.5px solid #fecaca', padding: '16px', borderRadius: '16px' }}>
              <h5 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 6px 0' }}>⚠️ EXCLUSION</h5>
              No marks/credits will be awarded for events conducted during the dates of SAHYA and CALIGO.
            </div>
          </div>
        );

      case '11': // Social Responsibilities
        return (
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Eligible Activities</h4>
            <p className="muted" style={{ fontSize: '0.88rem', marginBottom: '12px' }}>
              Community engagement, outreach participation and responsible student conduct:
            </p>
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0', fontSize: '0.88rem', color: 'var(--text-main)' }}>
              • Coordination of a community service event<br />
              • Outreach participation<br />
              • Coverage in news media (News media coverage strictly excludes self-published social media).
            </div>
            
            <p className="muted" style={{ fontSize: '0.84rem', marginBottom: '16px' }}>
              Examples include: Community Action Programme, Outreach activities, etc.
            </p>

            <div style={{ background: '#fff1f2', color: '#b91c1c', border: '1.5px solid #fecaca', padding: '16px', borderRadius: '16px' }}>
              <h5 style={{ fontSize: '0.92rem', fontWeight: 800, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.02em' }}>🚨 Disciplinary Penalty</h5>
              <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.4 }}>
                A penalty applies per student if a student in the class faces disciplinary action such as:
              </p>
              <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', fontSize: '0.86rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Suspension</li>
                <li>Punishment due to examination malpractice</li>
                <li>Similar code of conduct violations</li>
              </ul>
            </div>
          </div>
        );

      case '12': // Career Advancement
        return (
          <div>
            <p className="muted" style={{ fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px' }}>
              Career Advancement evaluates students' professional and academic development through library usage, LinkedIn engagement, and repository creation.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', color: 'var(--text-main)' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.88rem', fontWeight: 700 }}>
                📖<br />Library Usage
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.88rem', fontWeight: 700 }}>
                💼<br />LinkedIn Usage
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.88rem', fontWeight: 700 }}>
                💻<br />Repository Creation
              </div>
            </div>
          </div>
        );

      case '13': // Documentation
        return (
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Proper Digital Documentation</h4>
            <p className="muted" style={{ fontSize: '0.88rem', marginBottom: '16px' }}>
              Proper digital documentation and evidence supporting the class evaluation.
            </p>

            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Evaluation Method</h4>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0', fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--text-main)' }}>
              • <strong>There will be no oral presentation.</strong><br />
              • Evaluation consists of strict proof verification.<br />
              • Evaluators will perform interaction audits with class representatives if additional clarity is required.
            </div>

            <div style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '12px 16px', borderRadius: '12px', fontSize: '0.84rem', fontWeight: 600 }}>
              ℹ Note: This application system serves as the primary digital documentation and proof verification workflow.
            </div>
          </div>
        );

      default:
        return <p className="muted">No details available.</p>;
    }
  };

  return (
    <main
      style={{
        maxWidth: '1200px',
        margin: '20px auto 40px',
        padding: '0 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        animation: 'fadeUp 0.8s ease-out'
      }}
    >
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. 3D Card Carousel Section */}
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <PolicyCarousel onViewDetails={handleOpenDetails} />
      </section>

      {/* 3. Evaluation Grid Details */}
      <EvaluationGrid onViewDetails={handleOpenDetails} />

      {/* 4. Timeline Workflow */}
      <WorkflowTimeline />

      {/* 5. Score Formulation */}
      <ScoreCalculation />

      {/* 6. Expected Outcomes */}
      <OutcomesGrid />

      {/* Navigation Actions Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          borderTop: '1px solid var(--color-border)',
          paddingTop: '40px',
          marginTop: '20px',
          flexWrap: 'wrap',
        }}
      >
        <Link
          href="/"
          id="policy-return-home-btn"
          className="btn"
          style={{
            padding: '14px 32px',
            borderRadius: '14px',
            fontSize: '1rem',
            background: '#ffffff',
            color: '#1e293b',
            border: '1.5px solid var(--glass-border)',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
            textDecoration: 'none',
            cursor: 'pointer',
            fontWeight: 700,
          }}
          onClick={(e) => {
            e.preventDefault();
            router.push('/');
          }}
        >
          &larr; Return to Home
        </Link>
        <Link
          href="/login"
          id="policy-portal-login-btn"
          className="btn btn-primary"
          style={{
            padding: '14px 32px',
            borderRadius: '14px',
            fontSize: '1rem',
            boxShadow: '0 10px 25px rgba(79, 70, 229, 0.2)',
            textDecoration: 'none',
            cursor: 'pointer',
            fontWeight: 700,
          }}
          onClick={(e) => {
            e.preventDefault();
            router.push('/login');
          }}
        >
          Portal Login &rarr;
        </Link>
      </div>

      {/* Detailed Modal Popup Overlay */}
      {activeCategory && (
        <div className="details-modal-overlay" onClick={handleCloseDetails}>
          <div className="details-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleCloseDetails}
              aria-label="Close details"
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                background: 'transparent',
                border: 'none',
                fontSize: '1.6rem',
                cursor: 'pointer',
                fontWeight: 700,
                color: 'var(--text-main)',
                lineHeight: 1
              }}
            >
              &times;
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px', marginBottom: '8px' }}>
              <span style={{ fontSize: '2rem' }}>{activeCategory.icon}</span>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {activeCategory.title}
                </h3>
                <p className="muted" style={{ fontSize: '0.8rem', margin: '4px 0 0 0' }}>
                  Category Standard Details
                </p>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {renderModalDetails(activeCategory.id)}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

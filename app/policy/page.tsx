'use client';

import React, { useState } from 'react';
import { Hero } from '@/components/Hero';
import { PolicyCarousel } from '@/components/PolicyCarousel';
import { EvaluationGrid } from '@/components/EvaluationGrid';
import { WorkflowTimeline } from '@/components/WorkflowTimeline';
import { OutcomesGrid } from '@/components/OutcomesGrid';
import { PolicyCategory } from '@/components/policyData';
import { PolicyDetailsModal } from '@/components/PolicyDetailsModal';

export default function PolicyPage() {
  const [activeCategory, setActiveCategory] = useState<PolicyCategory | null>(null);

  const handleOpenDetails = (category: PolicyCategory) => {
    setActiveCategory(category);
  };

  const handleCloseDetails = () => {
    setActiveCategory(null);
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

      {/* 5. Expected Outcomes */}
      <OutcomesGrid />

      {/* Policy Details Modal Popup */}
      <PolicyDetailsModal
        category={activeCategory}
        onClose={handleCloseDetails}
      />
    </main>
  );
}

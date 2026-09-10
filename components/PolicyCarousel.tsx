'use client';

import React, { useState, useEffect, useRef } from 'react';
import { policyCategories, PolicyCategory } from './policyData';

interface PolicyCarouselProps {
  onViewDetails?: (category: PolicyCategory) => void;
}

export const PolicyCarousel: React.FC<PolicyCarouselProps> = ({ onViewDetails }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastWheelTime = useRef<number>(0);

  // Auto-slide every 3 seconds unless paused on hover
  useEffect(() => {
    if (!isPaused) {
      autoPlayTimer.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % policyCategories.length);
      }, 3000);
    }
    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };
  }, [isPaused]);

  // Support Mouse Wheel Scrolling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelTime.current < 180) return; // 180ms smooth throttle
      lastWheelTime.current = now;

      if (e.deltaY > 0 || e.deltaX > 0) {
        // Scroll down/right -> Next Category
        setActiveIndex((prev) => (prev + 1) % policyCategories.length);
      } else if (e.deltaY < 0 || e.deltaX < 0) {
        // Scroll up/left -> Previous Category
        setActiveIndex((prev) => (prev - 1 + policyCategories.length) % policyCategories.length);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Support touch swipe on mobile
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // swipe left -> next
        setActiveIndex((prev) => (prev + 1) % policyCategories.length);
      } else {
        // swipe right -> prev
        setActiveIndex((prev) => (prev - 1 + policyCategories.length) % policyCategories.length);
      }
    }
    touchStartX.current = null;
  };

  const getCardStyle = (index: number) => {
    let offset = index - activeIndex;
    if (offset < -6) offset += policyCategories.length;
    if (offset > 6) offset -= policyCategories.length;

    const absOffset = Math.abs(offset);

    // Limit visibility to a fan of 5 cards: active, 2 left, 2 right
    if (absOffset > 2) {
      return {
        transform: 'translateX(0px) scale(0.6) rotateY(0deg)',
        opacity: 0,
        zIndex: 0,
        pointerEvents: 'none' as const,
        visibility: 'hidden' as const
      };
    }

    const translateX = offset * 210; // horizontal layout separation
    const scale = 1 - absOffset * 0.12; // slightly scale down side cards
    const rotateY = offset * -20; // 3D Y fanned perspective angle
    const zIndex = 20 - absOffset;
    const opacity = 1 - absOffset * 0.3;

    return {
      transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
      zIndex,
      opacity,
      transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.6s, zIndex 0.6s'
    };
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '10px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        overflow: 'hidden'
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 3D Stack Container */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          height: '420px',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          perspective: '1200px',
          transformStyle: 'preserve-3d'
        }}
      >
        {policyCategories.map((card, index) => {
          const isActive = index === activeIndex;
          const style = getCardStyle(index);

          return (
            <div
              key={card.id}
              onClick={() => setActiveIndex(index)}
              style={{
                position: 'absolute',
                width: '320px',
                height: '380px',
                borderRadius: '24px',
                background: card.gradient,
                boxShadow: isActive
                  ? '0 20px 40px rgba(0,0,0,0.3), 0 0 30px rgba(255,255,255,0.1)'
                  : '0 10px 25px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px',
                color: '#ffffff',
                transformOrigin: 'center center',
                backfaceVisibility: 'hidden',
                ...style
              }}
            >
              {/* Card Top */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase'
                    }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: '1.8rem' }}>{card.icon}</span>
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: '0.84rem', lineHeight: 1.5, opacity: 0.85, margin: 0 }}>
                  {card.description}
                </p>
              </div>

              {/* Card Center (Minimal) */}
              <div style={{ flex: 1, margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.75 }}>
                  {card.detailsLabel}
                </span>
              </div>

              {/* Card Bottom */}
              <div
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.15)',
                  paddingTop: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', opacity: 0.7, fontWeight: 700 }}>Interactive Metrics</span>
                <span
                  style={{ fontSize: '0.86rem', fontWeight: 800, color: '#ffffff', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onViewDetails) onViewDetails(card);
                  }}
                >
                  View Details &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide Indicators */}
      <div style={{ display: 'flex', gap: '8px', zIndex: 10 }}>
        {policyCategories.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
            style={{
              width: index === activeIndex ? '28px' : '8px',
              height: '8px',
              borderRadius: '4px',
              border: 'none',
              background: index === activeIndex ? '#4f46e5' : '#cbd5e1',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>
    </div>
  );
};

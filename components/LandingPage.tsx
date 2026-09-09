'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Champion } from '@/data/initialData';
import { policyCategories, PolicyCategory } from './policyData';

interface StandingItem {
  rank: number;
  className: string;
  department: string;
  totalSubmissions: number;
  totalScore: number;
  percentage: number;
  color: string;
  M?: number | null;
  S?: number;
  P?: number;
}

const top10FallbackData: StandingItem[] = [
  { rank: 1, className: 'II MCA', department: 'PG Department of Computer Applications', totalSubmissions: 6, totalScore: 80, percentage: 22.0, color: '#4f46e5' },
  { rank: 2, className: 'BSc CS B', department: 'Computer Science', totalSubmissions: 15, totalScore: 1272, percentage: 14.5, color: '#059669' },
  { rank: 3, className: 'BCom C', department: 'Commerce', totalSubmissions: 12, totalScore: 978, percentage: 11.8, color: '#d97706' },
  { rank: 4, className: 'BSc CS A', department: 'Computer Science', totalSubmissions: 11, totalScore: 966, percentage: 11.2, color: '#ec4899' },
  { rank: 5, className: 'BA English B', department: 'English', totalSubmissions: 10, totalScore: 930, percentage: 10.4, color: '#8b5cf6' },
  { rank: 6, className: 'BA English A', department: 'English', totalSubmissions: 9, totalScore: 876, percentage: 9.2, color: '#06b6d4' },
  { rank: 7, className: 'BBA B', department: 'Business Admin', totalSubmissions: 8, totalScore: 850, percentage: 8.5, color: '#f97316' },
  { rank: 8, className: 'BSc Physics A', department: 'Physics', totalSubmissions: 7, totalScore: 754, percentage: 7.2, color: '#3b82f6' },
  { rank: 9, className: 'BCA A', department: 'Department of Computer Applications', totalSubmissions: 7, totalScore: 750, percentage: 7.0, color: '#10b981' },
  { rank: 10, className: 'BBA A', department: 'Business Admin', totalSubmissions: 6, totalScore: 730, percentage: 6.8, color: '#ef4444' },
];

const mockStudents = [
  { name: 'Rahul S', className: 'BCA A', department: 'The Under-Graduate Department of Computer Applications' },
  { name: 'Sneha K', className: 'BSc CS B', department: 'Computer Science' },
  { name: 'Arjun Prasad', className: 'BCom C', department: 'Commerce' },
  { name: 'Maria Antony', className: 'BA English A', department: 'English' },
  { name: 'Gautham Krishna', className: 'BBA A', department: 'Business Admin' },
  { name: 'Anjali Ramesh', className: 'BSc Physics A', department: 'Physics' },
];

const mockDepartments = [
  { name: 'Computer Science', score: 2988, progress: 92 },
  { name: 'Commerce', score: 2650, progress: 84 },
  { name: 'Management', score: 2150, progress: 76 },
  { name: 'Languages', score: 1806, progress: 68 },
  { name: 'Physics', score: 1680, progress: 62 },
  { name: 'Chemistry', score: 1420, progress: 54 },
];



const achievements = [
  { id: 1, icon: "🏅", class: "BCA A", title: "Completed 150 NPTEL Courses", desc: "Highest digital certification submissions this term." },
  { id: 2, icon: "🏆", class: "BSc Physics", title: "Won National Hackathon", desc: "1st place in Smart India Innovators contest." },
  { id: 3, icon: "🎓", class: "BCom", title: "95% Semester Pass Percentage", desc: "Outstanding academic performance across all batches." },
  { id: 4, icon: "🚀", class: "BSc CS B", title: "Launched 2 Registered Startups", desc: "TBI backed student ventures initiated." }
];

const initialActivities = [
  { id: 1, text: "✓ BCA A uploaded Internship Proof", time: "1 min ago" },
  { id: 2, text: "✓ BSc CS B added NPTEL Certificate", time: "3 mins ago" },
  { id: 3, text: "✓ BCom C uploaded Research Publication", time: "5 mins ago" },
  { id: 4, text: "✓ BA English A verified State Scholarship", time: "10 mins ago" },
  { id: 5, text: "✓ BBA A received 15 Marks for Outreach", time: "15 mins ago" },
];

const activityPool = [
  { text: "✓ BSc Physics A uploaded Prize Certificate", time: "Just now" },
  { text: "✓ BCA A verified competitive exam record", time: "Just now" },
  { text: "✓ BCom A added library borrow logs", time: "Just now" },
  { text: "✓ BSc CS A submitted startup pitch deck", time: "Just now" },
  { text: "✓ BBA B verified online certificate", time: "Just now" },
];

// Helper Animated CountUp Component
const CountUp: React.FC<{ end: number; duration?: number; suffix?: string }> = ({ end, duration = 1200, suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const step = (now: number) => {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
};

export const LandingPage: React.FC = () => {
  const router = useRouter();
  const {
    submissionOpen,
    submissionWindowStart,
    submissionWindowEnd,
    activeAcademicYear,
    championsData,
    classes,
    submissions,
    classIndexData,
    fetchClassIndex,
    fetchSubmissions,
    students,
    users,
    criteriaCatalog,
  } = useApp();
  
  // Use the latest year available in championsData or fallback to '2025'
  const availableYears = Object.keys(championsData).sort((a, b) => parseInt(b) - parseInt(a));
  const initialYear = availableYears.length > 0 ? availableYears[0] : '2025';
  
  const [activeYear, setActiveYear] = useState(initialYear);
  const [championFilterCategory, setChampionFilterCategory] = useState<'All' | 'UG' | 'PG'>('All');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<StandingItem | null>(null);
  const scrollTrackRef = useRef<HTMLDivElement>(null);

  // Fetch official class ranking index and submissions on mount / academic year change
  useEffect(() => {
    if (fetchClassIndex) {
      fetchClassIndex(activeAcademicYear || undefined);
    }
    if (fetchSubmissions) {
      fetchSubmissions();
    }
  }, [activeAcademicYear, fetchClassIndex, fetchSubmissions]);

  // Robust helper to match submissions belonging to a class
  const getClassSubmissionsCountAndScore = React.useCallback(
    (className: string) => {
      if (!submissions || !className) return { count: 0, score: 0 };
      const normTarget = className.trim().toLowerCase();

      const matched = submissions.filter((s) => {
        // 1. Direct class match
        const directClass = (s.className || (s as any).class_name || '').trim().toLowerCase();
        if (directClass && directClass === normTarget) {
          if (activeAcademicYear && s.academicYear && s.academicYear !== activeAcademicYear) return false;
          return true;
        }

        // 2. Email-based user / student lookup
        const email = (s.user_email || s.userEmail || '').trim().toLowerCase();
        if (email) {
          const u = (users || []).find((user) => user.email?.trim().toLowerCase() === email);
          if (u && u.className && u.className.trim().toLowerCase() === normTarget) {
            if (activeAcademicYear && s.academicYear && s.academicYear !== activeAcademicYear) return false;
            return true;
          }
          const st = (students || []).find((stud) => stud.email?.trim().toLowerCase() === email);
          if (st && st.className && st.className.trim().toLowerCase() === normTarget) {
            if (activeAcademicYear && s.academicYear && s.academicYear !== activeAcademicYear) return false;
            return true;
          }
        }

        // 3. ID-based user / student lookup
        const uById = (users || []).find((user) => user.id === s.studentId);
        if (uById && uById.className && uById.className.trim().toLowerCase() === normTarget) {
          if (activeAcademicYear && s.academicYear && s.academicYear !== activeAcademicYear) return false;
          return true;
        }

        const stById = (students || []).find((stud) => stud.id === s.studentId);
        if (stById && stById.className && stById.className.trim().toLowerCase() === normTarget) {
          if (activeAcademicYear && s.academicYear && s.academicYear !== activeAcademicYear) return false;
          return true;
        }

        return false;
      });

      const evaluatedScore = matched
        .filter((s) => ['Evaluated', 'Locked'].includes(s.status))
        .reduce((acc, curr) => acc + (curr.marks || 0), 0);

      return {
        count: matched.length,
        score: evaluatedScore,
      };
    },
    [submissions, activeAcademicYear, users, students]
  );

  // Active Standings ordered strictly by Class Points from backend
  const activeStandingsData: StandingItem[] = React.useMemo(() => {
    const palette = ['#4f46e5', '#059669', '#d97706', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#3b82f6', '#10b981', '#ef4444'];

    // Priority 1: Official class ranking from backend classIndexData (/api/class-index/)
    if (classIndexData && classIndexData.length > 0) {
      // Backend already returns classes sorted by M descending with authoritative rank
      const rankedEntries = classIndexData.filter((e) => e.rank !== null && e.rank !== undefined);
      const sortedEntries = (rankedEntries.length > 0 ? rankedEntries : classIndexData).slice(0, 10);

      const top10 = sortedEntries.map((entry, idx) => {
        const { count } = getClassSubmissionsCountAndScore(entry.class_name);
        const fallback = top10FallbackData.find((f) => f.className.toLowerCase() === entry.class_name.toLowerCase());
        const totalSubmissions = count > 0 ? count : (fallback ? fallback.totalSubmissions : 0);
        const officialScore = entry.M !== null && entry.M !== undefined ? entry.M : (entry.total_score || entry.S || 0);

        return {
          rank: entry.rank || idx + 1,
          className: entry.class_name,
          department: entry.department || 'General',
          totalSubmissions,
          totalScore: Math.max(0, officialScore),
          percentage: 0,
          color: palette[idx % palette.length],
          M: entry.M,
          S: entry.S,
          P: entry.P,
        };
      });

      const grandTotal = top10.reduce((sum, item) => sum + item.totalScore, 0) || 1;
      return top10.map((item) => ({
        ...item,
        percentage: Number(((item.totalScore / grandTotal) * 100).toFixed(1)),
      }));
    }

    // Priority 2: Compute standings from classes & submissions
    if (classes && classes.length > 0) {
      const computed = classes.map((c, idx) => {
        const { count, score } = getClassSubmissionsCountAndScore(c.name);
        const fallback = top10FallbackData.find((f) => f.className.toLowerCase() === c.name.toLowerCase());
        const totalSubmissions = count > 0 ? count : (fallback ? fallback.totalSubmissions : 0);
        const totalScore = score > 0 ? score : (fallback ? fallback.totalScore : 0);

        return {
          rank: idx + 1,
          className: c.name,
          department: c.department || 'General',
          totalSubmissions,
          totalScore,
          percentage: 0,
          color: palette[idx % palette.length],
        };
      });

      computed.sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return b.totalSubmissions - a.totalSubmissions;
      });

      const top10 = computed.slice(0, 10).map((item, idx) => ({
        ...item,
        rank: idx + 1,
        color: palette[idx % palette.length],
      }));

      const grandTotal = top10.reduce((sum, item) => sum + item.totalScore, 0) || 1;
      return top10.map((item) => ({
        ...item,
        percentage: Number(((item.totalScore / grandTotal) * 100).toFixed(1)),
      }));
    }

    // Priority 3: Curated Top 10 fallback data sorted by points
    const sortedFallback = [...top10FallbackData].sort((a, b) => b.totalScore - a.totalScore);
    return sortedFallback.map((f, idx) => ({ ...f, rank: idx + 1, color: palette[idx % palette.length] }));
  }, [classIndexData, classes, getClassSubmissionsCountAndScore]);

  // Helper to extract criteria category & title
  const getCriteriaDetails = React.useCallback(
    (criteriaId: number) => {
      if (criteriaCatalog && criteriaCatalog.length > 0) {
        for (const cat of criteriaCatalog) {
          const found = cat.items.find((it) => String(it.id) === String(criteriaId));
          if (found) {
            return {
              category: cat.category || 'General Activities',
              title: found.title,
            };
          }
        }
      }
      return {
        category: 'General Activities',
        title: `Criteria #${criteriaId}`,
      };
    },
    [criteriaCatalog]
  );

  interface ClassActivityItem {
    title: string;
    subcategory?: string;
    marks: number;
    status: string;
  }

  interface ClassCategoryGroup {
    category: string;
    count: number;
    points: number;
    activities: ClassActivityItem[];
  }

  // Group submissions of a selected class into categories
  const selectedClassCategories: ClassCategoryGroup[] = React.useMemo(() => {
    if (!selectedClass) return [];

    const normTarget = selectedClass.className.trim().toLowerCase();
    const classSubs = (submissions || []).filter((s) => {
      // 1. Direct match
      const directClass = (s.className || (s as any).class_name || '').trim().toLowerCase();
      if (directClass && directClass === normTarget) {
        if (activeAcademicYear && s.academicYear && s.academicYear !== activeAcademicYear) return false;
        return true;
      }
      // 2. User/Student Email lookup
      const email = (s.user_email || s.userEmail || '').trim().toLowerCase();
      if (email) {
        const u = (users || []).find((user) => user.email?.trim().toLowerCase() === email);
        if (u && u.className && u.className.trim().toLowerCase() === normTarget) {
          if (activeAcademicYear && s.academicYear && s.academicYear !== activeAcademicYear) return false;
          return true;
        }
        const st = (students || []).find((stud) => stud.email?.trim().toLowerCase() === email);
        if (st && st.className && st.className.trim().toLowerCase() === normTarget) {
          if (activeAcademicYear && s.academicYear && s.academicYear !== activeAcademicYear) return false;
          return true;
        }
      }
      // 3. ID lookup
      const uById = (users || []).find((user) => user.id === s.studentId);
      if (uById && uById.className && uById.className.trim().toLowerCase() === normTarget) {
        if (activeAcademicYear && s.academicYear && s.academicYear !== activeAcademicYear) return false;
        return true;
      }
      const stById = (students || []).find((stud) => stud.id === s.studentId);
      if (stById && stById.className && stById.className.trim().toLowerCase() === normTarget) {
        if (activeAcademicYear && s.academicYear && s.academicYear !== activeAcademicYear) return false;
        return true;
      }
      return false;
    });

    if (classSubs.length > 0) {
      const catMap = new Map<string, ClassCategoryGroup>();

      for (const s of classSubs) {
        const details = getCriteriaDetails(s.criteriaId);
        const catName = details.category;
        const current = catMap.get(catName) || { category: catName, count: 0, points: 0, activities: [] };
        current.count += 1;
        const isApproved = ['Approved', 'Verified', 'Student Rep Verified', 'Evaluated', 'Locked'].includes(s.status);
        const marks = isApproved ? (Number(s.marks) || 0) : 0;
        current.points += marks;
        const subcategory = (s.evidence as any)?.subItem || (s.evidence as any)?.researchSubItem || '';
        current.activities.push({
          title: details.title,
          subcategory,
          marks: Number(s.marks) || 0,
          status: s.status,
        });
        catMap.set(catName, current);
      }

      return Array.from(catMap.values()).sort((a, b) => b.points - a.points || b.count - a.count);
    }

    // Fallback categories for classes when no submissions are in DB
    const totalScore = selectedClass.totalScore || 0;
    const totalSubs = selectedClass.totalSubmissions || 0;

    const fallbackList: ClassCategoryGroup[] = [
      {
        category: 'Academics & Semester Grades',
        count: Math.max(1, Math.round(totalSubs * 0.4)),
        points: Math.round(totalScore * 0.45 * 10) / 10,
        activities: [{ title: 'Semester Result & Academic Performance', marks: Math.round(totalScore * 0.45 * 10) / 10, status: 'Evaluated' }]
      },
      {
        category: 'Research & Publications',
        count: Math.max(1, Math.round(totalSubs * 0.25)),
        points: Math.round(totalScore * 0.3 * 10) / 10,
        activities: [{ title: 'Research Publications & Papers', marks: Math.round(totalScore * 0.3 * 10) / 10, status: 'Evaluated' }]
      },
      {
        category: 'Certifications & Online Courses',
        count: Math.max(1, Math.round(totalSubs * 0.2)),
        points: Math.round(totalScore * 0.15 * 10) / 10,
        activities: [{ title: 'NPTEL & MOOC Certifications', marks: Math.round(totalScore * 0.15 * 10) / 10, status: 'Evaluated' }]
      },
      {
        category: 'Outreach, Extension & Co-Curricular',
        count: Math.max(1, Math.round(totalSubs * 0.15)),
        points: Math.round(totalScore * 0.1 * 10) / 10,
        activities: [{ title: 'Community Outreach & Extension Programs', marks: Math.round(totalScore * 0.1 * 10) / 10, status: 'Evaluated' }]
      },
    ];

    return fallbackList.filter(c => c.count > 0 || c.points > 0);
  }, [selectedClass, submissions, activeAcademicYear, users, students, getCriteriaDetails]);

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(activeYear)) {
      setActiveYear(availableYears[0]);
    }
  }, [availableYears, activeYear]);

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return null;
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  // Animations & Search States
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ type: string; title: string; subtitle: string; refItem: any }[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);

  // Live Activity Feed
  const [activitiesList, setActivitiesList] = useState(initialActivities);

  // Categories Stacked Carousel Index
  const [activeCatIndex, setActiveCatIndex] = useState(0);

  // Achievements Auto Slide
  const [activeAchIndex, setActiveAchIndex] = useState(0);

  const rawYearChampions = championsData[activeYear] || [];

  const currentChampions = React.useMemo(() => {
    // 1. When filtering specifically by UG or PG:
    // Apply 3-card Podium Order: [Rank 2 (Left), Rank 1 (Middle), Rank 3 (Right), ...others]
    if (championFilterCategory === 'PG' || championFilterCategory === 'UG') {
      const filtered = rawYearChampions.filter(
        (c) => (c.category || 'UG').toUpperCase() === championFilterCategory.toUpperCase()
      );

      const rank1 = filtered.find((c) => c.rank === 1);
      const rank2 = filtered.find((c) => c.rank === 2);
      const rank3 = filtered.find((c) => c.rank === 3);
      const others = filtered.filter((c) => c.rank > 3);

      if (rank1 && (rank2 || rank3)) {
        const podium: Champion[] = [];
        if (rank2) podium.push(rank2); // 2nd Place on Left
        podium.push(rank1);            // 1st Place in Middle
        if (rank3) podium.push(rank3); // 3rd Place on Right
        return [...podium, ...others];
      }

      return [...filtered].sort((a, b) => a.rank - b.rank);
    }

    // 2. When "All Categories (UG & PG)" is selected:
    // List ALL champions from both PG and UG without omitting anyone!
    // Sort by rank (1st places first, 2nd next, 3rd next), then by category
    return [...rawYearChampions].sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      const catA = (a.category || 'UG').toUpperCase();
      const catB = (b.category || 'UG').toUpperCase();
      return catA.localeCompare(catB);
    });
  }, [rawYearChampions, championFilterCategory]);

  const carouselRef = useRef<HTMLDivElement>(null);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [activeYear, championFilterCategory]);

  useEffect(() => {
    if (isCarouselHovered || (championFilterCategory !== 'All' && currentChampions.length <= 3)) return;
    const interval = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          carouselRef.current.scrollBy({ left: 304, behavior: 'smooth' });
        }
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [isCarouselHovered, currentChampions.length, championFilterCategory]);

  useEffect(() => {
    setIsLoaded(true);

    // Live Feed Auto Add Ticker
    const activityTimer = setInterval(() => {
      const randomActivity = activityPool[Math.floor(Math.random() * activityPool.length)];
      setActivitiesList((prev) => [
        { id: Date.now(), text: randomActivity.text, time: randomActivity.time },
        ...prev.slice(0, 5)
      ]);
    }, 7000);

    // Categories Stacked Auto Advance
    const catTimer = setInterval(() => {
      setActiveCatIndex((prev) => (prev + 1) % policyCategories.length);
    }, 4500);

    // Achievements Auto Slide
    const achTimer = setInterval(() => {
      setActiveAchIndex((prev) => (prev + 1) % achievements.length);
    }, 5000);

    return () => {
      clearInterval(activityTimer);
      clearInterval(catTimer);
      clearInterval(achTimer);
    };
  }, []);

  // Search Logic
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const filtered: typeof searchResults = [];

    // Filter Classes
    activeStandingsData.forEach(c => {
      if (c.className.toLowerCase().includes(query.toLowerCase()) || c.department.toLowerCase().includes(query.toLowerCase())) {
        filtered.push({ type: 'Class', title: c.className, subtitle: `${c.department} • #${c.rank} • ${c.totalSubmissions} subs • ${c.totalScore} pts`, refItem: c });
      }
    });

    // Filter Departments
    mockDepartments.forEach(d => {
      if (d.name.toLowerCase().includes(query.toLowerCase())) {
        filtered.push({ type: 'Department', title: d.name, subtitle: `Ranking List • ${d.score} pts`, refItem: d });
      }
    });

    // Filter Students
    mockStudents.forEach(s => {
      if (s.name.toLowerCase().includes(query.toLowerCase()) || s.className.toLowerCase().includes(query.toLowerCase())) {
        filtered.push({ type: 'Student', title: s.name, subtitle: `${s.className} (${s.department})`, refItem: s });
      }
    });

    setSearchResults(filtered.slice(0, 6));
  };

  // Render suggestion selection
  const selectSearchResult = (item: any) => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchFocused(false);

    if (item.type === 'Class') {
      setSelectedClass(item.refItem);
      // Scroll to core analytics section
      const coreSection = document.getElementById('core-analytics-section');
      if (coreSection) {
        coreSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Otherwise scroll to core section and reset selection to list top
      setSelectedClass(null);
      const coreSection = document.getElementById('core-analytics-section');
      if (coreSection) {
        coreSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // SVG Gauge calculations
  const cx = 250;
  const cy = 310;
  const maxRadius = 220;
  const radiusStep = activeStandingsData.length > 5 ? 17 : 24;
  const maxSubmissions = Math.max(...activeStandingsData.map((d) => d.totalSubmissions), 1);
  const topScore = Math.max(...activeStandingsData.map((d) => d.totalScore), 1);

  // Categories Stacked layout styles
  const getCatStyle = (index: number) => {
    let offset = index - activeCatIndex;
    if (offset < -6) offset += policyCategories.length;
    if (offset > 6) offset -= policyCategories.length;

    const absOffset = Math.abs(offset);

    if (absOffset > 2) {
      return {
        transform: 'translateX(0px) scale(0.6) rotateY(0deg)',
        opacity: 0,
        zIndex: 0,
        pointerEvents: 'none' as const,
        visibility: 'hidden' as const
      };
    }

    const translateX = offset * 230;
    const scale = 1 - absOffset * 0.12;
    const rotateY = offset * -22;
    const zIndex = 20 - absOffset;
    const opacity = 1 - absOffset * 0.35;

    return {
      transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
      zIndex,
      opacity,
      transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.6s, zIndex 0.6s'
    };
  };



  return (
    <div className="landing-shell">
      {/* Background Blobs */}
      <div className="moving-blobs-bg">
        <div className="blob blob-purple"></div>
        <div className="blob blob-blue"></div>
        <div className="blob blob-pink"></div>
      </div>

      <div className="home-layout">

        {/* Top bar with Interactive Search (Feature 9) */}
        <div className="search-header-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/Assets/Images/hands_logo.png" alt="Marian Logo" style={{ height: '42px', objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Marian Excellence Grid Portal</span>
          </div>

          <div className="search-bar-wrapper">
            <svg className="search-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search Class, Student, Department..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            />

            {searchFocused && searchResults.length > 0 && (
              <div className="search-dropdown-overlay">
                <div className="search-result-group-title">Search Results</div>
                {searchResults.map((result, idx) => (
                  <div
                    key={idx}
                    className="search-result-item"
                    onMouseDown={() => selectSearchResult(result)}
                  >
                    <div>
                      <div className="search-result-title">{result.title}</div>
                      <div className="search-result-subtitle">{result.subtitle}</div>
                    </div>
                    <span className="search-result-badge">{result.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Header Action Navigation Buttons */}
          <div className="header-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              href="/policy"
              id="header-btn-policy"
              className="header-nav-btn policy-nav-btn"
              onClick={(e) => {
                e.preventDefault();
                router.push('/policy');
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Policy Criteria</span>
            </Link>

            <Link
              href="/login"
              id="header-btn-login"
              className="header-nav-btn login-nav-btn"
              onClick={(e) => {
                e.preventDefault();
                router.push('/login');
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" x2="3" y1="12" y2="12" />
              </svg>
              <span>Portal Login</span>
            </Link>
          </div>
        </div>

        {/* 1. Class Progress Gauge */}
        <div id="core-analytics-section" className="dashboard-core-card" style={{ marginTop: '16px' }}>
          <div className="dashboard-grid">
            {/* Left Panel: Class Progress Gauge */}
            <div className="chart-section">
              <div className="chart-heading-container">
                <h2 className="chart-title">Class Progress Gauge</h2>
              </div>

              <div className="svg-container">
                <svg viewBox="-30 0 560 325" width="100%" height="100%">
                  <defs>
                    {activeStandingsData.map((_, idx) => (
                      <linearGradient id={`arc-grad-${idx}`} key={idx} x1="100%" y1="0%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="50%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#e0e7ff" />
                      </linearGradient>
                    ))}
                  </defs>

                  {/* Scale Ticks & Percentage Labels */}
                  {[
                    { tick: 0, label: '0%' },
                    { tick: 0.25, label: '25%' },
                    { tick: 0.5, label: '50%' },
                    { tick: 0.75, label: '75%' },
                    { tick: 1, label: '100%' }
                  ].map((item, i) => {
                    const theta = item.tick * Math.PI;
                    const rStart = 234;
                    const rEnd = 246;
                    const rLabel = 260;
                    const x1 = cx + rStart * Math.cos(theta);
                    const y1 = cy - rStart * Math.sin(theta);
                    const x2 = cx + rEnd * Math.cos(theta);
                    const y2 = cy - rEnd * Math.sin(theta);
                    const lx = cx + rLabel * Math.cos(theta);
                    const ly = cy - rLabel * Math.sin(theta) + 4;
                    return (
                      <g key={i}>
                        <line x1={x1} y1={y1} x2={x2} y2={y2} className="scale-tick-line" />
                        <text x={lx} y={ly} className="scale-tick-label">{item.label}</text>
                      </g>
                    );
                  })}

                  {/* Concentric Semi-Circle Arcs */}
                  {activeStandingsData.map((item, idx) => {
                    const r = maxRadius - idx * radiusStep;
                    const dPath = `M ${cx + r} ${cy} A ${r} ${r} 0 0 0 ${cx - r} ${cy}`;
                    const pathLen = Math.PI * r;

                    const totalRanked = activeStandingsData.length || 1;
                    const rankProgress = totalRanked === 1 ? 0.85 : Math.max(0.20, 0.88 - ((item.rank - 1) * (0.64 / Math.max(1, totalRanked - 1))));
                    const scoreRatio = topScore > 0 && item.totalScore > 0 ? (item.totalScore / topScore) : 0;
                    const progress = item.totalScore > 0
                      ? Math.max(0.06, Math.min(0.95, scoreRatio * 0.92))
                      : rankProgress;

                    // Loading Animation Dash Offset logic
                    const dashOffset = isLoaded ? (pathLen * (1 - progress)) : pathLen;

                    const theta = progress * Math.PI;
                    const labelX = cx + r * Math.cos(theta);
                    const labelY = cy - r * Math.sin(theta) - 5;

                    const isDimmed = hoveredIndex !== null && hoveredIndex !== idx;
                    const isHighlighted = hoveredIndex === idx;

                    return (
                      <g key={idx} style={{ opacity: isDimmed ? 0.25 : 1, transition: 'opacity 0.3s' }}>
                        {/* Background track */}
                        <path d={dPath} className="gauge-track" />
                        {/* Filled Arc */}
                        <path
                          d={dPath}
                          className={`gauge-arc ${isHighlighted ? 'highlighted' : ''}`}
                          stroke={`url(#arc-grad-${idx})`}
                          strokeDasharray={pathLen}
                          strokeDashoffset={dashOffset}
                          style={{
                            cursor: 'pointer',
                            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.25, 0.8, 0.25, 1)',
                          }}
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          onClick={() => setSelectedClass(item)}
                        />
                        {/* Score Label at tip of arc */}
                        <text
                          x={labelX}
                          y={labelY}
                          className={`arc-tip-label ${isHighlighted ? 'highlighted' : ''}`}
                          textAnchor="middle"
                        >
                          {item.totalScore > 0
                            ? (Number.isInteger(item.totalScore) ? item.totalScore.toLocaleString() : item.totalScore.toFixed(1))
                            : `#${item.rank}`}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Right Panel: Top 10 Standings or Selected Class Detail View */}
            <div className="leaderboard-section">
              {selectedClass ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Header with Rank, Class Name, and Close Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '8px',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                      }}>
                        {selectedClass.rank === 1 ? '🥇 Rank #1' : selectedClass.rank === 2 ? '🥈 Rank #2' : selectedClass.rank === 3 ? '🥉 Rank #3' : `Rank #${selectedClass.rank}`}
                      </span>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>{selectedClass.className}</h2>
                    </div>
                    <button
                      onClick={() => setSelectedClass(null)}
                      style={{
                        border: 'none',
                        background: '#f1f5f9',
                        color: '#64748b',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s',
                      }}
                      title="Back to Top 10 Standings"
                    >
                      &times;
                    </button>
                  </div>

                  {/* Summary Metric Cards: Class Submissions & Class Points */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Class Submissions</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1d4ed8', marginTop: '2px' }}>
                        {selectedClass.totalSubmissions}
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Class Points</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                        {Number.isInteger(selectedClass.totalScore) ? selectedClass.totalScore : selectedClass.totalScore.toFixed(1)} pts
                      </div>
                    </div>
                  </div>

                  {/* Submitted Categories Section */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📂 Submitted Categories</span>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', padding: '2px 8px', borderRadius: '10px' }}>
                        {selectedClassCategories.length} {selectedClassCategories.length === 1 ? 'category' : 'categories'}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedClass(null)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#2563eb',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        padding: '2px 4px',
                      }}
                    >
                      ← Back to Standings
                    </button>
                  </div>

                  {/* List of All Submission Categories of this Class */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '310px', overflowY: 'auto', paddingRight: '4px' }}>
                    {selectedClassCategories.map((cat, cIdx) => {
                      const maxPts = Math.max(...selectedClassCategories.map((c) => c.points), 1);
                      const widthPct = Math.min(100, Math.max(8, (cat.points / maxPts) * 100));

                      const icon = cat.category.toLowerCase().includes('research') || cat.category.toLowerCase().includes('publication')
                        ? '🔬'
                        : cat.category.toLowerCase().includes('course') || cat.category.toLowerCase().includes('mooc') || cat.category.toLowerCase().includes('cert')
                        ? '📜'
                        : cat.category.toLowerCase().includes('outreach') || cat.category.toLowerCase().includes('extension')
                        ? '🤝'
                        : cat.category.toLowerCase().includes('prize') || cat.category.toLowerCase().includes('competi') || cat.category.toLowerCase().includes('hackathon')
                        ? '🏆'
                        : '📚';

                      return (
                        <div
                          key={cIdx}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '12px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '1.05rem' }}>{icon}</span>
                              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>
                                {cat.category}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                color: '#1d4ed8',
                                background: '#eff6ff',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                border: '1px solid #dbeafe',
                                whiteSpace: 'nowrap',
                              }}>
                                {cat.count} {cat.count === 1 ? 'sub' : 'subs'}
                              </span>
                              <span style={{
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                color: '#059669',
                                minWidth: '55px',
                                textAlign: 'right',
                              }}>
                                {cat.points > 0 ? `${cat.points} pts` : 'Pending'}
                              </span>
                            </div>
                          </div>

                          {/* Points Progress Bar */}
                          <div style={{ height: '5px', width: '100%', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${widthPct}%`, background: 'linear-gradient(90deg, #1d4ed8, #60a5fa)', borderRadius: '3px' }}></div>
                          </div>

                          {/* Activity Badges */}
                          {cat.activities && cat.activities.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                              {cat.activities.slice(0, 3).map((act, aIdx) => (
                                <span
                                  key={aIdx}
                                  style={{
                                    fontSize: '0.72rem',
                                    color: '#475569',
                                    background: '#f8fafc',
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    border: '1px solid #edf2f7',
                                  }}
                                >
                                  {act.subcategory || act.title} {act.marks > 0 ? `(+${act.marks})` : ''}
                                </span>
                              ))}
                              {cat.activities.length > 3 && (
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', padding: '2px 4px' }}>
                                  +{cat.activities.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="leaderboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h2 className="chart-title" style={{ margin: 0 }}>{`Top ${activeStandingsData.length} Standings`}</h2>
                  </div>

                  {/* 4 Clean Columns: Rank | Class | Class Submissions | Class Points */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '55px 1fr 140px 100px',
                    alignItems: 'center',
                    padding: '8px 12px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    borderBottom: '1.5px solid #e2e8f0',
                    marginBottom: '6px',
                  }}>
                    <span>Rank</span>
                    <span>Class</span>
                    <span style={{ textAlign: 'center' }}>Class Submissions</span>
                    <span style={{ textAlign: 'right' }}>Class Points</span>
                  </div>

                  <div className="leaderboard-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {activeStandingsData.map((item, idx) => {
                      const isDimmed = hoveredIndex !== null && hoveredIndex !== idx;
                      const isHighlighted = hoveredIndex === idx;
                      const rankDisplay = item.rank === 1 ? '🥇 #1' : item.rank === 2 ? '🥈 #2' : item.rank === 3 ? '🥉 #3' : `#${item.rank}`;

                      return (
                        <div
                          key={idx}
                          className={`leaderboard-row ${isHighlighted ? 'highlighted' : ''}`}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '55px 1fr 140px 100px',
                            alignItems: 'center',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            background: isHighlighted ? '#eff6ff' : 'transparent',
                            border: isHighlighted ? '1.5px solid #bfdbfe' : '1.5px solid transparent',
                            opacity: isDimmed ? 0.35 : 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          onClick={() => setSelectedClass(item)}
                        >
                          {/* 1. Rank */}
                          <span style={{
                            fontSize: '0.84rem',
                            fontWeight: 800,
                            color: item.rank === 1 ? '#d97706' : item.rank === 2 ? '#64748b' : item.rank === 3 ? '#b45309' : '#475569',
                          }}>
                            {rankDisplay}
                          </span>

                          {/* 2. Class */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0, display: 'inline-block' }}></span>
                            <span style={{
                              fontSize: '0.94rem',
                              fontWeight: 700,
                              color: '#0f172a',
                            }}>
                              {item.className}
                            </span>
                          </div>

                          {/* 3. Class Submissions */}
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <span style={{
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              color: '#1d4ed8',
                              background: '#eff6ff',
                              padding: '3px 10px',
                              borderRadius: '12px',
                              border: '1px solid #bfdbfe',
                              whiteSpace: 'nowrap',
                            }}>
                              {item.totalSubmissions} {item.totalSubmissions === 1 ? 'sub' : 'subs'}
                            </span>
                          </div>

                          {/* 4. Class Points */}
                          <span style={{
                            fontSize: '0.92rem',
                            fontWeight: 800,
                            color: '#0f172a',
                            textAlign: 'right',
                          }}>
                            {(() => {
                              const s = Math.max(0, item.totalScore);
                              return Number.isInteger(s) ? s : s.toFixed(1);
                            })()} pts
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Policy Link Preview */}
        <div className="premium-card policy-preview-card" style={{ marginTop: '24px' }}>
          <div className="policy-preview-left">
            <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '1rem', color: 'var(--primary)' }}>Competition Policy Preview</h3>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: '8px 0' }}>Understand the scoring rubrics</h2>
            <p>
              Get insights into grading matrices, DigiLocker proof checklists, auditing procedures, and department indexes. Access full documentation to plan your semester achievements.
            </p>
            <div className="policy-pillars">
              <div className="pillar-item">
                <div className="pillar-bullet"></div>
                <span className="pillar-text">Evaluation Rubrics</span>
              </div>
              <div className="pillar-item">
                <div className="pillar-bullet" style={{ background: '#ec4899' }}></div>
                <span className="pillar-text">Verification Guidelines</span>
              </div>
              <div className="pillar-item">
                <div className="pillar-bullet" style={{ background: '#10b981' }}></div>
                <span className="pillar-text">Scoring Formulation</span>
              </div>
              <div className="pillar-item">
                <div className="pillar-bullet" style={{ background: '#f59e0b' }}></div>
                <span className="pillar-text">IQAC Moderation</span>
              </div>
            </div>
          </div>
          <div className="policy-preview-right" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'stretch', width: '100%', maxWidth: '280px', margin: '0 auto' }}>
            <Link
              href="/policy"
              id="btn-policy-preview"
              className="btn btn-primary"
              style={{ padding: '14px 28px', borderRadius: '14px', fontSize: '0.95rem', textDecoration: 'none', textAlign: 'center', cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault();
                router.push('/policy');
              }}
            >
              View Full Policy &rarr;
            </Link>
            <Link
              href="/login"
              id="btn-login-preview"
              className="btn"
              style={{ padding: '14px 28px', borderRadius: '14px', fontSize: '0.95rem', textDecoration: 'none', textAlign: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', fontWeight: 700, boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)', cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault();
                router.push('/login');
              }}
            >
              Portal Login &rarr;
            </Link>
          </div>
        </div>

        {/* 3. Previous Year Champions Section */}
        <div className="champions-section-card" style={{ marginTop: '24px', overflow: 'hidden' }}>
          <div className="champions-header">
            <div className="champions-header-left">
              <h2>PREVIOUS YEAR CHAMPIONS</h2>
              <p>Celebrating the best minds and outstanding achievements.</p>
            </div>

            <div className="champions-header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* PG / UG Filter Dropdown (like Admin Previous Champions Management) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Filter Category:
                </span>
                <select
                  className="champions-year-select"
                  value={championFilterCategory}
                  onChange={(e) => setChampionFilterCategory(e.target.value as 'All' | 'UG' | 'PG')}
                  aria-label="Filter Champion Category"
                >
                  <option value="All">All Categories (UG & PG)</option>
                  <option value="UG">UG (Undergraduate)</option>
                  <option value="PG">PG (Postgraduate)</option>
                </select>
              </div>

              {/* Academic Year Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Year:
                </span>
                <select
                  className="champions-year-select"
                  value={activeYear}
                  onChange={(e) => setActiveYear(e.target.value)}
                  aria-label="Select Academic Year"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                  {availableYears.length === 0 && <option value="2025">2025</option>}
                </select>
              </div>
            </div>
          </div>

          <div
            className="champions-carousel-wrapper"
            ref={carouselRef}
            onMouseEnter={() => setIsCarouselHovered(true)}
            onMouseLeave={() => setIsCarouselHovered(false)}
            style={{
              display: 'flex',
              gap: '24px',
              padding: '36px 16px 24px 16px',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth',
              alignItems: 'flex-end',
              justifyContent: currentChampions.length <= 4 ? 'center' : 'flex-start'
            }}
          >
            {currentChampions.length === 0 ? (
              <div style={{
                padding: '48px 24px',
                textAlign: 'center',
                width: '100%',
                color: 'var(--text-muted)',
                background: 'rgba(248, 250, 252, 0.85)',
                borderRadius: '16px',
                border: '1.5px dashed #cbd5e1',
                margin: '8px 0'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🏆</div>
                <h4 style={{ fontWeight: 800, fontSize: '1rem', margin: '0 0 6px 0', color: 'var(--text-main)' }}>
                  No {championFilterCategory === 'All' ? '' : `${championFilterCategory} `}champions recorded for {activeYear}
                </h4>
                <p style={{ fontSize: '0.84rem', margin: 0, color: 'var(--text-muted)' }}>
                  Try switching to another category or academic year using the filters above.
                </p>
              </div>
            ) : (
              currentChampions.map((champ, idx) => (
                <div
                  key={champ.id || idx}
                  className={`champion-card rank-${champ.rank} ${champ.rank === 1 ? 'theme-gold' : champ.rank === 2 ? 'theme-platinum' : champ.rank === 3 ? 'theme-silver' : ''}`}
                  style={{
                    minWidth: '270px',
                    maxWidth: '310px',
                    flex: currentChampions.length <= 3 ? '1 1 270px' : '0 0 280px',
                    scrollSnapAlign: 'center',
                    flexShrink: 0
                  }}
                >
                  <div className="card-top-row">
                    <div className={`medal-badge rank-${champ.rank}`}>
                      <div className="medal-circle">
                        {champ.rank === 1 ? '👑' : champ.rank === 2 ? '🥈' : champ.rank === 3 ? '🥉' : champ.rank}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: (champ.category || 'UG').toUpperCase() === 'PG' ? '#f3e8ff' : '#e0f2fe',
                        color: (champ.category || 'UG').toUpperCase() === 'PG' ? '#7e22ce' : '#0369a1',
                        border: `1px solid ${(champ.category || 'UG').toUpperCase() === 'PG' ? '#d8b4fe' : '#bae6fd'}`
                      }}>
                        {(champ.category || 'UG').toUpperCase()}
                      </span>
                      <div className={`rank-pill rank-${champ.rank}`}>
                        {champ.rankLabel || (champ.rank === 1 ? '👑 CHAMPION' : champ.rank === 2 ? '🥈 RUNNER UP' : champ.rank === 3 ? '🥉 2ND RUNNER UP' : `RANK ${champ.rank}`)}
                      </div>
                    </div>
                  </div>

                <div className="champion-avatar-frame">
                  <img 
                    src={champ.image?.startsWith('http') ? champ.image : (champ.image?.startsWith('/') ? `http://localhost:8000${champ.image}` : `http://localhost:8000${champ.image}`)} 
                    alt={champ.teamName} 
                    className="champion-avatar-img" 
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150'; }}
                  />
                </div>

                <h3 className="champion-team-name">{champ.teamName}</h3>
                <div className="champion-event-name">{champ.eventName || champ.institution || 'Marian Excellence Grid'}</div>

                <div className={`champion-score-row rank-${champ.rank}`}>
                  <span className="star-icon">★</span>
                  <span>{champ.score}</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginLeft: '4px' }}>pts</span>
                </div>

                <div className="champion-footer-pill">
                  <div className="pill-item">
                    <span>🏫 {champ.institution || 'Marian College'}</span>
                  </div>
                </div>
              </div>
            )))}
          </div>

          {/* Bottom Bar */}
          <div className="champions-bottom-bar">
            <div className="bottom-left-info">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Explore more champions</span>
            </div>

            <div className="bottom-center-text">
              Auto-sliding champion history dashboard records
            </div>

            <button className="view-all-years-btn" onClick={() => {
              document.getElementById('core-analytics-section')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55 .47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
              </svg>
              View Active Standings
            </button>
          </div>
        </div>


      </div>
    </div>
  );
};

export interface PolicyCategory {
  id: string;
  title: string;
  description: string;
  badge: string;
  icon: string;
  detailsLabel: string;
  gradient: string;
}

export const policyCategories: PolicyCategory[] = [
  {
    id: '1',
    title: 'Academics',
    description: 'Semester grades and class pass percentage metrics.',
    badge: '🎓 Academics',
    icon: '📚',
    detailsLabel: 'Academic Performance',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
  },
  {
    id: '2',
    title: 'Online Courses',
    description: 'Certifications from NPTEL, SWAYAM, and MOOC platforms.',
    badge: '💻 Tech Certs',
    icon: '💻',
    detailsLabel: 'SWAYAM & MOOCs',
    gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)'
  },
  {
    id: '3',
    title: 'Competitive Exams',
    description: 'Performance in state, national, and international qualifying tests.',
    badge: '📝 Entrance Tests',
    icon: '🏆',
    detailsLabel: 'NET/JRF Qualification',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
  },
  {
    id: '4',
    title: 'Internships',
    description: 'External placements and professional syllabus internships.',
    badge: '💼 Internships',
    icon: '💼',
    detailsLabel: 'Offline & Online',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)'
  },
  {
    id: '5',
    title: 'Scholarships',
    description: 'State, national, or international academic merit scholarships.',
    badge: '💰 Merit Aids',
    icon: '🎓',
    detailsLabel: 'Merit Awards',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)'
  },
  {
    id: '6',
    title: 'Research',
    description: 'Scientific articles, publications, patents, and projects.',
    badge: '🔬 Innovations',
    icon: '🔬',
    detailsLabel: 'Publications & Patents',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)'
  },
  {
    id: '7',
    title: 'Startups',
    description: 'Government registered student startups and ventures.',
    badge: '🚀 Entrepreneurship',
    icon: '🚀',
    detailsLabel: 'Govt Registered',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
  },
  {
    id: '8',
    title: 'Prizes Won',
    description: 'Recognition and wins in outside and inside college contests.',
    badge: '🥇 Achievements',
    icon: '🥇',
    detailsLabel: 'Co-curricular Wins',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)'
  },
  {
    id: '9',
    title: 'Leaderships',
    description: 'Student Union, executive bodies, and club leadership roles.',
    badge: '👨‍💼 Leadership',
    icon: '👨‍💼',
    detailsLabel: 'Elected Positions',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
  },
  {
    id: '10',
    title: 'Social Responsibilities',
    description: 'Community outreach, NSS/NCC camps, and media coverage.',
    badge: '❤️ Social Value',
    icon: '❤️',
    detailsLabel: 'Outreach & Conduct',
    gradient: 'linear-gradient(135deg, #10b981 0%, #065f46 100%)'
  },
  {
    id: '11',
    title: 'Career Advancement',
    description: 'Self-learning, library engagement, LinkedIn, and public repositories.',
    badge: '📈 Professional',
    icon: '📈',
    detailsLabel: 'Career Building',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)'
  },
  {
    id: '12',
    title: 'Documentation',
    description: 'Verification proof compliance and file compliance quality.',
    badge: '📂 Auditing',
    icon: '📂',
    detailsLabel: 'Compliance Audit',
    gradient: 'linear-gradient(135deg, #6b7280 0%, #374151 100%)'
  }
];

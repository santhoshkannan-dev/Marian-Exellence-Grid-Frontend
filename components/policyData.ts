export interface ScoreRow {
  label: string;
  mark: string | number;
}

export interface PolicySection {
  title: string;
  rows: ScoreRow[];
}

export interface PolicyCategory {
  id: string;
  title: string;
  description: string;
  badge: string;
  icon: string;
  detailsLabel: string;
  gradient: string;

  evaluator: {
    name: string;
    role: string;
    mobile: string;
  };

  documentationInCharge: string;
  supportingDocument: string;
  submissionDate: string;

  sections: PolicySection[];

  conditions?: string[];
  notes?: string[];
}

export const policyCategories: PolicyCategory[] = [
  {
    id: "academics",
    title: "Academics",
    description:
      "Individual academic performance and class pass percentage evaluation.",
    badge: "🎓 Academic Excellence",
    icon: "📚",
    detailsLabel: "Academic Performance",
    gradient:
      "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",

    evaluator: {
      name: "Mr. Allen George Podippara",
      role: "Faculty",
      mobile: "+91 9656396350",
    },

    documentationInCharge: "DQC Coordinator",
    supportingDocument: "Result summary report",
    submissionDate: "Before the commencement of SAS Examinations",

    sections: [
      {
        title: "Individual Performance",
        rows: [
          { label: "100 – 90.01%", mark: 5 },
          { label: "90 – 80.01%", mark: 4 },
          { label: "80 – 70.01%", mark: 3 },
          { label: "FAIL", mark: -2 },
        ],
      },
      {
        title: "Class Pass Percentage",
        rows: [
          { label: "100 – 90.01%", mark: 5 },
          { label: "90 – 80.01%", mark: 4 },
          { label: "80 – 70.01%", mark: 3 },
          { label: "70 – 60.01%", mark: 2 },
          { label: "60 – 50.01%", mark: 1 },
          { label: "Below 50%", mark: 0 },
        ],
      },
    ],

    notes: [
      "Batches with a separate grade scheme will be marked accordingly.",
    ],
  },

  {
    id: "online-courses",
    title: "Online Courses",
    description:
      "Recognized SWAYAM, NPTEL and MOOC courses completed by students.",
    badge: "💻 Online Learning",
    icon: "💻",
    detailsLabel: "SWAYAM / NPTEL / MOOC",
    gradient:
      "linear-gradient(135deg, #10b981 0%, #047857 100%)",

    evaluator: {
      name: "Mr. Allen George Podippara",
      role: "Faculty",
      mobile: "+91 9656396350",
    },

    documentationInCharge: "Student",
    supportingDocument: "Certificate",
    submissionDate: "Within one month of certificate issuance",

    sections: [
      {
        title: "Marks Per Course",
        rows: [
          { label: "SWAYAM / NPTEL", mark: 5 },
          { label: "MOOC", mark: 2 },
        ],
      },
    ],

    conditions: [
      "Marks are given per course.",
      "Maximum 3 courses per student.",
      "Courses should have credits which can be added to ABC.",
      "Evaluation period: June to March.",
      "Only certificates uploaded in DigiLocker will be considered.",
    ],
  },

  {
    id: "competitive-exams",
    title: "Competitive Examinations",
    description:
      "Recognition for qualifying and participating in relevant competitive examinations.",
    badge: "🏆 Competitive Exams",
    icon: "📝",
    detailsLabel: "NET / JRF / Other Exams",
    gradient:
      "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",

    evaluator: {
      name: "Ms. Anithamol Babu",
      role: "Faculty",
      mobile: "9496265359",
    },

    documentationInCharge: "Student",
    supportingDocument: "Certificate / Result / Hall ticket",
    submissionDate: "Within one month of Result announcement",

    sections: [
      {
        title: "Marks Per Examination",
        rows: [
          { label: "JRF", mark: 20 },
          { label: "NET", mark: 10 },
          { label: "Any Other Relevant Exam (IELTS, PET)", mark: 3 },
          {
            label: "Participation in relevant examination (UPSC/PSC Exams)",
            mark: 1,
          },
        ],
      },
    ],

    notes: [
      "Maximum of 3 examinations per student under the Participation Category.",
    ],
  },

  {
    id: "internships",
    title: "Internships",
    description:
      "Eligible offline and online internships completed outside the syllabus.",
    badge: "💼 Professional Experience",
    icon: "💼",
    detailsLabel: "Offline & Online",
    gradient:
      "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",

    evaluator: {
      name: "Ms. Bincy Binu",
      role: "Faculty",
      mobile: "7510154989",
    },

    documentationInCharge: "Student",
    supportingDocument: "Certificate",
    submissionDate: "Within one month of Internship completion",

    sections: [
      {
        title: "Marks Per Internship",
        rows: [
          { label: "Offline Internship", mark: 5 },
          { label: "Online Internship", mark: 3 },
        ],
      },
    ],

    conditions: [
      "Only internships that are not part of the syllabus will be considered.",
      "Required minimum duration: One month.",
      "Internships must be during the period June 01 – March 30.",
    ],
  },

  {
    id: "scholarships",
    title: "Scholarships",
    description:
      "Recognition for scholarships received at district, state, national and international levels.",
    badge: "🎓 Scholarship Awards",
    icon: "🏅",
    detailsLabel: "Merit Scholarships",
    gradient:
      "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",

    evaluator: {
      name: "Ms. Kezia Eldos",
      role: "Faculty",
      mobile: "8921198637",
    },

    documentationInCharge: "Student",
    supportingDocument:
      "Certificate / Scholarship Sanction (Award) Letter",
    submissionDate: "Within one month of Sanction",

    sections: [
      {
        title: "Marks by Level",
        rows: [
          { label: "International", mark: 20 },
          { label: "National", mark: 10 },
          { label: "State", mark: 5 },
          { label: "District", mark: 2 },
        ],
      },
    ],

    notes: [
      "Any scholarships availed from Marian will not be considered.",
    ],
  },

  {
    id: "research",
    title: "Research",
    description:
      "Publications, paper presentations, patents, books, articles and funded projects.",
    badge: "🔬 Research & Innovation",
    icon: "🔬",
    detailsLabel: "Publications & Patents",
    gradient:
      "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)",

    evaluator: {
      name: "Ms. Anithamol Babu",
      role: "Faculty",
      mobile: "9496265359",
    },

    documentationInCharge: "Student",
    supportingDocument:
      "Front page of publication / Certificate",
    submissionDate: "Within one month of Publication",

    sections: [
      {
        title: "Publications",
        rows: [
          { label: "Scopus / Web of Science", mark: 10 },
          {
            label: "Conference Proceedings / Peer reviewed article",
            mark: 5,
          },
        ],
      },
      {
        title: "Paper Presentation",
        rows: [
          { label: "Outside Marian College", mark: 5 },
          { label: "Inside Marian College", mark: 3 },
        ],
      },
      {
        title: "Patents",
        rows: [
          { label: "Utility", mark: 10 },
          { label: "Design", mark: 5 },
        ],
      },
      {
        title: "Books & Articles",
        rows: [
          { label: "Book", mark: 10 },
          { label: "Book Chapter", mark: 5 },
          { label: "Article", mark: 2 },
        ],
      },
      {
        title: "Funded Projects",
        rows: [
          { label: "International", mark: 20 },
          { label: "National", mark: 10 },
          { label: "State", mark: 5 },
          { label: "Any Other", mark: 3 },
        ],
      },
    ],

    notes: [
      "Consider only the number of publications, books and paper presentations — not the number of students.",
    ],
  },

  {
    id: "startups",
    title: "Startups",
    description:
      "Recognition for government-registered student startups and ventures.",
    badge: "🚀 Entrepreneurship",
    icon: "🚀",
    detailsLabel: "Government Registered",
    gradient:
      "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",

    evaluator: {
      name: "Ms. Blessy Maria Joseph",
      role: "Faculty",
      mobile: "9847206402",
    },

    documentationInCharge: "Student",
    supportingDocument: "Startup Recognition Certificate",
    submissionDate: "Within one month",

    sections: [
      {
        title: "Marks Per Registered Start-up",
        rows: [
          {
            label: "Each government-registered start-up",
            mark: 10,
          },
        ],
      },
    ],

    notes: [
      "10 marks are awarded per start-up, not per student.",
    ],
  },

  {
    id: "prizes",
    title: "Prizes Won",
    description:
      "Recognition for achievements in events conducted inside and outside Marian College.",
    badge: "🥇 Achievements",
    icon: "🏆",
    detailsLabel: "Individual & Group Wins",
    gradient:
      "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)",

    evaluator: {
      name: "Ms. Blessy Maria Joseph",
      role: "Faculty",
      mobile: "9847206402",
    },

    documentationInCharge: "Student(Individual), DQC Coordinator(Group)",
    supportingDocument:
      "Certificate / Letter from coordinator",
    submissionDate: "Within one month of Achievement",

    sections: [
      {
        title: "From Marian College",
        rows: [
          { label: "First — Individual", mark: 10 },
          { label: "First — Group", mark: 5 },
          { label: "Second — Individual", mark: 5 },
          { label: "Second — Group", mark: 3 },
          { label: "Third — Individual", mark: 3 },
          { label: "Third — Group", mark: 2 },
        ],
      },
      {
        title: "Outside Marian College",
        rows: [
          { label: "First — Individual", mark: 15 },
          { label: "First — Group", mark: 10 },
          { label: "Second — Individual", mark: 10 },
          { label: "Second — Group", mark: 5 },
          { label: "Third — Individual", mark: 5 },
          { label: "Third — Group", mark: 3 },
          { label: "Participation — Individual", mark: 3 },
          { label: "Participation — Group", mark: 2 },
        ],
      },
    ],

    notes: [
      "The same marking system applies to all types of events, including cultural, sports, or any other activities.",
    ],
  },

  {
    id: "leaderships",
    title: "Leaderships",
    description:
      "Recognition for democratically elected student representative positions and approved suggestions.",
    badge: "👨💼 Leadership",
    icon: "👥",
    detailsLabel: "Leadership & Suggestions",
    gradient:
      "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",

    evaluator: {
      name: "Ms. Kezia Eldos",
      role: "Faculty",
      mobile: "8921198637",
    },

    documentationInCharge: "Student",
    supportingDocument: "Letter from the Faculty In-charge",
    submissionDate: "Within one month of Election",

    sections: [
      {
        title: "Elected Student Representation",
        rows: [
          {
            label:
              "Every democratically elected student representative position, other than class-level positions",
            mark: 5,
          },
        ],
      },
      {
        title: "Approved Suggestions",
        rows: [
          {
            label:
              "Each approved and successfully implemented practical, innovative and sustainable suggestion",
            mark: 5,
          },
        ],
      },
    ],

    notes: [
      "Student representation includes MCSC, SAHYA Executive Body, Clubs and Associations, and CSM.",
      "Approved suggestions are evaluated based on successful implementation.",
    ],
  },

  {
    id: "programs",
    title: "Programs Organized",
    description:
      "Recognition for organizing intercollegiate, intra-collegiate programs and class magazines.",
    badge: "🎉 Programs & Events",
    icon: "🎪",
    detailsLabel: "Events Organized",
    gradient:
      "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",

    evaluator: {
      name: "Mr. Sivi Varghese",
      role: "Faculty",
      mobile: "7977215322",
    },

    documentationInCharge: "DQC Coordinator",
    supportingDocument: "Letter from Department Head",
    submissionDate: "Within one month of Event",

    sections: [
      {
        title: "Nature of Event",
        rows: [
          { label: "Intercollegiate", mark: 5 },
          { label: "Intra-collegiate", mark: 3 },
        ],
      },
      {
        title: "Class Magazine",
        rows: [
          { label: "Class Magazine", mark: 5 },
        ],
      },
    ],

    notes: [
      "There will be no marks awarded for any events conducted during the dates of SAHYA and CALIGO.",
    ],
  },

  {
    id: "social-responsibilities",
    title: "Social Responsibilities",
    description:
      "Community participation, outreach activities, media coverage and responsible conduct.",
    badge: "❤️ Social Responsibility",
    icon: "❤️",
    detailsLabel: "Outreach & Conduct",
    gradient:
      "linear-gradient(135deg, #10b981 0%, #065f46 100%)",

    evaluator: {
      name: "Mr. Sivi Varghese",
      role: "Faculty",
      mobile: "7977215322",
    },

    documentationInCharge: "DQC Coordinator / Student",
    supportingDocument:
      "Certificate / Letter from Department Head",
    submissionDate: "Within one month of the Event",

    sections: [
      {
        title: "Involvement in an Event",
        rows: [
          { label: "Coordination of an event", mark: 5 },
          { label: "Participation", mark: 3 },
        ],
      },
      {
        title: "Media Coverage",
        rows: [
          {
            label: "Coverage in news media, excluding social media",
            mark: 3,
          },
        ],
      },
      {
        title: "Deduction",
        rows: [
          {
            label:
              "Disciplinary action involving a student",
            mark: -10,
          },
        ],
      },
    ],

    conditions: [
      "Examples include Community Action Programme and Outreach activities.",
      "10 marks will be deducted per student if any student in the class faces disciplinary action such as suspension or punishment due to examination malpractice or similar violations.",
    ],
  },

  {
    id: "career-advancement",
    title: "Career Advancement",
    description:
      "Library engagement, repository creation and LinkedIn-based professional development.",
    badge: "📈 Professional Growth",
    icon: "📈",
    detailsLabel: "Library • LinkedIn • Repository",
    gradient:
      "linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)",

    evaluator: {
      name: "Ms. Bincy Binu",
      role: "Faculty",
      mobile: "7510154989",
    },

    documentationInCharge: "DQC Coordinator / Student",
    supportingDocument:
      "Library reports / Repository link / LinkedIn evidence",
    submissionDate: "As specified during the evaluation period",

    sections: [
      {
        title: "Library — Footfall",
        rows: [
          { label: "≥90% students", mark: 5 },
          { label: "80–89%", mark: 4 },
          { label: "70–79%", mark: 3 },
          { label: "60–69%", mark: 2 },
          { label: "<60%", mark: 1 },
        ],
      },
      {
        title: "Library — Books Read / Issued",
        rows: [
          { label: "≥90% students", mark: 5 },
          { label: "80–89%", mark: 4 },
          { label: "70–79%", mark: 3 },
          { label: "60–69%", mark: 2 },
          { label: "<60%", mark: 1 },
        ],
      },
      {
        title: "Repository Creation",
        rows: [
          { label: "Well-structured & complete", mark: 5 },
          { label: "Structured with minor gaps", mark: 4 },
          { label: "Basic structure", mark: 3 },
          { label: "Poorly organized", mark: 2 },
          { label: "Minimal", mark: 1 },
        ],
      },
      {
        title: "LinkedIn — Profile Completion",
        rows: [
          { label: "≥90%", mark: 5 },
          { label: "80–89%", mark: 4 },
          { label: "60–79%", mark: 3 },
          { label: "40–59%", mark: 2 },
          { label: "<40%", mark: 1 },
        ],
      },
    ],

    notes: [
      "Library footfall is measured using entry register / biometric data.",
      "Library books are academic and career-related books.",
      "Repository may be created using Drive, GitHub, LMS or Website.",
      "LinkedIn evidence includes profile links, screenshots, badge lists and certificate evidence.",
    ],
  },
];

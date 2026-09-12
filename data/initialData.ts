export interface CriteriaRule {
  min?: number;
  max?: number;
  marks: number;
}

export interface CriteriaItem {
  id: number;
  title: string;
  category?: string;
  marks: number;
  type: 'count' | 'range' | 'fixed' | 'negative' | 'boolean' | 'date' | 'academic_grades';
  access_level?: string;
  accessLevel?: string;
  is_manual_eval?: boolean;
  isManualEval?: boolean;
  details?: string;
  rules?: CriteriaRule[];
  rules_json?: any;
}

export interface CriteriaCategory {
  id: string;
  category: string;
  code?: string;
  access_level?: string;
  accessLevel?: string;
  is_manual_eval?: boolean;
  isManualEval?: boolean;
  evaluators?: string[]; // Array of evaluator emails assigned to this category
  items: CriteriaItem[];
}

export interface Student {
  id: number;
  name: string;
  className: string;
  email?: string;
  department?: string;
}

export interface SubmissionEvidence {
  type: string;
  count?: number;
  startDate?: string;
  endDate?: string;
  value?: number;
  checked?: boolean;
  submissionType?: string;
  markBreakdown?: {
    count90Above?: number;
    count80to90?: number;
    count70to80?: number;
    count60to70?: number;
    count50to60?: number;
    count40to50?: number;
    failCount?: number;
    [key: string]: any;
  };
  grades?: {
    S?: number;
    APlus?: number;
    A?: number;
    Fail?: number;
    B?: number;
    C?: number;
    [key: string]: any;
  };
  classPassPercentage?: number;
  totalStudents?: number;
  [key: string]: any;
}

export interface AcademicGradeBreakdownData {
  id?: number;
  s_grade_count: number;
  a_plus_grade_count: number;
  a_grade_count: number;
  other_pass_count: number;
  failed_count: number;
  class_pass_percentage: number;
  total_students: number;
}

export interface CriteriaVersionInfo {
  id: number;
  academic_year: string;
  version: number;
  name: string;
  is_locked: boolean;
}

export interface VerificationLogItem {
  id?: number;
  submission_id?: number;
  verification_level: 'DQC' | 'CLASS_TEACHER' | 'EVALUATOR';
  action: 'VERIFY_AND_FORWARD' | 'SEND_BACK' | 'REJECT';
  verified_by?: { id: number; email: string; name?: string; role?: string };
  verified_by_name?: string;
  remarks?: string;
  timestamp?: string;
}

export interface Submission {
  id: number;
  studentId: number;
  student_id?: number;
  classId?: number | string;
  class_id?: number | string;
  criteriaId: number;
  criteria_id?: number;
  categoryId?: number | string;
  category_id?: number | string;
  subcategoryId?: number | string;
  subcategory_id?: number | string;
  submissionDate?: string;
  submission_date?: string;
  calculatedMarks?: number | null;
  calculated_marks?: number | null;
  isManualEval?: boolean;
  is_manual_eval?: boolean;
  criteria_version?: number | null;
  criteria_version_info?: CriteriaVersionInfo | null;
  academicYear?: string;
  startDate?: string;
  endDate?: string;
  description: string;
  status: 'Approved' | 'Pending' | 'Pending Verification' | 'Pending Rep Verification' | 'Student Rep Verified' | 'Verified by Student Rep' | 'Teacher Verified' | 'TEACHER_VERIFIED' | 'EVALUATOR_PENDING' | 'DQC_PENDING' | 'Correction Requested' | 'Rejected' | 'Draft' | 'Submitted' | 'Verified' | 'Evaluated' | 'Locked' | 'Correction' | (string & {});
  remarks?: string;
  marks?: number | null;
  proof?: string;
  proofUrl?: string;
  proof_url?: string;
  eventId?: string;
  evaluatorVerified?: boolean;
  evidence?: SubmissionEvidence;
  grade_breakdown?: AcademicGradeBreakdownData | null;
  submissionMetadata?: any;
  submission_metadata?: any;
  verificationLogs?: VerificationLogItem[];
  verification_logs?: VerificationLogItem[];
  verifiedByName?: string;
  user_email?: string;
  userEmail?: string;
  email?: string;
  user_name?: string;
  className?: string;
  class_name?: string;
  department?: string;
  department_name?: string;
  repVerifiedByName?: string;
  repRemarks?: string;
  teacherVerifiedByName?: string;
  teacherRemarks?: string;
  evaluatorVerifiedByName?: string;
  evaluatorRemarks?: string;
}

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string;
  className?: string;
  isApproved?: boolean;
  isStudentRep?: boolean;
}

export interface Champion {
  id?: number;
  year: string;
  category?: 'UG' | 'PG' | string;
  rank: number;
  rankLabel: string;
  teamName: string;
  eventName: string;
  score: string;
  institution: string;
  image: string;
}

export interface AssignedCategoryItem {
  id?: number;
  code?: string;
  name?: string;
}

export interface UserGroupMemberDetail {
  id?: number;
  name: string;
  email: string;
  department?: string | null;
  assigned_class?: string | null;
  badge?: string | null;
  categories?: (string | AssignedCategoryItem)[];
}

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  emails: string[];
  policy?: 'staff_only' | 'student_only';
  member_details?: UserGroupMemberDetail[];
}

export const defaultCriteriaCatalog: CriteriaCategory[] = [
  {
    id: "cat-academics",
    category: "Academics",
    accessLevel: "student_rep_only",
    access_level: "student_rep_only",
    items: [
      { id: 101, title: "90% and Above", marks: 5, type: "count" },
      { id: 102, title: "80% to 90%", marks: 4, type: "count" },
      { id: 103, title: "70% to 80%", marks: 3, type: "count" },
      { id: 104, title: "Fail", marks: -2, type: "negative" },
      {
        id: 105,
        title: "Class Pass Percentage",
        marks: 0,
        type: "academic_grades",
        rules_json: {
          "90_above": 5.0,
          "80_90": 4.0,
          "70_80": 3.0,
          "fail": -2.0,
          "pass_percentage_ranges": [
            { "min": 90.01, "max": 100.0, "marks": 5.0 },
            { "min": 80.01, "max": 90.0, "marks": 4.0 },
            { "min": 70.01, "max": 80.0, "marks": 3.0 },
            { "min": 60.01, "max": 70.0, "marks": 2.0 },
            { "min": 50.01, "max": 60.0, "marks": 1.0 },
            { "min": 0, "max": 50.0, "marks": 0 }
          ]
        }
      }
    ]
  },
  {
    id: "cat-online-courses",
    category: "Online Courses",
    accessLevel: "all_students",
    access_level: "all_students",
    items: [
      { id: 201, title: "Swayam / NPTEL Course", marks: 5, type: "count" },
      { id: 202, title: "MOOC Course", marks: 2, type: "count" }
    ]
  },
  {
    id: "cat-competitive-exams",
    category: "Competitive Exams",
    accessLevel: "all_students",
    access_level: "all_students",
    items: [
      { id: 401, title: "JRF Passed", marks: 20, type: "count" },
      { id: 402, title: "NET Passed", marks: 10, type: "count" },
      { id: 403, title: "Any Other Relevant Exam (IELTS, PET, Language Specific, etc.)", marks: 3, type: "count" },
      { id: 404, title: "Participation in Relevant Exam (UPSC / PSC Exams)", marks: 1, type: "count" }
    ]
  },
  {
    id: "cat-internships",
    category: "Internships",
    accessLevel: "all_students",
    access_level: "all_students",
    items: [
      { id: 301, title: "Offline Internship (Min. 1 month)", marks: 5, type: "count" },
      { id: 302, title: "Online Internship (Min. 1 month)", marks: 3, type: "count" }
    ]
  },
  {
    id: "cat-scholarships",
    category: "Scholarships",
    accessLevel: "all_students",
    access_level: "all_students",
    items: [
      { id: 501, title: "International Level Scholarship", marks: 20, type: "count" },
      { id: 502, title: "National Level Scholarship", marks: 10, type: "count" },
      { id: 503, title: "State Level Scholarship", marks: 5, type: "count" },
      { id: 504, title: "District Level Scholarship", marks: 2, type: "count" }
    ]
  },
  {
    id: "cat-research",
    category: "Research",
    accessLevel: "all_students",
    access_level: "all_students",
    items: [
      {
        id: 601, title: "Publications", marks: 0, type: "count",
        rules_json: { "subItems": { "Scopus / Web of Science": 10, "Conference Proceeding / Peer reviewed article": 5 } }
      },
      {
        id: 602, title: "Paper Presentation", marks: 0, type: "count",
        rules_json: { "subItems": { "Outside Marian College": 5, "Inside Marian College": 3 } }
      },
      {
        id: 603, title: "Patents", marks: 0, type: "count",
        rules_json: { "subItems": { "Utility": 10, "Design": 5 } }
      },
      {
        id: 604, title: "Book Publications", marks: 0, type: "count",
        rules_json: { "subItems": { "Book": 10, "Book Chapter": 5, "Article": 2 } }
      },
      {
        id: 605, title: "Funded Projects", marks: 0, type: "count",
        rules_json: { "subItems": { "International": 20, "National": 10, "State": 5, "Any Other": 3 } }
      }
    ]
  },
  {
    id: "cat-startups",
    category: "Startups",
    accessLevel: "all_students",
    access_level: "all_students",
    items: [
      { id: 651, title: "Government-Registered Start-up", marks: 10, type: "count" }
    ]
  },
  {
    id: "cat-prizes",
    category: "Prizes",
    accessLevel: "all_students",
    access_level: "all_students",
    items: [
      {
        id: 701, title: "From Marian College", marks: 0, type: "count",
        rules_json: { "subItems": { "1st Prize (Individual)": 10, "2nd Prize (Individual)": 5, "3rd Prize (Individual)": 3, "1st Prize (group)": 5, "2nd Prize (group)": 3, "3rd Prize (group)": 2, "1st Prize (Group)": 5, "2nd Prize (Group)": 3, "3rd Prize (Group)": 2 } }
      },
      {
        id: 702, title: "Outside Marian College", marks: 0, type: "count",
        rules_json: { "subItems": { "1st Prize (Individual)": 15, "2nd Prize (Individual)": 10, "3rd Prize (Individual)": 5, "1st Prize (group)": 10, "2nd Prize (group)": 5, "3rd Prize (group)": 3, "1st Prize (Group)": 10, "2nd Prize (Group)": 5, "3rd Prize (Group)": 3, "participation(Individual)": 3, "participation(group)": 2, "Participation (Individual)": 3, "Participation (Group)": 2 } }
      }
    ]
  },
  {
    id: "cat-programs-organized",
    category: "Programs Organized",
    accessLevel: "student_rep_only",
    access_level: "student_rep_only",
    items: [
      { id: 901, title: "Intercollegiate", marks: 5, type: "count" },
      { id: 902, title: "IntraCollegiate", marks: 3, type: "count" },
      { id: 903, title: "Class Magazine", marks: 5, type: "count" }
    ]
  },
  {
    id: "cat-leadership",
    category: "Leaderships",
    accessLevel: "student_rep_only",
    access_level: "student_rep_only",
    items: [
      { id: 801, title: "MCSC Executive Body Position", marks: 5, type: "count" },
      { id: 802, title: "SAHYA Executive Body Position", marks: 5, type: "count" },
      { id: 803, title: "Clubs & Associations Leadership Position", marks: 5, type: "count" },
      { id: 804, title: "Innovative / Sustainable Suggestion", marks: 5, type: "count" }
    ]
  },
  {
    id: "cat-social-responsibility",
    category: "Social Responsibilities",
    accessLevel: "student_rep_only",
    access_level: "student_rep_only",
    items: [
      { id: 1001, title: "Coordination of Event (Community Action / Outreach)", marks: 5, type: "count" },
      { id: 1002, title: "Participation in Event", marks: 3, type: "count" },
      { id: 1003, title: "News Media Coverage (Excluding Social Media)", marks: 3, type: "count" }
    ]
  },
  {
    id: "cat-career-advancement",
    category: "Career Advancement",
    accessLevel: "all_students",
    access_level: "all_students",
    isManualEval: true,
    is_manual_eval: true,
    items: [
      { id: 1101, title: "Library - Regular Footfall (Biometric / Entry)", marks: 5, type: "count", accessLevel: "student_rep_only", access_level: "student_rep_only", isManualEval: true, is_manual_eval: true },
      { id: 1102, title: "Library - Academic & Career Books Issued/Read", marks: 5, type: "count", accessLevel: "student_rep_only", access_level: "student_rep_only", isManualEval: true, is_manual_eval: true },
      { id: 1106, title: "Repository Creation (Drive / GitHub / LMS / Website)", marks: 5, type: "count", accessLevel: "student_rep_only", access_level: "student_rep_only", isManualEval: true, is_manual_eval: true },
      { id: 1103, title: "LinkedIn - Profile Completion (Active Profile)", marks: 3, type: "count", accessLevel: "all_students", access_level: "all_students", isManualEval: true, is_manual_eval: true },
      { id: 1104, title: "LinkedIn - Skill Badges Earned", marks: 1, type: "count", accessLevel: "all_students", access_level: "all_students", isManualEval: true, is_manual_eval: true },
      { id: 1105, title: "LinkedIn - Micro-credentials / Learning Certifications", marks: 1, type: "count", accessLevel: "all_students", access_level: "all_students", isManualEval: true, is_manual_eval: true }
    ]
  },
  {
    id: "cat-documentation",
    category: "Documentation",
    accessLevel: "student_rep_only",
    access_level: "student_rep_only",
    items: [
      { id: 1201, title: "Class Activity Report & Documents", marks: 10, type: "count" }
    ]
  }
];

export const defaultStudents: Student[] = [
  { id: 101, name: "Amal Thomas", className: "II MCA" },
  { id: 102, name: "Santhosh Kannan", className: "II MCA" },
  { id: 103, name: "Santhosh Kannan", className: "II BCA A" }
];

export const defaultSubmissions: Submission[] = [];

export const defaultUsers: AppUser[] = [
  { id: 101, name: "Amal Thomas", email: "amal.25pmc114@mariancollege.org", role: "student", className: "II MCA", department: "PG Department of Computer Applications", isApproved: true },
  { id: 102, name: "Santhosh Kannan", email: "santhosh.25pmc152@mariancollege.org", role: "student", className: "II MCA", department: "PG Department of Computer Applications", isApproved: true, isStudentRep: true },
  { id: 103, name: "Santhosh Kannan", email: "santhosh.25ubc154@mariancollege.org", role: "student", className: "II BCA A", department: "UG Department of Computer Applications", isApproved: true },
  { id: 104, name: "Prof. Kochumol Abraham", email: "kochumol.abraham@mariancollege.org", role: "teacher", className: "II MCA", department: "PG Department of Computer Applications", isApproved: true },
  { id: 105, name: "Allen George", email: "allen.george@mariancollege.org", role: "evaluator", department: "PG Department of Computer Applications", isApproved: true },
  { id: 107, name: "System Administrator", email: "admin@mariancollege.org", role: "admin", isApproved: true }
];

export const defaultAcademicYears = ["2025-2026", "2024-2025", "2023-2024"];

export const defaultUserGroups: UserGroup[] = [
  {
    id: "grp-evaluation-committee",
    name: "Evaluation Committee",
    description: "Evaluator members assigned to review activity submissions.",
    emails: ["allen.george@mariancollege.org"]
  },
  {
    id: "grp-class-teachers",
    name: "Class Teachers Council",
    description: "Faculty members acting as class advisors.",
    emails: ["kochumol.abraham@mariancollege.org"]
  },
  {
    id: "grp-dqc-student-rep",
    name: "DQC Student Rep Group",
    description: "Data Quality Cell student representatives responsible for initial verification of peer submissions across all categories.",
    emails: ["santhosh.25pmc152@mariancollege.org"]
  },
  {
    id: "grp-student-reps",
    name: "Student Representatives",
    description: "Class representatives responsible for initial verification of peer submissions of the class they belong to.",
    emails: ["santhosh.25pmc152@mariancollege.org"]
  }
];

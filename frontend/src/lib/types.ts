// ============================================================
// Enums
// ============================================================

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE';
export type NotificationType = 'ANNOUNCEMENT' | 'ALERT';
export type BehaviorType = 'POSITIVE' | 'NEGATIVE';
export type SubmissionStatus = 'PENDING' | 'SUBMITTED' | 'GRADED';
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

// ============================================================
// Core Models
// ============================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface School {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}

export interface AcademicYear {
  id: string;
  year: number;
  schoolId: string;
  semesters: Semester[];
}

export interface Semester {
  id: string;
  term: number;
  academicYearId: string;
}

export interface GradeLevel {
  id: string;
  level: string;
}

export interface Classroom {
  id: string;
  roomNumber: string;
  gradeId: string;
  semesterId: string;
  homeroomTeacherId?: string | null;
  grade?: GradeLevel;
  semester?: Semester;
  homeroomTeacher?: Teacher;
  students?: Student[];
  subjects?: Subject[];
  _count?: { students?: number };
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  studentCode: string;
  userId: string;
  classroomId: string;
  parentLineToken?: string | null;
  gpa: number;
  user?: User;
  classroom?: Classroom;
  attendance?: Attendance[];
  submissions?: Submission[];
  behaviorLogs?: BehaviorLog[];
  enrolledSubjects?: StudentSubject[];
}

export interface Teacher {
  id: string;
  userId: string;
  user?: User;
  homeroomClass?: Classroom;
  subjects?: Subject[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  classroomId?: string | null;
  credit: number;
  semesterId?: string | null;
  teacher?: Teacher;
  classroom?: Classroom;
}

// ============================================================
// Academic Models
// ============================================================

export interface Assignment {
  id: string;
  title: string;
  description?: string | null;
  maxPoints: number;
  dueDate?: string | null;
  subjectId: string;
  classroomId?: string | null;
  attachments: string[];
  subject?: Subject;
  classroom?: Classroom;
  submissions?: Submission[];
  _count?: { submissions?: number };
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  content?: string | null;
  points?: number | null;
  feedback?: string | null;
  status: SubmissionStatus;
  attachments: string[];
  studentId: string;
  assignmentId: string;
  student?: Student;
  assignment?: Assignment;
  createdAt: string;
  updatedAt: string;
}

export interface StudentSubject {
  id: string;
  studentId: string;
  subjectId: string;
  grade?: number | null;
  student?: Student;
  subject?: Subject;
}

export interface LearningMaterial {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  fileType?: string | null;
  subjectId: string;
  teacherId: string;
  subject?: Subject;
  teacher?: Teacher;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Attendance
// ============================================================

export interface Attendance {
  id: string;
  date: string;
  status: AttendanceStatus;
  studentId: string;
  period: number;
  remarks?: string | null;
  student?: Student;
}

// ============================================================
// Behavior
// ============================================================

export interface BehaviorLog {
  id: string;
  type: BehaviorType;
  content: string;
  points: number;
  studentId: string;
  student?: Student;
  createdAt: string;
}

export interface BehaviorTag {
  label: string;
  points: number;
  type: BehaviorType;
}

// ============================================================
// Communication
// ============================================================

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  targetId?: string | null;
  imageUrl?: string | null;
  isPinned: boolean;
  expiresAt?: string | null;
  creatorId?: string | null;
  isRead?: boolean;
  createdAt: string;
}

// ============================================================
// Schedule
// ============================================================

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';

export interface Schedule {
  id: string;
  dayOfWeek: DayOfWeek;
  periodStart: number;
  periodEnd: number;
  subjectId: string;
  classroomId: string;
  teacherId: string;
  subject?: Subject;
  classroom?: Classroom;
  teacher?: Teacher;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Dashboard / Stats Responses
// ============================================================

export interface AdminDashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClassrooms: number;
  attendanceToday: number;
}

export interface AdminDashboardCharts {
  attendanceTrend: { label: string; value: number }[];
  scoreDistribution: { label: string; value: number }[];
  recentNotifications: Notification[];
}

export interface TeacherDashboardStats {
  totalStudents: number;
  attendanceRate: number;
  classroomId: string | null;
  className: string;
}

// ============================================================
// Analytics / AI Insights
// ============================================================

export interface AiRecommendation {
  subject: string;
  advice: string;
  priority: RecommendationPriority;
}

export interface AiInsightData {
  studentName: string;
  gpaPrediction: number;
  behaviorScore: number;
  riskLevel?: RiskLevel;
  recommendations: AiRecommendation[];
  stats: {
    totalSubmissions: number;
    attendanceRate: number;
  };
}

export interface EarlyWarningStudent {
  id: string;
  user?: User;
  attendance?: Attendance[];
}

export interface EarlyWarningResponse {
  highAbsence: EarlyWarningStudent[];
  lowGpa?: Student[];
}

// ============================================================
// Performance
// ============================================================

export interface StudentPerformance {
  gpa: number | string;
  submissions?: Submission[];
}

// ============================================================
// Semester Summary
// ============================================================

export interface SemesterStudentSummary {
  id: string;
  studentCode: string;
  user: User;
  gpa: number;
  attendanceRate: number;
  behaviorScore: number;
  averageScore: number;
  riskFlags: string[];
  classroom?: Classroom;
}

export interface SemesterSummaryData {
  students: SemesterStudentSummary[];
  classroomSummary?: {
    avgGpa: number;
    avgAttendance: number;
    avgBehavior: number;
    atRiskCount: number;
    gpaDistribution: { excellent: number; good: number; fair: number; low: number };
  };
}

// ============================================================
// Attendance Report
// ============================================================

export interface AttendanceReportStudent {
  id: string;
  studentCode: string;
  user: User;
  present: number;
  late: number;
  absent: number;
  leave: number;
  total: number;
  rate: number;
}

export interface AttendanceReportData {
  students: AttendanceReportStudent[];
  summary?: {
    totalPresent: number;
    totalLate: number;
    totalAbsent: number;
    totalLeave: number;
  };
}

// ============================================================
// Upload
// ============================================================

export interface UploadResponse {
  url: string;
  filename?: string;
}

// ============================================================
// Auth
// ============================================================

export interface LoginResponse {
  user: User;
  access_token: string;
}

// ============================================================
// Warning item (for teacher dashboard)
// ============================================================

export interface WarningItem {
  id: string;
  name: string;
  issue: string;
}

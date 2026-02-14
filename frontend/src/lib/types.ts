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

// ============================================================
// Event Calendar
// ============================================================

export type EventType = 'HOLIDAY' | 'EXAM' | 'ACTIVITY' | 'MEETING' | 'DEADLINE' | 'OTHER';

export interface SchoolEvent {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  allDay: boolean;
  type: EventType;
  color?: string | null;
  targetId?: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Leave Request
// ============================================================

export type LeaveType = 'SICK' | 'PERSONAL' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
  id: string;
  studentId: string;
  startDate: string;
  endDate: string;
  reason: string;
  type: LeaveType;
  status: LeaveStatus;
  attachments: string[];
  reviewerId?: string | null;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  student?: Student;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Leaderboard
// ============================================================

export interface LeaderboardEntry {
  rank: number;
  id: string;
  studentCode: string;
  name: string;
  avatarUrl?: string | null;
  classroom: string;
}

export interface AttendanceLeaderboardEntry extends LeaderboardEntry {
  attendanceRate: number;
  totalDays: number;
  presentDays: number;
}

export interface BehaviorLeaderboardEntry extends LeaderboardEntry {
  totalPoints: number;
  positiveCount: number;
  negativeCount: number;
}

export interface GpaLeaderboardEntry extends LeaderboardEntry {
  gpa: number;
}

export interface SubmissionLeaderboardEntry extends LeaderboardEntry {
  totalSubmissions: number;
  onTimeSubmissions: number;
  avgScore: number;
}

// ============================================================
// Portfolio
// ============================================================

export type PortfolioCategory = 'AWARD' | 'ACTIVITY' | 'PROJECT' | 'CERTIFICATE' | 'VOLUNTEER' | 'OTHER';

export interface PortfolioItem {
  id: string;
  studentId: string;
  title: string;
  description?: string | null;
  category: PortfolioCategory;
  fileUrl?: string | null;
  link?: string | null;
  date?: string | null;
  isPublic: boolean;
  student?: Student;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// QR Attendance
// ============================================================

export interface QRAttendanceSession {
  id: string;
  classroomId: string;
  creatorId: string;
  period: number;
  code: string;
  expiresAt: string;
  isActive: boolean;
  date: string;
  classroom?: Classroom;
  durationMinutes?: number;
  createdAt: string;
}

// ============================================================
// Survey / แบบประเมิน
// ============================================================

export type SurveyQuestionType = 'TEXT' | 'CHOICE' | 'RATING' | 'YESNO';

export interface SurveyQuestion {
  id: string;
  surveyId: string;
  text: string;
  type: SurveyQuestionType;
  options: string[];
  required: boolean;
  order: number;
}

export interface Survey {
  id: string;
  title: string;
  description?: string | null;
  creatorId: string;
  targetId?: string | null;
  isActive: boolean;
  isAnonymous: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  questions: SurveyQuestion[];
  responses?: { id: string }[];
  _count?: { responses: number };
  createdAt: string;
  updatedAt: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  userId: string;
  answers: Record<string, any>;
  user?: { firstName: string; lastName: string };
  createdAt: string;
}

export interface SurveyQuestionResult {
  questionId: string;
  text: string;
  type: SurveyQuestionType;
  total: number;
  average?: number;
  distribution?: { value: string | number; count: number }[];
  answers?: string[];
}

export interface SurveyResults {
  survey: Survey;
  totalResponses: number;
  questionResults: SurveyQuestionResult[];
  responses?: SurveyResponse[];
}

/**
 * Shared mock PrismaService for unit tests.
 * Returns jest.fn() for all common Prisma methods.
 */
export const mockPrismaService = {
  user: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  student: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), groupBy: jest.fn() },
  teacher: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  classroom: { findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  attendance: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn(), upsert: jest.fn(), groupBy: jest.fn(), updateMany: jest.fn() },
  behaviorLog: { findMany: jest.fn(), create: jest.fn(), groupBy: jest.fn() },
  assignment: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  submission: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), upsert: jest.fn(), groupBy: jest.fn() },
  schedule: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
  notification: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
  leaveRequest: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  event: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  school: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  academicYear: { findFirst: jest.fn(), create: jest.fn() },
  semester: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
  gradeLevel: { findMany: jest.fn(), create: jest.fn() },
  subject: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  studentSubject: { findMany: jest.fn(), create: jest.fn(), groupBy: jest.fn() },
  learningMaterial: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  portfolioItem: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  qRAttendanceSession: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
  survey: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  surveyQuestion: { createMany: jest.fn(), deleteMany: jest.fn() },
  surveyResponse: { findMany: jest.fn(), create: jest.fn(), groupBy: jest.fn() },
  $transaction: jest.fn((fn: any) => fn(mockPrismaService)),
  $queryRaw: jest.fn(),
};

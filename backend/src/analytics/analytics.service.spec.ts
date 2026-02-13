import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

const mockPrisma = {
  user: { findUnique: jest.fn() },
  student: { findUnique: jest.fn(), findMany: jest.fn() },
  attendance: { groupBy: jest.fn() },
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStudentAiInsights', () => {
    const mockStudent = {
      id: 'student-1',
      userId: 'user-student',
      user: { firstName: 'สมชาย', lastName: 'ใจดี' },
      classroom: {
        homeroomTeacher: { userId: 'user-teacher' },
        subjects: [],
      },
      submissions: [
        { points: 80, assignment: { maxPoints: 100, subjectId: 'sub-1' } },
        { points: 60, assignment: { maxPoints: 100, subjectId: 'sub-1' } },
      ],
      attendance: [
        { status: 'PRESENT' },
        { status: 'PRESENT' },
        { status: 'ABSENT' },
        { status: 'LATE' },
      ],
      behaviorLogs: [
        { type: 'POSITIVE', points: 5 },
        { type: 'NEGATIVE', points: 3 },
      ],
    };

    it('should return insights for the student themselves', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'STUDENT' });
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);

      const result = await service.getStudentAiInsights('user-student', 'student-1');

      expect(result).toHaveProperty('gpaPrediction');
      expect(result).toHaveProperty('behaviorScore');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('summary');
      expect(typeof result.gpaPrediction).toBe('number');
      expect(typeof result.behaviorScore).toBe('number');
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(result.riskLevel);
    });

    it('should calculate GPA prediction based on submissions', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'STUDENT' });
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);

      const result = await service.getStudentAiInsights('user-student', 'student-1');

      // (80 + 60) / (100 + 100) = 0.7 * 4.0 = 2.8
      expect(result.gpaPrediction).toBe(2.8);
    });

    it('should return 0 GPA prediction when no submissions', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'STUDENT' });
      mockPrisma.student.findUnique.mockResolvedValue({
        ...mockStudent,
        submissions: [],
      });

      const result = await service.getStudentAiInsights('user-student', 'student-1');
      expect(result.gpaPrediction).toBe(0);
    });

    it('should calculate behavior score correctly', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'STUDENT' });
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);

      const result = await service.getStudentAiInsights('user-student', 'student-1');

      // Base 100 - ABSENT(5) - LATE(2) + POSITIVE(5) - NEGATIVE(3) = 95
      expect(result.behaviorScore).toBe(95);
    });

    it('should clamp behavior score between 0 and 100', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'STUDENT' });
      mockPrisma.student.findUnique.mockResolvedValue({
        ...mockStudent,
        attendance: Array(30).fill({ status: 'ABSENT' }), // 30 * -5 = -150
        behaviorLogs: [],
      });

      const result = await service.getStudentAiInsights('user-student', 'student-1');
      expect(result.behaviorScore).toBe(0);
    });

    it('should return HIGH risk for low GPA', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'STUDENT' });
      mockPrisma.student.findUnique.mockResolvedValue({
        ...mockStudent,
        submissions: [
          { points: 20, assignment: { maxPoints: 100, subjectId: 'sub-1' } },
        ],
      });

      const result = await service.getStudentAiInsights('user-student', 'student-1');
      // GPA = 20/100 * 4 = 0.8 → HIGH
      expect(result.riskLevel).toBe('HIGH');
    });

    it('should return MEDIUM risk for moderate GPA', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'STUDENT' });
      mockPrisma.student.findUnique.mockResolvedValue({
        ...mockStudent,
        submissions: [
          { points: 55, assignment: { maxPoints: 100, subjectId: 'sub-1' } },
        ],
      });

      const result = await service.getStudentAiInsights('user-student', 'student-1');
      // GPA = 55/100 * 4 = 2.2 → MEDIUM
      expect(result.riskLevel).toBe('MEDIUM');
    });

    it('should return LOW risk for good GPA and behavior', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'STUDENT' });
      mockPrisma.student.findUnique.mockResolvedValue({
        ...mockStudent,
        submissions: [
          { points: 90, assignment: { maxPoints: 100, subjectId: 'sub-1' } },
        ],
        attendance: [{ status: 'PRESENT' }, { status: 'PRESENT' }],
        behaviorLogs: [],
      });

      const result = await service.getStudentAiInsights('user-student', 'student-1');
      // GPA = 3.6, behavior = 100 → LOW
      expect(result.riskLevel).toBe('LOW');
    });

    it('should throw NotFoundException when student not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'STUDENT' });
      mockPrisma.student.findUnique.mockResolvedValue(null);

      await expect(
        service.getStudentAiInsights('user-student', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized access', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'TEACHER' });
      mockPrisma.student.findUnique.mockResolvedValue({
        ...mockStudent,
        userId: 'other-user',
        classroom: {
          homeroomTeacher: { userId: 'other-teacher' },
          subjects: [], // no subjects taught by this teacher
        },
      });

      await expect(
        service.getStudentAiInsights('user-teacher', 'student-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to access any student', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);

      const result = await service.getStudentAiInsights('admin-user', 'student-1');
      expect(result).toHaveProperty('gpaPrediction');
    });

    it('should allow homeroom teacher to access student', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'TEACHER' });
      mockPrisma.student.findUnique.mockResolvedValue({
        ...mockStudent,
        classroom: {
          homeroomTeacher: { userId: 'user-teacher' },
          subjects: [],
        },
      });

      const result = await service.getStudentAiInsights('user-teacher', 'student-1');
      expect(result).toHaveProperty('gpaPrediction');
    });
  });

  describe('getEarlyWarning', () => {
    it('should return low GPA and high absence students', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'ADMIN', teacher: null });
      mockPrisma.student.findMany
        .mockResolvedValueOnce([{ id: 's1', gpa: 1.5, user: { firstName: 'A', lastName: 'B' } }])
        .mockResolvedValueOnce([{ id: 's2', user: { firstName: 'C', lastName: 'D' } }]);
      mockPrisma.attendance.groupBy.mockResolvedValue([{ studentId: 's2', _count: { id: 5 } }]);

      const result = await service.getEarlyWarning('admin-user');

      expect(result).toHaveProperty('lowGpa');
      expect(result).toHaveProperty('highAbsence');
      expect(result).toHaveProperty('summary');
      expect(result.lowGpa).toHaveLength(1);
      expect(result.highAbsence).toHaveLength(1);
    });

    it('should filter by teacher classrooms for TEACHER role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        role: 'TEACHER',
        teacher: { id: 'teacher-1' },
      });
      mockPrisma.student.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.attendance.groupBy.mockResolvedValue([]);

      const result = await service.getEarlyWarning('user-teacher');

      expect(result.lowGpa).toHaveLength(0);
      expect(result.highAbsence).toHaveLength(0);
      // Verify teacher filter was applied
      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            gpa: { lt: 2.0 },
            classroom: { subjects: { some: { teacherId: 'teacher-1' } } },
          }),
        }),
      );
    });
  });
});

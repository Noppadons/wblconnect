import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../prisma/prisma.service';
import { LineService } from '../communication/line.service';

const mockPrisma = {
  attendance: {
    upsert: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  user: { findUnique: jest.fn() },
  student: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  classroom: { findFirst: jest.fn() },
  $transaction: jest.fn((fn) => fn(mockPrisma)),
};

const mockLineService = {
  sendMessage: jest.fn(),
};

describe('AttendanceService', () => {
  let service: AttendanceService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: LineService, useValue: mockLineService },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkAttendance', () => {
    const mockAttendanceResult = {
      id: 'att-1',
      studentId: 'student-1',
      status: 'PRESENT',
      period: 1,
      date: new Date('2025-01-15'),
      student: {
        id: 'student-1',
        parentLineToken: null,
        user: { firstName: 'สมชาย', lastName: 'ใจดี' },
        classroom: { id: 'class-1' },
      },
    };

    beforeEach(() => {
      // Mock validateTeacherAccess to pass
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'teacher-1', role: 'ADMIN' });
      mockPrisma.attendance.upsert.mockResolvedValue(mockAttendanceResult);
    });

    it('should create attendance record for PRESENT status', async () => {
      const result = await service.checkAttendance('teacher-1', {
        studentId: 'student-1',
        status: 'PRESENT' as any,
        period: 1,
        date: '2025-01-15',
      });

      expect(result).toEqual(mockAttendanceResult);
      expect(mockPrisma.attendance.upsert).toHaveBeenCalledTimes(1);
    });

    it('should normalize date to midnight UTC', async () => {
      await service.checkAttendance('teacher-1', {
        studentId: 'student-1',
        status: 'PRESENT' as any,
        period: 1,
        date: '2025-06-15T14:30:00Z',
      });

      const call = mockPrisma.attendance.upsert.mock.calls[0][0];
      const dateUsed = call.where.studentId_date_period.date;
      expect(dateUsed.getUTCHours()).toBe(0);
      expect(dateUsed.getUTCMinutes()).toBe(0);
      expect(dateUsed.getUTCSeconds()).toBe(0);
    });

    it('should send LINE notification when student is ABSENT and has parentLineToken', async () => {
      const absentResult = {
        ...mockAttendanceResult,
        status: 'ABSENT',
        student: {
          ...mockAttendanceResult.student,
          parentLineToken: 'line-token-123',
        },
      };
      mockPrisma.attendance.upsert.mockResolvedValue(absentResult);

      await service.checkAttendance('teacher-1', {
        studentId: 'student-1',
        status: 'ABSENT' as any,
        period: 3,
        date: '2025-01-15',
      });

      expect(mockLineService.sendMessage).toHaveBeenCalledWith(
        'line-token-123',
        expect.stringContaining('ขาดเรียน'),
      );
    });

    it('should NOT send LINE notification for PRESENT status', async () => {
      await service.checkAttendance('teacher-1', {
        studentId: 'student-1',
        status: 'PRESENT' as any,
        period: 1,
        date: '2025-01-15',
      });

      expect(mockLineService.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle morning assembly (period 0) notifications', async () => {
      const lateResult = {
        ...mockAttendanceResult,
        status: 'LATE',
        period: 0,
        student: {
          ...mockAttendanceResult.student,
          parentLineToken: 'line-token-123',
        },
      };
      mockPrisma.attendance.upsert.mockResolvedValue(lateResult);

      await service.checkAttendance('teacher-1', {
        studentId: 'student-1',
        status: 'LATE' as any,
        period: 0,
        date: '2025-01-15',
      });

      expect(mockLineService.sendMessage).toHaveBeenCalledWith(
        'line-token-123',
        expect.stringContaining('เข้าแถวสาย'),
      );
    });

    it('should not crash if LINE notification fails', async () => {
      const absentResult = {
        ...mockAttendanceResult,
        status: 'ABSENT',
        student: {
          ...mockAttendanceResult.student,
          parentLineToken: 'line-token-123',
        },
      };
      mockPrisma.attendance.upsert.mockResolvedValue(absentResult);
      mockLineService.sendMessage.mockRejectedValue(new Error('LINE API down'));

      const result = await service.checkAttendance('teacher-1', {
        studentId: 'student-1',
        status: 'ABSENT' as any,
        period: 1,
        date: '2025-01-15',
      });

      // Should still return the attendance record
      expect(result).toBeDefined();
    });
  });

  describe('validateTeacherAccess (via checkAttendance)', () => {
    it('should allow ADMIN to access any student', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.attendance.upsert.mockResolvedValue({
        id: 'att-1',
        student: { user: { firstName: 'A', lastName: 'B' }, parentLineToken: null },
      });

      await expect(
        service.checkAttendance('admin-1', {
          studentId: 'any-student',
          status: 'PRESENT' as any,
          period: 1,
          date: '2025-01-15',
        }),
      ).resolves.toBeDefined();
    });

    it('should throw ForbiddenException for TEACHER without classroom access', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'teacher-1', role: 'TEACHER' });
      mockPrisma.student.findUnique.mockResolvedValue({ id: 'student-1', classroomId: 'class-1' });
      mockPrisma.classroom.findFirst.mockResolvedValue(null); // No access

      await expect(
        service.checkAttendance('teacher-1', {
          studentId: 'student-1',
          status: 'PRESENT' as any,
          period: 1,
          date: '2025-01-15',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent student', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'teacher-1', role: 'TEACHER' });
      mockPrisma.student.findUnique.mockResolvedValue(null);

      await expect(
        service.checkAttendance('teacher-1', {
          studentId: 'nonexistent',
          status: 'PRESENT' as any,
          period: 1,
          date: '2025-01-15',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getClassroomAttendance', () => {
    it('should allow TEACHER to view classroom attendance', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'teacher-1', role: 'TEACHER' });
      mockPrisma.attendance.findMany.mockResolvedValue([]);

      const result = await service.getClassroomAttendance('teacher-1', 'class-1', new Date('2025-01-15'));

      expect(result).toEqual([]);
      expect(mockPrisma.attendance.findMany).toHaveBeenCalledTimes(1);
    });

    it('should throw ForbiddenException for STUDENT role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'student-1', role: 'STUDENT' });

      await expect(
        service.getClassroomAttendance('student-1', 'class-1', new Date()),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getSemesterSummary', () => {
    it('should return overview and student reports', async () => {
      mockPrisma.attendance.groupBy.mockResolvedValue([
        { status: 'PRESENT', _count: { id: 50 } },
        { status: 'ABSENT', _count: { id: 5 } },
      ]);
      mockPrisma.student.count.mockResolvedValue(10);
      mockPrisma.student.findMany.mockResolvedValue([
        {
          id: 's1',
          studentCode: 'S001',
          user: { firstName: 'สมชาย', lastName: 'ใจดี' },
          attendance: [
            { status: 'PRESENT' },
            { status: 'PRESENT' },
            { status: 'ABSENT' },
          ],
        },
      ]);

      const result = await service.getSemesterSummary('class-1');

      expect(result.overview).toHaveLength(2);
      expect(result.studentsCount).toBe(10);
      expect(result.studentReports).toHaveLength(1);
      expect(result.studentReports[0].name).toBe('สมชาย ใจดี');
      expect(result.studentReports[0].attendanceRate).toBe(67); // 2/3 = 66.67 → 67
    });

    it('should handle date range filters', async () => {
      mockPrisma.attendance.groupBy.mockResolvedValue([]);
      mockPrisma.student.count.mockResolvedValue(0);
      mockPrisma.student.findMany.mockResolvedValue([]);

      await service.getSemesterSummary('class-1', '2025-01-01', '2025-06-30');

      const groupByCall = mockPrisma.attendance.groupBy.mock.calls[0][0];
      expect(groupByCall.where.date).toBeDefined();
      expect(groupByCall.where.date.gte).toEqual(new Date('2025-01-01'));
      expect(groupByCall.where.date.lte).toEqual(new Date('2025-06-30'));
    });

    it('should return 0% attendance rate for students with no records', async () => {
      mockPrisma.attendance.groupBy.mockResolvedValue([]);
      mockPrisma.student.count.mockResolvedValue(1);
      mockPrisma.student.findMany.mockResolvedValue([
        {
          id: 's1',
          studentCode: 'S001',
          user: { firstName: 'A', lastName: 'B' },
          attendance: [],
        },
      ]);

      const result = await service.getSemesterSummary('class-1');

      expect(result.studentReports[0].attendanceRate).toBe(0);
    });
  });

  describe('bulkCheckAttendance', () => {
    it('should process multiple records in a transaction', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.attendance.upsert
        .mockResolvedValueOnce({
          id: 'att-1',
          period: 1,
          status: 'PRESENT',
          student: { id: 's1', user: { firstName: 'A', lastName: 'B' }, parentLineToken: null },
        })
        .mockResolvedValueOnce({
          id: 'att-2',
          period: 1,
          status: 'ABSENT',
          student: { id: 's2', user: { firstName: 'C', lastName: 'D' }, parentLineToken: null },
        });

      const result = await service.bulkCheckAttendance('admin-1', {
        records: [
          { studentId: 's1', status: 'PRESENT' as any, period: 1, date: '2025-01-15' },
          { studentId: 's2', status: 'ABSENT' as any, period: 1, date: '2025-01-15' },
        ],
      });

      expect(result.count).toBe(2);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});

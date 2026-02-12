import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async getStudentProfileByUserId(userId: string) {
    return this.prisma.student.findUnique({
      where: { userId: userId },
      include: {
        user: true,
        classroom: {
          include: {
            grade: true,
            homeroomTeacher: {
              include: { user: true },
            },
          },
        },
        attendance: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        behaviorLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        submissions: {
          include: {
            assignment: {
              include: { subject: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async getStudentProfile(studentId: string) {
    return this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        classroom: {
          include: {
            grade: true,
            homeroomTeacher: {
              include: { user: true },
            },
          },
        },
        attendance: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        behaviorLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        submissions: {
          include: {
            assignment: {
              include: { subject: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async getAttendanceStats(studentId: string) {
    const attendance = await this.prisma.attendance.findMany({
      where: { studentId },
    });

    const total = attendance.length;
    if (total === 0)
      return { present: 0, late: 0, absent: 0, leave: 0, percentage: 0 };

    const stats = attendance.reduce(
      (acc, curr) => {
        acc[curr.status]++;
        return acc;
      },
      { PRESENT: 0, LATE: 0, ABSENT: 0, LEAVE: 0 },
    );

    return {
      ...stats,
      total,
      percentage: (stats.PRESENT / total) * 100,
    };
  }
}

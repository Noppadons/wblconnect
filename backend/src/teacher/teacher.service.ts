import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeacherService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(userId: string) {
    // Find teacher profile
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      include: {
        homeroomClass: {
          include: {
            students: true,
            grade: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new Error('Teacher profile not found');
    }

    const stats = {
      totalStudents: 0,
      attendanceRate: 0,
      classroomId: teacher.homeroomClass?.id || null, // For report link
      className: teacher.homeroomClass
        ? `${teacher.homeroomClass.grade?.level || ''}/${teacher.homeroomClass.roomNumber}`
        : 'ไม่มีที่ปรึกษา',
    };

    if (teacher.homeroomClass) {
      stats.totalStudents = teacher.homeroomClass.students.length;

      // Calculate attendance rate for TODAY
      const now = new Date();
      const thaiTime = new Date(
        now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }),
      );
      const startOfDay = new Date(thaiTime);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(thaiTime);
      endOfDay.setHours(23, 59, 59, 999);

      const totalStudents = stats.totalStudents;

      if (totalStudents > 0) {
        const presentCount = await this.prisma.attendance.count({
          where: {
            student: { classroomId: teacher.homeroomClass.id },
            date: { gte: startOfDay, lte: endOfDay },
            status: { in: ['PRESENT', 'LATE'] },
          },
        });

        // If checking period 1 or morning assembly, rate = present / total
        // This is a simple approximation
        stats.attendanceRate = Math.round((presentCount / totalStudents) * 100);
      }
    }

    return stats;
  }

  async getMySchedule(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) throw new Error('Teacher not found');

    return this.prisma.schedule.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: true,
        classroom: {
          include: { grade: true },
        },
      },
      orderBy: { periodStart: 'asc' },
    });
  }

  async getMyStudents(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      include: { homeroomClass: true },
    });

    if (!teacher || !teacher.homeroomClass) return [];

    return this.prisma.student.findMany({
      where: { classroomId: teacher.homeroomClass.id },
      include: {
        user: true,
        attendance: {
          take: 5,
          orderBy: { date: 'desc' },
        },
        behaviorLogs: {
          // Assuming relation exists, if not need to add
          select: { points: true },
        },
      },
      orderBy: { studentCode: 'asc' },
    });
  }

  async addBehaviorScore(
    userId: string,
    studentId: string,
    points: number,
    type: string,
    content: string,
  ) {
    // Verify teacher
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) throw new Error('Unauthorized');

    return this.prisma.behaviorLog.create({
      data: {
        studentId,
        points,
        type,
        content,
      },
    });
  }

  async getBehaviorLogsByClassroom(classroomId: string, limit: number = 30) {
    return this.prisma.behaviorLog.findMany({
      where: {
        student: { classroomId },
      },
      include: {
        student: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

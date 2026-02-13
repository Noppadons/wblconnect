import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeacherService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(userId: string) {
    // Find teacher profile with homeroom + taught subjects
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      include: {
        homeroomClass: {
          include: {
            students: true,
            grade: true,
          },
        },
        subjects: {
          where: { classroomId: { not: null } },
          select: { classroomId: true },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    // Collect all unique classroom IDs
    const allClassroomIds = new Set<string>();
    if (teacher.homeroomClass) {
      allClassroomIds.add(teacher.homeroomClass.id);
    }
    for (const subject of teacher.subjects) {
      if (subject.classroomId) {
        allClassroomIds.add(subject.classroomId);
      }
    }

    const classroomIds = Array.from(allClassroomIds);

    // Count total students across all classrooms
    const totalStudents = await this.prisma.student.count({
      where: { classroomId: { in: classroomIds } },
    });

    // Calculate attendance rate for TODAY across all classrooms
    let attendanceRate = 0;
    if (totalStudents > 0) {
      const now = new Date();
      const thaiTime = new Date(
        now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }),
      );
      const startOfDay = new Date(thaiTime);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(thaiTime);
      endOfDay.setHours(23, 59, 59, 999);

      const presentCount = await this.prisma.attendance.count({
        where: {
          student: { classroomId: { in: classroomIds } },
          date: { gte: startOfDay, lte: endOfDay },
          status: { in: ['PRESENT', 'LATE'] },
        },
      });

      attendanceRate = Math.round((presentCount / totalStudents) * 100);
    }

    return {
      totalStudents,
      attendanceRate,
      totalClassrooms: classroomIds.length,
      classroomId: teacher.homeroomClass?.id || classroomIds[0] || null,
      className: teacher.homeroomClass
        ? `${teacher.homeroomClass.grade?.level || ''}/${teacher.homeroomClass.roomNumber}`
        : 'ไม่มีที่ปรึกษา',
    };
  }

  async getMySchedule(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) throw new NotFoundException('Teacher not found');

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

  async getMyClassrooms(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      include: {
        homeroomClass: { include: { grade: true, _count: { select: { students: true } } } },
        subjects: {
          where: { classroomId: { not: null } },
          select: {
            classroomId: true,
            classroom: { include: { grade: true, _count: { select: { students: true } } } },
          },
        },
      },
    });

    if (!teacher) throw new NotFoundException('Teacher not found');

    // Build unique classroom list with isHomeroom flag
    const classroomMap = new Map<string, any>();

    if (teacher.homeroomClass) {
      classroomMap.set(teacher.homeroomClass.id, {
        ...teacher.homeroomClass,
        isHomeroom: true,
      });
    }

    for (const subject of teacher.subjects) {
      if (subject.classroomId && subject.classroom && !classroomMap.has(subject.classroomId)) {
        classroomMap.set(subject.classroomId, {
          ...subject.classroom,
          isHomeroom: false,
        });
      }
    }

    return Array.from(classroomMap.values()).sort((a, b) => {
      // Homeroom first, then by grade level + room number
      if (a.isHomeroom !== b.isHomeroom) return a.isHomeroom ? -1 : 1;
      return (a.grade?.level || '').localeCompare(b.grade?.level || '') || a.roomNumber.localeCompare(b.roomNumber);
    });
  }

  async getMyStudents(userId: string, classroomId?: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      include: {
        homeroomClass: true,
        subjects: { select: { classroomId: true } },
      },
    });

    if (!teacher) throw new NotFoundException('Teacher not found');

    // Collect all classroom IDs the teacher has access to (homeroom + taught subjects)
    const allClassroomIds = new Set<string>();
    if (teacher.homeroomClass) {
      allClassroomIds.add(teacher.homeroomClass.id);
    }
    for (const subject of teacher.subjects) {
      if (subject.classroomId) {
        allClassroomIds.add(subject.classroomId);
      }
    }

    if (allClassroomIds.size === 0) return [];

    // If a specific classroomId is requested, validate access
    let targetClassroomIds: string[];
    if (classroomId) {
      if (!allClassroomIds.has(classroomId)) {
        throw new ForbiddenException('คุณไม่มีสิทธิ์เข้าถึงห้องเรียนนี้');
      }
      targetClassroomIds = [classroomId];
    } else {
      targetClassroomIds = Array.from(allClassroomIds);
    }

    return this.prisma.student.findMany({
      where: { classroomId: { in: targetClassroomIds } },
      include: {
        user: true,
        classroom: { include: { grade: true } },
        attendance: {
          take: 5,
          orderBy: { date: 'desc' },
        },
        behaviorLogs: {
          select: { points: true },
        },
      },
      orderBy: [{ classroomId: 'asc' }, { studentCode: 'asc' }],
    });
  }

  async addBehaviorScore(
    userId: string,
    studentId: string,
    points: number,
    type: string,
    content: string,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      include: {
        homeroomClass: true,
        subjects: { select: { classroomId: true } },
      },
    });
    if (!teacher) throw new ForbiddenException('Unauthorized');

    // Verify teacher has access to the student's classroom
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { classroomId: true },
    });
    if (!student) throw new NotFoundException('ไม่พบข้อมูลนักเรียน');

    const accessibleClassroomIds = new Set<string>();
    if (teacher.homeroomClass) accessibleClassroomIds.add(teacher.homeroomClass.id);
    for (const subject of teacher.subjects) {
      if (subject.classroomId) accessibleClassroomIds.add(subject.classroomId);
    }

    if (!accessibleClassroomIds.has(student.classroomId)) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์บันทึกพฤติกรรมนักเรียนในห้องเรียนนี้');
    }

    return this.prisma.behaviorLog.create({
      data: {
        studentId,
        points,
        type,
        content,
      },
      include: {
        student: {
          include: { user: true },
        },
      },
    });
  }

  async getBehaviorLogsByClassroom(userId: string, classroomId?: string, limit: number = 50) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      include: {
        homeroomClass: true,
        subjects: { select: { classroomId: true } },
      },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    // Collect all accessible classroom IDs
    const accessibleIds = new Set<string>();
    if (teacher.homeroomClass) accessibleIds.add(teacher.homeroomClass.id);
    for (const subject of teacher.subjects) {
      if (subject.classroomId) accessibleIds.add(subject.classroomId);
    }

    // Determine target classrooms
    let targetIds: string[];
    if (classroomId) {
      if (!accessibleIds.has(classroomId)) {
        throw new ForbiddenException('คุณไม่มีสิทธิ์ดูข้อมูลห้องเรียนนี้');
      }
      targetIds = [classroomId];
    } else {
      targetIds = Array.from(accessibleIds);
    }

    if (targetIds.length === 0) return [];

    return this.prisma.behaviorLog.findMany({
      where: {
        student: { classroomId: { in: targetIds } },
      },
      include: {
        student: {
          include: {
            user: true,
            classroom: { include: { grade: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

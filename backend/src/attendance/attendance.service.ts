import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';
import { LineService } from '../communication/line.service';
import { getThaiNow, normalizeToDateOnly, getThaiDayRange } from '../common/utils/date.util';
import { NotificationQueue } from '../common/utils/notification-queue.util';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);
  private readonly notificationQueue: NotificationQueue;

  constructor(
    private prisma: PrismaService,
    private lineService: LineService,
  ) {
    this.notificationQueue = new NotificationQueue(
      (token, message) => this.lineService.sendMessage(token, message),
      5, // concurrency: 5 concurrent LINE API calls
    );
  }

  async checkAttendance(
    userId: string,
    data: {
      studentId: string;
      status: AttendanceStatus;
      period: number;
      remarks?: string;
      date?: string;
    },
  ) {
    await this.validateTeacherAccess(userId, data.studentId);

    // Use provided date or default to Thai Time
    const targetDate = data.date ? new Date(data.date) : getThaiNow();
    const normalizedDate = normalizeToDateOnly(targetDate);

    const attendance = await this.prisma.attendance.upsert({
      where: {
        studentId_date_period: {
          studentId: data.studentId,
          date: normalizedDate,
          period: data.period,
        },
      },
      update: {
        status: data.status,
        remarks: data.remarks,
      },
      create: {
        studentId: data.studentId,
        date: normalizedDate,
        period: data.period,
        status: data.status,
        remarks: data.remarks,
      },
      include: {
        student: {
          include: {
            user: true,
            classroom: { include: { grade: true } },
          },
        },
      },
    });

    // NOTIFICATION LOGIC
    try {
      const student = attendance.student;
      const name = `${student.user.firstName} ${student.user.lastName}`;
      let message = '';
      let shouldNotify = false;

      const now = new Date();
      const dateStr = now.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const classroomName = student.classroom ? `${student.classroom.grade?.level || ''}/${student.classroom.roomNumber || ''}` : '';

      // Case 1: Morning Assembly (Period 0)
      if (data.period === 0) {
        if (data.status === AttendanceStatus.ABSENT) {
          message = [
            `━━━━━━━━━━━━━━━`,
            `🚨 แจ้งเตือน: ขาดการเข้าแถว`,
            `━━━━━━━━━━━━━━━`,
            `👤 นักเรียน: ${name}`,
            classroomName ? `🏫 ชั้น: ${classroomName}` : '',
            `📅 วันที่: ${dateStr}`,
            `🕐 เวลา: ${timeStr} น.`,
            ``,
            `❌ สถานะ: ขาดการเข้าแถวหน้าเสาธง`,
            ``,
            `📌 กรุณาติดต่อครูประจำชั้นหากมีข้อสงสัย`,
            `━━━━━━━━━━━━━━━`,
            `🏫 WBL Connect`,
          ].filter(Boolean).join('\n');
          shouldNotify = true;
        } else if (data.status === AttendanceStatus.LATE) {
          message = [
            `━━━━━━━━━━━━━━━`,
            `⏰ แจ้งเตือน: เข้าแถวสาย`,
            `━━━━━━━━━━━━━━━`,
            `👤 นักเรียน: ${name}`,
            classroomName ? `🏫 ชั้น: ${classroomName}` : '',
            `📅 วันที่: ${dateStr}`,
            `🕐 เวลา: ${timeStr} น.`,
            ``,
            `⚠️ สถานะ: มาเข้าแถวสาย`,
            ``,
            `📌 กรุณาติดต่อครูประจำชั้นหากมีข้อสงสัย`,
            `━━━━━━━━━━━━━━━`,
            `🏫 WBL Connect`,
          ].filter(Boolean).join('\n');
          shouldNotify = true;
        }
      }
      // Case 2: Class Period (1-8)
      else {
        if (data.status === AttendanceStatus.ABSENT) {
          message = [
            `━━━━━━━━━━━━━━━`,
            `🚨 แจ้งเตือน: ขาดเรียน`,
            `━━━━━━━━━━━━━━━`,
            `👤 นักเรียน: ${name}`,
            classroomName ? `🏫 ชั้น: ${classroomName}` : '',
            `📅 วันที่: ${dateStr}`,
            `🕐 เวลา: ${timeStr} น.`,
            `📚 คาบเรียน: คาบที่ ${data.period}`,
            ``,
            `❌ สถานะ: ขาดเรียน`,
            ``,
            `📌 กรุณาติดต่อครูประจำชั้นหากมีข้อสงสัย`,
            `━━━━━━━━━━━━━━━`,
            `🏫 WBL Connect`,
          ].filter(Boolean).join('\n');
          shouldNotify = true;
        } else if (data.status === AttendanceStatus.LATE) {
          message = [
            `━━━━━━━━━━━━━━━`,
            `⏰ แจ้งเตือน: มาเรียนสาย`,
            `━━━━━━━━━━━━━━━`,
            `👤 นักเรียน: ${name}`,
            classroomName ? `🏫 ชั้น: ${classroomName}` : '',
            `📅 วันที่: ${dateStr}`,
            `🕐 เวลา: ${timeStr} น.`,
            `📚 คาบเรียน: คาบที่ ${data.period}`,
            ``,
            `⚠️ สถานะ: มาเรียนสาย`,
            ``,
            `📌 กรุณาติดต่อครูประจำชั้นหากมีข้อสงสัย`,
            `━━━━━━━━━━━━━━━`,
            `🏫 WBL Connect`,
          ].filter(Boolean).join('\n');
          shouldNotify = true;
        }
      }

      if (shouldNotify && message) {
        let notified = false;

        // Priority 1: Parent Direct (Targeted)
        if (student.parentLineToken) {
          await this.lineService.sendMessage(student.parentLineToken, message);
          notified = true;
        }

        // Fallback: Log only — do NOT broadcast to all users when no specific target
        // No specific token found, skip notification
      }
    } catch (err) {
      this.logger.warn(`LINE notification failed for student ${data.studentId}: ${(err as Error).message}`);
    }

    return attendance;
  }

  async bulkCheckAttendance(
    userId: string,
    data: {
      records: {
        studentId: string;
        status: AttendanceStatus;
        period: number;
        remarks?: string;
        date?: string;
      }[];
    },
  ) {
    // Pre-validate: collect unique studentIds and validate access once
    const uniqueStudentIds = [...new Set(data.records.map((r) => r.studentId))];

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN') {
      // Batch validate: find all students' classrooms, then check teacher access
      const students = await this.prisma.student.findMany({
        where: { id: { in: uniqueStudentIds } },
        select: { id: true, classroomId: true },
      });

      if (students.length !== uniqueStudentIds.length) {
        throw new NotFoundException('ไม่พบข้อมูลนักเรียนบางคน');
      }

      const uniqueClassroomIds = [...new Set(students.map((s) => s.classroomId))];

      if (user?.role === 'TEACHER') {
        const accessibleClassrooms = await this.prisma.classroom.findMany({
          where: {
            id: { in: uniqueClassroomIds },
            OR: [
              { homeroomTeacher: { userId } },
              { subjects: { some: { teacher: { userId } } } },
            ],
          },
          select: { id: true },
        });

        const accessibleIds = new Set(accessibleClassrooms.map((c) => c.id));
        const denied = uniqueClassroomIds.filter((id) => !accessibleIds.has(id));
        if (denied.length > 0) {
          throw new ForbiddenException('คุณไม่มีสิทธิ์เช็คชื่อนักเรียนในบางห้องเรียน');
        }
      } else {
        // STUDENT or other roles — check each owns the record
        for (const sid of uniqueStudentIds) {
          const student = await this.prisma.student.findUnique({ where: { id: sid } });
          if (!student || student.userId !== userId) {
            throw new ForbiddenException('คุณไม่มีสิทธิ์จัดการข้อมูลนักเรียนท่านนี้');
          }
        }
      }
    }

    const results = await this.prisma.$transaction(async (tx) => {
      const ops = data.records.map(async (record) => {
        const targetDate = record.date ? new Date(record.date) : getThaiNow();
        const normalizedDate = normalizeToDateOnly(targetDate);

        return tx.attendance.upsert({
          where: {
            studentId_date_period: {
              studentId: record.studentId,
              date: normalizedDate,
              period: record.period,
            },
          },
          update: {
            status: record.status,
            remarks: record.remarks,
          },
          create: {
            studentId: record.studentId,
            date: normalizedDate,
            period: record.period,
            status: record.status,
            remarks: record.remarks,
          },
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        });
      });
      return Promise.all(ops);
    });

    // Handle notifications asynchronously after transaction success
    this.handleBulkNotifications(results);

    return { count: results.length };
  }

  private async validateTeacherAccess(userId: string, studentId: string, tx: any = this.prisma) {
    const user = await tx.user.findUnique({ where: { id: userId } });

    // ADMIN can access all students
    if (user?.role === 'ADMIN') return;

    // TEACHER must be homeroom teacher or teach a subject in the student's classroom
    if (user?.role === 'TEACHER') {
      const student = await tx.student.findUnique({
        where: { id: studentId },
        select: { classroomId: true },
      });
      if (!student) throw new NotFoundException('ไม่พบข้อมูลนักเรียน');

      const hasAccess = await tx.classroom.findFirst({
        where: {
          id: student.classroomId,
          OR: [
            { homeroomTeacher: { userId } },
            { subjects: { some: { teacher: { userId } } } },
          ],
        },
        select: { id: true },
      });

      if (!hasAccess) {
        throw new ForbiddenException('คุณไม่มีสิทธิ์เช็คชื่อนักเรียนในห้องเรียนนี้');
      }
      return;
    }

    // For other roles (STUDENT etc.)
    const student = await tx.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('ไม่พบข้อมูลนักเรียน');
    if (student.userId !== userId) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์จัดการข้อมูลนักเรียนท่านนี้');
    }
  }

  private handleBulkNotifications(attendances: any[]) {
    // Build notification tasks
    const tasks = attendances
      .map((attendance) => {
        const student = attendance.student;
        if (!student?.parentLineToken) return null;

        const name = `${student.user.firstName} ${student.user.lastName}`;
        let message = '';

        if (attendance.period === 0) {
          if (attendance.status === AttendanceStatus.ABSENT) {
            message = `❌ [ขาดการเข้าแถว]\nน้อง ${name}\nสถานะ: ขาดการเข้าแถวหน้าเสาธงครับ`;
          } else if (attendance.status === AttendanceStatus.LATE) {
            message = `⏰ [เข้าแถวสาย]\nน้อง ${name}\nสถานะ: มาเข้าแถวสายครับ`;
          }
        } else {
          if (attendance.status === AttendanceStatus.ABSENT) {
            message = `❌ [ขาดเรียน]\nน้อง ${name}\nสถานะ: ขาดเรียนในคาบที่ ${attendance.period} ครับ`;
          } else if (attendance.status === AttendanceStatus.LATE) {
            message = `⏰ [มาสาย]\nน้อง ${name}\nสถานะ: มาเรียนสายในคาบที่ ${attendance.period} ครับ`;
          }
        }

        if (!message) return null;
        return { token: student.parentLineToken, message, studentId: student.id };
      })
      .filter(Boolean) as { token: string; message: string; studentId: string }[];

    if (tasks.length === 0) return;

    // Fire-and-forget: enqueue notifications without blocking API response
    this.notificationQueue.enqueue(tasks);
    this.logger.log(`Enqueued ${tasks.length} LINE notifications (pending: ${this.notificationQueue.pendingCount})`);
  }

  async getClassroomAttendance(
    userId: string,
    classroomId: string,
    date: Date,
  ) {
    // SECURITY CHECK: Relaxed for TEACHER and ADMIN
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN' && user?.role !== 'TEACHER') {
      throw new ForbiddenException('คุณไม่มีสิทธิ์ดูข้อมูลเข้าเรียนของห้องนี้');
    }

    const baseDate = date ? new Date(date) : getThaiNow();
    const { start: startOfDay, end: endOfDay } = getThaiDayRange(baseDate);

    return this.prisma.attendance.findMany({
      where: {
        student: { classroomId },
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        student: {
          include: { user: true },
        },
      },
    });
  }

  async getMultiClassroomAttendance(
    userId: string,
    classroomIds: string[],
    date: Date,
  ) {
    // SECURITY CHECK: Relaxed for TEACHER and ADMIN
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN' && user?.role !== 'TEACHER') {
      throw new ForbiddenException('คุณไม่มีสิทธิ์ดูข้อมูลบางห้องเรียนที่คุณเลือก');
    }

    const baseDate = date ? new Date(date) : getThaiNow();
    const { start: startOfDay, end: endOfDay } = getThaiDayRange(baseDate);

    return this.prisma.attendance.findMany({
      where: {
        student: { classroomId: { in: classroomIds } },
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        student: {
          include: {
            user: true,
            classroom: { include: { grade: true } },
          },
        },
      },
    });
  }

  async getSemesterSummary(classroomId: string, startDate?: string, endDate?: string) {
    const where: { student: { classroomId: string }; date?: { gte?: Date; lte?: Date } } = {
      student: { classroomId },
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const attendances = await this.prisma.attendance.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
    });

    const studentsCount = await this.prisma.student.count({
      where: { classroomId },
    });

    // Per-student summary for the table
    const students = await this.prisma.student.findMany({
      where: { classroomId },
      include: {
        user: true,
        attendance: {
          where: where.date ? { date: where.date } : {},
          select: { status: true },
        },
      },
    });

    const studentReports = students.map((s) => {
      const stats = {
        PRESENT: s.attendance.filter((a) => a.status === 'PRESENT').length,
        ABSENT: s.attendance.filter((a) => a.status === 'ABSENT').length,
        LATE: s.attendance.filter((a) => a.status === 'LATE').length,
        LEAVE: s.attendance.filter((a) => a.status === 'LEAVE').length,
      };
      const total = s.attendance.length;
      const rate = total > 0 ? Math.round((stats.PRESENT / total) * 100) : 0;

      return {
        id: s.id,
        studentCode: s.studentCode,
        name: `${s.user.firstName} ${s.user.lastName}`,
        stats,
        total,
        attendanceRate: rate,
      };
    });

    return {
      overview: attendances.map((a) => ({ status: a.status, count: a._count.id })),
      studentsCount,
      studentReports,
    };
  }

  async getStudentAttendanceReport(studentId: string, startDate?: string, endDate?: string) {
    const where: { studentId: string; date?: { gte?: Date; lte?: Date } } = { studentId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const attendances = await this.prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const stats = await this.prisma.attendance.groupBy({
      by: ['status'],
      where: { studentId },
      _count: { id: true },
    });

    return {
      attendances,
      stats: stats.map((s) => ({ status: s.status, count: s._count.id })),
    };
  }
}

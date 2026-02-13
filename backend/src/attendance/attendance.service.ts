import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';
import { LineService } from '../communication/line.service';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private prisma: PrismaService,
    private lineService: LineService,
  ) { }

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
    let targetDate: Date;
    if (data.date) {
      targetDate = new Date(data.date);
    } else {
      // Get current date in UTC+7
      const now = new Date();
      targetDate = new Date(now.getTime() + (7 * 3600000));
    }

    // Standardize to midnight for "date" portion if we were using date-only, 
    // but here we keep the exact time the teacher checked.
    // However, the unique constraint is on [studentId, date, period].
    // If we want to allow only one check-in per day per period, 
    // we MUST normalize the date to YYYY-MM-DD.

    const year = targetDate.getUTCFullYear();
    const month = targetDate.getUTCMonth();
    const day = targetDate.getUTCDate();
    const normalizedDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));

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
    // 1. Pre-validate access for all students to avoid partial failures (optional but recommended)
    // For large sets, we might want a more optimized check, but here we'll do it per-record or use a combined query.
    // For now, let's stick to a combined check for the classroom if possible.

    const results = await this.prisma.$transaction(async (tx) => {
      const ops = data.records.map(async (record) => {
        // Internal security check within transaction
        await this.validateTeacherAccess(userId, record.studentId, tx);

        // Use provided date or default to Thai Time
        let targetDate: Date;
        if (record.date) {
          targetDate = new Date(record.date);
        } else {
          const now = new Date();
          targetDate = new Date(now.getTime() + 7 * 3600000);
        }

        const year = targetDate.getUTCFullYear();
        const month = targetDate.getUTCMonth();
        const day = targetDate.getUTCDate();
        const normalizedDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));

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

  private async handleBulkNotifications(attendances: any[]) {
    for (const attendance of attendances) {
      try {
        const student = attendance.student;
        const name = `${student.user.firstName} ${student.user.lastName}`;
        let message = '';
        let shouldNotify = false;

        if (attendance.period === 0) {
          if (attendance.status === AttendanceStatus.ABSENT) {
            message = `❌ [ขาดการเข้าแถว]\nน้อง ${name}\nสถานะ: ขาดการเข้าแถวหน้าเสาธงครับ`;
            shouldNotify = true;
          } else if (attendance.status === AttendanceStatus.LATE) {
            message = `⏰ [เข้าแถวสาย]\nน้อง ${name}\nสถานะ: มาเข้าแถวสายครับ`;
            shouldNotify = true;
          }
        } else {
          if (attendance.status === AttendanceStatus.ABSENT) {
            message = `❌ [ขาดเรียน]\nน้อง ${name}\nสถานะ: ขาดเรียนในคาบที่ ${attendance.period} ครับ`;
            shouldNotify = true;
          } else if (attendance.status === AttendanceStatus.LATE) {
            message = `⏰ [มาสาย]\nน้อง ${name}\nสถานะ: มาเรียนสายในคาบที่ ${attendance.period} ครับ`;
            shouldNotify = true;
          }
        }

        if (shouldNotify && student.parentLineToken) {
          await this.lineService.sendMessage(student.parentLineToken, message);
        }
      } catch (err) {
        this.logger.warn(`LINE notification failed for student ${attendance.student?.id}: ${(err as Error).message}`);
      }
    }
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

    // Use provided date or default to Thai Time
    let baseDate: Date;
    if (date) {
      baseDate = new Date(date);
    } else {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      baseDate = new Date(utc + 3600000 * 7); // UTC+7
    }

    // Calculate start and end of that day in Thai Time (UTC+7)
    // We want records from YYYY-MM-DDT00:00:00.000+07:00 to YYYY-MM-DDT23:59:59.999+07:00
    // In UTC, this is (UTC-7) to (UTC-7)
    const year = baseDate.getUTCFullYear();
    const month = baseDate.getUTCMonth();
    const day = baseDate.getUTCDate();

    // Start: YYYY-MM-DDT00:00:00 in Thai time = YYYY-MM-DDT17:00:00-1 day in UTC
    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    startOfDay.setUTCHours(startOfDay.getUTCHours() - 7);

    const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    endOfDay.setUTCHours(endOfDay.getUTCHours() - 7);

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

    // Date normalization logic (reused)
    let baseDate = date ? new Date(date) : new Date();
    const year = baseDate.getUTCFullYear();
    const month = baseDate.getUTCMonth();
    const day = baseDate.getUTCDate();
    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    startOfDay.setUTCHours(startOfDay.getUTCHours() - 7);
    const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    endOfDay.setUTCHours(endOfDay.getUTCHours() - 7);

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

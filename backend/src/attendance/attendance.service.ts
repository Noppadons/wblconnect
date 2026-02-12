import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';
import { LineService } from '../communication/line.service';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private lineService: LineService,
  ) {}

  async checkAttendance(data: {
    studentId: string;
    status: AttendanceStatus;
    period: number;
    remarks?: string;
    date?: string;
  }) {
    // Use provided date or default to Thai Time today
    let targetDate: Date;
    if (data.date) {
      targetDate = new Date(data.date);
    } else {
      const now = new Date();
      targetDate = new Date(
        now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }),
      );
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await this.prisma.attendance.findFirst({
      where: {
        studentId: data.studentId,
        period: data.period,
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    let attendance;

    if (existing) {
      attendance = await this.prisma.attendance.update({
        where: { id: existing.id },
        data: { status: data.status, remarks: data.remarks },
        include: {
          student: {
            include: {
              user: true,
              classroom: true,
            },
          },
        },
      });
    } else {
      attendance = await this.prisma.attendance.create({
        data: {
          studentId: data.studentId,
          status: data.status,
          period: data.period,
          remarks: data.remarks,
          date: targetDate,
        },
        include: {
          student: {
            include: {
              user: true,
              classroom: true,
            },
          },
        },
      });
    }

    // NOTIFICATION LOGIC
    try {
      const student = attendance.student;
      const name = `${student.user.firstName} ${student.user.lastName}`;
      let message = '';
      let shouldNotify = false;

      console.log(
        `[Attendance] Checking notification for ${name}, Period: ${data.period}, Status: ${data.status}`,
      );

      // Case 1: Morning Assembly (Period 0)
      if (data.period === 0) {
        if (data.status === AttendanceStatus.ABSENT) {
          message = `❌ [ขาดการเข้าแถว]\nน้อง ${name}\nสถานะ: ขาดการเข้าแถวหน้าเสาธงครับ`;
          shouldNotify = true;
        } else if (data.status === AttendanceStatus.LATE) {
          message = `⏰ [เข้าแถวสาย]\nน้อง ${name}\nสถานะ: มาเข้าแถวสายครับ`;
          shouldNotify = true;
        }
      }
      // Case 2: Class Period (1-8)
      else {
        if (data.status === AttendanceStatus.ABSENT) {
          message = `❌ [ขาดเรียน]\nน้อง ${name}\nสถานะ: ขาดเรียนในคาบที่ ${data.period} ครับ`;
          shouldNotify = true;
        } else if (data.status === AttendanceStatus.LATE) {
          message = `⏰ [มาสาย]\nน้อง ${name}\nสถานะ: มาเรียนสายในคาบที่ ${data.period} ครับ`;
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
        if (!notified) {
          console.log(
            `[Attendance] No specific token found for ${name}, skipping notification`,
          );
        }
      }
    } catch (err) {
      console.error('[Attendance] Notification Error:', err);
    }

    return attendance;
  }

  async getClassroomAttendance(classroomId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

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
}

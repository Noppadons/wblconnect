import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';
import { LineService } from '../communication/line.service';

@Injectable()
export class AttendanceService {
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
    // SECURITY CHECK: Ensure the teacher teaches this student or is an ADMIN
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN') {
      const student = await this.prisma.student.findUnique({
        where: { id: data.studentId },
        include: {
          user: true,
          classroom: {
            include: {
              homeroomTeacher: true,
              subjects: {
                where: { teacher: { userId } },
              },
            },
          },
        },
      });

      if (!student) throw new NotFoundException('ไม่พบข้อมูลนักเรียน');

      const isMe = student.userId === userId;
      const isHomeroomTeacher = student.classroom.homeroomTeacher?.userId === userId;
      const teachesAnySubjectInClass = student.classroom.subjects.length > 0;

      if (!isMe && !isHomeroomTeacher && !teachesAnySubjectInClass) {
        throw new ForbiddenException(
          'คุณไม่มีสิทธิ์เช็คชื่อนักเรียนในห้องเรียนนี้',
        );
      }
    }

    // Use provided date or default to Thai Time
    let baseDate: Date;
    if (data.date) {
      baseDate = new Date(data.date);
    } else {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      baseDate = new Date(utc + 3600000 * 7); // UTC+7
    }

    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const day = baseDate.getDate();

    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    startOfDay.setUTCHours(startOfDay.getUTCHours() - 7);

    const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    endOfDay.setUTCHours(endOfDay.getUTCHours() - 7);

    console.log(
      `[Attendance] checkAttendance: Student ${data.studentId}, Period ${data.period}, UTC Range: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`,
    );

    const existing = await this.prisma.attendance.findFirst({
      where: {
        studentId: data.studentId,
        period: data.period,
        date: {
          gte: startOfDay,
          lte: endOfDay,
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
          date: baseDate,
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

  async getClassroomAttendance(
    userId: string,
    classroomId: string,
    date: Date,
  ) {
    // SECURITY CHECK: Ensure teacher teaches this classroom or is an ADMIN
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN') {
      const classroom = await this.prisma.classroom.findUnique({
        where: { id: classroomId },
        include: {
          homeroomTeacher: true,
          subjects: {
            where: { teacher: { userId } },
          },
        },
      });

      if (!classroom) throw new NotFoundException('ไม่พบข้อมูลห้องเรียน');

      const isHomeroomTeacher = classroom.homeroomTeacher?.userId === userId;
      const teachesAnySubjectInClass = classroom.subjects.length > 0;

      if (!isHomeroomTeacher && !teachesAnySubjectInClass) {
        throw new ForbiddenException('คุณไม่มีสิทธิ์ดูข้อมูลเข้าเรียนของห้องนี้');
      }
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
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const day = baseDate.getDate();

    // Start: YYYY-MM-DDT00:00:00 in Thai time = YYYY-MM-DDT17:00:00-1 day in UTC
    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    startOfDay.setUTCHours(startOfDay.getUTCHours() - 7);

    const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    endOfDay.setUTCHours(endOfDay.getUTCHours() - 7);

    console.log(
      `[Attendance] getClassroomAttendance: Classroom ${classroomId}, Target Date: ${baseDate.toDateString()}, UTC Range: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`,
    );

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

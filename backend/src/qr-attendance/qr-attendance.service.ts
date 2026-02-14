import { Injectable, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQRSessionDto } from './dto/create-qr-session.dto';
import { AttendanceStatus } from '@prisma/client';
import { getThaiNow, normalizeToDateOnly } from '../common/utils/date.util';
import { randomBytes } from 'crypto';

@Injectable()
export class QRAttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private generateCode(): string {
    return randomBytes(4).toString('hex').substring(0, 6).toUpperCase();
  }

  async createSession(userId: string, dto: CreateQRSessionDto) {
    // Verify teacher has access to this classroom
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN') {
      const classroom = await this.prisma.classroom.findFirst({
        where: {
          id: dto.classroomId,
          OR: [
            { homeroomTeacher: { userId } },
            { subjects: { some: { teacher: { userId } } } },
          ],
        },
      });
      if (!classroom) throw new ForbiddenException('คุณไม่มีสิทธิ์สร้าง QR สำหรับห้องเรียนนี้');
    }

    // Deactivate any existing active sessions for same classroom+period
    await this.prisma.qRAttendanceSession.updateMany({
      where: { classroomId: dto.classroomId, period: dto.period, isActive: true },
      data: { isActive: false },
    });

    const durationMinutes = dto.durationMinutes || 5;
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    // Generate unique code with retry (max 5 attempts)
    let code = '';
    for (let attempts = 0; attempts < 5; attempts++) {
      code = this.generateCode();
      const existing = await this.prisma.qRAttendanceSession.findUnique({ where: { code } });
      if (!existing) break;
      if (attempts === 4) {
        throw new InternalServerErrorException('ไม่สามารถสร้างรหัส QR ได้ กรุณาลองใหม่อีกครั้ง');
      }
    }

    const session = await this.prisma.qRAttendanceSession.create({
      data: {
        classroomId: dto.classroomId,
        creatorId: userId,
        period: dto.period,
        code,
        expiresAt,
      },
      include: {
        classroom: { include: { grade: true } },
      },
    });

    return {
      ...session,
      durationMinutes,
    };
  }

  async scanCode(userId: string, code: string) {
    const session = await this.prisma.qRAttendanceSession.findUnique({
      where: { code },
      include: { classroom: true },
    });

    if (!session) throw new NotFoundException('ไม่พบ QR Code นี้');
    if (!session.isActive) throw new BadRequestException('QR Code นี้ถูกปิดใช้งานแล้ว');
    if (new Date() > session.expiresAt) throw new BadRequestException('QR Code หมดอายุแล้ว');

    // Verify student is in this classroom
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!student) throw new ForbiddenException('ไม่พบข้อมูลนักเรียน');
    if (student.classroomId !== session.classroomId) {
      throw new ForbiddenException('คุณไม่ได้อยู่ในห้องเรียนนี้');
    }

    // Normalize date using centralized Thai timezone utility
    const thaiNow = getThaiNow();
    const normalizedDate = normalizeToDateOnly(thaiNow);

    // Upsert attendance
    const attendance = await this.prisma.attendance.upsert({
      where: {
        studentId_date_period: {
          studentId: student.id,
          date: normalizedDate,
          period: session.period,
        },
      },
      update: { status: AttendanceStatus.PRESENT },
      create: {
        studentId: student.id,
        date: normalizedDate,
        period: session.period,
        status: AttendanceStatus.PRESENT,
        remarks: 'เช็คชื่อผ่าน QR Code',
      },
    });

    return {
      success: true,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      period: session.period,
      status: 'PRESENT',
      attendance,
    };
  }

  async getActiveSessions(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (user?.role === 'ADMIN') {
      return this.prisma.qRAttendanceSession.findMany({
        where: { isActive: true, expiresAt: { gt: new Date() } },
        include: { classroom: { include: { grade: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Teacher: only their classrooms
    return this.prisma.qRAttendanceSession.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: new Date() },
        classroom: {
          OR: [
            { homeroomTeacher: { userId } },
            { subjects: { some: { teacher: { userId } } } },
          ],
        },
      },
      include: { classroom: { include: { grade: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deactivateSession(id: string, userId: string) {
    const session = await this.prisma.qRAttendanceSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (session.creatorId !== userId && user?.role !== 'ADMIN') {
      throw new ForbiddenException('คุณไม่มีสิทธิ์ปิด QR Session นี้');
    }

    return this.prisma.qRAttendanceSession.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) { }

  async findMySchedule(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: { include: { classroom: true } },
        teacher: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    if (user.role === 'STUDENT' && user.student) {
      return this.findByClassroom(userId, user.student.classroomId);
    }

    if (user.role === 'TEACHER' && user.teacher) {
      return this.findByTeacher(userId, user.teacher.id);
    }

    return [];
  }

  async create(data: CreateScheduleDto) {
    // Check for conflicts in classroom
    const classroomConflict = await this.prisma.schedule.findFirst({
      where: {
        dayOfWeek: data.dayOfWeek,
        classroomId: data.classroomId,
        AND: [
          { periodStart: { lte: data.periodEnd } },
          { periodEnd: { gte: data.periodStart } },
        ],
      },
    });

    if (classroomConflict) {
      throw new ConflictException(
        'ห้องเรียนมีการสอนในเวลานี้อยู่แล้ว (Classroom conflict)',
      );
    }

    // Check for conflicts for teacher
    const teacherConflict = await this.prisma.schedule.findFirst({
      where: {
        dayOfWeek: data.dayOfWeek,
        teacherId: data.teacherId,
        AND: [
          { periodStart: { lte: data.periodEnd } },
          { periodEnd: { gte: data.periodStart } },
        ],
      },
    });

    if (teacherConflict) {
      throw new ConflictException(
        'ครูผู้สอนมีตารางสอนอื่นในเวลานี้อยู่แล้ว (Teacher conflict)',
      );
    }

    return this.prisma.schedule.create({
      data: {
        dayOfWeek: data.dayOfWeek,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        subjectId: data.subjectId,
        classroomId: data.classroomId,
        teacherId: data.teacherId,
      },
    });
  }

  async findByClassroom(userId: string, id: string) {
    // SECURITY CHECK
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { student: true },
    });

    if (user?.role !== 'ADMIN') {
      const classroom = await this.prisma.classroom.findUnique({
        where: { id },
        include: {
          homeroomTeacher: true,
          subjects: { where: { teacher: { userId } } },
        },
      });
      if (!classroom) throw new NotFoundException('Classroom not found');

      const isMyClass = user?.student?.classroomId === id;
      const isHomeroomTeacher = classroom.homeroomTeacher?.userId === userId;
      const teachesInClass = classroom.subjects.length > 0;

      if (!isMyClass && !isHomeroomTeacher && !teachesInClass) {
        throw new ForbiddenException('คุณไม่มีสิทธิ์เข้าถึงตารางสอนของห้องนี้');
      }
    }

    return this.prisma.schedule.findMany({
      where: { classroomId: id },
      include: {
        subject: true,
        teacher: {
          include: { user: true },
        },
      },
      orderBy: [{ periodStart: 'asc' }],
    });
  }

  async findByTeacher(userId: string, id: string) {
    // SECURITY CHECK
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN') {
      const teacher = await this.prisma.teacher.findUnique({ where: { id } });
      if (!teacher) throw new NotFoundException('Teacher not found');
      if (teacher.userId !== userId) {
        throw new ForbiddenException('คุณไม่มีสิทธิ์เข้าดูตารางสอนของผู้อื่น');
      }
    }

    return this.prisma.schedule.findMany({
      where: { teacherId: id },
      include: {
        subject: true,
        classroom: {
          include: { grade: true },
        },
      },
      orderBy: [{ periodStart: 'asc' }],
    });
  }

  async findAll() {
    return this.prisma.schedule.findMany({
      include: {
        subject: true,
        teacher: {
          include: { user: true },
        },
        classroom: {
          include: { grade: true },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { periodStart: 'asc' }],
    });
  }

  async remove(id: string) {
    return this.prisma.schedule.delete({
      where: { id },
    });
  }
}

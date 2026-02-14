import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { ReviewLeaveDto } from './dto/review-leave.dto';
import { Role, LeaveType, LeaveStatus } from '@prisma/client';

@Injectable()
export class LeaveService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateLeaveDto) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new ForbiddenException('Only students can create leave requests');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    return this.prisma.leaveRequest.create({
      data: {
        studentId: student.id,
        startDate,
        endDate,
        reason: dto.reason,
        type: dto.type as LeaveType,
        attachments: dto.attachments || [],
      },
      include: {
        student: { include: { user: true, classroom: { include: { grade: true } } } },
      },
    });
  }

  async findAll(query: {
    status?: string;
    classroomId?: string;
    studentId?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 200);

    if (query.status) where.status = query.status;
    if (query.studentId) where.studentId = query.studentId;
    if (query.classroomId) {
      where.student = { classroomId: query.classroomId };
    }

    const [data, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        include: {
          student: { include: { user: true, classroom: { include: { grade: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findMyRequests(userId: string, page = 1, limit = 50) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new ForbiddenException('Student not found');
    }

    const where = { studentId: student.id };
    const [data, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: Math.min(limit, 200),
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        student: { include: { user: true, classroom: { include: { grade: true } } } },
      },
    });
    if (!leave) throw new NotFoundException('Leave request not found');
    return leave;
  }

  async review(id: string, reviewerId: string, dto: ReviewLeaveDto) {
    const leave = await this.findOne(id);

    if (leave.status !== 'PENDING') {
      throw new BadRequestException('This leave request has already been reviewed');
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: dto.status as LeaveStatus,
        reviewerId,
        reviewNote: dto.reviewNote,
        reviewedAt: new Date(),
      },
      include: {
        student: { include: { user: true, classroom: { include: { grade: true } } } },
      },
    });
  }

  async cancel(id: string, userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    const leave = await this.findOne(id);

    if (leave.studentId !== student?.id) {
      throw new ForbiddenException('You can only cancel your own leave requests');
    }

    if (leave.status !== 'PENDING') {
      throw new BadRequestException('Can only cancel pending leave requests');
    }

    return this.prisma.leaveRequest.delete({ where: { id } });
  }

  async getPendingCount(classroomId?: string) {
    const where: any = { status: 'PENDING' };
    if (classroomId) {
      where.student = { classroomId };
    }
    return this.prisma.leaveRequest.count({ where });
  }
}

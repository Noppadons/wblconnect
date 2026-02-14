import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Role } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        creatorId: userId,
      },
    });
  }

  async findAll(query: {
    month?: number;
    year?: number;
    type?: string;
    targetId?: string;
  }) {
    const where: any = {};

    if (query.month && query.year) {
      const startOfMonth = new Date(query.year, query.month - 1, 1);
      const endOfMonth = new Date(query.year, query.month, 0, 23, 59, 59);
      where.OR = [
        { startDate: { gte: startOfMonth, lte: endOfMonth } },
        { endDate: { gte: startOfMonth, lte: endOfMonth } },
        { AND: [{ startDate: { lte: startOfMonth } }, { endDate: { gte: endOfMonth } }] },
      ];
    }

    if (query.type) {
      where.type = query.type;
    }

    // Show school-wide events + targeted events
    if (query.targetId) {
      where.AND = [
        ...(where.AND || []),
        { OR: [{ targetId: null }, { targetId: query.targetId }] },
      ];
    }

    return this.prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async update(id: string, userId: string, role: Role, dto: UpdateEventDto) {
    const event = await this.findOne(id);

    // Only creator or admin can update
    if (event.creatorId !== userId && role !== Role.ADMIN) {
      throw new ForbiddenException('You can only edit your own events');
    }

    return this.prisma.event.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
      },
    });
  }

  async remove(id: string, userId: string, role: Role) {
    const event = await this.findOne(id);

    if (event.creatorId !== userId && role !== Role.ADMIN) {
      throw new ForbiddenException('You can only delete your own events');
    }

    return this.prisma.event.delete({ where: { id } });
  }
}

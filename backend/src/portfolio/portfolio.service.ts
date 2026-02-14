import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { PortfolioCategory } from '@prisma/client';

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreatePortfolioDto) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new ForbiddenException('Only students can create portfolio items');

    return this.prisma.portfolioItem.create({
      data: {
        studentId: student.id,
        title: dto.title,
        description: dto.description,
        category: dto.category as PortfolioCategory,
        fileUrl: dto.fileUrl,
        link: dto.link,
        date: dto.date ? new Date(dto.date) : null,
        isPublic: dto.isPublic ?? true,
      },
    });
  }

  async findMyItems(userId: string, category?: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new ForbiddenException('Student not found');

    const where: any = { studentId: student.id };
    if (category) where.category = category;

    return this.prisma.portfolioItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStudent(studentId: string, viewerUserId: string) {
    const viewer = await this.prisma.user.findUnique({ where: { id: viewerUserId } });

    const where: any = { studentId };
    // Students can only see public items of others
    if (viewer?.role === 'STUDENT') {
      const viewerStudent = await this.prisma.student.findUnique({ where: { userId: viewerUserId } });
      if (viewerStudent?.id !== studentId) {
        where.isPublic = true;
      }
    }

    return this.prisma.portfolioItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
      },
    });
  }

  async update(id: string, userId: string, dto: UpdatePortfolioDto) {
    const item = await this.prisma.portfolioItem.findUnique({
      where: { id },
      include: { student: true },
    });
    if (!item) throw new NotFoundException('Portfolio item not found');
    if (item.student.userId !== userId) throw new ForbiddenException('You can only edit your own portfolio');

    return this.prisma.portfolioItem.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category !== undefined && { category: dto.category as PortfolioCategory }),
        ...(dto.fileUrl !== undefined && { fileUrl: dto.fileUrl }),
        ...(dto.link !== undefined && { link: dto.link }),
        ...(dto.date !== undefined && { date: dto.date ? new Date(dto.date) : null }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
    });
  }

  async remove(id: string, userId: string) {
    const item = await this.prisma.portfolioItem.findUnique({
      where: { id },
      include: { student: true },
    });
    if (!item) throw new NotFoundException('Portfolio item not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (item.student.userId !== userId && user?.role !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own portfolio');
    }

    return this.prisma.portfolioItem.delete({ where: { id } });
  }
}

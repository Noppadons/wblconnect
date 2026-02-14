import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { SurveyQuestionType } from '@prisma/client';

@Injectable()
export class SurveyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSurveyDto) {
    return this.prisma.survey.create({
      data: {
        title: dto.title,
        description: dto.description,
        creatorId: userId,
        targetId: dto.targetId,
        isAnonymous: dto.isAnonymous ?? false,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        questions: {
          create: dto.questions.map((q, i) => ({
            text: q.text,
            type: q.type as SurveyQuestionType,
            options: q.options || [],
            required: q.required ?? true,
            order: q.order ?? i,
          })),
        },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  }

  async findAll(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (user?.role === 'ADMIN') {
      return this.prisma.survey.findMany({
        include: {
          questions: { orderBy: { order: 'asc' } },
          _count: { select: { responses: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (user?.role === 'TEACHER') {
      return this.prisma.survey.findMany({
        where: { creatorId: userId },
        include: {
          questions: { orderBy: { order: 'asc' } },
          _count: { select: { responses: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Student: show active surveys targeted at their classroom or school-wide
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) return [];

    return this.prisma.survey.findMany({
      where: {
        isActive: true,
        OR: [
          { targetId: null },
          { targetId: student?.classroomId },
        ],
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] },
        ],
      },
      include: {
        questions: { orderBy: { order: 'asc' } },
        responses: { where: { userId }, select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const survey = await this.prisma.survey.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: 'asc' } },
        _count: { select: { responses: true } },
      },
    });
    if (!survey) throw new NotFoundException('Survey not found');
    return survey;
  }

  async submitResponse(userId: string, dto: SubmitResponseDto) {
    const survey = await this.prisma.survey.findUnique({
      where: { id: dto.surveyId },
      include: { questions: true },
    });

    if (!survey) throw new NotFoundException('Survey not found');
    if (!survey.isActive) throw new BadRequestException('แบบประเมินนี้ปิดรับคำตอบแล้ว');

    if (survey.endsAt && new Date() > survey.endsAt) {
      throw new BadRequestException('แบบประเมินนี้หมดเขตตอบแล้ว');
    }

    // Validate required questions
    for (const q of survey.questions) {
      if (q.required && !(q.id in dto.answers)) {
        throw new BadRequestException(`กรุณาตอบคำถาม: ${q.text}`);
      }
    }

    return this.prisma.surveyResponse.upsert({
      where: {
        surveyId_userId: { surveyId: dto.surveyId, userId },
      },
      update: { answers: dto.answers },
      create: {
        surveyId: dto.surveyId,
        userId,
        answers: dto.answers,
      },
    });
  }

  async getResults(surveyId: string, userId: string) {
    const survey = await this.prisma.survey.findUnique({
      where: { id: surveyId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!survey) throw new NotFoundException('Survey not found');

    // Only creator or admin can see results
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (survey.creatorId !== userId && user?.role !== 'ADMIN') {
      throw new ForbiddenException('คุณไม่มีสิทธิ์ดูผลแบบประเมินนี้');
    }

    const responses = await this.prisma.surveyResponse.findMany({
      where: { surveyId },
      include: survey.isAnonymous ? {} : {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    // Aggregate results per question
    const questionResults = survey.questions.map((q) => {
      const answers = responses
        .map((r) => (r.answers as Record<string, any>)[q.id])
        .filter((a) => a !== undefined && a !== null);

      let summary: any = { total: answers.length };

      if (q.type === 'RATING') {
        const nums = answers.map(Number).filter((n) => !isNaN(n));
        summary.average = nums.length > 0 ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100 : 0;
        summary.distribution = [1, 2, 3, 4, 5].map((v) => ({ value: v, count: nums.filter((n) => n === v).length }));
      } else if (q.type === 'CHOICE' || q.type === 'YESNO') {
        const counts: Record<string, number> = {};
        answers.forEach((a) => { counts[a] = (counts[a] || 0) + 1; });
        summary.distribution = Object.entries(counts).map(([value, count]) => ({ value, count }));
      } else {
        summary.answers = answers;
      }

      return { questionId: q.id, text: q.text, type: q.type, ...summary };
    });

    return {
      survey,
      totalResponses: responses.length,
      questionResults,
      responses: survey.isAnonymous ? undefined : responses,
    };
  }

  async toggleActive(id: string, userId: string) {
    const survey = await this.findOne(id);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (survey.creatorId !== userId && user?.role !== 'ADMIN') {
      throw new ForbiddenException('คุณไม่มีสิทธิ์แก้ไขแบบประเมินนี้');
    }

    return this.prisma.survey.update({
      where: { id },
      data: { isActive: !survey.isActive },
    });
  }

  async remove(id: string, userId: string) {
    const survey = await this.findOne(id);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (survey.creatorId !== userId && user?.role !== 'ADMIN') {
      throw new ForbiddenException('คุณไม่มีสิทธิ์ลบแบบประเมินนี้');
    }

    return this.prisma.survey.delete({ where: { id } });
  }
}

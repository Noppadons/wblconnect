import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAttendanceLeaderboard(classroomId?: string, limit = 10) {
    const studentWhere: any = {};
    if (classroomId) studentWhere.classroomId = classroomId;

    // Step 1: Aggregate attendance counts per student at DB level
    const attendanceAgg = await this.prisma.attendance.groupBy({
      by: ['studentId'],
      where: classroomId ? { student: { classroomId } } : {},
      _count: { id: true },
    });

    const presentAgg = await this.prisma.attendance.groupBy({
      by: ['studentId'],
      where: {
        status: { in: ['PRESENT', 'LATE'] },
        ...(classroomId ? { student: { classroomId } } : {}),
      },
      _count: { id: true },
    });

    const totalMap = new Map(attendanceAgg.map((a) => [a.studentId, a._count.id]));
    const presentMap = new Map(presentAgg.map((a) => [a.studentId, a._count.id]));

    // Step 2: Fetch only student info (no attendance records)
    const studentIds = Array.from(totalMap.keys());
    if (studentIds.length === 0) return [];

    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds }, ...studentWhere },
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true } },
        classroom: { include: { grade: true } },
      },
    });

    const ranked = students
      .map((s) => {
        const total = totalMap.get(s.id) || 0;
        const present = presentMap.get(s.id) || 0;
        const rate = total > 0 ? Math.round((present / total) * 10000) / 100 : 0;
        return {
          id: s.id,
          studentCode: s.studentCode,
          name: `${s.user.firstName} ${s.user.lastName}`,
          avatarUrl: s.user.avatarUrl,
          classroom: s.classroom ? `${s.classroom.grade?.level}/${s.classroom.roomNumber}` : '',
          attendanceRate: rate,
          totalDays: total,
          presentDays: present,
        };
      })
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, limit);

    return ranked.map((r, i) => ({ ...r, rank: i + 1 }));
  }

  async getBehaviorLeaderboard(classroomId?: string, limit = 10) {
    const studentWhere: any = {};
    if (classroomId) studentWhere.classroomId = classroomId;

    // PERFORMANCE: Aggregate behavior at DB level instead of loading all logs
    const [students, behaviorAgg] = await Promise.all([
      this.prisma.student.findMany({
        where: studentWhere,
        select: {
          id: true,
          studentCode: true,
          user: { select: { firstName: true, lastName: true, avatarUrl: true } },
          classroom: { include: { grade: true } },
        },
      }),
      this.prisma.behaviorLog.groupBy({
        by: ['studentId', 'type'],
        where: { student: studentWhere },
        _sum: { points: true },
        _count: { id: true },
      }),
    ]);

    // Build lookup map
    const behaviorMap = new Map<string, { positive: number; negative: number; posCount: number; negCount: number }>();
    for (const row of behaviorAgg) {
      if (!behaviorMap.has(row.studentId)) {
        behaviorMap.set(row.studentId, { positive: 0, negative: 0, posCount: 0, negCount: 0 });
      }
      const map = behaviorMap.get(row.studentId)!;
      if (row.type === 'POSITIVE') {
        map.positive = row._sum.points || 0;
        map.posCount = row._count.id;
      } else {
        map.negative = Math.abs(row._sum.points || 0);
        map.negCount = row._count.id;
      }
    }

    const ranked = students
      .map((s) => {
        const beh = behaviorMap.get(s.id) || { positive: 0, negative: 0, posCount: 0, negCount: 0 };
        return {
          id: s.id,
          studentCode: s.studentCode,
          name: `${s.user.firstName} ${s.user.lastName}`,
          avatarUrl: s.user.avatarUrl,
          classroom: s.classroom ? `${s.classroom.grade?.level}/${s.classroom.roomNumber}` : '',
          totalPoints: beh.positive - beh.negative,
          positiveCount: beh.posCount,
          negativeCount: beh.negCount,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);

    return ranked.map((r, i) => ({ ...r, rank: i + 1 }));
  }

  async getGpaLeaderboard(classroomId?: string, limit = 10) {
    const where: any = {};
    if (classroomId) where.classroomId = classroomId;

    const students = await this.prisma.student.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true } },
        classroom: { include: { grade: true } },
      },
      orderBy: { gpa: 'desc' },
      take: limit,
    });

    return students.map((s, i) => ({
      rank: i + 1,
      id: s.id,
      studentCode: s.studentCode,
      name: `${s.user.firstName} ${s.user.lastName}`,
      avatarUrl: s.user.avatarUrl,
      classroom: s.classroom ? `${s.classroom.grade?.level}/${s.classroom.roomNumber}` : '',
      gpa: s.gpa,
    }));
  }

  async getSubmissionLeaderboard(classroomId?: string, limit = 10) {
    const studentWhere: any = {};
    if (classroomId) studentWhere.classroomId = classroomId;

    // Aggregate submission counts at DB level
    const submissionAgg = await this.prisma.submission.groupBy({
      by: ['studentId'],
      where: classroomId ? { student: { classroomId } } : {},
      _count: { id: true },
      _avg: { points: true },
    });

    const onTimeAgg = await this.prisma.submission.groupBy({
      by: ['studentId'],
      where: {
        status: { in: ['SUBMITTED', 'GRADED'] },
        ...(classroomId ? { student: { classroomId } } : {}),
      },
      _count: { id: true },
    });

    const totalMap = new Map(submissionAgg.map((a) => [a.studentId, { count: a._count.id, avg: a._avg.points || 0 }]));
    const onTimeMap = new Map(onTimeAgg.map((a) => [a.studentId, a._count.id]));

    const studentIds = Array.from(totalMap.keys());
    if (studentIds.length === 0) return [];

    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds }, ...studentWhere },
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true } },
        classroom: { include: { grade: true } },
      },
    });

    const ranked = students
      .map((s) => {
        const stats = totalMap.get(s.id) || { count: 0, avg: 0 };
        const onTime = onTimeMap.get(s.id) || 0;
        return {
          id: s.id,
          studentCode: s.studentCode,
          name: `${s.user.firstName} ${s.user.lastName}`,
          avatarUrl: s.user.avatarUrl,
          classroom: s.classroom ? `${s.classroom.grade?.level}/${s.classroom.roomNumber}` : '',
          totalSubmissions: stats.count,
          onTimeSubmissions: onTime,
          avgScore: Math.round(stats.avg * 100) / 100,
        };
      })
      .sort((a, b) => b.avgScore - a.avgScore || b.onTimeSubmissions - a.onTimeSubmissions)
      .slice(0, limit);

    return ranked.map((r, i) => ({ ...r, rank: i + 1 }));
  }
}

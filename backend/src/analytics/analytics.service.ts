import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';
import { EARLY_WARNING, RISK_THRESHOLDS, BEHAVIOR_SCORE, ATTENDANCE, GPA } from '../common/constants';

export interface Recommendation {
  subject: string;
  advice: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) { }

  async getStudentAiInsights(userId: string, studentId: string) {
    const userRequesting = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
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
        submissions: {
          include: { assignment: true },
          orderBy: { createdAt: 'desc' },
          take: 50, // SCALABILITY: Limit to recent 50 records
        },
        attendance: {
          orderBy: { date: 'desc' },
          take: 50, // SCALABILITY: Limit to recent 50 records
        },
        behaviorLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50, // SCALABILITY: Limit to recent 50 records
        },
      },
    });

    if (!student) throw new NotFoundException('Student not found');

    // SECURITY CHECK
    if (userRequesting?.role !== 'ADMIN') {
      const isMe = student.userId === userId;
      const isHomeroomTeacher = student.classroom.homeroomTeacher?.userId === userId;
      const teachesAnySubjectInClass = student.classroom.subjects.length > 0;

      if (!isMe && !isHomeroomTeacher && !teachesAnySubjectInClass) {
        throw new ForbiddenException('คุณไม่มีสิทธิ์ดูข้อมูลวิเคราะห์ของนักเรียนคนนี้');
      }
    }

    const gpaPrediction = this.calculateGpaPrediction(student.submissions);
    const behaviorScore = this.calculateBehaviorScore(
      student.attendance,
      student.behaviorLogs,
    );
    const recommendations = this.generateRecommendations(
      student.submissions,
      student.attendance,
    );

    return {
      gpaPrediction,
      behaviorScore,
      riskLevel: this.calculateRiskLevel(gpaPrediction, behaviorScore),
      summary: student.user.firstName + ' ' + (gpaPrediction < 2.5 ? 'ต้องการการดูแลเป็นพิเศษ' : 'ผลการเรียนอยู่ในเกณฑ์ปกติ'),
    };
  }

  async getEarlyWarning(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { teacher: true },
    });

    const isTeacher = user?.role === 'TEACHER';
    const teacherId = user?.teacher?.id;

    // Base filters for "Risk" students
    const lowGpaList = await this.prisma.student.findMany({
      where: {
        gpa: { lt: EARLY_WARNING.MIN_GPA },
        ...(isTeacher ? { classroom: { subjects: { some: { teacherId } } } } : {}),
      },
      include: { user: true, classroom: { include: { grade: true } } },
    });

    const highAbsenceGroups = await this.prisma.attendance.groupBy({
      by: ['studentId'],
      where: {
        status: 'ABSENT',
        ...(isTeacher ? { student: { classroom: { subjects: { some: { teacherId } } } } } : {}),
      },
      _count: { id: true },
      having: { id: { _count: { gte: EARLY_WARNING.MIN_ABSENCE_COUNT } } },
    });

    const absenceStudentIds = highAbsenceGroups.map((g) => g.studentId);
    const absentStudents = await this.prisma.student.findMany({
      where: { id: { in: absenceStudentIds } },
      include: { user: true, classroom: { include: { grade: true } } },
    });

    return {
      lowGpa: lowGpaList,
      highAbsence: absentStudents,
      summary: `พบนักเรียนที่มีความเสี่ยงด้านผลการเรียน ${lowGpaList.length} คน และด้านสถิติมาเรียน ${absentStudents.length} คน`,
    };
  }

  private calculateRiskLevel(gpa: number, behavior: number): string {
    if (gpa < RISK_THRESHOLDS.HIGH_GPA || behavior < RISK_THRESHOLDS.HIGH_BEHAVIOR) return 'HIGH';
    if (gpa < RISK_THRESHOLDS.MEDIUM_GPA || behavior < RISK_THRESHOLDS.MEDIUM_BEHAVIOR) return 'MEDIUM';
    return 'LOW';
  }

  private calculateGpaPrediction(submissions: { points: number | null; assignment: { maxPoints: number; subjectId: string } }[]) {
    if (submissions.length === 0) return 0.0;

    let totalPoints = 0;
    let totalMaxPoints = 0;

    submissions.forEach((sub) => {
      if (sub.points !== null && sub.assignment.maxPoints > 0) {
        totalPoints += sub.points;
        totalMaxPoints += sub.assignment.maxPoints;
      }
    });

    if (totalMaxPoints === 0) return 0.0;

    // Simple linear scale to 4.0 GPA
    const scoreRatio = totalPoints / totalMaxPoints;
    const predictedGpa = scoreRatio * GPA.MAX_SCALE;

    return parseFloat(predictedGpa.toFixed(2));
  }

  private calculateBehaviorScore(attendance: { status: AttendanceStatus }[], logs: { type: string; points: number }[]) {
    let score = BEHAVIOR_SCORE.BASE;

    // Deductions for attendance
    attendance.forEach((a) => {
      if (a.status === AttendanceStatus.ABSENT) score -= BEHAVIOR_SCORE.ABSENT_DEDUCTION;
      if (a.status === AttendanceStatus.LATE) score -= BEHAVIOR_SCORE.LATE_DEDUCTION;
    });

    // Manual logs
    logs.forEach((log) => {
      if (log.type === 'POSITIVE') score += log.points;
      if (log.type === 'NEGATIVE') score -= log.points;
    });

    return Math.max(BEHAVIOR_SCORE.MIN, Math.min(BEHAVIOR_SCORE.MAX, score));
  }

  private generateRecommendations(submissions: { points: number | null; assignment: { maxPoints: number; subjectId: string } }[], attendance: { status: AttendanceStatus }[]) {
    const recommendations: Recommendation[] = [];

    // Low attendance check
    const rate = this.calculateAttendanceRate(attendance);
    if (rate < ATTENDANCE.LOW_RATE_THRESHOLD) {
      recommendations.push({
        subject: 'การเข้าเรียน',
        advice:
          'ควรปรับปรุงการเข้าเรียนให้สม่ำเสมอกว่านี้ เพื่อไม่ให้พลาดเนื้อหาสำคัญ',
        priority: 'HIGH',
      });
    }

    // Subject-specific performance
    const subjectScores: Record<
      string,
      { points: number; max: number; name: string }
    > = {};

    submissions.forEach((sub) => {
      const subjectId = sub.assignment.subjectId;
      if (!subjectScores[subjectId]) {
        subjectScores[subjectId] = { points: 0, max: 0, name: 'วิชาไม่ระบุ' };
      }
      if (sub.points !== null) {
        subjectScores[subjectId].points += sub.points;
        subjectScores[subjectId].max += sub.assignment.maxPoints;
      }
    });

    Object.values(subjectScores).forEach((score) => {
      if (score.max > 0 && score.points / score.max < GPA.LOW_SCORE_RATIO) {
        recommendations.push({
          subject: score.name,
          advice:
            'คะแนนในวิชานี้ค่อนข้างต่ำ ควรทบทวนเนื้อหาเพิ่มเติมหรือปรึกษาครูผู้สอน',
          priority: 'MEDIUM',
        });
      }
    });

    if (recommendations.length === 0) {
      recommendations.push({
        subject: 'ภาพรวม',
        advice: 'รักษามาตรฐานผลการเรียนและความประพฤติที่ดีต่อไป ยอดเยี่ยมมาก!',
        priority: 'LOW',
      });
    }

    return recommendations;
  }

  private calculateAttendanceRate(attendance: { status: AttendanceStatus }[]) {
    if (attendance.length === 0) return 100;
    const present = attendance.filter(
      (a) => a.status === AttendanceStatus.PRESENT,
    ).length;
    return (present / attendance.length) * 100;
  }
}

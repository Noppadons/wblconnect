import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';

export interface Recommendation {
  subject: string;
  advice: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getStudentAiInsights(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        submissions: {
          include: { assignment: true },
        },
        attendance: true,
        behaviorLogs: true,
        user: true,
      },
    });

    if (!student) throw new Error('Student not found');

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
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      gpaPrediction,
      behaviorScore,
      recommendations,
      stats: {
        totalSubmissions: student.submissions.length,
        attendanceRate: this.calculateAttendanceRate(student.attendance),
      },
    };
  }

  private calculateGpaPrediction(submissions: any[]) {
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
    const predictedGpa = scoreRatio * 4.0;

    return parseFloat(predictedGpa.toFixed(2));
  }

  private calculateBehaviorScore(attendance: any[], logs: any[]) {
    let score = 100;

    // Deductions for attendance
    attendance.forEach((a) => {
      if (a.status === AttendanceStatus.ABSENT) score -= 5;
      if (a.status === AttendanceStatus.LATE) score -= 2;
    });

    // Manual logs
    logs.forEach((log) => {
      if (log.type === 'POSITIVE') score += log.points;
      if (log.type === 'NEGATIVE') score -= log.points;
    });

    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(submissions: any[], attendance: any[]) {
    const recommendations: Recommendation[] = [];

    // Low attendance check
    const rate = this.calculateAttendanceRate(attendance);
    if (rate < 80) {
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
      if (score.max > 0 && score.points / score.max < 0.5) {
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

  private calculateAttendanceRate(attendance: any[]) {
    if (attendance.length === 0) return 100;
    const present = attendance.filter(
      (a) => a.status === AttendanceStatus.PRESENT,
    ).length;
    return (present / attendance.length) * 100;
  }
}

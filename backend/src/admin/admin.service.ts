import { Injectable, ConflictException, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { SchoolService } from '../school/school.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private schoolService: SchoolService,
  ) { }

  async getDashboardStats() {
    const now = new Date();
    const thaiTime = new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }),
    );
    const startOfDay = new Date(thaiTime);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(thaiTime);
    endOfDay.setHours(23, 59, 59, 999);

    const [totalStudents, totalTeachers, totalClassrooms, attendanceToday] =
      await Promise.all([
        this.prisma.student.count(),
        this.prisma.teacher.count(),
        this.prisma.classroom.count(),
        this.prisma.attendance.count({
          where: {
            date: {
              gte: startOfDay,
              lt: endOfDay,
            },
            status: 'PRESENT',
          },
        }),
      ]);

    return {
      totalStudents,
      totalTeachers,
      totalClassrooms,
      attendanceToday,
    };
  }

  async getDashboardCharts() {
    const now = new Date();
    const thaiTime = new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }),
    );

    // Attendance trend: last 7 days using GROUP BY
    const totalStudents = await this.prisma.student.count();
    const startDate = new Date(thaiTime);
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const attendances = await this.prisma.attendance.groupBy({
      by: ['date'],
      where: {
        date: { gte: startDate },
        status: 'PRESENT',
      },
      _count: {
        id: true,
      },
    });

    const attendanceTrend: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(thaiTime);
      day.setDate(day.getDate() - i);
      const startOfTargetDay = new Date(day);
      startOfTargetDay.setHours(0, 0, 0, 0);
      const endOfTargetDay = new Date(day);
      endOfTargetDay.setHours(23, 59, 59, 999);

      // Find the count for this specific day in the grouped results
      const presentCount =
        attendances.find(
          (a) => a.date >= startOfTargetDay && a.date <= endOfTargetDay,
        )?._count.id || 0;

      const rate =
        totalStudents > 0
          ? Math.round((presentCount / totalStudents) * 100)
          : 0;
      attendanceTrend.push({
        label: day.toLocaleDateString('th-TH', { weekday: 'short' }),
        value: rate,
      });
    }

    // Score distribution: single query using groupBy to avoid N+1
    const allStudents = await this.prisma.student.findMany({
      where: { gpa: { gte: 0 } },
      select: { gpa: true },
    });

    const ranges = [
      { label: '0-1.0', min: 0, max: 1.0 },
      { label: '1.0-1.5', min: 1.0, max: 1.5 },
      { label: '1.5-2.0', min: 1.5, max: 2.0 },
      { label: '2.0-2.5', min: 2.0, max: 2.5 },
      { label: '2.5-3.0', min: 2.5, max: 3.0 },
      { label: '3.0-3.5', min: 3.0, max: 3.5 },
      { label: '3.5-4.0', min: 3.5, max: 4.01 },
    ];

    const scoreDistribution = ranges.map((r) => ({
      label: r.label,
      value: allStudents.filter((s) => (s.gpa ?? 0) >= r.min && (s.gpa ?? 0) < r.max).length,
    }));

    // Recent notifications as activity
    const recentNotifications = await this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return { attendanceTrend, scoreDistribution, recentNotifications };
  }

  async findAllStudents() {
    return this.prisma.student.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        classroom: {
          include: {
            grade: true,
          },
        },
      },
    });
  }

  async createStudent(data: any) {
    const {
      email,
      password,
      firstName,
      lastName,
      studentCode,
      classroomId,
      avatarUrl,
    } = data;

    if (!password || password.length < 6) {
      throw new BadRequestException('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) throw new ConflictException('อีเมลนี้ถูกใช้งานแล้ว');

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'STUDENT',
        avatarUrl: avatarUrl || null,
        student: {
          create: {
            studentCode,
            classroomId: classroomId || undefined,
            parentLineToken: data.parentLineToken || null,
          },
        },
      },
      include: {
        student: {
          include: {
            classroom: { include: { grade: true } },
          },
        },
      },
    });
  }

  async updateStudent(id: string, data: any) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) throw new NotFoundException('Student not found');

    // Build user update — only include fields that are provided
    const userUpdate: any = {};
    if (data.firstName !== undefined) userUpdate.firstName = data.firstName;
    if (data.lastName !== undefined) userUpdate.lastName = data.lastName;
    if (data.email) userUpdate.email = data.email;
    if (data.avatarUrl !== undefined)
      userUpdate.avatarUrl = data.avatarUrl || null;

    // Build student update
    const updateData: any = {};
    if (data.studentCode !== undefined)
      updateData.studentCode = data.studentCode;
    if (data.parentLineToken !== undefined)
      updateData.parentLineToken = data.parentLineToken || null;

    if (data.classroomId) {
      updateData.classroom = { connect: { id: data.classroomId } };
      // Ensure no scalar classroomId is passed to avoid Prisma validation error
      delete updateData.classroomId;
    }

    if (Object.keys(userUpdate).length > 0) {
      updateData.user = { update: userUpdate };
    }

    // AGGRESSIVE FIX: Ensure no classroomId key exists
    delete updateData.classroomId;

    return this.prisma.student.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        classroom: { include: { grade: true } },
      },
    });
  }

  async deleteStudent(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) throw new NotFoundException('Student not found');

    // Delete user will cascade to student if configured,
    // but let's be safe or check the schema.
    // Actually, in prisma schema, student is dependent on user.
    return this.prisma.user.delete({
      where: { id: student.userId },
    });
  }

  // Teacher Management
  async findAllTeachers() {
    return this.prisma.teacher.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        homeroomClass: {
          include: {
            grade: true,
          },
        },
      },
    });
  }

  async createTeacher(data: any) {
    const normalizedEmail = data.email.toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) throw new ConflictException('อีเมลนี้ถูกใช้งานแล้ว');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'TEACHER',
        avatarUrl: data.avatarUrl || null,
        teacher: {
          create: {},
        },
      },
      include: {
        teacher: true,
      },
    });
  }

  async updateTeacher(id: string, data: any) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!teacher) throw new NotFoundException('Teacher not found');

    const userUpdate: any = {};
    if (data.firstName !== undefined) userUpdate.firstName = data.firstName;
    if (data.lastName !== undefined) userUpdate.lastName = data.lastName;
    if (data.email) userUpdate.email = data.email;
    if (data.avatarUrl !== undefined)
      userUpdate.avatarUrl = data.avatarUrl || null;

    return this.prisma.user.update({
      where: { id: teacher.userId },
      data: userUpdate,
      include: {
        teacher: true,
      },
    });
  }

  async deleteTeacher(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!teacher) throw new NotFoundException('Teacher not found');

    return this.prisma.user.delete({
      where: { id: teacher.userId },
    });
  }

  // Classroom Management
  async findAllClassrooms() {
    return this.prisma.classroom.findMany({
      include: {
        grade: true,
        homeroomTeacher: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            students: true,
            subjects: true,
          },
        },
      },
    });
  }

  async createClassroom(data: any) {
    const {
      semesterId: rawSemesterId,
      gradeLevel,
      roomNumber,
      homeroomTeacherId,
    } = data;

    // Resolve semesterId to a real UUID
    const semesterId =
      await this.schoolService.resolveSemesterId(rawSemesterId);

    // Find or create gradeLevel
    let grade = await this.prisma.gradeLevel.findFirst({
      where: { level: gradeLevel },
    });

    if (!grade) {
      grade = await this.prisma.gradeLevel.create({
        data: { level: gradeLevel },
      });
    }

    return this.prisma.classroom.create({
      data: {
        roomNumber,
        gradeId: grade.id,
        semesterId: semesterId,
        homeroomTeacherId: homeroomTeacherId || null,
      },
      include: {
        grade: true,
        homeroomTeacher: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async updateClassroom(id: string, data: any) {
    const {
      roomNumber,
      homeroomTeacherId,
      gradeLevel,
      semesterId: rawSemesterId,
    } = data;

    const updateData: any = {
      roomNumber,
      homeroomTeacherId: homeroomTeacherId || null,
    };

    if (rawSemesterId) {
      updateData.semesterId =
        await this.schoolService.resolveSemesterId(rawSemesterId);
    }

    if (gradeLevel) {
      let grade = await this.prisma.gradeLevel.findFirst({
        where: { level: gradeLevel },
      });

      if (!grade) {
        grade = await this.prisma.gradeLevel.create({
          data: { level: gradeLevel },
        });
      }
      updateData.gradeId = grade.id;
    }

    return this.prisma.classroom.update({
      where: { id },
      data: updateData,
      include: {
        grade: true,
        homeroomTeacher: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async deleteClassroom(id: string) {
    return this.prisma.classroom.delete({
      where: { id },
    });
  }

  async getSettings() {
    let school = await this.prisma.school.findFirst();
    if (!school) {
      school = await this.prisma.school.create({
        data: { name: 'โรงเรียนวัดบึงเหล็ก ในพระบรมราชานุเคราะห์' },
      });
    }
    return school;
  }

  async getSemesterSummary(classroomId?: string) {
    const whereClause = classroomId ? { classroomId } : {};

    // PERFORMANCE FIX: Use selective fields and aggregated counting
    const students = await this.prisma.student.findMany({
      where: whereClause,
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true } },
        classroom: { include: { grade: true } },
        _count: {
          select: {
            enrolledSubjects: true,
            submissions: true,
            attendance: true,
          },
        },
        attendance: {
          select: { status: true },
        },
        behaviorLogs: {
          select: { type: true, points: true },
        },
        submissions: {
          where: { status: 'GRADED' },
          select: {
            points: true,
            assignment: { select: { maxPoints: true } },
          },
        },
        // Only fetch failing subjects for risk assessment
        enrolledSubjects: {
          where: { grade: { lt: 1.0, not: null } },
          select: { id: true },
        },
      },
    });

    const ABSENT_THRESHOLD = 20;
    const LOW_GPA_THRESHOLD = 2.0;

    const studentSummaries = students.map((s) => {
      // Use pre-calculated GPA from DB (Trusting the AssessmentService sync logic)
      const gpa = s.gpa || 0;

      // Attendance Metrics
      const stats = s.attendance.reduce(
        (acc, curr) => {
          acc[curr.status.toLowerCase()]++;
          return acc;
        },
        { present: 0, late: 0, absent: 0, leave: 0 } as any,
      );

      const totalAttendance = s._count.attendance;
      const attendanceRate =
        totalAttendance > 0
          ? Math.round(((stats.present + stats.late) / totalAttendance) * 10000) / 100
          : 0;

      // Behavior Metrics
      let behaviorScore = 0;
      let positivePts = 0;
      let negativePts = 0;
      s.behaviorLogs.forEach((b) => {
        if (b.type === 'POSITIVE') positivePts += b.points;
        else negativePts += Math.abs(b.points);
      });
      behaviorScore = positivePts - negativePts;

      // Submissions Metrics
      const graded = s.submissions;
      const avgScore =
        graded.length > 0
          ? Math.round(
            graded.reduce(
              (sum, sub) =>
                sum +
                ((sub.points || 0) / (sub.assignment?.maxPoints || 100)) *
                100,
              0,
            ) / graded.length,
          )
          : 0;

      // Risk flags
      const risks: string[] = [];
      if (gpa > 0 && gpa < LOW_GPA_THRESHOLD) risks.push('GPA ต่ำ');
      if (stats.absent >= ABSENT_THRESHOLD) risks.push('ขาดเรียนเกินเกณฑ์');
      if (behaviorScore < -10) risks.push('พฤติกรรมเสี่ยง');
      if (s.enrolledSubjects.length > 0) risks.push('มีวิชาที่ไม่ผ่าน');

      return {
        id: s.id,
        studentCode: s.studentCode,
        firstName: s.user.firstName,
        lastName: s.user.lastName,
        avatarUrl: s.user.avatarUrl,
        classroom: `${s.classroom.grade.level}/${s.classroom.roomNumber}`,
        classroomId: s.classroomId,
        gpa,
        subjectCount: s._count.enrolledSubjects,
        gradedSubjectCount: graded.length,
        attendance: {
          total: totalAttendance,
          ...stats,
          rate: attendanceRate,
        },
        behavior: {
          positive: positivePts,
          negative: negativePts,
          score: behaviorScore,
        },
        submissions: { total: s._count.submissions, avgScore },
        risks,
        isAtRisk: risks.length > 0,
      };
    });

    // Classroom-level aggregation
    const totalStudents = studentSummaries.length;
    const avgGpa =
      totalStudents > 0
        ? Math.round(
          (studentSummaries.reduce((s, st) => s + st.gpa, 0) /
            totalStudents) *
          100,
        ) / 100
        : 0;
    const avgAttendanceRate =
      totalStudents > 0
        ? Math.round(
          (studentSummaries.reduce((s, st) => s + st.attendance.rate, 0) /
            totalStudents) *
          100,
        ) / 100
        : 0;
    const avgBehaviorScore =
      totalStudents > 0
        ? Math.round(
          (studentSummaries.reduce((s, st) => s + st.behavior.score, 0) /
            totalStudents) *
          100,
        ) / 100
        : 0;
    const atRiskCount = studentSummaries.filter((s) => s.isAtRisk).length;

    // GPA distribution
    const gpaDistribution = {
      excellent: studentSummaries.filter((s) => s.gpa >= 3.5).length,
      good: studentSummaries.filter((s) => s.gpa >= 3.0 && s.gpa < 3.5).length,
      fair: studentSummaries.filter((s) => s.gpa >= 2.0 && s.gpa < 3.0).length,
      poor: studentSummaries.filter((s) => s.gpa > 0 && s.gpa < 2.0).length,
      none: studentSummaries.filter((s) => s.gpa === 0).length,
    };

    // Sort: at-risk first, then by GPA ascending
    studentSummaries.sort((a, b) => {
      if (a.isAtRisk !== b.isAtRisk) return a.isAtRisk ? -1 : 1;
      return a.gpa - b.gpa;
    });

    return {
      overview: {
        totalStudents,
        avgGpa,
        avgAttendanceRate,
        avgBehaviorScore,
        atRiskCount,
        gpaDistribution,
      },
      students: studentSummaries,
    };
  }

  async updateSettings(data: any) {
    const school = await this.prisma.school.findFirst();
    if (!school) throw new NotFoundException('School not found');

    return this.prisma.school.update({
      where: { id: school.id },
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
      },
    });
  }
}

import { Injectable, ConflictException, BadRequestException, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { SchoolService } from '../school/school.service';
import { getThaiNow, getThaiDayRange } from '../common/utils/date.util';
import {
  CreateStudentDto,
  UpdateStudentDto,
  CreateTeacherDto,
  UpdateTeacherDto,
  CreateClassroomDto,
  UpdateClassroomDto,
  UpdateSettingsDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private schoolService: SchoolService,
  ) { }

  async getDashboardStats() {
    const thaiNow = getThaiNow();
    const { start: startOfDay, end: endOfDay } = getThaiDayRange(thaiNow);

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
    const thaiTime = getThaiNow();

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

  async findAllStudents(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        skip,
        take: limit,
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
      }),
      this.prisma.student.count(),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createStudent(data: CreateStudentDto) {
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

    if (!classroomId) {
      throw new BadRequestException('กรุณาระบุห้องเรียน');
    }

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
            classroom: { connect: { id: classroomId } },
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

  async updateStudent(id: string, data: UpdateStudentDto) {
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
  async findAllTeachers(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.teacher.findMany({
        skip,
        take: limit,
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
      }),
      this.prisma.teacher.count(),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createTeacher(data: CreateTeacherDto) {
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

  async updateTeacher(id: string, data: UpdateTeacherDto) {
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

  async createClassroom(data: CreateClassroomDto) {
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

  async updateClassroom(id: string, data: UpdateClassroomDto) {
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

    // PERFORMANCE: Fetch students with minimal data (no embedded arrays)
    const [students, attendanceStats, behaviorStats, failingSubjects, submissionCounts] = await Promise.all([
      // 1. Students with basic info only
      this.prisma.student.findMany({
        where: whereClause,
        select: {
          id: true,
          studentCode: true,
          gpa: true,
          classroomId: true,
          user: { select: { firstName: true, lastName: true, avatarUrl: true } },
          classroom: { include: { grade: true } },
          _count: { select: { enrolledSubjects: true, submissions: true, attendance: true } },
        },
      }),
      // 2. Attendance aggregated by studentId + status (DB-level)
      this.prisma.attendance.groupBy({
        by: ['studentId', 'status'],
        where: { student: whereClause },
        _count: { id: true },
      }),
      // 3. Behavior aggregated by studentId + type (DB-level)
      this.prisma.behaviorLog.groupBy({
        by: ['studentId', 'type'],
        where: { student: whereClause },
        _sum: { points: true },
      }),
      // 4. Failing subjects count per student (DB-level)
      this.prisma.studentSubject.groupBy({
        by: ['studentId'],
        where: { student: whereClause, grade: { lt: 1.0, not: null } },
        _count: { id: true },
      }),
      // 5. Graded submissions count per student (DB-level)
      this.prisma.submission.groupBy({
        by: ['studentId'],
        where: { student: whereClause, status: 'GRADED' },
        _count: { id: true },
        _avg: { points: true },
      }),
    ]);

    // Build lookup maps for O(1) access
    const attendanceMap = new Map<string, Record<string, number>>();
    for (const row of attendanceStats) {
      if (!attendanceMap.has(row.studentId)) {
        attendanceMap.set(row.studentId, { present: 0, late: 0, absent: 0, leave: 0 });
      }
      const map = attendanceMap.get(row.studentId)!;
      map[row.status.toLowerCase()] = row._count.id;
    }

    const behaviorMap = new Map<string, { positive: number; negative: number }>();
    for (const row of behaviorStats) {
      if (!behaviorMap.has(row.studentId)) {
        behaviorMap.set(row.studentId, { positive: 0, negative: 0 });
      }
      const map = behaviorMap.get(row.studentId)!;
      if (row.type === 'POSITIVE') map.positive = row._sum.points || 0;
      else map.negative = Math.abs(row._sum.points || 0);
    }

    const failingMap = new Map<string, number>();
    for (const row of failingSubjects) {
      failingMap.set(row.studentId, row._count.id);
    }

    const submissionMap = new Map<string, { count: number; avgPoints: number }>();
    for (const row of submissionCounts) {
      submissionMap.set(row.studentId, { count: row._count.id, avgPoints: row._avg.points || 0 });
    }

    const ABSENT_THRESHOLD = 20;
    const LOW_GPA_THRESHOLD = 2.0;

    const studentSummaries = students.map((s) => {
      const gpa = s.gpa || 0;

      // Attendance from aggregated map
      const stats = attendanceMap.get(s.id) || { present: 0, late: 0, absent: 0, leave: 0 };
      const totalAttendance = s._count.attendance;
      const attendanceRate =
        totalAttendance > 0
          ? Math.round(((stats.present + stats.late) / totalAttendance) * 10000) / 100
          : 0;

      // Behavior from aggregated map
      const beh = behaviorMap.get(s.id) || { positive: 0, negative: 0 };
      const behaviorScore = beh.positive - beh.negative;

      // Submissions from aggregated map
      const sub = submissionMap.get(s.id) || { count: 0, avgPoints: 0 };

      // Risk flags
      const risks: string[] = [];
      if (gpa > 0 && gpa < LOW_GPA_THRESHOLD) risks.push('GPA ต่ำ');
      if (stats.absent >= ABSENT_THRESHOLD) risks.push('ขาดเรียนเกินเกณฑ์');
      if (behaviorScore < -10) risks.push('พฤติกรรมเสี่ยง');
      if ((failingMap.get(s.id) || 0) > 0) risks.push('มีวิชาที่ไม่ผ่าน');

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
        gradedSubjectCount: sub.count,
        attendance: {
          total: totalAttendance,
          ...stats,
          rate: attendanceRate,
        },
        behavior: {
          positive: beh.positive,
          negative: beh.negative,
          score: behaviorScore,
        },
        submissions: { total: s._count.submissions, avgScore: Math.round(sub.avgPoints) },
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

  async updateSettings(data: UpdateSettingsDto) {
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

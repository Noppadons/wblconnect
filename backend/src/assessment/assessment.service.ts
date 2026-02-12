import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssessmentService {
  constructor(private prisma: PrismaService) { }

  async createAssignment(data: any) {
    return this.prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description || null,
        maxPoints: data.maxPoints,
        subjectId: data.subjectId,
        classroomId: data.classroomId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        attachments: data.attachments || [],
      },
    });
  }

  async submitAssignment(data: {
    userId: string;
    assignmentId: string;
    content?: string;
    attachments?: string[];
  }) {
    // 1. Resolve Student ID from User ID
    const student = await this.prisma.student.findUnique({
      where: { userId: data.userId },
      select: { id: true, classroomId: true },
    });

    if (!student) {
      throw new ForbiddenException('ไม่พบข้อมูลโปรไฟล์นักเรียน');
    }

    // 2. SECURITY CHECK: Ensure assignment exists and student is in the correct classroom
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: data.assignmentId },
      select: { classroomId: true },
    });

    if (!assignment) {
      throw new NotFoundException('ไม่พบการมอบหมายงานนี้');
    }

    if (student.classroomId !== assignment.classroomId) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์ส่งงานในการมอบหมายงานนี้');
    }

    return this.prisma.submission.upsert({
      where: {
        studentId_assignmentId: {
          studentId: student.id,
          assignmentId: data.assignmentId,
        },
      },
      update: {
        status: 'SUBMITTED',
        content: data.content,
        attachments: data.attachments || [],
        updatedAt: new Date(),
      },
      create: {
        studentId: student.id,
        assignmentId: data.assignmentId,
        status: 'SUBMITTED',
        content: data.content,
        attachments: data.attachments || [],
      },
    });
  }

  async gradeSubmission(
    userId: string,
    submissionId: string,
    points: number,
    feedback?: string,
  ) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            subject: {
              include: { teacher: true },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('ไม่พบข้อมูลการส่งงาน');
    }

    // SECURITY CHECK: Ensure the teacher is the one teaching this subject
    // (Allow ADMIN to bypass)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (
      user?.role !== 'ADMIN' &&
      submission.assignment.subject.teacher.userId !== userId
    ) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์พิจารณาเกรดให้วิชานี้');
    }

    if (points > submission.assignment.maxPoints) {
      throw new BadRequestException(
        `คะแนนต้องไม่เกิน ${submission.assignment.maxPoints}`,
      );
    }

    return this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        points,
        feedback,
        status: 'GRADED',
      },
    });
  }

  async getAssignmentsByClassroom(classroomId: string) {
    return this.prisma.assignment.findMany({
      where: { classroomId },
      include: {
        subject: true,
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAssignmentGradebook(assignmentId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        subject: true,
        classroom: {
          include: {
            students: {
              include: {
                user: true,
                submissions: {
                  where: { assignmentId },
                },
              },
            },
          },
        },
      },
    });

    if (!assignment) throw new Error('Assignment not found');

    // Format for easy consumption by the frontend gradebook table
    return {
      id: assignment.id,
      title: assignment.title,
      maxPoints: assignment.maxPoints,
      subject: assignment.subject,
      students:
        assignment.classroom?.students.map((s) => ({
          id: s.id,
          name: `${s.user.firstName} ${s.user.lastName}`,
          studentCode: s.studentCode,
          submission: s.submissions[0] || null,
        })) || [],
    };
  }

  async bulkUpdateGrades(
    userId: string,
    assignmentId: string,
    grades: { studentId: string; points: number; feedback?: string }[],
  ) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        subject: {
          include: { teacher: true },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('ไม่พบการมอบหมายงาน');
    }

    // SECURITY CHECK: Teacher or Admin only
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (
      user?.role !== 'ADMIN' &&
      assignment.subject.teacher.userId !== userId
    ) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์พิจารณาเกรดให้วิชานี้');
    }

    // Use $transaction to ensure all updates succeed or none do
    return this.prisma.$transaction(
      grades.map((g) =>
        this.prisma.submission.upsert({
          where: {
            studentId_assignmentId: {
              studentId: g.studentId,
              assignmentId,
            },
          },
          update: {
            points: g.points,
            feedback: g.feedback,
            status: 'GRADED',
          },
          create: {
            studentId: g.studentId,
            assignmentId,
            points: g.points,
            feedback: g.feedback,
            status: 'GRADED',
          },
        }),
      ),
    );
  }

  async enrollStudent(studentId: string, subjectId: string) {
    return this.prisma.studentSubject.create({
      data: {
        studentId,
        subjectId,
      },
    });
  }

  async updateSubjectGrade(
    studentId: string,
    subjectId: string,
    grade: number,
  ) {
    const result = await this.prisma.studentSubject.update({
      where: {
        studentId_subjectId: {
          studentId,
          subjectId,
        },
      },
      data: { grade },
    });

    // **Optimization**: Auto-recalculate GPA to keep data consistent
    await this.calculateGPA(studentId);

    return result;
  }

  async calculateGPA(studentId: string) {
    const enrollments = await this.prisma.studentSubject.findMany({
      where: { studentId },
      include: { subject: true },
    });

    let totalPoints = 0;
    let totalCredits = 0;

    for (const enrollment of enrollments) {
      if (enrollment.grade !== null) {
        totalPoints += enrollment.grade * enrollment.subject.credit;
        totalCredits += enrollment.subject.credit;
      }
    }

    const gpa =
      totalCredits > 0
        ? parseFloat((totalPoints / totalCredits).toFixed(2))
        : 0.0;

    // **Optimization**: Update the student's GPA in the database for fast querying
    await this.prisma.student.update({
      where: { id: studentId },
      data: { gpa: gpa },
    });

    return gpa;
  }

  async getStudentPerformance(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { gpa: true },
    });

    const submissions = await this.prisma.submission.findMany({
      where: { studentId },
      include: {
        assignment: {
          include: { subject: true },
        },
      },
    });

    return {
      gpa: student?.gpa || 0.0,
      submissions,
    };
  }

  async getEarlyWarningStudents() {
    // Optimization: Use groupBy to find IDs of students with >= 3 absences directly in DB
    const highAbsenceGroups = await this.prisma.attendance.groupBy({
      by: ['studentId'],
      where: {
        status: 'ABSENT',
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gte: 3,
          },
        },
      },
    });

    const studentIds = highAbsenceGroups.map((g) => g.studentId);

    const highAbsenceStudents = await this.prisma.student.findMany({
      where: {
        id: { in: studentIds },
      },
      include: {
        user: true,
        // Only include the count if needed, or nothing at all to keep it lean
      },
    });

    // Rule 2: Low GPA (< 2.0)
    // **Optimization**: Direct DB query using the indexed 'gpa' field (O(1))
    const lowGpaStudents = await this.prisma.student.findMany({
      where: {
        gpa: {
          lt: 2.0,
        },
      },
      include: {
        user: true,
      },
    });

    return {
      highAbsence: highAbsenceStudents,
      lowGpa: lowGpaStudents,
    };
  }

  async getMyAssignments(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: { id: true, classroomId: true },
    });

    if (!student) {
      throw new Error('Student profile not found');
    }

    const assignments = await this.prisma.assignment.findMany({
      where: { classroomId: student.classroomId },
      include: {
        subject: true,
        submissions: {
          where: { studentId: student.id },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return assignments.map((a) => ({
      ...a,
      mySubmission: a.submissions[0] || null,
    }));
  }
}

import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

import { AssessmentService } from '../assessment/assessment.service';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private assessmentService: AssessmentService,
  ) { }

  async generateAttendanceExcel(userId: string, classroomId: string, startDate?: string, endDate?: string) {
    // SECURITY CHECK
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN') {
      const classroom = await this.prisma.classroom.findUnique({
        where: { id: classroomId },
        include: {
          homeroomTeacher: true,
          subjects: { where: { teacher: { userId } } },
        },
      });
      if (!classroom) throw new NotFoundException('ไม่พบห้องเรียน');
      if (classroom.homeroomTeacher?.userId !== userId && classroom.subjects.length === 0) {
        throw new ForbiddenException('คุณไม่มีสิทธิ์เข้าถึงรายงานของห้องเรียนนี้');
      }
    }

    // Build date filter to avoid loading all historical records
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const students = await this.prisma.student.findMany({
      where: { classroomId },
      include: {
        user: true,
        attendance: {
          where: Object.keys(dateFilter).length > 0 ? { date: dateFilter } : undefined,
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายงานการมาเรียน');

    worksheet.columns = [
      { header: 'เลขประจำตัว', key: 'studentCode', width: 15 },
      { header: 'ชื่อ-นามสกุล', key: 'name', width: 30 },
      { header: 'มาเรียน', key: 'present', width: 10 },
      { header: 'สาย', key: 'late', width: 10 },
      { header: 'ขาด', key: 'absent', width: 10 },
      { header: 'ลา', key: 'leave', width: 10 },
    ];

    students.forEach((student) => {
      const stats = student.attendance.reduce(
        (acc, curr) => {
          acc[curr.status.toLowerCase()]++;
          return acc;
        },
        { present: 0, late: 0, absent: 0, leave: 0 },
      );

      worksheet.addRow({
        studentCode: student.studentCode,
        name: `${student.user.firstName} ${student.user.lastName}`,
        ...stats,
      });
    });

    return workbook;
  }

  async generateStudentPdf(userId: string, studentId: string) {
    // Reuse permission logic from student profile check
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        classroom: {
          include: {
            grade: true,
            homeroomTeacher: true,
            subjects: { where: { teacher: { userId } } },
          },
        },
      },
    });

    if (!student) throw new NotFoundException('ไม่พบข้อมูลนักเรียน');

    const userRequesting = await this.prisma.user.findUnique({ where: { id: userId } });
    if (userRequesting?.role !== 'ADMIN') {
      const isMe = student.userId === userId;
      const isHomeroomTeacher = student.classroom.homeroomTeacher?.userId === userId;
      const teachesAnySubjectInClass = student.classroom.subjects.length > 0;

      if (!isMe && !isHomeroomTeacher && !teachesAnySubjectInClass) {
        throw new ForbiddenException('คุณไม่มีสิทธิ์เข้าถึงรายงานนิสัยการเรียนของนักเรียนคนนี้');
      }
    }
    const doc = new PDFDocument();
    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .text('Student Profile Report', { align: 'center' });
    doc.moveDown();
    doc
      .font('Helvetica')
      .fontSize(14)
      .text(`Name: ${student?.user.firstName} ${student?.user.lastName}`);
    doc.text(`Student ID: ${student?.studentCode}`);
    doc.text(
      `Grade: ${student.classroom.grade?.level || 'N/A'}/${student.classroom.roomNumber}`,
    );
    doc.end();
    return doc;
  }

  async generateTranscript(userId: string, studentId: string) {
    // Same check as PDF
    await this.generateStudentPdf(userId, studentId);
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        classroom: {
          include: {
            grade: true,
            semester: { include: { academicYear: true } },
          },
        },
        enrolledSubjects: { include: { subject: true } },
      },
    });

    if (!student) throw new NotFoundException('Student not found');

    const gpa = student.gpa || 0;

    const doc = new PDFDocument();

    // Header
    doc
      .font('Helvetica-Bold')
      .fontSize(24)
      .text('OFFICIAL TRANSCRIPT', { align: 'center' });
    doc
      .fontSize(10)
      .text('Antigravity School Management System', { align: 'center' });
    doc.moveDown(2);

    // Student Info
    doc
      .fontSize(12)
      .text(`Name: ${student.user.firstName} ${student.user.lastName}`);
    doc.text(`ID: ${student.studentCode}`);
    doc.text(
      `Class: ${student.classroom.grade.level}/${student.classroom.roomNumber}`,
    );
    doc.moveDown();

    // Academic Records Table
    doc.font('Helvetica-Bold').text('Subject', 50, doc.y, { width: 300 });
    doc.text('Credit', 350, doc.y, { width: 50 });
    doc.text('Grade', 450, doc.y, { width: 50 });
    doc.moveDown();
    doc.lineWidth(1).moveTo(50, doc.y).lineTo(500, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica');
    for (const enrollment of student.enrolledSubjects) {
      doc.text(enrollment.subject.name, 50, doc.y, { width: 300 });
      doc.text((enrollment.subject.credit || 1.0).toString(), 350, doc.y, {
        width: 50,
      });
      doc.text((enrollment.grade || '-').toString(), 450, doc.y, { width: 50 });
      doc.moveDown(0.5);
    }

    doc.moveDown();
    doc.lineWidth(1).moveTo(50, doc.y).lineTo(500, doc.y).stroke();
    doc.moveDown();

    // Summary
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(`Cumulative GPA: ${gpa}`, { align: 'right' });

    doc.end();
    return doc;
  }
}

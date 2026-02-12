import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

import { AssessmentService } from '../assessment/assessment.service';

@Injectable()
export class ReportsService {
    constructor(
        private prisma: PrismaService,
        private assessmentService: AssessmentService
    ) { }

    async generateAttendanceExcel(classroomId: string) {
        // ... (unchanged)
        const students = await this.prisma.student.findMany({
            where: { classroomId },
            include: {
                user: true,
                attendance: true,
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

    async generateStudentPdf(studentId: string) {
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
            include: {
                user: true,
                classroom: { include: { grade: true } },
            },
        });

        const doc = new PDFDocument();
        doc.font('Helvetica-Bold').fontSize(20).text('Student Profile Report', { align: 'center' });
        doc.moveDown();
        doc.font('Helvetica').fontSize(14).text(`Name: ${student?.user.firstName} ${student?.user.lastName}`);
        doc.text(`Student ID: ${student?.studentCode}`);
        doc.text(`Grade: ${student?.classroom.grade.level}/${student?.classroom.roomNumber}`);
        doc.end();
        return doc;
    }

    async generateTranscript(studentId: string) {
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
            include: {
                user: true,
                classroom: {
                    include: {
                        grade: true,
                        semester: { include: { academicYear: true } }
                    }
                },
                enrolledSubjects: { include: { subject: true } }
            }
        });

        if (!student) throw new Error('Student not found');

        const gpa = await this.assessmentService.calculateGPA(studentId);

        const doc = new PDFDocument();

        // Header
        doc.font('Helvetica-Bold').fontSize(24).text('OFFICIAL TRANSCRIPT', { align: 'center' });
        doc.fontSize(10).text('Antigravity School Management System', { align: 'center' });
        doc.moveDown(2);

        // Student Info
        doc.fontSize(12).text(`Name: ${student.user.firstName} ${student.user.lastName}`);
        doc.text(`ID: ${student.studentCode}`);
        doc.text(`Class: ${student.classroom.grade.level}/${student.classroom.roomNumber}`);
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
            doc.text((enrollment.subject.credit || 1.0).toString(), 350, doc.y, { width: 50 });
            doc.text((enrollment.grade || '-').toString(), 450, doc.y, { width: 50 });
            doc.moveDown(0.5);
        }

        doc.moveDown();
        doc.lineWidth(1).moveTo(50, doc.y).lineTo(500, doc.y).stroke();
        doc.moveDown();

        // Summary
        doc.font('Helvetica-Bold').fontSize(14).text(`Cumulative GPA: ${gpa}`, { align: 'right' });

        doc.end();
        return doc;
    }
}

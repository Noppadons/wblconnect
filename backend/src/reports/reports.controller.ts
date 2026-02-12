import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Roles(Role.TEACHER, Role.ADMIN)
    @Get('attendance/excel')
    async exportAttendanceExcel(@Query('classroomId') classroomId: string, @Res() res: Response) {
        const workbook = await this.reportsService.generateAttendanceExcel(classroomId);

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=' + `attendance_${classroomId}.xlsx`,
        );

        await workbook.xlsx.write(res);
        res.end();
    }

    @Get('student/pdf')
    async exportStudentPdf(@Query('studentId') studentId: string, @Res() res: Response) {
        const doc = await this.reportsService.generateStudentPdf(studentId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=student_${studentId}.pdf`);


        doc.pipe(res);
    }

    @Get('student/transcript')
    async exportTranscript(@Query('studentId') studentId: string, @Res() res: Response) {
        const doc = await this.reportsService.generateTranscript(studentId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=transcript_${studentId}.pdf`);

        doc.pipe(res);
    }
}

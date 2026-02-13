import { Controller, Post, Body, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import {
  CheckAttendanceDto,
  BulkCheckAttendanceDto,
} from './dto/check-attendance.dto';

import { PrismaService } from '../prisma/prisma.service';

@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly prisma: PrismaService,
  ) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @Post('check')
  async checkAttendance(@Req() req: any, @Body() data: CheckAttendanceDto) {
    return this.attendanceService.checkAttendance(req.user.id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @Post('bulk-check')
  async bulkCheckAttendance(@Req() req: any, @Body() data: BulkCheckAttendanceDto) {
    return this.attendanceService.bulkCheckAttendance(req.user.id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @Get('classroom')
  async getClassroomAttendance(
    @Req() req: any,
    @Query('classroomId') classroomId: string,
    @Query('date') dateString: string,
  ) {
    let date = dateString ? new Date(dateString) : new Date();
    if (isNaN(date.getTime())) {
      date = new Date();
    }
    return this.attendanceService.getClassroomAttendance(
      req.user.id,
      classroomId,
      date,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @Get('multi-classrooms')
  async getMultiClassroomAttendance(
    @Req() req: any,
    @Query('classroomIds') classroomIds: string,
    @Query('date') dateString: string,
  ) {
    const ids = classroomIds ? classroomIds.split(',') : [];
    let date = dateString ? new Date(dateString) : new Date();
    if (isNaN(date.getTime())) {
      date = new Date();
    }
    return this.attendanceService.getMultiClassroomAttendance(
      req.user.id,
      ids,
      date,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @Get('summary')
  async getSemesterSummary(
    @Query('classroomId') classroomId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.attendanceService.getSemesterSummary(classroomId, startDate, endDate);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  @Get('student-report')
  async getStudentReport(
    @Req() req: any,
    @Query('studentId') studentId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    // If student, they can only see their own
    let targetStudentId = studentId;
    if (req.user.role === Role.STUDENT) {
      const student = await this.prisma.student.findUnique({
        where: { userId: req.user.id },
      });
      targetStudentId = student?.id || '';
    }

    return this.attendanceService.getStudentAttendanceReport(
      targetStudentId,
      startDate,
      endDate,
    );
  }
}

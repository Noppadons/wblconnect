import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import {
  CheckAttendanceDto,
  BulkCheckAttendanceDto,
} from './dto/check-attendance.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @Post('check')
  async checkAttendance(@Body() data: CheckAttendanceDto) {
    return this.attendanceService.checkAttendance(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @Post('bulk-check')
  async bulkCheckAttendance(@Body() data: BulkCheckAttendanceDto) {
    const results: any[] = [];
    for (const record of data.records) {
      results.push(await this.attendanceService.checkAttendance(record));
    }
    return { count: results.length, message: 'Attendance saved successfully' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @Get('classroom')
  async getClassroomAttendance(
    @Query('classroomId') classroomId: string,
    @Query('date') dateString: string,
  ) {
    let date = dateString ? new Date(dateString) : new Date();
    if (isNaN(date.getTime())) {
      date = new Date();
    }
    return this.attendanceService.getClassroomAttendance(classroomId, date);
  }
}

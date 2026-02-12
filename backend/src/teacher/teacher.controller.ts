import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  Query,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('teacher')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) { }

  @Get('stats')
  async getDashboardStats(@Req() req: any) {
    return this.teacherService.getDashboardStats(req.user.id);
  }

  @Get('schedule')
  async getMySchedule(@Req() req: any) {
    return this.teacherService.getMySchedule(req.user.id);
  }

  @Get('my-students')
  async getMyStudents(@Req() req: any) {
    return this.teacherService.getMyStudents(req.user.id);
  }

  @Post('behavior')
  async addBehaviorScore(
    @Req() req: any,
    @Body()
    body: { studentId: string; points: number; type: string; content: string },
  ) {
    return this.teacherService.addBehaviorScore(
      req.user.id,
      body.studentId,
      body.points,
      body.type,
      body.content,
    );
  }

  @Get('behavior-logs/:classroomId')
  async getBehaviorLogs(
    @Param('classroomId') classroomId: string,
    @Query('limit') limit?: string,
  ) {
    return this.teacherService.getBehaviorLogsByClassroom(
      classroomId,
      parseInt(limit || '30'),
    );
  }
}

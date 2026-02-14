import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { AddBehaviorDto } from './dto/behavior.dto';

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

  @Get('my-classrooms')
  async getMyClassrooms(@Req() req: any) {
    return this.teacherService.getMyClassrooms(req.user.id);
  }

  @Get('my-students')
  async getMyStudents(
    @Req() req: any,
    @Query('classroomId') classroomId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.teacherService.getMyStudents(
      req.user.id,
      classroomId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  @Post('behavior')
  async addBehaviorScore(
    @Req() req: any,
    @Body() body: AddBehaviorDto,
  ) {
    return this.teacherService.addBehaviorScore(
      req.user.id,
      body.studentId,
      body.points,
      body.type,
      body.content,
    );
  }

  @Get('behavior-logs')
  async getBehaviorLogs(
    @Req() req: any,
    @Query('classroomId') classroomId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.teacherService.getBehaviorLogsByClassroom(
      req.user.id,
      classroomId,
      parseInt(limit || '50'),
    );
  }
}

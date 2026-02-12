import {
  Controller,
  Get,
  UseGuards,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import {
  CreateStudentDto,
  UpdateStudentDto,
  CreateTeacherDto,
  UpdateTeacherDto,
  CreateClassroomDto,
  UpdateClassroomDto,
  UpdateSettingsDto,
} from './dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('charts')
  async getDashboardCharts() {
    return this.adminService.getDashboardCharts();
  }

  @Get('students')
  async findAllStudents() {
    return this.adminService.findAllStudents();
  }

  @Post('students')
  async createStudent(@Body() data: CreateStudentDto) {
    return this.adminService.createStudent(data);
  }

  @Patch('students/:id')
  async updateStudent(@Param('id') id: string, @Body() data: UpdateStudentDto) {
    return this.adminService.updateStudent(id, data);
  }

  @Delete('students/:id')
  async deleteStudent(@Param('id') id: string) {
    return this.adminService.deleteStudent(id);
  }

  // Teacher Management
  @Get('teachers')
  async findAllTeachers() {
    return this.adminService.findAllTeachers();
  }

  @Post('teachers')
  async createTeacher(@Body() data: CreateTeacherDto) {
    return this.adminService.createTeacher(data);
  }

  @Patch('teachers/:id')
  async updateTeacher(@Param('id') id: string, @Body() data: UpdateTeacherDto) {
    return this.adminService.updateTeacher(id, data);
  }

  @Delete('teachers/:id')
  async deleteTeacher(@Param('id') id: string) {
    return this.adminService.deleteTeacher(id);
  }

  // Classroom Management
  @Get('classrooms')
  async findAllClassrooms() {
    return this.adminService.findAllClassrooms();
  }

  @Post('classrooms')
  async createClassroom(@Body() data: CreateClassroomDto) {
    return this.adminService.createClassroom(data);
  }

  @Patch('classrooms/:id')
  async updateClassroom(
    @Param('id') id: string,
    @Body() data: UpdateClassroomDto,
  ) {
    return this.adminService.updateClassroom(id, data);
  }

  @Delete('classrooms/:id')
  async deleteClassroom(@Param('id') id: string) {
    return this.adminService.deleteClassroom(id);
  }

  // System Settings
  @Get('settings')
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  async updateSettings(@Body() data: UpdateSettingsDto) {
    return this.adminService.updateSettings(data);
  }

  @Get('semester-summary')
  async getSemesterSummary(@Query('classroomId') classroomId?: string) {
    return this.adminService.getSemesterSummary(classroomId);
  }
}

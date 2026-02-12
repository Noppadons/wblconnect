import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SchoolService } from './school.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('school')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Get('info')
  async getSchoolInfo() {
    return this.schoolService.getSchoolInfo();
  }

  @Get('academic-years')
  async getAcademicYears() {
    return this.schoolService.getAcademicYears();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-classrooms')
  async getMyClassrooms(@Req() req: any) {
    return this.schoolService.getTeacherClassrooms(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('classrooms')
  async getClassrooms(@Query('semesterId') semesterId: string) {
    return this.schoolService.getClassrooms(semesterId);
  }

  @Get('grade-levels')
  async getGradeLevels() {
    return this.schoolService.getGradeLevels();
  }

  @Get('subjects')
  async getSubjects() {
    return this.schoolService.getSubjects();
  }

  @Post('subjects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createSubject(@Body() body: any) {
    return this.schoolService.createSubject(body);
  }

  @Patch('subjects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateSubject(@Param('id') id: string, @Body() body: any) {
    return this.schoolService.updateSubject(id, body);
  }

  @Delete('subjects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteSubject(@Param('id') id: string) {
    return this.schoolService.deleteSubject(id);
  }

  // Learning Materials
  @Get('materials')
  @UseGuards(JwtAuthGuard)
  async getMaterials(@Query('subjectId') subjectId: string) {
    return this.schoolService.getLearningMaterials(subjectId);
  }

  @Post('materials')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  async createMaterial(@Req() req: any, @Body() body: any) {
    // Find teacher profile if not ADMIN
    let teacherId = body.teacherId;
    if (req.user.role === Role.TEACHER) {
      const teacher = await this.schoolService['prisma'].teacher.findUnique({
        where: { userId: req.user.id },
      });
      if (teacher) teacherId = teacher.id;
    }

    return this.schoolService.createLearningMaterial({
      ...body,
      teacherId,
    });
  }

  @Delete('materials/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  async deleteMaterial(@Param('id') id: string) {
    return this.schoolService.deleteLearningMaterial(id);
  }
}

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
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SchoolService } from './school.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('school')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) { }

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
    if (req.user.role === Role.ADMIN) {
      return this.schoolService.createLearningMaterial(body);
    }

    // TEACHER logic: Verify they teach the subject
    const teacher = await this.schoolService['prisma'].teacher.findUnique({
      where: { userId: req.user.id },
      include: {
        subjects: { where: { id: body.subjectId } },
      },
    });

    if (!teacher) throw new ForbiddenException('ไม่พบข้อมูลโปรไฟล์ครู');
    if (teacher.subjects.length === 0) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์เพิ่มสื่อการสอนในวิชานี้');
    }

    return this.schoolService.createLearningMaterial({
      ...body,
      teacherId: teacher.id,
    });
  }

  @Delete('materials/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  async deleteMaterial(@Req() req: any, @Param('id') id: string) {
    if (req.user.role === Role.ADMIN) {
      return this.schoolService.deleteLearningMaterial(id);
    }

    const material = await this.schoolService['prisma'].learningMaterial.findUnique({
      where: { id },
      include: { teacher: true },
    });

    if (!material) throw new NotFoundException('ไม่พบสื่อการสอน');
    if (material.teacher.userId !== req.user.id) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์ลบสื่อการสอนของผู้อื่น');
    }

    return this.schoolService.deleteLearningMaterial(id);
  }
}

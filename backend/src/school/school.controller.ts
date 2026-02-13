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
import { CreateSubjectDto, UpdateSubjectDto, CreateMaterialDto } from './dto/school.dto';

@Controller('school')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) { }

  @Get('student-materials')
  @UseGuards(JwtAuthGuard)
  async getStudentMaterials(@Req() req: any) {
    return this.schoolService.getStudentMaterials(req.user.id);
  }

  @Get('info')
  @UseGuards(JwtAuthGuard)
  async getSchoolInfo() {
    return this.schoolService.getSchoolInfo();
  }

  @Get('academic-years')
  @UseGuards(JwtAuthGuard)
  async getAcademicYears() {
    return this.schoolService.getAcademicYears();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-classrooms')
  async getMyClassrooms(@Req() req: any) {
    return this.schoolService.getTeacherClassrooms(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-classrooms/categorized')
  async getMyClassroomsCategorized(@Req() req: any) {
    return this.schoolService.getTeacherClassroomsCategorized(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('all-classrooms')
  async getAllClassrooms() {
    return this.schoolService.getAllClassrooms();
  }

  @UseGuards(JwtAuthGuard)
  @Get('classrooms')
  async getClassrooms(@Query('semesterId') semesterId: string) {
    return this.schoolService.getClassrooms(semesterId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('classrooms/students')
  async getStudentsByClassrooms(
    @Req() req: any,
    @Query('classroomIds') classroomIds: string,
  ) {
    const ids = classroomIds ? classroomIds.split(',') : [];
    return this.schoolService.getStudentsByClassrooms(req.user.id, ids);
  }

  @Get('grade-levels')
  @UseGuards(JwtAuthGuard)
  async getGradeLevels() {
    return this.schoolService.getGradeLevels();
  }

  @Get('subjects')
  @UseGuards(JwtAuthGuard)
  async getSubjects() {
    return this.schoolService.getSubjects();
  }

  @Post('subjects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createSubject(@Body() body: CreateSubjectDto) {
    return this.schoolService.createSubject(body);
  }

  @Patch('subjects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateSubject(@Param('id') id: string, @Body() body: UpdateSubjectDto) {
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
  async createMaterial(@Req() req: any, @Body() body: CreateMaterialDto) {
    if (req.user.role === Role.ADMIN) {
      return this.schoolService.createLearningMaterial(body);
    }

    // TEACHER logic: Verify they teach the subject
    return this.schoolService.createLearningMaterialAsTeacher(req.user.id, body);
  }

  @Delete('materials/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  async deleteMaterial(@Req() req: any, @Param('id') id: string) {
    if (req.user.role === Role.ADMIN) {
      return this.schoolService.deleteLearningMaterial(id);
    }

    return this.schoolService.deleteLearningMaterialAsTeacher(req.user.id, id);
  }
}

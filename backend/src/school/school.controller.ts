import { Controller, Get, Post, Patch, Body, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
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
}

import { Controller, Post, Body, Get, Param, UseGuards, Patch, Request } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CreateAssignmentDto, SubmitAssignmentDto, GradeSubmissionDto, BulkGradeItemDto } from './dto/create-assignment.dto';

@Controller('assessment')
@UseGuards(JwtAuthGuard)
export class AssessmentController {
    constructor(private readonly assessmentService: AssessmentService) { }

    @Roles(Role.TEACHER, Role.ADMIN)
    @UseGuards(RolesGuard)
    @Post('assignment')
    async createAssignment(@Body() data: CreateAssignmentDto) {
        return this.assessmentService.createAssignment(data);
    }

    @Roles(Role.STUDENT)
    @UseGuards(RolesGuard)
    @Post('submit')
    async submitAssignment(@Body() data: SubmitAssignmentDto) {
        return this.assessmentService.submitAssignment(data);
    }

    @Roles(Role.TEACHER, Role.ADMIN)
    @UseGuards(RolesGuard)
    @Patch('grade/:id')
    async gradeSubmission(@Param('id') id: string, @Body() data: GradeSubmissionDto) {
        return this.assessmentService.gradeSubmission(id, data.points, data.feedback);
    }

    @Roles(Role.TEACHER, Role.ADMIN)
    @UseGuards(RolesGuard)
    @Get('performance/:studentId')
    async getPerformance(@Param('studentId') studentId: string) {
        return this.assessmentService.getStudentPerformance(studentId);
    }

    @Roles(Role.TEACHER, Role.ADMIN)
    @UseGuards(RolesGuard)
    @Get('classroom/:id')
    async getAssignments(@Param('id') id: string) {
        return this.assessmentService.getAssignmentsByClassroom(id);
    }

    @Roles(Role.TEACHER, Role.ADMIN)
    @UseGuards(RolesGuard)
    @Get('gradebook/:id')
    async getGradebook(@Param('id') id: string) {
        return this.assessmentService.getAssignmentGradebook(id);
    }

    @Roles(Role.TEACHER, Role.ADMIN)
    @UseGuards(RolesGuard)
    @Post('bulk-grade/:id')
    async bulkGrade(@Param('id') id: string, @Body() body: any) {
        // Handle both: [ {...} ] AND { grades: [ {...} ] }
        const grades = Array.isArray(body) ? body : (body.grades || []);
        return this.assessmentService.bulkUpdateGrades(id, grades);
    }

    @Roles(Role.TEACHER, Role.ADMIN)
    @UseGuards(RolesGuard)
    @Get('early-warning')
    async getEarlyWarning() {
        return this.assessmentService.getEarlyWarningStudents();
    }

    @Roles(Role.STUDENT)
    @UseGuards(RolesGuard)
    @Get('my-assignments')
    async getMyAssignments(@Request() req: any) {
        return this.assessmentService.getMyAssignments(req.user.id);
    }
}

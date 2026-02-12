import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('students')
export class StudentsController {
    constructor(private readonly studentsService: StudentsService) { }

    @UseGuards(JwtAuthGuard)
    @Get('profile/:id')
    async getProfile(@Param('id') id: string) {
        return this.studentsService.getStudentProfile(id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('my-profile')
    async getMyProfile(@Request() req) {
        return this.studentsService.getStudentProfileByUserId(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('stats/:id')
    async getStats(@Param('id') id: string) {
        return this.studentsService.getAttendanceStats(id);
    }
}

import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) { }

  @UseGuards(JwtAuthGuard)
  @Get('profile/:id')
  async getProfile(@Req() req: any, @Param('id') id: string) {
    return this.studentsService.getStudentProfile(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-profile')
  async getMyProfile(@Req() req: any) {
    return this.studentsService.getStudentProfileByUserId(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats/:id')
  async getStats(@Req() req: any, @Param('id') id: string) {
    return this.studentsService.getAttendanceStats(req.user.id, id);
  }
}

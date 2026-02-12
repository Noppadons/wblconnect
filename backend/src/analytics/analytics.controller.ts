import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get('student/:id')
  async getStudentInsights(@Req() req: any, @Param('id') id: string) {
    return this.analyticsService.getStudentAiInsights(req.user.id, id);
  }

  @Roles(Role.TEACHER, Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get('early-warning')
  async getEarlyWarning(@Req() req: any) {
    return this.analyticsService.getEarlyWarning(req.user.id);
  }
}

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
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
    async getStudentInsights(@Param('id') id: string) {
        return this.analyticsService.getStudentAiInsights(id);
    }

    @Roles(Role.TEACHER, Role.ADMIN)
    @UseGuards(RolesGuard)
    @Get('early-warning')
    async getEarlyWarning() {
        // This could be an enhanced version of the one in AssessmentService
        // but for now, we'll keep it simple or integrate it.
        return { message: 'AI Enhanced Early Warning coming soon' };
    }
}

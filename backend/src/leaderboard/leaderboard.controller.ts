import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CacheTTL } from '../common/interceptors/cache-control.interceptor';

@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('attendance')
  @CacheTTL(60)
  getAttendanceLeaderboard(
    @Query('classroomId') classroomId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.leaderboardService.getAttendanceLeaderboard(
      classroomId,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('behavior')
  @CacheTTL(60)
  getBehaviorLeaderboard(
    @Query('classroomId') classroomId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.leaderboardService.getBehaviorLeaderboard(
      classroomId,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('gpa')
  @CacheTTL(60)
  getGpaLeaderboard(
    @Query('classroomId') classroomId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.leaderboardService.getGpaLeaderboard(
      classroomId,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('submissions')
  @CacheTTL(60)
  getSubmissionLeaderboard(
    @Query('classroomId') classroomId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.leaderboardService.getSubmissionLeaderboard(
      classroomId,
      limit ? parseInt(limit) : 10,
    );
  }
}

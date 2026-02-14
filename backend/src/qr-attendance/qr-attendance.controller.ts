import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { QRAttendanceService } from './qr-attendance.service';
import { CreateQRSessionDto } from './dto/create-qr-session.dto';
import { ScanQRDto } from './dto/scan-qr.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('qr-attendance')
@UseGuards(JwtAuthGuard)
export class QRAttendanceController {
  constructor(private readonly qrService: QRAttendanceService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @Post('session')
  createSession(@Req() req: any, @Body() dto: CreateQRSessionDto) {
    return this.qrService.createSession(req.user.id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT)
  @Post('scan')
  scanCode(@Req() req: any, @Body() dto: ScanQRDto) {
    return this.qrService.scanCode(req.user.id, dto.code);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @Get('sessions')
  getActiveSessions(@Req() req: any) {
    return this.qrService.getActiveSessions(req.user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @Put('session/:id/deactivate')
  deactivateSession(@Param('id') id: string, @Req() req: any) {
    return this.qrService.deactivateSession(id, req.user.id);
  }
}

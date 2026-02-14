import { Module } from '@nestjs/common';
import { QRAttendanceService } from './qr-attendance.service';
import { QRAttendanceController } from './qr-attendance.controller';

@Module({
  controllers: [QRAttendanceController],
  providers: [QRAttendanceService],
})
export class QRAttendanceModule {}

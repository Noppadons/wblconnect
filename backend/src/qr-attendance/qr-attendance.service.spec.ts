import { Test, TestingModule } from '@nestjs/testing';
import { QRAttendanceService } from './qr-attendance.service';
import { PrismaService } from '../prisma/prisma.service';

describe('QRAttendanceService', () => {
  let service: QRAttendanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QRAttendanceService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<QRAttendanceService>(QRAttendanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

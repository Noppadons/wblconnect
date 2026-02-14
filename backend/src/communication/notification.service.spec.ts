import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { LineService } from './line.service';
import { NotificationGateway } from './notification.gateway';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: {} },
        { provide: LineService, useValue: {} },
        {
          provide: NotificationGateway,
          useValue: {
            broadcastNotification: jest.fn(),
            sendToClassroom: jest.fn(),
            sendToUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

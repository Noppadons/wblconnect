import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

const mockPrisma = {
  $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
};

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getHello should return Hello World!', () => {
    expect(service.getHello()).toBe('Hello World!');
  });

  it('getHealth should return health status', async () => {
    const result = await service.getHealth();
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('services');
    expect(result.services.database.status).toBe('ok');
  });

  it('getHealth should return degraded when DB fails', async () => {
    mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('DB down'));
    const result = await service.getHealth();
    expect(result.status).toBe('degraded');
    expect(result.services.database.status).toBe('error');
  });
});

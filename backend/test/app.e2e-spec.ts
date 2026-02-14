import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

const mockPrisma = {
  $queryRaw: jest.fn().mockResolvedValue([{ '1': 1 }]),
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  },
  student: { count: jest.fn().mockResolvedValue(0) },
  teacher: { count: jest.fn().mockResolvedValue(0) },
  classroom: { count: jest.fn().mockResolvedValue(0) },
  attendance: { count: jest.fn().mockResolvedValue(0) },
  notification: { findMany: jest.fn().mockResolvedValue([]) },
  school: { findFirst: jest.fn().mockResolvedValue(null) },
};

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
      prefix: 'v',
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ============================================================
  // Health Check (version-neutral via /api/v1/)
  // ============================================================
  describe('GET /api/v1/health', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('memory');
        });
    });
  });

  // ============================================================
  // Root endpoint
  // ============================================================
  describe('GET /api/v1', () => {
    it('should return Hello World', () => {
      return request(app.getHttpServer())
        .get('/api/v1')
        .expect(200)
        .expect('Hello World!');
    });
  });

  // ============================================================
  // Auth - Login
  // ============================================================
  describe('POST /api/v1/auth/login', () => {
    it('should reject empty body with 400', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);
    });

    it('should reject invalid credentials', () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'wrong@test.com', password: 'wrong' })
        .expect(401);
    });
  });

  // ============================================================
  // Protected routes - should require auth
  // ============================================================
  describe('Protected routes', () => {
    it('GET /api/v1/auth/profile should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(401);
    });

    it('GET /api/v1/admin/stats should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/stats')
        .expect(401);
    });

    it('GET /api/v1/teacher/stats should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/teacher/stats')
        .expect(401);
    });

    it('GET /api/v1/leave should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/leave')
        .expect(401);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { SurveyService } from './survey.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SurveyService', () => {
  let service: SurveyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SurveyService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<SurveyService>(SurveyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

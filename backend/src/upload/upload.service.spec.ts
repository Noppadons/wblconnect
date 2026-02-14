import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'http://test.com/file' } }),
      }),
    },
  }),
}));

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadService],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

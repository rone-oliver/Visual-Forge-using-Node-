import { Test, TestingModule } from '@nestjs/testing';
import { AdminsAuthService } from './admins-auth.service';

describe('AdminsAuthService', () => {
  let service: AdminsAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminsAuthService],
    }).compile();

    service = module.get<AdminsAuthService>(AdminsAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

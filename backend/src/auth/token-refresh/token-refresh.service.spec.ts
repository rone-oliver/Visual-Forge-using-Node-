import { Test, TestingModule } from '@nestjs/testing';

import { TokenRefreshService } from './token-refresh.service';

describe('TokenRefreshService', () => {
  let service: TokenRefreshService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenRefreshService],
    }).compile();

    service = module.get<TokenRefreshService>(TokenRefreshService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

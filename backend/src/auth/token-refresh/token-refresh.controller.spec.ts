import { Test, TestingModule } from '@nestjs/testing';
import { TokenRefreshController } from './token-refresh.controller';

describe('TokenRefreshController', () => {
  let controller: TokenRefreshController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokenRefreshController],
    }).compile();

    controller = module.get<TokenRefreshController>(TokenRefreshController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

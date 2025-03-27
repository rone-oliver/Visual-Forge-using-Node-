import { Test, TestingModule } from '@nestjs/testing';
import { UsersAuthController } from './users-auth.controller';

describe('UsersAuthController', () => {
  let controller: UsersAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersAuthController],
    }).compile();

    controller = module.get<UsersAuthController>(UsersAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

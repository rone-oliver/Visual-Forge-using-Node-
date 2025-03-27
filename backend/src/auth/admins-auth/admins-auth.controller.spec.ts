import { Test, TestingModule } from '@nestjs/testing';
import { AdminsAuthController } from './admins-auth.controller';

describe('AdminsAuthController', () => {
  let controller: AdminsAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminsAuthController],
    }).compile();

    controller = module.get<AdminsAuthController>(AdminsAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

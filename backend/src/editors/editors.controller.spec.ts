import { Test, TestingModule } from '@nestjs/testing';
import { EditorsController } from './editors.controller';

describe('EditorsController', () => {
  let controller: EditorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EditorsController],
    }).compile();

    controller = module.get<EditorsController>(EditorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

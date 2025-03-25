import { Test, TestingModule } from '@nestjs/testing';
import { EditorsService } from './editors.service';

describe('EditorsService', () => {
  let service: EditorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EditorsService],
    }).compile();

    service = module.get<EditorsService>(EditorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

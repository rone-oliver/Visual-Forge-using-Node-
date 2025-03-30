// backend/src/auth/guards/auth.guard.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { Reflector } from '@nestjs/core';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: Reflector,
          useValue: {},
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
});
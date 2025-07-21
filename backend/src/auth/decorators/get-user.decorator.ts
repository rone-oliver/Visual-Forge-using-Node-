import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface UserInfo {
  userId: string;
  role: string;
}

export const GetUser = createParamDecorator(
  (data: keyof UserInfo | undefined, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();

    if (!request.user) {
      return null;
    }
    if (data) {
      return request.user[data];
    }
    return request.user;
  },
);

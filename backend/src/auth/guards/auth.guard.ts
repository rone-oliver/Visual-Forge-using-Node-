import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const payload = request.jwt;
    // if(!refreshToken){
    //   return false;
    // }

    if(!payload){
      return false;
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }

    return true;
  }
}

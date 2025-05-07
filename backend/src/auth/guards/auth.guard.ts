import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly userService: UsersService,
  ){};
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }
    if(user.role !== 'Admin'){
      const userDetails = await this.userService.findOne({ _id: user.userId });
      if (userDetails && userDetails.isBlocked) {
        this.logger.warn(`User ${user.userId} is blocked.`);
        throw new HttpException({
          statusCode: HttpStatus.FORBIDDEN,
          isBlocked: true,
          message: 'User account is blocked',
          errorCode: 'USER_ACCOUNT_BLOCKED',
        }, HttpStatus.FORBIDDEN,);
      }
    }
    return true;
  }
}

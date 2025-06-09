import { CanActivate, ExecutionContext, HttpException, HttpStatus, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { IUsersService, IUsersServiceToken } from 'src/users/interfaces/users.service.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    @Inject(IUsersServiceToken)private readonly userService: IUsersService,
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
      }else if(!userDetails){
        this.logger.error(`Doesn't find the user with _id: ${user.userId}`)
      }
    }
    return true;
  }
}

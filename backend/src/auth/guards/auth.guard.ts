import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import {
  IUsersService,
  IUsersServiceToken,
} from 'src/users/interfaces/services/users.service.interface';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(IUsersServiceToken) private readonly userService: IUsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const contextType = context.getType();

    if (contextType === 'http') {
      const isPublic = this.reflector.getAllAndOverride<boolean>(
        IS_PUBLIC_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (isPublic) {
        return true;
      }

      const request = context.switchToHttp().getRequest();
      const user = request.user;
      if (!user) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (user.role !== 'Admin') {
        const userDetails = await this.userService.findOne({
          _id: user.userId,
        });
        if (userDetails && userDetails.isBlocked) {
          this.logger.warn(`User ${user.userId} is blocked.`);
          throw new HttpException(
            {
              statusCode: HttpStatus.FORBIDDEN,
              isBlocked: true,
              message: 'User account is blocked',
              errorCode: 'USER_ACCOUNT_BLOCKED',
            },
            HttpStatus.FORBIDDEN,
          );
        } else if (!userDetails) {
          this.logger.error(`Doesn't find the user with _id: ${user.userId}`);
        }
      }
      console.log('AuthGuard canActivate http:', context.getType());
      return true;
    }

    if (contextType === 'ws') {
      this.logger.log('AuthGuard running for WebSocket connection...');
      try {
        const client: Socket = context.switchToWs().getClient<Socket>();
        const authToken = client.handshake.auth.token?.split(' ')[1];

        if (!authToken) {
          this.logger.warn(
            `WS Auth: No token provided for client ${client.id}. Disconnecting.`,
          );
          client.disconnect();
          return false;
        }

        const payload = await this.jwtService.verifyAsync(authToken, {
          secret: this.configService.get<string>('JWT_SECRET'),
        });

        client['user'] = { userId: payload.userId, role: payload.role };
        this.logger.log(
          `WS Auth: Client ${client.id} authenticated as user ${payload.userId}`,
        );
        this.logger.log('AuthGuard canActivate ws:', context.getType());
        return true;
      } catch (error) {
        this.logger.error('WS Authentication Error:', error.message);
        context.switchToWs().getClient<Socket>().disconnect();
        return false;
      }
    }

    return false;
  }
}

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
import { RedisService } from 'src/common/redis/redis.service';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly _logger = new Logger(AuthGuard.name);

  constructor(
    private readonly _reflector: Reflector,
    @Inject(IUsersServiceToken)
    private readonly _userService: IUsersService,
    private readonly _jwtService: JwtService,
    private readonly _configService: ConfigService,
    private readonly _redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const contextType = context.getType();

    if (contextType === 'http') {
      const isPublic = this._reflector.getAllAndOverride<boolean>(
        IS_PUBLIC_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (isPublic) {
        return true;
      }

      const request = context.switchToHttp().getRequest();

      const token = this._extractTokenFromHeader(request);
      if (!token) {
        throw new UnauthorizedException('Token not found');
      }

      const isBlacklisted = await this._redisService.client.exists(
        `blacklist:${token}`,
      );
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
      
      const user = request.user;
      if (!user) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (user.role !== 'Admin') {
        const userDetails = await this._userService.findOne({
          _id: user.userId,
        });
        if (userDetails && userDetails.isBlocked) {
          this._logger.warn(`User ${user.userId} is blocked.`);
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
          this._logger.error(`Doesn't find the user with _id: ${user.userId}`);
        }
      }
      console.log('AuthGuard canActivate http:', context.getType());
      return true;
    }

    if (contextType === 'ws') {
      this._logger.log('AuthGuard running for WebSocket connection...');
      try {
        const client: Socket = context.switchToWs().getClient<Socket>();
        const authToken = client.handshake.auth.token?.split(' ')[1];

        if (!authToken) {
          this._logger.warn(
            `WS Auth: No token provided for client ${client.id}. Disconnecting.`,
          );
          client.disconnect();
          return false;
        }

        const isBlacklisted = await this._redisService.client.exists(
          `blacklist:${authToken}`,
        );
        if (isBlacklisted) {
          this._logger.warn(
            `WS Auth: Client ${client.id} attempted to use a blacklisted token. Disconnecting.`,
          );
          client.disconnect();
          return false;
        }

        const payload = await this._jwtService.verifyAsync(authToken, {
          secret: this._configService.get<string>('JWT_SECRET'),
        });

        client['user'] = { userId: payload.userId, role: payload.role };
        this._logger.log(
          `WS Auth: Client ${client.id} authenticated as user ${payload.userId}`,
        );
        this._logger.log('AuthGuard canActivate ws:', context.getType());
        return true;
      } catch (error) {
        this._logger.error('WS Authentication Error:', error.message);
        context.switchToWs().getClient<Socket>().disconnect();
        return false;
      }
    }

    return false;
  }

  private _extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

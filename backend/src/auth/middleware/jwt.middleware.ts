import {
  Injectable,
  Logger,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtMiddleware.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.split(' ')[1];

      if (accessToken) {
        try {
          const payload = await this.jwtService.verifyAsync(accessToken, {
            secret: this.configService.get<string>('JWT_SECRET'),
          });
          req['user'] = { userId: payload.userId, role: payload.role };
          next();
        } catch (error) {
          this.logger.error(
            `Token verification failed: ${error.name}`,
            error.message,
          );
          if (error.name === 'TokenExpiredError') {
            throw new UnauthorizedException({
              message: 'Token has expired',
              isTokenExpired: true,
            });
          }
          throw new UnauthorizedException({
            message: 'Invalid token',
            isTokenExpired: false,
          });
        }
      } else {
        throw new UnauthorizedException({
          message: 'Access token not provided',
          isTokenExpired: false,
        });
      }
    } else {
      throw new UnauthorizedException({
        message: 'Authorization header not found or invalid format',
        isTokenExpired: false,
      });
    }
  }
}

import { HttpException, Injectable, Logger, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtMiddleware.name);

  constructor(
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
      const authHeader = req.headers.authorization;
      console.log('Authorization header:', req.headers.authorization);

      if (authHeader && authHeader.startsWith('Bearer ')) {
          const accessToken = authHeader.split(' ')[1];

          if (accessToken) {
              try {
                  const payload = await this.jwtService.verifyAsync(accessToken, {
                      secret: this.configService.get<string>('JWT_SECRET'),
                  });
                  // Attach the user information to the request object
                  req['user'] = { userId: payload.userId, role: payload.role,};
                  next();
              } catch (error) {
                  this.logger.error('Invalid accessToken:', error.message);
                  throw new UnauthorizedException('Invalid access token');
              }
          } else {
              throw new UnauthorizedException('Access token not provided');
          }
      } else {
          throw new UnauthorizedException('Authorization header not found or invalid format');
      }
  }
}
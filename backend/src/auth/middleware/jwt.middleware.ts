import { HttpException, Injectable, Logger, NestMiddleware } from '@nestjs/common';
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

  use(req: Request, res: Response, next: NextFunction) {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      try {
        const payload = this.jwtService.verify(refreshToken, {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET')
        });
        req['jwt'] = payload;
      } catch (error) {
        this.logger.error('Invalid refreshToken:', error.message);
        res.clearCookie('refreshToken');
        req['jwtError'] = true;
        throw new HttpException(`Couldn't verify the refresh token`, 401);
      }
    }

    next();
  }
}
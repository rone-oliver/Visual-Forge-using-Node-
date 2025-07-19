import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ITokenRefreshService } from './interfaces/tokenRefresh-service.interface';

@Injectable()
export class TokenRefreshService implements ITokenRefreshService {
    private readonly _logger = new Logger(TokenRefreshService.name);

    constructor(
        private readonly _jwtService: JwtService,
        private readonly _configService: ConfigService
    ) {};

    async refreshAccessToken(refreshToken: string): Promise<{accessToken: string}> {
        try {
            const payload = this._jwtService.verify(refreshToken, {
                secret: this._configService.get<string>('JWT_SECRET')
            })
            const accessToken = this._jwtService.sign(
                {
                    userId: payload.userId,
                    username: payload.username,
                    email: payload.email,
                    role: payload.role
                },
                {
                    secret: this._configService.get<string>('JWT_SECRET'),
                    expiresIn: this._configService.get<string>('ACCESS_TOKEN_EXPIRATION')
                }
            )
            this._logger.log('refresh Access Token called: ', accessToken);
            return {accessToken};
        } catch (error) {
            throw new HttpException('Invalid refresh token', 401);
        }
    }

    async verifyRefreshToken(refreshToken: string): Promise<void> {
        try {
            await this._jwtService.verifyAsync(refreshToken, {
                secret: this._configService.get<string>('JWT_SECRET')
            });
        } catch (error) {
            throw new HttpException('Invalid refresh token', 401);
        }
    }
}

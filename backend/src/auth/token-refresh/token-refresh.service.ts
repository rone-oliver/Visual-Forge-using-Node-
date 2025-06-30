import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ITokenRefreshService } from './interfaces/tokenRefresh-service.interface';

@Injectable()
export class TokenRefreshService implements ITokenRefreshService {
    private readonly logger = new Logger(TokenRefreshService.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) {};

    async refreshAccessToken(refreshToken: string): Promise<{accessToken: string}> {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('JWT_SECRET')
            })
            const accessToken = this.jwtService.sign(
                {
                    userId: payload.userId,
                    username: payload.username,
                    email: payload.email,
                    role: payload.role
                },
                {
                    secret: this.configService.get<string>('JWT_SECRET'),
                    expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRATION')
                }
            )
            this.logger.log('refresh Access Token called: ', accessToken);
            return {accessToken};
        } catch (error) {
            throw new HttpException('Invalid refresh token', 401);
        }
    }

    async verifyRefreshToken(refreshToken: string): Promise<void> {
        try {
            await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get<string>('JWT_SECRET')
            });
        } catch (error) {
            throw new HttpException('Invalid refresh token', 401);
        }
    }
}

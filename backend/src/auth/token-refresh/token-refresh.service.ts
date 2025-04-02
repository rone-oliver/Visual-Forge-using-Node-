import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenRefreshService {
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
            console.log('refresh Access Token called');
            console.log(accessToken);
            return {accessToken};
        } catch (error) {
            throw new HttpException('Invalid refresh token', 401);
        }
    }

    async verifyRefreshToken(refreshToken: string): Promise<void> {
        try {
            this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('JWT_SECRET')
            });
        } catch (error) {
            throw new HttpException('Invalid refresh token', 401);
        }
    }
}

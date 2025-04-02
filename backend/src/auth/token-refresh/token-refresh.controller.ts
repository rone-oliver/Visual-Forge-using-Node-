import { Controller, Get, HttpException, Post, Req, UseGuards } from '@nestjs/common';
import { TokenRefreshService } from './token-refresh.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class TokenRefreshController {
    constructor(private readonly tokenRefreshService: TokenRefreshService) {};

    @Get('refresh')
    async refreshAccessToken(@Req() req): Promise<{ accessToken: string }> {
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken){
            throw new HttpException('Refresh token not found', 401);
        }
        return await this.tokenRefreshService.refreshAccessToken(refreshToken);
    }

    @Get('check-refreshToken')
    async checkRefreshToken(@Req() req): Promise<{valid: boolean}>{
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return { valid: false };
        }
        try {
            await this.tokenRefreshService.verifyRefreshToken(refreshToken);
            return { valid: true };
        } catch {
            return { valid: false };
        }
    }
}

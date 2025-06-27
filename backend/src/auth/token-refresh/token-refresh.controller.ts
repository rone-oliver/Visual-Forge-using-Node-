import { Controller, Get, HttpException, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TokenRefreshService } from './token-refresh.service';
import { Public } from '../decorators/public.decorator';

@Controller('auth')
export class TokenRefreshController {
    constructor(private readonly tokenRefreshService: TokenRefreshService) {};

    @Public()
    @Get('refresh')
    async refreshAccessToken(@Req() req, @Query('role') role: 'Admin' | 'User'): Promise<{ accessToken: string }> {
        const lowerCaseRole = role.toLowerCase();
        const refreshToken = req.cookies[`${lowerCaseRole}RefreshToken`];
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

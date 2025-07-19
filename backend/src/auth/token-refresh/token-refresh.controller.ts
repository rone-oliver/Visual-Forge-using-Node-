import { Controller, Get, HttpException, Inject, Query, Req } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { ITokenRefreshService, ITokenRefreshServiceToken } from './interfaces/tokenRefresh-service.interface';

@Controller('auth')
export class TokenRefreshController {
    constructor(
        @Inject(ITokenRefreshServiceToken) private readonly _tokenRefreshService: ITokenRefreshService,
    ) {};

    @Public()
    @Get('refresh')
    async refreshAccessToken(@Req() req, @Query('role') role: 'Admin' | 'User'): Promise<{ accessToken: string }> {
        const lowerCaseRole = role.toLowerCase();
        const refreshToken = req.cookies[`${lowerCaseRole}RefreshToken`];
        if(!refreshToken){
            throw new HttpException('Refresh token not found', 401);
        }
        return await this._tokenRefreshService.refreshAccessToken(refreshToken);
    }

    @Get('check-refreshToken')
    async checkRefreshToken(@Req() req): Promise<{valid: boolean}>{
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return { valid: false };
        }
        try {
            await this._tokenRefreshService.verifyRefreshToken(refreshToken);
            return { valid: true };
        } catch {
            return { valid: false };
        }
    }
}

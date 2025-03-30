import { Controller, Body, Post, Get, Res, Req, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AdminsAuthService } from './admins-auth.service';
import { Request, Response } from 'express';
import { adminLoginData } from './interfaces/admin-login.interface';

@Controller('auth/admin')
export class AdminsAuthController {
    private readonly logger = new Logger(AdminsAuthController.name);
    constructor(private adminsAuthService: AdminsAuthService){};

    @Post('login')
    async login(
        @Body() LoginData:adminLoginData,
        @Res({passthrough: true}) response: Response
    ) {
        this.logger.debug('Received login data:', LoginData);
        if (!LoginData) {
            throw new BadRequestException('Request body is empty');
        }
        // this.logger.log(`Login attempt with data: ${JSON.stringify(LoginData)}`);
        return await this.adminsAuthService.login(
            LoginData.username,
            LoginData.password,
            response
        );
    }

    @Get('refresh')
    async refresh(
        @Req() request: Request,
        @Res({ passthrough: true}) response: Response
    ){
        const refreshToken = request.cookies['refreshToken'];
        try {
            const tokens = await this.adminsAuthService.refreshAccessToken(refreshToken);
            this.adminsAuthService.setRefreshTokenCookie(response, tokens.refreshToken);
            return { accessToken: tokens.accessToken};
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    @Post('register')
    async register(@Body() registerData: any) {
      return this.adminsAuthService.register(registerData);
    }
}

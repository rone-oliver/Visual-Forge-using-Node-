import { Controller, Post, Body, Res, Req, Get, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Response, Request } from 'express';
import { UsersAuthService } from './users-auth.service';
import { User } from 'src/users/models/user.schema';

interface VerifyOtpDto{
    email:string;
    otp:string;
}

@Controller('auth/users')
export class UsersAuthController {
    constructor(private usersAuthService: UsersAuthService){};

    @Post('login')
    async login(
        @Body() loginData: Partial<User>,
        @Res({passthrough: true}) response: Response
    ){
        if(loginData.username && loginData.password){
            return await this.usersAuthService.login(
                loginData.username,
                loginData.password,
                response
            );
        }
    }

    @Get('refresh')
    async refresh(
        @Req() request: Request,
        @Res({ passthrough: true}) response: Response
    ){
        const refreshToken = request.cookies['refreshToken'];
        try {
            const tokens = await this.usersAuthService.refreshAccessToken(refreshToken);
            this.usersAuthService.setRefreshTokenCookie(response, tokens.refreshToken);
            return { accessToken: tokens.accessToken};
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    @Post('register')
    async register(
        @Body() userData: User,
        @Res({ passthrough: true}) response: Response
    ){
        return await this.usersAuthService.register(userData,response);
    }

    @Post('verify-otp')
    async verifyOtp(
        @Body() verifyOtpDto: VerifyOtpDto,
    ){
        try {
            const { email, otp} = verifyOtpDto;
            if(!email || !otp){
                throw new BadRequestException('User ID and OTP are required');
            }
            console.log(email, otp);
            const isVerified = await this.usersAuthService.verifyOtp(email,otp);
            if(!isVerified){
                throw new BadRequestException('Invalid OTP');
            }
            return {
                message: 'Email verified successfully',
                verified: true
            }
        } catch (error) {
            throw new UnauthorizedException('Invalid OTP');
        }
    }
}

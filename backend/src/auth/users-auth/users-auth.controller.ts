import { Controller, Post, Body, Res, Req, Get, UnauthorizedException, BadRequestException, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { Response, Request } from 'express';
import { User } from 'src/users/models/user.schema';
import { Public } from '../decorators/public.decorator';
import { IUsersAuthService, IUsersAuthServiceToken } from './interfaces/usersAuth-service.interface';
import { VerifyOtpDto } from './dtos/users-auth.dto';

@Controller('auth/user')
export class UsersAuthController {
    constructor(
        @Inject(IUsersAuthServiceToken) private readonly _usersAuthService: IUsersAuthService,
    ){};

    @Public()
    @Post('login')
    async login(
        @Body() loginData: Partial<User>,
        @Res({passthrough: true}) response: Response
    ){
        if(loginData.username && loginData.password){
            return await this._usersAuthService.login(
                loginData.username,
                loginData.password,
                response
            );
        }
    }

    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(
        @Body() userData: Partial<User>,
    ){
        return await this._usersAuthService.register(userData);
    }

    @Public()
    @Post('resend-otp')
    async resendOtp(@Body() body:{email:string}){
        return await this._usersAuthService.resendOtp(body.email);
    }

    @Public()
    @Post('verify-email')
    async verifyOtp(
        @Body() verifyOtpDto: VerifyOtpDto,
    ){
        try {
            const { email, otp} = verifyOtpDto;
            if(!email || !otp){
                return {
                    success: false,
                    error: {
                      message: 'Email and OTP are required',
                      fieldsMissing: true
                    }
                };
            }
            console.log(email, otp);
            const result = await this._usersAuthService.verifyOtp(email,otp);
            return result;
        } catch (error) {
            return {
                success: false,
                error: {
                  message: 'Verification failed',
                  verificationFailed: true
                }
            };
        }
    }

    @Public()
    @Post('forgot-password')
    async sendPasswordResetOtp(@Body() body:{email:string}){
        return await this._usersAuthService.resendOtp(body.email);
    }

    @Public()
    @Post('verify-reset-otp')
    async verifyPasswordResetOtp(@Body() body:{email:string, otp:string}){
        return await this._usersAuthService.verifyOtp(body.email,body.otp);
    }

    @Public()
    @Post('reset-password')
    async resetPassword(@Body() body:{email:string, newPassword:string}){
        const result = await this._usersAuthService.resetPassword(body.email,body.newPassword);
        return result;
    }
}

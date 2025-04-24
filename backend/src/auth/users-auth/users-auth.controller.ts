import { Controller, Post, Body, Res, Req, Get, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Response, Request } from 'express';
import { UsersAuthService } from './users-auth.service';
import { User } from 'src/users/models/user.schema';

interface VerifyOtpDto{
    email:string;
    otp:string;
}

@Controller('auth/user')
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

    @Post('register')
    async register(
        @Body() userData: User,
        @Res() response: Response
    ){
        return await this.usersAuthService.register(userData,response);
    }

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
            const result = await this.usersAuthService.verifyOtp(email,otp);
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
}

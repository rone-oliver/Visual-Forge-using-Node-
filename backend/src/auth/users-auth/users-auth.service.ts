import { Injectable, UnauthorizedException, Logger, HttpStatus, HttpException, Inject } from '@nestjs/common';
import { User } from 'src/users/models/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp/otp.service';
import { Types } from 'mongoose';
import { IUsersService, IUsersServiceToken } from 'src/users/interfaces/users.service.interface';

@Injectable()
export class UsersAuthService {
    constructor(
        @Inject(IUsersServiceToken) private readonly usersService: IUsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private otpService: OtpService,
    ) { }
    private readonly logger = new Logger(UsersAuthService.name);

    // Helper
    private async generateTokens(user: User, role: 'User' | 'Editor') {
        console.log('user Role: ', role);
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(
                {
                    userId: user._id,
                    // username: user.username,
                    email: user.email,
                    role
                },
                {
                    secret: this.configService.get<string>('JWT_SECRET'),
                    expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRATION')
                },
            ),
            this.jwtService.signAsync(
                {
                    userId: user._id,
                    // username: user.username,
                    email: user.email,
                    role
                },
                {
                    secret: this.configService.get<string>('JWT_SECRET'),
                    expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRATION')
                },
            )
        ]);

        return { accessToken, refreshToken };
    }

    private setCookies(response: Response, refreshToken: string) {
        response.cookie('userRefreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
    }
    setRefreshTokenCookie(response: Response, refreshToken: string) {
        this.setCookies(response, refreshToken);
    }

    async checkPassword(password: string, hashPassword: string): Promise<boolean> {
        return await bcrypt.compare(password, hashPassword)
    }

    async login(username: string, password: string, response: Response) {
        try {
            this.logger.log(`Login attempt for user: ${username}`);
            const user = await this.usersService.findOne({ username });
            if (!user) {
                throw new UnauthorizedException('User not found');
            }
            const isPasswordValid = await this.checkPassword(password, user.password);
            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid password');
            }
            if (user.isBlocked) {
                throw new UnauthorizedException('User is blocked');
            }
            const tokens = await this.generateTokens(user, user.isEditor ? 'Editor' : 'User');
            this.setCookies(response, tokens.refreshToken);
            return { user, accessToken: tokens.accessToken };
        } catch (error) {
            this.logger.error(`Login failed for user ${username}: ${error.message}`);
            throw error;
        }
    }

    async register(userData: User): Promise<any> {
        try {
            this.logger.log('New user registration attempt');

            const existingUserByUsername = await this.usersService.findByUsername(userData.username);
            if (existingUserByUsername) {
                throw new HttpException({
                    success: false,
                    error: {
                        message: 'Username already exists',
                        usernameExists: true,
                        emailExists: false
                    }
                }, HttpStatus.BAD_REQUEST);
            }

            const existingUserByEmail = await this.usersService.findByEmail(userData.email);
            if (existingUserByEmail) {
                throw new HttpException({
                    success: false,
                    error: {
                        message: 'Email already registered',
                        usernameExists: false,
                        emailExists: true
                    }
                }, HttpStatus.BAD_REQUEST);
            }

            const user = await this.usersService.createUser(userData);

            const otp = await this.otpService.createOtp(user.email);
            this.otpService.sendOtpEmail(user.email, otp);
            this.logger.log('OTP Sent for verification');
            return {
                success: true,
                data: {
                    user
                }
            };
        } catch (error) {
            if (error instanceof HttpException) {
                const response = error.getResponse();
                if (response && typeof response === 'object' && 'success' in response) {
                    throw error;
                }
                this.logger.error(response)
                throw new HttpException({
                    success: false,
                    error: response
                }, error.getStatus());
            }

            this.logger.error(`Registration failed for user ${userData.username}: ${error.message}`);
            throw new HttpException({
                success: false,
                error: {
                    message: error.message || 'An unexpected error occurred',
                    usernameExists: false,
                    emailExists: false
                }
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async resendOtp(email: string): Promise<boolean> {
        try {
            const otp = await this.otpService.createOtp(email);
            await this.otpService.sendOtpEmail(email, otp);
            return true;
        } catch (error) {
            this.logger.error(`Failed to resend OTP for email ${email}: ${error.message}`);
            throw new HttpException('Failed to resend OTP', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async verifyOtp(email: string, otp: string): Promise<any> {
        const isValid = await this.otpService.verifyOtp(email, otp);
        if (isValid) {
            await this.usersService.updateOne(
                { email },
                { isVerified: true }
            );
            return {
                success: true,
                message: 'Email verified successfully',
                verified: true
            };
        }
        return {
            success: false,
            error: {
                message: 'Invalid OTP',
                otpInvalid: true
            }
        };
    }

    async resetPassword(email: string, newPassword: string): Promise<boolean> {
        try {
            const user = await this.usersService.findByEmail(email);
            if (!user) throw new Error('User not found');
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const status = await this.usersService.updatePassword(user._id, hashedPassword);
            return status ? true : false
        } catch (error) {
            this.logger.error(`Error resetting password: ${error.message}`);
            throw error;
        }
    }
}

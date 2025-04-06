import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/models/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp/otp.service';
import { Types } from 'mongoose';

@Injectable()
export class UsersAuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private otpService: OtpService,
    ) { }
    private readonly logger = new Logger(UsersAuthService.name);

    // Helper
    private async generateTokens(user: User) {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(
                {
                    userId: user._id,
                    username: user.username,
                    email: user.email,
                    role: 'User'
                },
                {
                    secret: this.configService.get<string>('JWT_SECRET'),
                    expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRATION')
                },
            ),
            this.jwtService.signAsync(
                {
                    userId: user._id,
                    username: user.username,
                    email: user.email,
                    role: 'User'
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
                // return ["User not found"];
            }
            const isPasswordValid = await this.checkPassword(password, user.password);
            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid password');
                // return ["Invalid password"];
            }
            const tokens = await this.generateTokens(user);
            this.setCookies(response, tokens.refreshToken);
            return { user, accessToken: tokens.accessToken };
        } catch (error) {
            this.logger.error(`Login failed for user ${username}: ${error.message}`);
            throw error;
        }
    }
    
    async register(userData: User, response: Response): Promise<User> {
        try {
            this.logger.log('New user registration attempt');
            const user = await this.usersService.createUser(userData);

            const otp = await this.otpService.createOtp(user.email);
            await this.otpService.sendOtpEmail(user.email, otp);
            this.logger.log('OTP Sent for verification');
            return user;
        } catch (error) {
            this.logger.error(`Registration failed for user ${userData.username}: ${error.message}`);
            throw error;
        }
    }
    async verifyOtp(email:string, otp: string): Promise<boolean> {
        const isValid = await this.otpService.verifyOtp(email, otp);
        if (isValid) {
            await this.usersService.updateOne(
                { email },
                { isVerified: true }
            );
        }
        return isValid;
    }
}

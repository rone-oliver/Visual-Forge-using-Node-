import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AdminsService } from 'src/admins/admins.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { Admin } from 'src/admins/models/admin.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminsAuthService {
    constructor(
        private adminsService: AdminsService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { };
    private readonly logger = new Logger(AdminsAuthService.name);
    // Helper
    private async generateTokens(admin: Admin) {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(
                {
                    sub: admin._id,
                    username: admin.username,
                    role: 'Admin'
                },
                { 
                    secret: this.configService.get<string>('JWT_SECRET'),
                    expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRATION') 
                }
            ),
            this.jwtService.signAsync(
                {
                    sub: admin._id,
                    username: admin.username,
                    role: 'Admin'
                },
                { 
                    secret: this.configService.get<string>('JWT_SECRET'),
                    expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRATION')
                }
            )
        ]);

        return { accessToken, refreshToken };
    }

    private setCookies(response: Response, refreshToken: string) {
        response.cookie('refreshToken', refreshToken, {
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
        return await bcrypt.compare(password, hashPassword);
    }

    async login(username: string, password: string, response: Response) {
        try {
            const admin = await this.adminsService.findOne({ username });
            if (!admin) {
                throw new UnauthorizedException('Admin not found');
            }
            const isPasswordValid = await this.checkPassword(password, admin.password);
            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid password');
            }
            const tokens = await this.generateTokens(admin);
            this.setCookies(response, tokens.refreshToken);
            return { admin, accessToken: tokens.accessToken };
        } catch (error) {
            this.logger.error(`Login failed for admin ${username}: ${error.message}`);
            throw error;
        }
    }
    async refreshAccessToken(refreshToken: string) {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken);
            const admin = await this.adminsService.findOne({ _id: payload.sub });

            if (!admin) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const tokens = await this.generateTokens(admin);
            return tokens;
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }
    async register(registerData: any) {
        return this.adminsService.createAdmin(registerData);
    }
}

import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { Admin } from 'src/admins/models/admin.schema';
import { ConfigService } from '@nestjs/config';
import { IAdminsService, IAdminsServiceToken } from 'src/admins/interfaces/admins.service.interface';
import { IAdminsAuthService } from './interfaces/adminsAuth-service.interface';
import { AdminLoginResponseDto } from './dtos/admins-auth.dto';

@Injectable()
export class AdminsAuthService implements IAdminsAuthService {
    constructor(
        @Inject(IAdminsServiceToken) private adminsService: IAdminsService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { };
    private readonly logger = new Logger(AdminsAuthService.name);
    // Helper
    private async generateTokens(admin: Admin) {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(
                {
                    userId: admin._id,
                    username: admin.username,
                    role: 'Admin'
                },
                { 
                    secret: this.configService.get<string>('JWT_SECRET'),
                    expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRATION')
                    // expiresIn: '1m' 
                }
            ),
            this.jwtService.signAsync(
                {
                    userId: admin._id,
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
        response.cookie('adminRefreshToken', refreshToken, {
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

    async login(username: string, password: string, response: Response): Promise<AdminLoginResponseDto> {
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
    async register(registerData: { username: string,password: string }): Promise<Admin> {
        return this.adminsService.createAdmin(registerData);
    }
}

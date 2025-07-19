import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { Admin } from 'src/admins/models/admin.schema';
import { ConfigService } from '@nestjs/config';
import { IAdminsService, IAdminsServiceToken } from 'src/admins/interfaces/admins.service.interface';
import { IAdminsAuthService } from './interfaces/adminsAuth-service.interface';
import { AdminLoginResponseDto } from './dtos/admins-auth.dto';
import { IHashingService, IHashingServiceToken } from 'src/common/hashing/interfaces/hashing.service.interface';

@Injectable()
export class AdminsAuthService implements IAdminsAuthService {
    constructor(
        @Inject(IAdminsServiceToken) private readonly _adminsService: IAdminsService,
        @Inject(IHashingServiceToken) private readonly _hashingService: IHashingService,
        private _jwtService: JwtService,
        private _configService: ConfigService,
    ) { };
    private readonly _logger = new Logger(AdminsAuthService.name);
    // Helper
    private async generateTokens(admin: Admin) {
        const [accessToken, refreshToken] = await Promise.all([
            this._jwtService.signAsync(
                {
                    userId: admin._id,
                    username: admin.username,
                    role: 'Admin'
                },
                { 
                    secret: this._configService.get<string>('JWT_SECRET'),
                    expiresIn: this._configService.get<string>('ACCESS_TOKEN_EXPIRATION')
                }
            ),
            this._jwtService.signAsync(
                {
                    userId: admin._id,
                    username: admin.username,
                    role: 'Admin'
                },
                { 
                    secret: this._configService.get<string>('JWT_SECRET'),
                    expiresIn: this._configService.get<string>('REFRESH_TOKEN_EXPIRATION')
                }
            )
        ]);

        return { accessToken, refreshToken };
    }

    private _setCookies(response: Response, refreshToken: string) {
        response.cookie('adminRefreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
    }
    setRefreshTokenCookie(response: Response, refreshToken: string) {
        this._setCookies(response, refreshToken);
    }

    async checkPassword(password: string, hashPassword: string): Promise<boolean> {
        // return await bcrypt.compare(password, hashPassword);
        return await this._hashingService.compare(password, hashPassword);
    }

    async login(username: string, password: string, response: Response): Promise<AdminLoginResponseDto> {
        try {
            const admin = await this._adminsService.findOne({ username });
            if (!admin) {
                throw new UnauthorizedException('Admin not found');
            }
            const isPasswordValid = await this.checkPassword(password, admin.password);
            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid password');
            }
            const tokens = await this.generateTokens(admin);
            this._setCookies(response, tokens.refreshToken);
            return { admin, accessToken: tokens.accessToken };
        } catch (error) {
            this._logger.error(`Login failed for admin ${username}: ${error.message}`);
            throw error;
        }
    }
    async register(registerData: { username: string,password: string }): Promise<Admin> {
        return this._adminsService.createAdmin(registerData);
    }
}

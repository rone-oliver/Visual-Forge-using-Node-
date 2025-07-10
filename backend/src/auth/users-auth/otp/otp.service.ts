import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as otpGenerator from 'otp-generator';
import { IOtpService } from '../interfaces/otp.service.interface';
import { IOtpRepository, IOtpRepositoryToken } from '../interfaces/otp.repository.interface';

@Injectable()
export class OtpService implements IOtpService {
    private readonly logger = new Logger(OtpService.name);
    constructor(
        @Inject(IOtpRepositoryToken) private readonly otpRepository: IOtpRepository,
    ) {
    }

    async createOtp(email: string): Promise<string> {
        try {
            const otp = this.generateOtp();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            const success = await this.otpRepository.upsert(
                { email },
                {
                    otp,
                    expiresAt,
                    isVerified: false
                }
            );

            if (!success) {
                throw new HttpException('Failed to create OTP', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return otp;
        } catch (error) {
            this.logger.error(`Failed to create OTP for email ${email}: ${error.message}`);
            throw new HttpException('Failed to create OTP', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async verifyOtp(email: string, otp: string): Promise<boolean> {
        return this.otpRepository.findAndUpdate(
            {
                email,
                otp,
                expiresAt: { $gt: new Date() },
                isVerified: false,
            },
            {
                isVerified: true,
            }
        )
    }
    private generateOtp(): string {
        return otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
            lowerCaseAlphabets: false
        });
    }
}

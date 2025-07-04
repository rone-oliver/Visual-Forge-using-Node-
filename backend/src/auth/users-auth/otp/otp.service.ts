import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as otpGenerator from 'otp-generator';
import { IOtpService } from '../interfaces/otp.service.interface';
import { IOtpRepository, IOtpRepositoryToken } from '../interfaces/otp.repository.interface';

@Injectable()
export class OtpService implements IOtpService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(OtpService.name);
    constructor(
        @Inject(IOtpRepositoryToken) private readonly otpRepository: IOtpRepository,
        private configService: ConfigService
    ) {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.configService.get<string>('EMAIL'),
                pass: this.configService.get<string>('EMAIL_APP_PASSWORD')
            }
        })
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
    async sendOtpEmail(email: string, otp: string): Promise<void> {
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Verify Your Email - Visual Forge',
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 40px 20px;
                        font-family: 'Inter', sans-serif;
                        background-color: #ffffff;
                    }

                    .header {
                        text-align: center;
                        margin-bottom: 40px;
                    }

                    .logo {
                        font-size: 24px;
                        font-weight: 600;
                        color: #1a1a1a;
                        margin-bottom: 20px;
                    }

                    .title {
                        font-size: 28px;
                        font-weight: 600;
                        color: #1a1a1a;
                        margin-bottom: 16px;
                    }

                    .description {
                        color: #4b5563;
                        font-size: 16px;
                        line-height: 24px;
                        margin-bottom: 32px;
                    }

                    .otp-container {
                        background-color: #f3f4f6;
                        border-radius: 12px;
                        padding: 24px;
                        text-align: center;
                        margin-bottom: 32px;
                    }

                    .otp-code {
                        font-size: 32px;
                        font-weight: 600;
                        letter-spacing: 8px;
                        color: #1a1a1a;
                    }

                    .expiry {
                        color: #dc2626;
                        font-size: 14px;
                        margin-top: 16px;
                    }

                    .footer {
                        text-align: center;
                        color: #6b7280;
                        font-size: 14px;
                    }

                    @media (max-width: 480px) {
                        .container {
                            padding: 20px;
                        }

                        .title {
                            font-size: 24px;
                        }

                        .otp-code {
                            font-size: 28px;
                            letter-spacing: 6px;
                        }
                    }
                </style>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
                <div class="container">
                    <div class="header">
                        <div class="logo">Visual Forge</div>
                    </div>

                    <div class="title">Verify your email address</div>

                    <p class="description">
                        Thanks for signing up! Please use the verification code below to verify your email address. This code will expire in 10 minutes.
                    </p>

                    <div class="otp-container">
                        <div class="otp-code">${otp}</div>
                        <div class="expiry">Valid for 10 minutes only</div>
                    </div>

                    <p class="description">
                        If you didn't request this email, you can safely ignore it.
                    </p>

                    <div class="footer">
                        &copy; ${new Date().getFullYear()} Visual Forge. All rights reserved.
                    </div>
                </div>
            </body>
            </html>
            `
        }
        await this.transporter.sendMail(mailOptions);
    }
}

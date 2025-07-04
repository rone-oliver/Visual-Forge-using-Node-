export const IOtpServiceToken = Symbol('IOtpService');

export interface IOtpService {
    createOtp(email: string): Promise<string>;
    verifyOtp(email: string, otp: string): Promise<boolean>;
    sendOtpEmail(email: string, otp: string): Promise<void>;
}
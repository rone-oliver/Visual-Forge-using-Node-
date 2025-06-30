import { Response } from "express";
import { User } from "src/users/models/user.schema";

export const IUsersAuthServiceToken = Symbol('IUsersAuthService');

export interface IUsersAuthService {
    login(username: string, password: string, response: Response): Promise<{ user: User; accessToken: string; }>;
    register(userData: User): Promise<{ success: boolean, data: { user: User } }>;
    resendOtp(email: string): Promise<boolean>;
    verifyOtp(email: string, otp: string): Promise<{ success: boolean, error: { message: string, otpInvalid: boolean } }>;
    resetPassword(email: string, newPassword: string): Promise<boolean>;
}
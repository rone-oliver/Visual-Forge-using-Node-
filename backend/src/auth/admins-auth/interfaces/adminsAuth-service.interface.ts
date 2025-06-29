import { Response } from "express";
import { Admin } from "src/admins/models/admin.schema";

export const IAdminsAuthServiceToken = Symbol('IAdminsAuthService');

export interface IAdminsAuthService {
    login(username: string, password: string, response: Response): Promise<{ admin: Admin; accessToken: string }>;
    register(registerData: { username: string, password: string }): Promise<Admin>;
}
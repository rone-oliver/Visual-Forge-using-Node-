import { Response } from "express";
import { Types } from "mongoose";
import { UserType } from "../dtos/common.dto";

export const ICommonServiceToken = Symbol('ICommonService');

export interface ICommonService {
    logoutHandler(response: Response, userType: UserType): Promise<void>;
    updateThemePreference(res: Response, userId: string, isDark: boolean): Promise<void>;
    getThemePreference(res: Response, userId: string): Promise<void>;
    handleGoogleAuth(credential: string, response: Response): Promise<{ accessToken: string; message: string; }>;
}
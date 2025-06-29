import { Response } from "express";
import { Types } from "mongoose";
import { UserType } from "../dtos/common.dto";

export const ICommonServiceToken = Symbol('ICommonService');

export interface ICommonService {
    logoutHandler(response: Response, userType: UserType): Promise<void>;
    updateThemePreference(res: Response, userId: Types.ObjectId, isDark: boolean): Promise<void>;
    getThemePreference(res: Response, userId: Types.ObjectId): Promise<void>;
    handleGoogleAuth(credential: string, response: Response): Promise<{ accessToken: string; message: string; }>;
}
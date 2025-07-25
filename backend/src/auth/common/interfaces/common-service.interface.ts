import { Request, Response } from 'express';

import { UserType } from '../dtos/common.dto';
import { User } from 'src/users/models/user.schema';
import { Role } from 'src/common/enums/role.enum';

export const ICommonServiceToken = Symbol('ICommonService');

export interface ICommonService {
  logoutHandler(req: Request, response: Response, userType: UserType): Promise<void>;
  updateThemePreference(
    res: Response,
    userId: string,
    isDark: boolean,
  ): Promise<void>;
  getThemePreference(res: Response, userId: string): Promise<void>;
  handleGoogleAuth(
    credential: string,
    response: Response,
  ): Promise<{ accessToken: string; message: string }>;
  generateTokens(user: User, role: Role): Promise<{ accessToken: string; refreshToken: string }>;
  setRefreshTokenCookie(
    response: Response,
    refreshToken: string,
    userType: Omit<Role, Role.EDITOR>,
  ): void;
}

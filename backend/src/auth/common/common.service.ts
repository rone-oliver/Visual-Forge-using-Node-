import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { Model, Types } from 'mongoose';
import {
  Preference,
  PreferenceDocument,
} from 'src/common/models/userPreference.schema';
import {
  IUsersService,
  IUsersServiceToken,
} from 'src/users/interfaces/services/users.service.interface';
import { Language, User } from 'src/users/models/user.schema';

import { UserType } from './dtos/common.dto';
import { ICommonService } from './interfaces/common-service.interface';
import { RedisService } from 'src/common/redis/redis.service';
import { IEditorsService, IEditorsServiceToken } from 'src/editors/interfaces/services/editors.service.interface';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class CommonService implements ICommonService {
  private readonly _logger = new Logger(CommonService.name);
  private _googleClient: OAuth2Client;

  constructor(
    @InjectModel(Preference.name)
    private _preferenceModel: Model<PreferenceDocument>,
    private _configService: ConfigService,
    @Inject(IUsersServiceToken)
    private readonly _userService: IUsersService,
    @Inject(IEditorsServiceToken)
    private readonly _editorService: IEditorsService,
    private _jwtService: JwtService,
    private readonly _redisService: RedisService,
  ) {
    this._googleClient = new OAuth2Client(
      this._configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }
  async logoutHandler(req: Request, response: Response, userType: UserType) {
    const tokenName = userType.toLowerCase();
    const cookieName = `${tokenName}RefreshToken`;

    const accessToken = req.headers.authorization?.split(' ')[1];
    const refreshToken = req.cookies[cookieName];

    try {
      if (accessToken) {
        await this._blacklistToken(accessToken);
      }
      if (refreshToken) {
        await this._blacklistToken(refreshToken);
      }

      response.clearCookie(cookieName, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      this._logger.log(`Logout service called, cleared cookie: ${cookieName}`);
      response.status(200).json({ message: 'Successfully logged out' });
    } catch (error) {
      this._logger.error('Logout error:', error);
      response.status(500).json({ message: 'Logout failed' });
    }
  }

  async updateThemePreference(
    res: Response,
    userId: string,
    isDark: boolean,
  ): Promise<void> {
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized or User ID not found' });
      return;
    }

    const theme = isDark ? 'dark' : 'light';
    const existingPreference = await this._preferenceModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (existingPreference) {
      await this._preferenceModel.updateOne(
        { _id: existingPreference._id },
        { $set: { 'preferences.theme': theme } },
      );
      res.status(200).json({ message: 'Theme preference updated' });
    } else {
      this._preferenceModel.create({
        userId: new Types.ObjectId(userId),
        preferences: { theme },
      });
      res.status(201).json({ message: 'Theme preference created' });
    }
  }

  async getThemePreference(res: Response, userId: string): Promise<void> {
    if (!userId) {
      throw new UnauthorizedException('Unauthorized or User ID not found');
    }

    try {
      const preference = await this._preferenceModel.findOne({
        userId: new Types.ObjectId(userId),
      });
      if (
        preference &&
        preference.preferences &&
        preference.preferences.theme
      ) {
        res.status(200).json({
          isDark: preference.preferences.theme === 'dark' ? true : false,
        });
      } else {
        res.status(404).json({ message: 'No theme preference found' });
      }
    } catch (error) {
      res.status(404).json({ message: 'No theme preference found' });
    }
  }

  //for google authentication
  async handleGoogleAuth(
    credential: string,
    res: Response,
  ): Promise<{ accessToken: string; message: string }> {
    try {
      const ticket = await this._googleClient.verifyIdToken({
        idToken: credential,
        audience: this._configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        throw new BadRequestException('Invalid Google Token');
      }

      const {
        email,
        name: fullname,
        email_verified,
        sub: googleId,
        locale,
        picture: profileImage,
      } = payload;
      if (!email_verified) {
        throw new BadRequestException('Email not verified');
      }

      const language = this._convertToLanguageEnum(locale);

      let user: User | null = await this._userService.findByEmail(email);
      if (!user) {
        user = await this._userService.createGoogleUser({
          email,
          fullname,
          googleId,
          language,
          profileImage,
        });
      }

      if (user && !user.googleId) {
        user = await this._userService.updateUserGoogleId(user._id, googleId);
      }
      if (user) {
        const { accessToken, refreshToken } = await this.generateTokens(
          user,
          user.isEditor ? Role.EDITOR : Role.USER,
        );

        this.setRefreshTokenCookie(res, refreshToken, Role.USER);

        return {
          accessToken,
          message: 'Google sign-in successful',
        };
      } else {
        throw new InternalServerErrorException('Unable to sign in via Google');
      }
    } catch (error) {
      throw new BadRequestException('Invalid google Token');
    }
  }

  // Helper function to generate JWT tokens
  async generateTokens(
    user: User,
    role: Role
  ) {
    this._logger.debug('User Role: ', role);

    const payload: JwtPayload = {
      userId: user._id.toHexString(),
      email: user.email,
      role,
    };

    if (role === Role.EDITOR) {
      const editorDetails = await this._editorService.findByUserId(user._id);
      if (editorDetails) {
        payload.isSuspended = editorDetails.isSuspended;
        payload.suspendedUntil = editorDetails.suspendedUntil;
        payload.warningCount = editorDetails.warningCount;
      }
    }

    const [accessToken, refreshToken] = await Promise.all([
      this._jwtService.signAsync(payload, {
        secret: this._configService.get<string>('JWT_SECRET'),
        expiresIn: this._configService.get<string>('ACCESS_TOKEN_EXPIRATION'),
      }),
      this._jwtService.signAsync(payload, {
        secret: this._configService.get<string>('JWT_SECRET'),
        expiresIn: this._configService.get<string>('REFRESH_TOKEN_EXPIRATION'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  setRefreshTokenCookie(
    response: Response,
    refreshToken: string,
    userType: Omit<Role, Role.EDITOR>,
  ) {
    const cookieName = `${userType.toLowerCase()}RefreshToken`;
    const maxAge = this._parseTimeToMs(
      this._configService.getOrThrow<string>('REFRESH_TOKEN_EXPIRATION'),
    );

    response.cookie(cookieName, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
    });
  }

  private _parseTimeToMs(timeString: string): number {
    const unit = timeString.charAt(timeString.length - 1);
    const value = parseInt(timeString.slice(0, -1));

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return value;
    }
  }

  private _convertToLanguageEnum(
    lang: string | undefined,
  ): Language | undefined {
    if (!lang) return undefined;

    const language = lang.split('-')[0].toUpperCase();

    // Mapping enum values
    const languageMap: { [key: string]: Language } = {
      EN: Language.ENGLISH,
      ES: Language.SPANISH,
      FR: Language.FRENCH,
      DE: Language.GERMAN,
      HI: Language.HINDI,
    };

    return languageMap[language] || Language.ENGLISH; // Default to English if not found
  }

  private async _blacklistToken(token: string): Promise<void> {
    try {
      const decoded: JwtPayload = this._jwtService.decode(token);
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          const key = `blacklist:${token}`;
          await this._redisService.client.set(key, 'true', { EX: ttl });
          this._logger.log(`Token blacklisted with TTL: ${ttl}s`);
        }
      }
    } catch (error) {
      this._logger.error(`Failed to blacklist token: ${error.message}`);
    }
  }
}

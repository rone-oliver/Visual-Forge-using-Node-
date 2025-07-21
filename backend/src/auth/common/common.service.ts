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
import { Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { Model, Types } from 'mongoose';
import {
  Preference,
  PreferenceDocument,
} from 'src/common/models/userPreference.schema';
import {
  IUsersService,
  IUsersServiceToken,
} from 'src/users/interfaces/users.service.interface';
import { Language, User } from 'src/users/models/user.schema';

import { UserType } from './dtos/common.dto';
import { ICommonService } from './interfaces/common-service.interface';

@Injectable()
export class CommonService implements ICommonService {
  private googleClient: OAuth2Client;
  private readonly logger = new Logger(CommonService.name);

  constructor(
    @InjectModel(Preference.name)
    private preferenceModel: Model<PreferenceDocument>,
    private configService: ConfigService,
    @Inject(IUsersServiceToken) private readonly userService: IUsersService,
    private jwtService: JwtService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }
  async logoutHandler(response: Response, userType: UserType) {
    const tokenName = userType.toLowerCase();
    const cookieName = `${tokenName}RefreshToken`;
    try {
      response.clearCookie(cookieName, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      this.logger.log(`Logout service called, cleared cookie: ${cookieName}`);
      response.status(200).json({ message: 'Successfully logged out' });
    } catch (error) {
      this.logger.error('Logout error:', error);
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
    const existingPreference = await this.preferenceModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (existingPreference) {
      await this.preferenceModel.updateOne(
        { _id: existingPreference._id },
        { $set: { 'preferences.theme': theme } },
      );
      res.status(200).json({ message: 'Theme preference updated' });
    } else {
      this.preferenceModel.create({
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
      const preference = await this.preferenceModel.findOne({
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

  // Helper function to generate JWT tokens
  private async generateTokens(user: User, role: 'User' | 'Editor') {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          userId: user._id,
          // username: user.username,
          email: user.email,
          role,
        },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRATION'),
        },
      ),
      this.jwtService.signAsync(
        {
          userId: user._id,
          // username: user.username,
          email: user.email,
          role,
        },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRATION'),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private convertToLanguageEnum(
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

  //for google authentication
  async handleGoogleAuth(
    credential: string,
    res: Response,
  ): Promise<{ accessToken: string; message: string }> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
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

      const language = this.convertToLanguageEnum(locale);

      let user: User | null = await this.userService.findByEmail(email);
      if (!user) {
        user = await this.userService.createGoogleUser({
          email,
          fullname,
          googleId,
          language,
          profileImage,
        });
      }

      if (user && !user.googleId) {
        user = await this.userService.updateUserGoogleId(user._id, googleId);
      }
      if (user) {
        const tokens = await this.generateTokens(
          user,
          user.isEditor ? 'Editor' : 'User',
        );

        res.cookie('userRefreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return {
          accessToken: tokens.accessToken,
          message: 'Google sign-in successful',
        };
      } else {
        throw new InternalServerErrorException('Unable to sign in via Google');
      }
    } catch (error) {
      throw new BadRequestException('Invalid google Token');
    }
  }
}

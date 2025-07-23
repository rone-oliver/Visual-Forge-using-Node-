import {
  Injectable,
  UnauthorizedException,
  Logger,
  HttpStatus,
  HttpException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import {
  IHashingService,
  IHashingServiceToken,
} from 'src/common/hashing/interfaces/hashing.service.interface';
import {
  IEditorsService,
  IEditorsServiceToken,
} from 'src/editors/interfaces/services/editors.service.interface';
import { MailService } from 'src/mail/mail.service';
import {
  IUsersService,
  IUsersServiceToken,
} from 'src/users/interfaces/services/users.service.interface';
import { User } from 'src/users/models/user.schema';

import {
  IOtpService,
  IOtpServiceToken,
} from './interfaces/otp.service.interface';
import { IUsersAuthService } from './interfaces/usersAuth-service.interface';

@Injectable()
export class UsersAuthService implements IUsersAuthService {
  constructor(
    @Inject(IUsersServiceToken) private readonly _usersService: IUsersService,
    private _jwtService: JwtService,
    private _configService: ConfigService,
    @Inject(IEditorsServiceToken)
    private readonly _editorService: IEditorsService,
    @Inject(IOtpServiceToken) private readonly _otpService: IOtpService,
    @Inject(IHashingServiceToken)
    private readonly _hashingService: IHashingService,
    private readonly _mailService: MailService,
  ) {}
  private readonly _logger = new Logger(UsersAuthService.name);

  // Helper
  private async _generateTokens(user: User, role: 'User' | 'Editor') {
    this._logger.debug('User Role: ', role);

    let payload: any = {
      userId: user._id,
      email: user.email,
      role,
    };

    if (role === 'Editor') {
      const editorDetails = await this._editorService.findByUserId(user._id);
      if (editorDetails) {
        payload = {
          ...payload,
          isSuspended: editorDetails.isSuspended,
          suspendedUntil: editorDetails.suspendedUntil,
          warningCount: editorDetails.warningCount,
        };
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

  private _setCookies(response: Response, refreshToken: string) {
    response.cookie('userRefreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
  setRefreshTokenCookie(response: Response, refreshToken: string) {
    this._setCookies(response, refreshToken);
  }

  async login(
    username: string,
    password: string,
    response: Response,
  ): Promise<{ user: User; accessToken: string }> {
    try {
      this._logger.log(`Login attempt for user: ${username}`);
      const user = await this._usersService.findOne({ username });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      const isPasswordValid = await this._hashingService.compare(
        password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid password');
      }
      if (user.isBlocked) {
        throw new UnauthorizedException('User is blocked');
      }
      const tokens = await this._generateTokens(
        user,
        user.isEditor ? 'Editor' : 'User',
      );
      this._setCookies(response, tokens.refreshToken);
      return { user, accessToken: tokens.accessToken };
    } catch (error) {
      this._logger.error(`Login failed for user ${username}: ${error.message}`);
      throw error;
    }
  }

  async register(userData: Partial<User>): Promise<any> {
    try {
      this._logger.log('New user registration attempt');

      if (!userData.username) {
        throw new HttpException(
          {
            success: false,
            error: {
              message: 'Username is required',
              usernameExists: false,
              emailExists: false,
            },
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      const existingUserByUsername = await this._usersService.findByUsername(
        userData.username,
      );
      if (existingUserByUsername) {
        throw new HttpException(
          {
            success: false,
            error: {
              message: 'Username already exists',
              usernameExists: true,
              emailExists: false,
            },
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!userData.email) {
        throw new HttpException(
          {
            success: false,
            error: {
              message: 'Email is required',
              usernameExists: false,
              emailExists: false,
            },
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      const existingUserByEmail = await this._usersService.findByEmail(
        userData.email,
      );
      if (existingUserByEmail) {
        throw new HttpException(
          {
            success: false,
            error: {
              message: 'Email already registered',
              usernameExists: false,
              emailExists: true,
            },
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const user = await this._usersService.createUser(userData);

      const otp = await this._otpService.createOtp(user.email);
      this._mailService.sendOtpEmail(user.email, { otp });
      this._logger.log('OTP Sent for verification');
      return {
        success: true,
        data: {
          user,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        const response = error.getResponse();
        if (response && typeof response === 'object' && 'success' in response) {
          throw error;
        }
        this._logger.error(response);
        throw new HttpException(
          {
            success: false,
            error: response,
          },
          error.getStatus(),
        );
      }

      this._logger.error(
        `Registration failed for user ${userData.username}: ${error.message}`,
      );
      throw new HttpException(
        {
          success: false,
          error: {
            message: error.message || 'An unexpected error occurred',
            usernameExists: false,
            emailExists: false,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async resendOtp(email: string): Promise<boolean> {
    try {
      const otp = await this._otpService.createOtp(email);
      await this._mailService.sendOtpEmail(email, { otp });
      return true;
    } catch (error) {
      this._logger.error(
        `Failed to resend OTP for email ${email}: ${error.message}`,
      );
      throw new HttpException(
        'Failed to resend OTP',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifyOtp(email: string, otp: string): Promise<any> {
    const isValid = await this._otpService.verifyOtp(email, otp);
    if (isValid) {
      await this._usersService.updateOne({ email }, { isVerified: true });
      return {
        success: true,
        message: 'Email verified successfully',
        verified: true,
      };
    }
    return {
      success: false,
      error: {
        message: 'Invalid OTP',
        otpInvalid: true,
      },
    };
  }

  async resetPassword(email: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this._usersService.findByEmail(email);
      if (!user) throw new Error('User not found');
      const hashedPassword = await this._hashingService.hash(newPassword);
      const status = await this._usersService.updatePassword(
        user._id,
        hashedPassword,
      );
      return status ? true : false;
    } catch (error) {
      this._logger.error(`Error resetting password: ${error.message}`);
      throw error;
    }
  }
}

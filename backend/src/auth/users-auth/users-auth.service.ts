import {
  Injectable,
  UnauthorizedException,
  Logger,
  HttpStatus,
  HttpException,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import {
  IHashingService,
  IHashingServiceToken,
} from 'src/common/hashing/interfaces/hashing.service.interface';
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
import { ICommonService, ICommonServiceToken } from '../common/interfaces/common-service.interface';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class UsersAuthService implements IUsersAuthService {
  private readonly _logger = new Logger(UsersAuthService.name);

  constructor(
    @Inject(IUsersServiceToken) private readonly _usersService: IUsersService,
    @Inject(IOtpServiceToken) private readonly _otpService: IOtpService,
    @Inject(IHashingServiceToken)
    private readonly _hashingService: IHashingService,
    @Inject(ICommonServiceToken)
    private readonly _commonService: ICommonService,
    private readonly _mailService: MailService,
  ) {}

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
      const { accessToken, refreshToken } = await this._commonService.generateTokens(
        user,
        user.isEditor ? Role.EDITOR : Role.USER,
      );
      this._commonService.setRefreshTokenCookie(response, refreshToken, Role.USER);
      return { user, accessToken };
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

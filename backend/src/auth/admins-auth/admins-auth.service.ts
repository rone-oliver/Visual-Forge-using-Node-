import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  IAdminsService,
  IAdminsServiceToken,
} from 'src/admins/interfaces/admins.service.interface';
import { Admin } from 'src/admins/models/admin.schema';
import {
  IHashingService,
  IHashingServiceToken,
} from 'src/common/hashing/interfaces/hashing.service.interface';

import { AdminLoginResponseDto } from './dtos/admins-auth.dto';
import { IAdminsAuthService } from './interfaces/adminsAuth-service.interface';
import { ICommonService, ICommonServiceToken } from '../common/interfaces/common-service.interface';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class AdminsAuthService implements IAdminsAuthService {
  private readonly _logger = new Logger(AdminsAuthService.name);

  constructor(
    @Inject(IAdminsServiceToken)
    private readonly _adminsService: IAdminsService,
    @Inject(IHashingServiceToken)
    private readonly _hashingService: IHashingService,
    @Inject(ICommonServiceToken)
    private readonly _commonService: ICommonService,
  ) {}

  async checkPassword(
    password: string,
    hashPassword: string,
  ): Promise<boolean> {
    return await this._hashingService.compare(password, hashPassword);
  }

  async login(
    username: string,
    password: string,
    response: Response,
  ): Promise<AdminLoginResponseDto> {
    try {
      const admin = await this._adminsService.findOne({ username });
      if (!admin) {
        throw new UnauthorizedException('Admin not found');
      }
      const isPasswordValid = await this.checkPassword(
        password,
        admin.password,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid password');
      };

      const { accessToken, refreshToken } = await this._commonService.generateTokens(
        admin,
        Role.ADMIN
      );

      this._commonService.setRefreshTokenCookie(
        response,
        refreshToken,
        Role.ADMIN
      );

      return { admin, accessToken };
    } catch (error) {
      this._logger.error(
        `Login failed for admin ${username}: ${error.message}`,
      );
      throw error;
    }
  }

  async register(registerData: {
    username: string;
    password: string;
  }): Promise<Admin> {
    return this._adminsService.createAdmin(registerData);
  }
}

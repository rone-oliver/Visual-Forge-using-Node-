import {
  Controller,
  Body,
  Post,
  Res,
  Logger,
  BadRequestException,
  Inject,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import { Admin } from 'src/admins/models/admin.schema';

import { Public } from '../decorators/public.decorator';

import { AdminLoginDto, AdminLoginResponseDto } from './dtos/admins-auth.dto';
import {
  IAdminsAuthService,
  IAdminsAuthServiceToken,
} from './interfaces/adminsAuth-service.interface';

@Controller('auth/admin')
export class AdminsAuthController {
  private readonly _logger = new Logger(AdminsAuthController.name);
  constructor(
    @Inject(IAdminsAuthServiceToken)
    private readonly _adminsAuthService: IAdminsAuthService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() LoginData: AdminLoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AdminLoginResponseDto> {
    if (!LoginData) {
      throw new BadRequestException('Request body is empty');
    }
    return await this._adminsAuthService.login(
      LoginData.username,
      LoginData.password,
      response,
    );
  }

  @Public()
  @Post('register')
  async register(
    @Body() registerData: { username: string; password: string },
  ): Promise<Admin> {
    return this._adminsAuthService.register(registerData);
  }
}

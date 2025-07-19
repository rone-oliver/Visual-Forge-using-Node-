import { BadRequestException, Body, Controller, Delete, Get, Inject, Post, Put, Query, Req, Res, UseGuards, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { Types } from 'mongoose';
import { Public } from '../decorators/public.decorator';
import { UserType } from './dtos/common.dto';
import { ICommonService, ICommonServiceToken } from './interfaces/common-service.interface';
import { Logger } from '@nestjs/common';
import { GetUser } from '../decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  private readonly _logger = new Logger(AuthController.name);
  constructor(
    @Inject(ICommonServiceToken) private readonly _commonService: ICommonService
  ){}

  @Public()
  @Delete('logout')
  async userLogout(@Req() req: Request, @Res() res: Response, @Query('userType') userType: UserType) {
    this._logger.log(`Logout called for role: ${userType}`);
    if (!userType || (userType !== UserType.USER && userType !== UserType.ADMIN)) {
      throw new BadRequestException('Missing or invalid "role" query parameter.');
    }
    await this._commonService.logoutHandler(res,userType);
  }

  @Put('theme-preference')
  async updateAdminThemePreference(@GetUser('userId') userId: string, @Res() res: Response, @Body() body:{isDark: boolean}) {
    this._commonService.updateThemePreference(res,userId,body.isDark);
  }

  @Get('theme-preference')
  async getUserThemePreference(@GetUser('userId') userId: string, @Res() res: Response) {
    this._commonService.getThemePreference(res,userId);
  }

  @Public()
  @Post('google')
  async authGoogle(@Body() body:{credential:string}, @Res() res:Response){
    if(!body.credential){
      throw new BadRequestException('No credential provided');
    }else{
      const resp = await this._commonService.handleGoogleAuth(body.credential,res);
      res.status(HttpStatus.OK).json(resp);
    }
  }
}
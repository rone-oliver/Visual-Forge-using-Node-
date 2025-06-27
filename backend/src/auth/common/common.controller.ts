import { BadRequestException, Body, Controller, Delete, Get, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { CommonService } from './common.service';
import { Types } from 'mongoose';
import { Public } from '../decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private commonService: CommonService){}

  @Public()
  @Delete('logout')
  async userLogout(@Req() req: Request, @Res() res: Response, @Query('userType') userType: 'User' | 'Admin') {
    console.log(`Logout called for role: ${userType}`);
    if (!userType || (userType !== 'User' && userType !== 'Admin')) {
      throw new BadRequestException('Missing or invalid "role" query parameter.');
    }
    await this.commonService.logoutHandler(res,userType);
  }

  // @Delete('admin/logout')
  // async adminLogout(@Req() req: Request, @Res() res: Response) {
  //   await this.commonService.logoutHandler(res,'Admin');
  // }

  @Put('theme-preference')
  async updateAdminThemePreference(@Req() req: Request, @Res() res: Response, @Body() body:{userType: 'User' | 'Admin', isDark: boolean}) {
    const user = req['user'] as { userId: Types.ObjectId; role: string };
    this.commonService.updateThemePreference(res,user.userId,body.userType,body.isDark);
  }

  // @Post('user/theme-preference')
  // async updateUserThemePreference(@Req() req: Request, @Res() res: Response, @Body() body:{userType: 'User' | 'Admin', isDark: boolean}) {
  //   const user = req['user'] as { userId: Types.ObjectId; role: string };
  //   this.commonService.updateThemePreference(res,user.userId,body.userType,body.isDark);
  // }

  @Get('theme-preference')
  async getUserThemePreference(@Req() req: Request, @Res() res: Response, @Query() query:{userType:'User' | 'Admin'}) {
    const user = req['user'] as { userId: Types.ObjectId; role: string };
    this.commonService.getThemePreference(res,user.userId,query.userType);
  }

  // @Get('admin/theme-preference')
  // async getAdminThemePreference(@Req() req: Request, @Res() res: Response, @Query() query:{userType:'User' | 'Admin'}) {
  //   const user = req['user'] as { userId: Types.ObjectId; role: string };
  //   this.commonService.getThemePreference(res,user.userId,query.userType);
  // }

  @Public()
  @Post('google')
  async authGoogle(@Body() body:{credential:string}, @Res() res:Response){
    if(!body.credential){
      throw new BadRequestException('No credential provided');
    }else{
      return this.commonService.handleGoogleAuth(body.credential,res);
    }
  }
}
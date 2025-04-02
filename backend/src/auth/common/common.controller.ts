import { Controller, Post, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { CommonService } from './common.service';

@Controller('auth')
export class AuthController {
  constructor(private commonService: CommonService){}
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    this.commonService.logoutHandler(res);
  }
}
import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/common/enums/role.enum';

import {
  GetLedgerQueryDto,
  PaginatedLedgerResponseDto,
} from './dto/wallet.dto';
import {
  IAdminWalletService,
  IAdminWalletServiceToken,
} from './interfaces/admin-wallet.service.interface';

@Controller('admin/wallet')
@UseGuards(AuthGuard, RolesGuard)
export class AdminWalletController {
  constructor(
    @Inject(IAdminWalletServiceToken)
    private readonly _adminWalletService: IAdminWalletService,
  ) {}

  @Roles(Role.ADMIN)
  @Get('ledger')
  async getLedger(
    @Query() query: GetLedgerQueryDto,
  ): Promise<PaginatedLedgerResponseDto> {
    return this._adminWalletService.getLedger(query.page, query.limit);
  }
}

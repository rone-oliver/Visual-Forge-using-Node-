import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { AdminWalletService } from './admin-wallet.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { IAdminWalletService, IAdminWalletServiceToken } from './interfaces/admin-wallet.service.interface';
import { GetLedgerQueryDto, PaginatedLedgerResponseDto } from './dto/wallet.dto';

@Controller('admin/wallet')
@UseGuards(AuthGuard,RolesGuard)
export class AdminWalletController {
  constructor(
    @Inject(IAdminWalletServiceToken) private readonly adminWalletService: IAdminWalletService,
  ) {}

  @Roles(Role.ADMIN)
  @Get('ledger')
  async getLedger(
    @Query() query: GetLedgerQueryDto,
  ): Promise<PaginatedLedgerResponseDto> {
    return this.adminWalletService.getLedger(query.page, query.limit);
  }
}
import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { TransactionResponseDto } from 'src/users/dto/users.dto';

import {
  GetTransactionsDto,
  PaginatedWalletTransactionsResponseDto,
  PayFromWalletDto,
  UpdateWalletDto,
} from './dto/wallet.dto';
import { IWalletController } from './interfaces/wallet-controller.interface';
import {
  IWalletService,
  IWalletServiceToken,
} from './interfaces/wallet-service.interface';
import { Wallet } from './models/wallet.schema';

@Controller('user/wallet')
@UseGuards(AuthGuard, RolesGuard)
export class WalletController implements IWalletController {
  constructor(
    @Inject(IWalletServiceToken)
    private readonly _walletService: IWalletService,
  ) {}

  @Get()
  async getWallet(@GetUser('userId') userId: string): Promise<Wallet> {
    return this._walletService.getWallet(userId);
  }

  @Get('transactions')
  async getTransactions(
    @GetUser('userId') userId: string,
    @Query() query: GetTransactionsDto,
  ): Promise<PaginatedWalletTransactionsResponseDto> {
    return this._walletService.getTransactions(
      userId,
      query.page,
      query.limit,
      query.startDate,
      query.endDate,
    );
  }

  @Post('add')
  async addMoney(
    @GetUser('userId') userId: string,
    @Body() body: UpdateWalletDto,
  ): Promise<Wallet> {
    return this._walletService.addMoney(userId, body.amount);
  }

  @Post('withdraw')
  async withdrawMoney(
    @GetUser('userId') userId: string,
    @Body() body: UpdateWalletDto,
  ): Promise<Wallet> {
    return this._walletService.withdrawMoney(userId, body.amount);
  }

  @Post('pay')
  async payFromWallet(
    @GetUser('userId') userId: string,
    @Body() body: PayFromWalletDto,
  ): Promise<TransactionResponseDto> {
    return this._walletService.payFromWallet(userId, body);
  }
}

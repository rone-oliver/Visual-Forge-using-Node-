import { Body, Controller, Get, Inject, Post, Query, UseGuards } from '@nestjs/common';
import { IWalletService, IWalletServiceToken } from './interfaces/wallet-service.interface';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { IWalletController } from './interfaces/wallet-controller.interface';
import { GetTransactionsDto, PayFromWalletDto, UpdateWalletDto } from './dto/wallet.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

@Controller('user/wallet')
@UseGuards(AuthGuard,RolesGuard)
export class WalletController implements IWalletController {
    constructor(
        @Inject(IWalletServiceToken) private readonly _walletService: IWalletService,
    ){}

    @Get()
    async getWallet(@GetUser('userId') userId: string) {
        return this._walletService.getWallet(userId);
    }

    @Get('transactions')
    async getTransactions(@GetUser('userId') userId: string, @Query() query: GetTransactionsDto) {
        return this._walletService.getTransactions(
            userId,
            query.page,
            query.limit,
            query.startDate,
            query.endDate,
        );
    }

    @Post('add')
    async addMoney(@GetUser('userId') userId: string, @Body() body: UpdateWalletDto) {
        return this._walletService.addMoney(userId, body.amount);
    }

    @Post('withdraw')
    async withdrawMoney(@GetUser('userId') userId: string, @Body() body: UpdateWalletDto) {
        return this._walletService.withdrawMoney(userId, body.amount);
    }

    @Post('pay')
    async payFromWallet(@GetUser('userId') userId: string, @Body() body: PayFromWalletDto) {
        return this._walletService.payFromWallet(userId, body);
    }
}

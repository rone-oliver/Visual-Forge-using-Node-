import { Module } from '@nestjs/common';
import { OverdueQuotationsService } from './overdue-quotations';
import { ScheduleModule } from '@nestjs/schedule';
import { QuotationModule } from 'src/quotation/quotation.module';
import { EditorsModule } from 'src/editors/editors.module';
import { WalletModule } from 'src/wallet/wallet.module';
import { MailModule } from 'src/mail/mail.module';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        QuotationModule, EditorsModule, WalletModule,
        MailModule, UsersModule,
    ],
    providers: [OverdueQuotationsService],
})
export class OverdueQuotationsModule {}

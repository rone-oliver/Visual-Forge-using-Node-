import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EditorsModule } from 'src/editors/editors.module';
import { MailModule } from 'src/mail/mail.module';
import { QuotationModule } from 'src/quotation/quotation.module';
import { UsersModule } from 'src/users/users.module';
import { WalletModule } from 'src/wallet/wallet.module';

import { OverdueQuotationsService } from './overdue-quotations';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    QuotationModule,
    EditorsModule,
    WalletModule,
    MailModule,
    UsersModule,
  ],
  providers: [OverdueQuotationsService],
})
export class OverdueQuotationsModule {}

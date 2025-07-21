import { Injectable, Inject, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventTypes } from 'src/common/constants/events.constants';
import {
  IEditorsService,
  IEditorsServiceToken,
} from 'src/editors/interfaces/editors.service.interface';
import { MailService } from 'src/mail/mail.service';
import { NotificationType } from 'src/notification/models/notification.schema';
import {
  IQuotationService,
  IQuotationServiceToken,
} from 'src/quotation/interfaces/quotation.service.interface';
import { QuotationStatus } from 'src/quotation/models/quotation.schema';
import {
  IUsersService,
  IUsersServiceToken,
} from 'src/users/interfaces/users.service.interface';
import {
  IWalletService,
  IWalletServiceToken,
} from 'src/wallet/interfaces/wallet-service.interface';

@Injectable()
export class OverdueQuotationsService {
  private readonly _logger = new Logger(OverdueQuotationsService.name);

  constructor(
    @Inject(IQuotationServiceToken)
    private readonly _quotationService: IQuotationService,
    @Inject(IEditorsServiceToken)
    private readonly _editorService: IEditorsService,
    @Inject(IWalletServiceToken)
    private readonly _walletService: IWalletService,
    @Inject(IUsersServiceToken) private readonly _userService: IUsersService,
    private readonly _mailService: MailService,
    private _eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleOverdueQuotations() {
    this._logger.log('Starting overdue quotations job...');

    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - 24);

    const overdueQuotations = await this._quotationService.findMany({
      status: QuotationStatus.ACCEPTED,
      dueDate: { $lt: thresholdDate },
    });

    if (!overdueQuotations || overdueQuotations.length === 0) {
      this._logger.log('No overdue quotations found.');
      return;
    }

    this._logger.log(
      `Found ${overdueQuotations.length} overdue quotations to process.`,
    );

    // for (const quotation of overdueQuotations) {
    const processingPromises = overdueQuotations.map(async (quotation) => {
      try {
        // 1. Refund user's advance payment to their wallet
        if (
          typeof quotation.advanceAmount === 'number' &&
          quotation.advanceAmount > 0
        ) {
          await this._walletService.refundUserForExpiredQuotation(
            quotation.userId.toString(),
            quotation._id.toString(),
            quotation.advanceAmount,
          );

          this._eventEmitter.emit(EventTypes.PAYMENT_REFUNDED, {
            recipient: quotation.userId,
            message: `The quotation #${quotation.title} has expired due to no response from the editor. Your advance payment of $${quotation.advanceAmount} has been refunded to your wallet.`,
            type: NotificationType.QUOTATION_EXPIRED,
          });
        } else {
          this._logger.warn(
            `Skipping refund for quotation #${quotation._id} due to missing or invalid advanceAmount.`,
          );
        }

        // 2. Handle editor warning and suspension
        const editor = await this._editorService.findByUserId(
          quotation.editorId,
        );
        if (editor) {
          const warningCount = (editor.warningCount || 0) + 1;
          let isSuspended = false;
          let suspendedUntil: Date | null = null;

          let editorUpdate: any = {
            warningCount,
            lastWarningDate: new Date(),
          };

          if (warningCount >= 3) {
            isSuspended = true;
            suspendedUntil = new Date();
            suspendedUntil.setDate(suspendedUntil.getDate() + 14);
            editorUpdate = {
              ...editorUpdate,
              isSuspended,
              suspendedUntil,
              warningCount: 0,
            };
          }
          await this._editorService.updateEditor(editor.userId, editorUpdate);

          const editorUser = await this._userService.getUserById(editor.userId);
          if (isSuspended) {
            this._eventEmitter.emit(EventTypes.EDITOR_SUSPENDED, {
              recipient: quotation.editorId,
              message: `You have been suspended for 2 weeks due to repeated failure to respond to quotations. Your warning count has been reset.`,
              type: NotificationType.ACCOUNT_SUSPENDED,
            });
            if (editor.suspendedUntil && editorUser) {
              await this._mailService.sendSuspensionEmail(editorUser.email, {
                suspendedUntil: editor.suspendedUntil,
              });
            }
          } else {
            this._eventEmitter.emit(EventTypes.EDITOR_WARNING, {
              recipient: quotation.editorId,
              message: `You have received a warning for failing to respond to quotation #${quotation.title}. Accumulating 3 warnings will result in a temporary suspension.`,
              type: NotificationType.EDITOR_WARNING,
            });
            if (editorUser) {
              await this._mailService.sendWarningEmail(editorUser.email, {
                quotationTitle: quotation.title,
              });
            }
          }
        }

        await this._quotationService.updateQuotation(
          { _id: quotation._id },
          { status: QuotationStatus.EXPIRED },
        );

        this._logger.log(
          `Successfully processed overdue quotation #${quotation._id.toString()}`,
        );
      } catch (error) {
        this._logger.error(
          `Failed to process overdue quotation #${quotation._id.toString()}: ${error.message}`,
          error.stack,
        );
      }
    });

    await Promise.all(processingPromises);
    this._logger.log('Finished overdue quotations job.');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleWarningReset() {
    this._logger.log('Starting editor warning reset job...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const editorsToReset = await this._editorService.findMany({
        isSuspended: { $ne: true },
        warningCount: { $gt: 0 },
        lastWarningDate: { $lt: thirtyDaysAgo },
      });

      if (!editorsToReset || editorsToReset.length === 0) {
        this._logger.log('No editors found for warning reset.');
        return;
      }

      this._logger.log(
        `Found ${editorsToReset.length} editors for warning reset.`,
      );

      for (const editor of editorsToReset) {
        await this._editorService.updateEditor(editor.userId, {
          warningCount: 0,
        });
        this._logger.log(`Reset warning count for editor #${editor.userId}`);
      }
    } catch (error) {
      this._logger.error(
        `Failed to run warning reset job: ${error.message}`,
        error.stack,
      );
    }

    this._logger.log('Finished editor warning reset job.');
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: this.configService.get<boolean>('EMAIL_SECURE'),
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  private async _sendMail(mailOptions: nodemailer.SendMailOptions) {
    await this.transporter.sendMail(mailOptions);
  }

  private _createThemedEmail(title: string, preheader: string, contentHtml: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <title>${title}</title>
        <style>
          :root {
            --bg-light: #f8f9fa;
            --content-bg-light: #ffffff;
            --text-light: #212529;
            --accent-light: #6C72FF;
            --warning-light: #FDB52A;
            --danger-light: #EF4444;
            --footer-text-light: #6c757d;

            --bg-dark: #080F25;
            --content-bg-dark: #151C32;
            --text-dark: #D9E1FA;
            --accent-dark: #6C72FF;
            --warning-dark: #FDB52A;
            --danger-dark: #DC2626;
            --footer-text-dark: #7E89AC;
          }

          @media (prefers-color-scheme: dark) {
            body { background-color: var(--bg-dark) !important; }
            .container, .content-card { background-color: var(--content-bg-dark) !important; }
            .title, .body-text, .highlight-text { color: var(--text-dark) !important; }
            .footer-text { color: var(--footer-text-dark) !important; }
            .button { background-color: var(--accent-dark) !important; }
            .warning-icon { color: var(--warning-dark) !important; }
            .danger-icon { color: var(--danger-dark) !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; width: 100%; background-color: var(--bg-light); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';">
        <div class="preheader" style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>
        <table class="container" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: var(--content-bg-light);">
          <tr><td style="padding: 24px;">
            <h1 class="title" style="font-size: 24px; font-weight: 600; color: var(--text-light); margin: 0 0 24px 0;">Visual Forge</h1>
            <div class="content-card" style="padding: 32px; border-radius: 12px;">
              ${contentHtml}
            </div>
            <p class="footer-text" style="font-size: 12px; color: var(--footer-text-light); text-align: center; margin: 24px 0 0 0;">
              &copy; ${new Date().getFullYear()} Visual Forge. All rights reserved.
            </p>
          </td></tr>
        </table>
      </body>
      </html>
    `;
  }

  async sendOtpEmail(to: string, data: { otp: string }): Promise<void> {
    const subject = 'Your Verification Code - Visual Forge';
    const content = `
      <h2 class="title" style="font-size: 20px; font-weight: 600; color: var(--text-light); margin: 0 0 16px 0;">Confirm Your Email Address</h2>
      <p class="body-text" style="font-size: 16px; line-height: 1.6; color: var(--text-light); margin: 0 0 24px 0;">
        To complete your sign-up, please use the following verification code. The code is valid for 10 minutes.
      </p>
      <div style="background-color: rgba(108, 114, 255, 0.1); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
        <p style="font-size: 32px; font-weight: 700; color: var(--accent-light); letter-spacing: 8px; margin: 0;">${data.otp}</p>
      </div>
      <p class="body-text" style="font-size: 16px; line-height: 1.6; color: var(--text-light); margin: 0;">
        If you did not request this code, you can safely ignore this email.
      </p>
    `;
    const html = this._createThemedEmail('Email Verification', `Your verification code is ${data.otp}`, content);
    await this._sendMail({ from: this.configService.get<string>('EMAIL_FROM'), to, subject, html });
  }

  async sendWarningEmail(to: string, data: { quotationTitle: string }): Promise<void> {
    const subject = 'Account Warning - Visual Forge';
    const content = `
      <h2 class="title" style="font-size: 20px; font-weight: 600; color: var(--text-light); margin: 0 0 16px 0;">You've Received a Warning</h2>
      <p class="body-text" style="font-size: 16px; line-height: 1.6; color: var(--text-light); margin: 0 0 16px 0;">
        This is a notification that you have received a warning for failing to respond to the quotation: <strong>"${data.quotationTitle}"</strong> before it expired.
      </p>
      <p class="body-text" style="font-size: 16px; line-height: 1.6; color: var(--text-light); margin: 0 0 24px 0;">
        Please ensure you respond to all assigned quotations in a timely manner. Accumulating 3 warnings will result in a temporary suspension of your account, preventing you from bidding on new projects.
      </p>
      <a href="#" class="button" style="display: inline-block; padding: 12px 24px; background-color: var(--accent-light); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500;">View My Quotations</a>
    `;
    const html = this._createThemedEmail('Account Warning', 'You have received a warning for inactivity.', content);
    await this._sendMail({ from: this.configService.get<string>('EMAIL_FROM'), to, subject, html });
  }

  async sendSuspensionEmail(to: string, data: { suspendedUntil: Date }): Promise<void> {
    const subject = 'Account Suspension Notice - Visual Forge';
    const formattedDate = data.suspendedUntil.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const content = `
      <h2 class="title" style="font-size: 20px; font-weight: 600; color: var(--text-light); margin: 0 0 16px 0;">Your Account Has Been Suspended</h2>
      <p class="body-text" style="font-size: 16px; line-height: 1.6; color: var(--text-light); margin: 0 0 16px 0;">
        Your account has been temporarily suspended due to accumulating multiple warnings for failing to respond to quotations. 
      </p>
      <p class="highlight-text" style="font-size: 16px; line-height: 1.6; color: var(--text-light); margin: 0 0 24px 0; padding: 16px; background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid var(--danger-light); border-radius: 4px;">
        Your suspension will be lifted on: <strong>${formattedDate}</strong>.
      </p>
      <p class="body-text" style="font-size: 16px; line-height: 1.6; color: var(--text-light); margin: 0 0 24px 0;">
        During this period, you will not be able to bid on new projects. You can still complete any ongoing work. Your warning count has been reset.
      </p>
      <a href="#" class="button" style="display: inline-block; padding: 12px 24px; background-color: var(--accent-light); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500;">Access My Account</a>
    `;
    const html = this._createThemedEmail('Account Suspension', `Your account is suspended until ${formattedDate}.`, content);
    await this._sendMail({ from: this.configService.get<string>('EMAIL_FROM'), to, subject, html });
  }
}

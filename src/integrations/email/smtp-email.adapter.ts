import nodemailer from 'nodemailer';
import { IEmailAdapter, SendEmailOptions } from './email.interface';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export class SmtpEmailAdapter implements IEmailAdapter {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      auth: {
        user: env.SMTP_USER || '',
        pass: env.SMTP_PASS || '',
      },
    });
  }

  public async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      logger.info({ messageId: info.messageId, to: options.to }, 'Email delivered via SMTP');
      return true;
    } catch (error) {
      logger.error({ error, to: options.to }, 'Failed to deliver email via SMTP');
      return false;
    }
  }
}


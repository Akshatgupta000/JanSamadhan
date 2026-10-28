import { IEmailAdapter, SendEmailOptions } from './email.interface';
import { logger } from '../../config/logger';

export class MockEmailAdapter implements IEmailAdapter {
  public async sendEmail(options: SendEmailOptions): Promise<boolean> {
    logger.info(
      { to: options.to, subject: options.subject },
      '[MOCK EMAIL] Simulating email delivery (development mode)'
    );
    return true;
  }
}


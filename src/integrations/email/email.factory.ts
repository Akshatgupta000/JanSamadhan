import { IEmailAdapter } from './email.interface';
import { MockEmailAdapter } from './mock-email.adapter';
import { SmtpEmailAdapter } from './smtp-email.adapter';
import { env } from '../../config/env';

export class EmailFactory {
  private static instance: IEmailAdapter;

  public static getAdapter(): IEmailAdapter {
    if (!this.instance) {
      if (env.EMAIL_PROVIDER === 'smtp' && env.SMTP_HOST && env.SMTP_USER) {
        this.instance = new SmtpEmailAdapter();
      } else {
        this.instance = new MockEmailAdapter();
      }
    }
    return this.instance;
  }
}


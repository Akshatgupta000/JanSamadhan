export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface IEmailAdapter {
  sendEmail(options: SendEmailOptions): Promise<boolean>;
}


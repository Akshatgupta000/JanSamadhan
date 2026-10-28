import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { IStorageAdapter, FileUploadResult } from './storage.interface';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export class S3StorageAdapter implements IStorageAdapter {
  private s3: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = env.S3_BUCKET;
    this.s3 = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: env.S3_FORCE_PATH_STYLE === 'true',
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY || '',
        secretAccessKey: env.S3_SECRET_KEY || '',
      },
    });
  }

  public async uploadFile(buffer: Buffer, key: string, mimeType: string): Promise<FileUploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });

    await this.s3.send(command);
    logger.debug({ key, bucket: this.bucket }, 'File uploaded to S3');

    return {
      fileKey: key,
      storageProvider: 's3',
      fileSize: buffer.length,
      mimeType,
      url: `${env.S3_ENDPOINT}/${this.bucket}/${key}`,
    };
  }

  public async getFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const response = await this.s3.send(command);
    const byteArray = await response.Body?.transformToByteArray();
    return Buffer.from(byteArray || []);
  }

  public async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.s3.send(command);
  }

  public async getUrl(key: string): Promise<string> {
    return `${env.S3_ENDPOINT}/${this.bucket}/${key}`;
  }
}


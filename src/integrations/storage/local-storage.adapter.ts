import fs from 'fs';
import path from 'path';
import { IStorageAdapter, FileUploadResult } from './storage.interface';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export class LocalStorageAdapter implements IStorageAdapter {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), env.STORAGE_LOCAL_DIR);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  public async uploadFile(buffer: Buffer, key: string, mimeType: string): Promise<FileUploadResult> {
    const filePath = path.join(this.baseDir, key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await fs.promises.writeFile(filePath, buffer);
    logger.debug({ key, size: buffer.length }, 'File saved locally');

    return {
      fileKey: key,
      storageProvider: 'local',
      fileSize: buffer.length,
      mimeType,
      url: `/uploads/${key}`,
    };
  }

  public async getFile(key: string): Promise<Buffer> {
    const filePath = path.join(this.baseDir, key);
    return fs.promises.readFile(filePath);
  }

  public async deleteFile(key: string): Promise<void> {
    const filePath = path.join(this.baseDir, key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  public async getUrl(key: string): Promise<string> {
    return `/uploads/${key}`;
  }
}


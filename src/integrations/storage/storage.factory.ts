import { IStorageAdapter } from './storage.interface';
import { LocalStorageAdapter } from './local-storage.adapter';
import { S3StorageAdapter } from './s3-storage.adapter';
import { env } from '../../config/env';

export class StorageFactory {
  private static instance: IStorageAdapter;

  public static getAdapter(): IStorageAdapter {
    if (!this.instance) {
      if (env.STORAGE_PROVIDER === 's3' && env.S3_ACCESS_KEY) {
        this.instance = new S3StorageAdapter();
      } else {
        this.instance = new LocalStorageAdapter();
      }
    }
    return this.instance;
  }
}


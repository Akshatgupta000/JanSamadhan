export interface FileUploadResult {
  fileKey: string;
  storageProvider: string;
  fileSize: number;
  mimeType: string;
  url?: string;
}

export interface IStorageAdapter {
  uploadFile(buffer: Buffer, key: string, mimeType: string): Promise<FileUploadResult>;
  getFile(key: string): Promise<Buffer>;
  deleteFile(key: string): Promise<void>;
  getUrl(key: string): Promise<string>;
}


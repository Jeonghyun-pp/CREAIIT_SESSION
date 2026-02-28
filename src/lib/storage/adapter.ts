export interface StorageAdapter {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<{ data: Buffer; contentType: string }>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

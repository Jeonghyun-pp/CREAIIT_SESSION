import { StorageAdapter } from "./adapter";
import { LocalStorageAdapter } from "./local";

let instance: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (instance) return instance;

  // TODO: add S3 adapter when STORAGE_DRIVER=s3
  instance = new LocalStorageAdapter(process.env.UPLOAD_DIR || "./uploads");
  return instance;
}

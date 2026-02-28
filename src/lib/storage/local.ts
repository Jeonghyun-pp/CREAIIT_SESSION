import fs from "fs/promises";
import path from "path";
import { StorageAdapter } from "./adapter";

export class LocalStorageAdapter implements StorageAdapter {
  private dir: string;

  constructor(dir: string) {
    this.dir = path.resolve(dir);
  }

  private filePath(key: string) {
    return path.join(this.dir, key);
  }

  async put(key: string, data: Buffer, _contentType: string): Promise<void> {
    const fullPath = this.filePath(key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);
  }

  async get(key: string): Promise<{ data: Buffer; contentType: string }> {
    const data = await fs.readFile(this.filePath(key));
    return { data: Buffer.from(data), contentType: "application/octet-stream" };
  }

  async delete(key: string): Promise<void> {
    await fs.unlink(this.filePath(key)).catch(() => {});
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.filePath(key));
      return true;
    } catch {
      return false;
    }
  }
}

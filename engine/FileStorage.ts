import fs from 'fs/promises';
import path from 'path';
import { StorageAdapter } from './Storage';
import { StepContext } from './Transaction';

export class FileStorage implements StorageAdapter {
  private dir = path.join(process.cwd(), '.transaction-logs');

  async init() {
    try { await fs.mkdir(this.dir, { recursive: true }); } catch {}
  }

  async save(txId: string, state: StepContext[]): Promise<void> {
    await this.init();
    await fs.writeFile(path.join(this.dir, `${txId}.json`), JSON.stringify(state, null, 2));
  }

  async load(txId: string): Promise<StepContext[] | null> {
    try {
      const data = await fs.readFile(path.join(this.dir, `${txId}.json`), 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async clear(txId: string): Promise<void> {
    try { await fs.unlink(path.join(this.dir, `${txId}.json`)); } catch {}
  }
}

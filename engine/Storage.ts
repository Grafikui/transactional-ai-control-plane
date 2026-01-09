import { StepContext } from './Transaction';

export interface StorageAdapter {
  save(transactionId: string, state: StepContext[]): Promise<void>;
  load(transactionId: string): Promise<StepContext[] | null>;
  clear(transactionId: string): Promise<void>;
}

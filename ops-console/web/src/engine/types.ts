export type TransactionState = 'Pending' | 'Committed' | 'RolledBack' | 'Halted';

export interface TransactionStep {
  id: string;
  type: 'Pure' | 'Reversible' | 'Irreversible';
  execute: (context: any) => Promise<any>;
  compensate?: (context: any) => Promise<any>; // For Reversible steps
  idempotencyKey: string;
}

export interface Transaction {
  id: string;
  steps: TransactionStep[];
  state: TransactionState;
  context: any;
  logs: any[];
}

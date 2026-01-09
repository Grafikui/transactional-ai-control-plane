
import { StorageAdapter } from './Storage';

export type StepContext<T = any> = {
  name: string;
  result?: T;
  status: 'completed' | 'pending';
};

export type StepDefinition<T> = {
  do: () => Promise<T> | T;
  undo: (result: T) => Promise<void> | void;
};

type RecordedStep = {
  name: string;
  undo: () => Promise<void> | void;
};


// Add options interface
type TransactionOptions = {
  cleanupOnSuccess?: boolean;
};

export class Transaction {
  private stepStack: RecordedStep[] = [];
  private history: Map<string, any> = new Map();
  private id: string;
  private storage?: StorageAdapter;
  private cleanupOnSuccess: boolean;

  constructor(id: string, storage?: StorageAdapter, options: TransactionOptions = {}) {
    this.id = id;
    this.storage = storage;
    // Default to TRUE (clean up) unless told otherwise
    this.cleanupOnSuccess = options.cleanupOnSuccess ?? true;
  }

  async run(workflow: (tx: Transaction) => Promise<void>): Promise<void> {
    // 1. Load previous state if storage is provided
    if (this.storage) {
      const savedState = await this.storage.load(this.id);
      if (savedState) {
        console.log(`[Transaction] 🔄 Resuming ${this.id} with ${savedState.length} completed steps.`);
        savedState.forEach(s => this.history.set(s.name, s.result));
        // Note: We can't re-hydrate the 'undo' functions until the code runs again.
        // The 'step' method handles re-hydrating the stack.
      }
    }

    try {
      await workflow(this);
      // CHANGED: Only clear if flag is true
      if (this.storage && this.cleanupOnSuccess) {
        await this.storage.clear(this.id);
      }
    } catch (error) {
      console.error(`\n🔴 [Transaction Failed] Error: ${error instanceof Error ? error.message : error}`);
      await this.rollback();
      throw error;
    }
  }

  async step<T>(name: string, definition: StepDefinition<T>): Promise<T> {
    // 1. Check if we already did this step (Resumability!)
    if (this.history.has(name)) {
      console.log(`⏩ [Skip: ${name}] Already completed.`);
      const result = this.history.get(name) as T;
      // CRITICAL: We still need to push the undo handler to the stack 
      // so we can rollback if a LATER step fails.
      this.stepStack.push({ name, undo: () => definition.undo(result) });
      return result;
    }

    // 2. If not, Execute
    console.log(`➡️  [Do: ${name}] Executing...`);
    const result = await definition.do();

    // 3. Update State
    this.stepStack.push({ name, undo: () => definition.undo(result) });
    
    // 4. Persist
    if (this.storage) {
      const currentHistory = this.stepStack.map(s => ({ 
        name: s.name, 
        result: s.name === name ? result : this.history.get(s.name), // simplified for demo
        status: 'completed'
      }));
      // In a real app, map the full history properly
      await this.storage.save(this.id, currentHistory as any);
    }
    
    return result;
  }

  private async rollback() {
    const stepsToUndo = [...this.stepStack].reverse();
    for (const step of stepsToUndo) {
      console.log(`⬅️  [Undo: ${step.name}] Reverting...`);
      try { await step.undo(); } 
      catch (err) { console.error(`   ❌ [CRITICAL] Undo failed for '${step.name}'`, err); }
    }
    // Clear storage after rollback so we don't resume into a broken state
    if (this.storage) await this.storage.clear(this.id);
    this.stepStack = [];
  }
}

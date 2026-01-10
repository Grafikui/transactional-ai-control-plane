import { Transaction, StepContext } from '../engine/Transaction';
import { StorageAdapter } from '../engine/Storage';

// 1. Mock Storage strictly typed to your interface
class MemoryStorage implements StorageAdapter {
  private data = new Map<string, StepContext[]>();
  
  async save(transactionId: string, state: StepContext[]): Promise<void> { 
    this.data.set(transactionId, state); 
  }
  
  async load(transactionId: string): Promise<StepContext[] | null> { 
    return this.data.get(transactionId) || null; 
  }
  
  async clear(transactionId: string): Promise<void> {
    this.data.delete(transactionId);
  }
}

describe('Transaction Engine', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  test('Should execute all steps successfully', async () => {
    const tx = new Transaction('tx-success', storage);
    
    const step1Do = jest.fn().mockResolvedValue('step1-result');
    const step2Do = jest.fn().mockResolvedValue('step2-result');

    await tx.run(async (t) => {
      await t.step('step-1', { 
        do: step1Do, 
        undo: async () => {} 
      });

      await t.step('step-2', { 
        do: step2Do, 
        undo: async () => {} 
      });
    });

    expect(step1Do).toHaveBeenCalled();
    expect(step2Do).toHaveBeenCalled();
    
    // FIXED: Your mock returns 'null', not 'undefined'
    expect(await storage.load('tx-success')).toBeNull(); 
  });

  test('Should rollback (undo) in reverse order on failure', async () => {
    const tx = new Transaction('tx-fail', storage);
    
    const step1Do = jest.fn().mockResolvedValue('res-1');
    const step1Undo = jest.fn();
    
    const step2Do = jest.fn().mockRejectedValue(new Error('Boom!'));
    const step2Undo = jest.fn();

    // Expect the run to fail
    await expect(tx.run(async (t) => {
      await t.step('step-1', { 
        do: step1Do, 
        undo: step1Undo 
      });
      
      await t.step('step-2', { 
        do: step2Do, // Will throw
        undo: step2Undo 
      });
    })).rejects.toThrow('Boom!');

    // Assertions
    expect(step1Do).toHaveBeenCalled(); // Ran
    expect(step2Do).toHaveBeenCalled(); // Ran and failed
    
    // FIXED: Step 2 failed, so it was never added to the stack.
    // It should NOT be compensated (logic: don't undo what didn't finish).
    expect(step2Undo).not.toHaveBeenCalled(); 
    
    // Step 1 finished, so it MUST be compensated.
    expect(step1Undo).toHaveBeenCalled(); 
  });

  test('Should skip previously completed steps (Resumability)', async () => {
    // Simulate existing state: Step 1 is already done
    await storage.save('tx-resume', [
      { name: 'step-1', result: 'cached-result', status: 'completed' }
    ]);

    const tx = new Transaction('tx-resume', storage);
    const step1Do = jest.fn();
    const step2Do = jest.fn().mockResolvedValue('fresh');

    await tx.run(async (t) => {
      // This should be SKIPPED because it's in storage
      await t.step('step-1', { 
        do: step1Do, 
        undo: async () => {} 
      });

      // This should RUN
      await t.step('step-2', { 
        do: step2Do, 
        undo: async () => {} 
      });
    });

    expect(step1Do).not.toHaveBeenCalled(); // Skipped!
    expect(step2Do).toHaveBeenCalled();     // Ran!
  });
});
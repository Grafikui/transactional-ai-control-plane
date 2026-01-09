import { Transaction } from './Transaction';

describe('Transaction Engine', () => {
  let output: string[] = [];

  // Helper to track execution order
  const log = (msg: string) => {
    output.push(msg);
  };

  beforeEach(() => {
    output = [];
  });

  test('Happy Path: executes all steps sequentially', async () => {
    // FIX: Added 'test-tx-1' ID
    const tx = new Transaction('test-tx-1');

    await tx.run(async (t) => {
      await t.step('step1', {
        do: () => { log('do 1'); },
        undo: () => { log('undo 1'); }
      });
      await t.step('step2', {
        do: () => { log('do 2'); },
        undo: () => { log('undo 2'); }
      });
    });

    expect(output).toEqual(['do 1', 'do 2']);
  });

  test('Rollback: reverts previous steps in reverse order on failure', async () => {
    // FIX: Added 'test-tx-2' ID
    const tx = new Transaction('test-tx-2');

    const task = tx.run(async (t) => {
      // Step 1: Succeeds
      await t.step('step1', {
        do: () => { log('do 1'); },
        undo: () => { log('undo 1'); }
      });

      // Step 2: Fails
      await t.step('step2', {
        do: () => {
          log('do 2 (fail)');
          throw new Error('Boom');
        },
        undo: () => { log('undo 2'); }
      });
    });

    // Expect the run to throw the error "Boom"
    await expect(task).rejects.toThrow('Boom');

    // Verify the log: Do 1 -> Do 2 -> Undo 1
    expect(output).toEqual(['do 1', 'do 2 (fail)', 'undo 1']);
  });

  test('Double Fault: handles errors during rollback gracefully', async () => {
    // FIX: Added 'test-tx-3' ID
    const tx = new Transaction('test-tx-3');
    
    // Silence console.error for this test since we expect it
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const task = tx.run(async (t) => {
      await t.step('step1', {
        do: () => {},
        undo: () => {
          log('undo 1 (crash)');
          throw new Error('Undo Failed'); 
        }
      });
      
      await t.step('step2', {
        do: () => { throw new Error('Original Error'); },
        undo: () => {}
      });
    });

    await expect(task).rejects.toThrow('Original Error');
    expect(output).toEqual(['undo 1 (crash)']);
    
    consoleSpy.mockRestore();
  });
});
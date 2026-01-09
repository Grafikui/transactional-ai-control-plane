export type StepDefinition<T> = {
  do: () => Promise<T> | T;
  undo: (result: T) => Promise<void> | void;
};

type RecordedStep = {
  name: string;
  undo: () => Promise<void> | void;
};

export class Transaction {
  private stepStack: RecordedStep[] = [];

  async run(workflow: (tx: Transaction) => Promise<void>): Promise<void> {
    this.stepStack = [];
    try {
      await workflow(this);
    } catch (error) {
      console.error(`\n🔴 [Transaction Failed] Error: ${error instanceof Error ? error.message : error}`);
      console.log(`🔄 Initiating Rollback for ${this.stepStack.length} steps...`);
      await this.rollback();
      throw error;
    }
  }

  async step<T>(name: string, definition: StepDefinition<T>): Promise<T> {
    console.log(`➡️  [Do: ${name}] Executing...`);
    
    const result = await definition.do();

    // Push the UNDO action to the stack immediately after success
    // We bind the result here so the undo function is ready to go with no arguments
    this.stepStack.push({
      name,
      undo: () => definition.undo(result)
    });
    
    return result;
  }

  private async rollback() {
    // Clone and reverse to undo LIFO
    const stepsToUndo = [...this.stepStack].reverse();

    for (const step of stepsToUndo) {
      console.log(`⬅️  [Undo: ${step.name}] Reverting...`);
      try {
        await step.undo();
        console.log(`   ✅ Reverted.`);
      } catch (err) {
        console.error(`   ❌ [CRITICAL] Undo failed for '${step.name}'`, err);
      }
    }
    this.stepStack = []; // Clear stack after rollback
  }
}

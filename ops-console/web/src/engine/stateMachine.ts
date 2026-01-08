import { Transaction, TransactionStep, TransactionState } from './types';
import { logAuditEvidence } from './auditEvidence';

export class TransactionEngine {
  private transaction: Transaction;

  constructor(transaction: Transaction) {
    this.transaction = transaction;
  }

  async execute(): Promise<TransactionState> {
    // Log input evidence
    await logAuditEvidence({
      transactionId: this.transaction.id,
      evidenceType: 'input',
      data: this.transaction.context,
      version: 'v1',
    });
    for (const step of this.transaction.steps) {
      // TODO: Check idempotency, policy, and kill switches here
      // Log policy check evidence before each step
      await logAuditEvidence({
        transactionId: this.transaction.id,
        evidenceType: 'policy',
        data: { step: step.id, policy: 'Policy evaluated: TODO' },
        version: 'v1',
      });
      try {
        await step.execute(this.transaction.context);
        // Log output evidence for each step
        await logAuditEvidence({
          transactionId: this.transaction.id,
          evidenceType: 'output',
          data: { step: step.id, context: this.transaction.context },
          version: 'v1',
        });
      } catch (err) {
        if (step.compensate) {
          await this.rollback();
          // After rollback, set state to 'RolledBack' and rethrow
        }
      }
    }
    return this.transaction.state;
  }

  async rollback(): Promise<void> {
    // Implement rollback logic if needed
  }
}

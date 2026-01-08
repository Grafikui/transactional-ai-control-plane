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
          throw err;
        } else {
          this.transaction.state = 'Halted';
          // Log halt evidence
          await logAuditEvidence({
            transactionId: this.transaction.id,
            evidenceType: 'output',
            data: { error: String(err), state: 'Halted' },
            version: 'v1',
          });
          throw err;
        }
      }
    }
    this.transaction.state = 'Committed';
    // Log commit evidence
    await logAuditEvidence({
      transactionId: this.transaction.id,
      evidenceType: 'output',
      data: { state: 'Committed' },
      version: 'v1',
    });
    // Log signature evidence (placeholder)
    await logAuditEvidence({
      transactionId: this.transaction.id,
      evidenceType: 'signature',
      data: { state: 'Committed', signature: 'TODO: sign transaction' },
      version: 'v1',
    });
    return this.transaction.state;
  }

  async rollback(): Promise<void> {
    // Rollback in reverse order for reversible steps
    for (const step of [...this.transaction.steps].reverse()) {
      if (step.compensate) {
        await step.compensate(this.transaction.context);
      }
    }
    this.transaction.state = 'RolledBack';
    // Log rollback evidence
    await logAuditEvidence({
      transactionId: this.transaction.id,
      evidenceType: 'output',
      data: { state: 'RolledBack' },
      version: 'v1',
    });
    // Log signature evidence (placeholder)
    await logAuditEvidence({
      transactionId: this.transaction.id,
      evidenceType: 'signature',
      data: { state: 'RolledBack', signature: 'TODO: sign rollback' },
      version: 'v1',
    });
  }
}

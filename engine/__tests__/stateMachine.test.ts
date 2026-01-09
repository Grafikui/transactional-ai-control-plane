
import { TransactionEngine } from '../stateMachine';
import { Transaction, TransactionStep } from '../types';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

test('executes and rolls back transaction', async () => {

  let executed = false;
  let compensated = false;

  // Clean up any existing txn1 before test
  await prisma.auditEvidence.deleteMany({ where: { transactionId: 'txn1' } });
  await prisma.transaction.delete({ where: { id: 'txn1' } }).catch(() => {});

  // Ensure a Transaction record exists in the DB for FK constraint
  await prisma.transaction.create({
    data: {
      id: 'txn1',
      state: 'Pending',
      context: {},
      steps: [],
    },
  });

  const step: TransactionStep = {
    id: 'step1',
    type: 'Reversible',
    execute: async () => { executed = true; throw new Error('fail'); },
    compensate: async () => { compensated = true; },
    idempotencyKey: 'test-key',
  };

  const transaction: Transaction = {
    id: 'txn1',
    steps: [step],
    state: 'Pending',
    context: {},
    logs: [],
  };

  const engine = new TransactionEngine(transaction);
  const result = await engine.execute();
  expect(result).toBe('RolledBack');
  expect(executed).toBe(true);
  expect(compensated).toBe(true);
  expect(transaction.state).toBe('RolledBack');

  // Clean up
  await prisma.auditEvidence.deleteMany({ where: { transactionId: 'txn1' } });
  await prisma.transaction.delete({ where: { id: 'txn1' } });
});

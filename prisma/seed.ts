import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.log.deleteMany();
  await prisma.transaction.deleteMany();

  // Create sample transactions
  const txn1 = await prisma.transaction.create({
    data: {
      id: 't1',
      agent: 'alice',
      state: 'Committed',
      started: new Date().toISOString(),
      context: { foo: 'bar' },
      steps: [{ id: 's1', type: 'Pure', idempotencyKey: 'k1' }],
    },
  });
  const txn2 = await prisma.transaction.create({
    data: {
      id: 't2',
      agent: 'bob',
      state: 'RolledBack',
      started: new Date(Date.now() - 60000).toISOString(),
      context: { baz: 'qux' },
      steps: [{ id: 's2', type: 'Reversible', idempotencyKey: 'k2' }],
    },
  });
  // Create sample logs
  await prisma.log.create({
    data: {
      transactionId: 't1',
      event: { message: 'Transaction t1 log event' },
    },
  });
  await prisma.log.create({
    data: {
      transactionId: 't2',
      event: { message: 'Transaction t2 log event' },
    },
  });
  console.log('Seeded sample transactions and logs.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());

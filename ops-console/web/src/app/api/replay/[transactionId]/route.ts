import { NextRequest } from 'next/server';
import { getAuditEvidence, logAuditEvidence } from '@/engine/auditEvidence';
import { TransactionEngine } from '@/engine/stateMachine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: { transactionId: string } }) {
  const { transactionId } = await params;
  try {
    const txn = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!txn) {
      return new Response(JSON.stringify({ error: 'Transaction not found' }), { status: 404 });
    }
    // Re-execute transaction (simplified: assumes context and steps are serializable)
    const engine = new TransactionEngine(txn as any);
    await engine.execute();
    // Log replay evidence
    await logAuditEvidence({
      transactionId,
      evidenceType: 'replay',
      data: { replayed: true, timestamp: new Date().toISOString() },
      version: 'v1',
    });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Replay failed', details: String(err) }), { status: 500 });
  }
}

import { NextRequest } from 'next/server';
import { getAuditEvidence } from '@/engine/auditEvidence';

export async function GET(req: NextRequest, { params }: { params: { transactionId: string } }) {
  const { transactionId } = await params;
  try {
    const evidence = await getAuditEvidence(transactionId);
    const original = evidence.filter(e => e.evidenceType !== 'replay');
    const replayed = evidence.filter(e => e.evidenceType === 'replay');
    // Simple drift detection: compare counts and last output
    const drift = original.length !== replayed.length ||
      (original.length > 0 && replayed.length > 0 && JSON.stringify(original[original.length-1].data) !== JSON.stringify(replayed[replayed.length-1].data));
    return new Response(JSON.stringify({ drift, details: { original, replayed } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Drift detection failed', details: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

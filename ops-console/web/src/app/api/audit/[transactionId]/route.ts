import { NextRequest } from 'next/server';
import { getAuditEvidence } from '@/engine/auditEvidence';

export async function GET(req: NextRequest, { params }: { params: { transactionId: string } }) {
  const { transactionId } = await params;
  try {
    const evidence = await getAuditEvidence(transactionId);
    return new Response(JSON.stringify(evidence), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch audit evidence', details: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

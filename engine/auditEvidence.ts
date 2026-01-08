import { PrismaClient, AuditEvidence } from '@prisma/client';

const prisma = new PrismaClient();

export type AuditEvidenceType = 'input' | 'output' | 'policy' | 'signature' | 'replay';

export async function logAuditEvidence(params: {
  transactionId: string;
  evidenceType: AuditEvidenceType;
  data: any;
  signature?: string;
  version?: string;
}) {
  return prisma.auditEvidence.create({
    data: {
      transactionId: params.transactionId,
      evidenceType: params.evidenceType,
      data: params.data,
      signature: params.signature ?? '',
      version: params.version ?? '',
    },
  });
}

export async function getAuditEvidence(transactionId: string): Promise<AuditEvidence[]> {
  return prisma.auditEvidence.findMany({
    where: { transactionId },
    orderBy: { timestamp: 'asc' },
  });
}

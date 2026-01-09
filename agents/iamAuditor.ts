import { TransactionStep, Transaction } from '../engine/types';

export const enumeratePolicies: TransactionStep = {
  id: 'enumerate',
  type: 'Pure',
  execute: async (context) => {
    context.policies = [
      { id: 'policy1', document: '{"Effect":"Allow","Action":"*"}' },
      { id: 'policy2', document: '{"Effect":"Allow","Action":"s3:*"}' },
    ];
  },
  idempotencyKey: 'enumerate-1',
};

export const validatePolicies: TransactionStep = {
  id: 'validate',
  type: 'Reversible',
  execute: async (context) => {
    const violations = context.policies.filter((p: any) => p.document.includes('*'));
    context.violations = violations;
    if (violations.length > 0) throw new Error('Policy violation detected');
  },
  compensate: async (context) => {}, // No-op, but triggers rollback
  idempotencyKey: 'validate-1',
};

export const proposeChanges: TransactionStep = {
  id: 'propose',
  type: 'Pure',
  execute: async (context) => {
    context.proposed = context.violations.map((v: any) => ({ id: v.id, action: 'restrict' }));
  },
  idempotencyKey: 'propose-1',
};

export const applyChanges: TransactionStep = {
  id: 'apply',
  type: 'Reversible',
  execute: async (context) => {
    context.applied = context.proposed;
  },
  compensate: async (context) => {
    context.applied = [];
  },
  idempotencyKey: 'apply-1',
};

export const iamAuditTransaction: Transaction = {
  id: 'iam-audit-1',
  steps: [enumeratePolicies, validatePolicies, proposeChanges, applyChanges],
  state: 'Pending',
  context: {},
  logs: [],
};

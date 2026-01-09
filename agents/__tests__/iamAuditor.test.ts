import { runIamAudit } from '../workflow';

describe('IAM Policy Auditor Reference Agent', () => {
  it('detects policy violations and rolls back', async () => {
    const result = await runIamAudit();
    expect(result.state).toBe('RolledBack');
    expect(Array.isArray(result.context.violations)).toBe(true);
    expect(result.context.violations.length).toBeGreaterThan(0);
    expect(Array.isArray(result.context.applied)).toBe(true);
    expect(result.context.applied).toEqual([]);
  });
});

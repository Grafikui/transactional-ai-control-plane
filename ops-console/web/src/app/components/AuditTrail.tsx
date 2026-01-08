import React, { useEffect, useState } from 'react';
import type { AuditEvidence } from '@prisma/client';

export function AuditTrail({ transactionId }: { transactionId: string }) {
  const [evidence, setEvidence] = useState<AuditEvidence[]>([]);
  const [drift, setDrift] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvidence() {
      setLoading(true);
      const res = await fetch(`/api/audit/${transactionId}`);
      const data = await res.json();
      setEvidence(data);
      setLoading(false);
    }
    async function fetchDrift() {
      const res = await fetch(`/api/drift/${transactionId}`);
      const data = await res.json();
      setDrift(data.drift);
    }
    fetchEvidence();
    fetchDrift();
  }, [transactionId]);

  async function handleReplay() {
    await fetch(`/api/replay/${transactionId}`, { method: 'POST' });
    // Re-fetch evidence and drift after replay
    const res = await fetch(`/api/audit/${transactionId}`);
    setEvidence(await res.json());
    const driftRes = await fetch(`/api/drift/${transactionId}`);
    setDrift((await driftRes.json()).drift);
  }

  return (
    <div className="border rounded p-4 mb-4">
      <h3 className="text-lg font-bold mb-2">Audit Trail</h3>
      <button className="bg-blue-600 text-white px-3 py-1 rounded mb-2" onClick={handleReplay}>
        Replay Transaction
      </button>
      {drift && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-2">Drift detected! Evidence mismatch after replay.</div>
      )}
      {loading ? (
        <div>Loading audit evidence...</div>
      ) : (
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left">Type</th>
              <th className="px-2 py-1 text-left">Timestamp</th>
              <th className="px-2 py-1 text-left">Data</th>
            </tr>
          </thead>
          <tbody>
            {evidence.map(ev => (
              <tr key={ev.id}>
                <td className="px-2 py-1 font-mono">{ev.evidenceType}</td>
                <td className="px-2 py-1 font-mono">{typeof ev.timestamp === 'string' ? ev.timestamp : new Date(ev.timestamp).toISOString()}</td>
                <td className="px-2 py-1"><pre className="whitespace-pre-wrap text-xs">{JSON.stringify(ev.data, null, 2)}</pre></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

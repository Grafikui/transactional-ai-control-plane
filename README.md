# Transactional AI

**A reliability protocol for AI Agents.**
Implement the Saga Pattern with persistent rollback and state recovery for Long-Running Machine (LLM) operations.

[![npm version](https://img.shields.io/npm/v/transactional-ai.svg)](https://www.npmjs.com/package/transactional-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![CI](https://github.com/Grafikui/transactional-ai-control-plane/actions/workflows/ci.yml/badge.svg)

## Why use this?
AI Agents are flaky. Steps fail, APIs time out, and hallucinations happen.
`transactional-ai` gives you:
1.  **Automatic Rollbacks**: If step 3 fails, steps 2 and 1 are compensated (undone) automatically.
2.  **Persistence**: Transactions survive process crashes using Redis or File storage.
3.  **Observability**: Inspect running transactions via the built-in CLI.

## Installation

```bash
npm install transactional-ai
```

---

## Quick Start

### 1. The "Litmus Test" (Basic Usage)
Define a transaction where every action has a compensating rollback action.

```typescript
import { Transaction } from 'transactional-ai';

// 1. Create a named transaction (required for resumability)
const agent = new Transaction('user-onboarding-123');

agent
  .step({
    name: 'create-file',
    execute: async (ctx) => {
       // Do the work
       const file = await googleDrive.createFile('report.txt');
       return file.id; 
    },
    compensate: async (fileId) => {
       // Undo the work
       await googleDrive.deleteFile(fileId);
    }
  })
  .step({
    name: 'email-report',
    execute: async (ctx) => {
       // Use previous results via context or external state
       await emailService.send(ctx.result);
    },
    compensate: async () => {
       await emailService.recallLast();
    }
  });

// 2. Run it
await agent.run({ initialData: 'foo' });
```

### Adding Persistence (Redis)
To survive process crashes, simply provide a storage adapter.

```typescript
import { Transaction, RedisStorage } from 'transactional-ai';

const storage = new RedisStorage('redis://localhost:6379');
const agent = new Transaction('workflow-id-555', storage);

// If the process crashes here, running this code again
// will automatically SKIP completed steps and resume at the failure point.
agent
  .step({ /* ... */ })
  .step({ /* ... */ });

await agent.run();
```

---

## CLI Inspector
You don't need a complex dashboard to see what your agents are doing. Use the included CLI to inspect transaction logs directly from your terminal.

```bash
# Inspect a specific transaction ID (File Storage)
npx tai-inspect workflow-id-555

# Inspect using Redis
export REDIS_URL="redis://localhost:6379"
npx tai-inspect workflow-id-555
```

Output:

```
🔍 Inspecting: workflow-id-555
     Source: RedisStorage

     STEP NAME            | STATUS
     ------------------------------------
     ├── create-file      | ✅ completed
     │       └-> Result: "file_xyz123"
     ├── email-report     | ❌ failed
     └── (comp) create-f..| ✅ completed
```

---

## Advanced Usage

### Audit Mode (Governance)
By default, logs are cleared upon success to save storage space. To keep a permanent audit trail for compliance (e.g., "Why did the agent do this?"), enable Audit Mode:

```typescript
const agent = new Transaction('id', storage, {
    cleanupOnSuccess: false
});
```

### Manual Rollbacks
The library handles rollbacks automatically on error. You can trigger them manually by throwing an error inside any step:

```typescript
// Define a step that throws an error to trigger rollback
agent.step({
    name: 'check-balance',
    execute: async (ctx) => {
        const balance = await getBalance(ctx.userId);
        if (balance < 10) {
             // Throwing an error automatically triggers the compensation 
             // for all previous steps.
             throw new Error("Insufficient funds"); 
        }
    },
    compensate: async () => {
        // No compensation needed for a read-only check
    }
});
```

## Limitations (v0.1.0)
This release is designed as a Single-Process MVP.

1. Concurrency: Do not run the same transaction-id across multiple worker processes simultaneously. Distributed locking (Redlock) is not yet implemented, so race conditions may occur if you horizontally scale workers on the same ID.

2. Storage: Currently supports Redis and local FileSystem. SQL adapters are in development.

---

## Roadmap
[x] Core Saga Engine (Execute/Compensate)

[x] Persistence Adapters (File, Redis)

[x] Resumability (Skip completed steps)

[x] CLI Inspector (tai-inspect)

[ ] Concurrent Transaction Locking

[ ] Postgres/SQL Storage Adapter

---

## License
MIT
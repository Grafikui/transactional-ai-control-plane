# transactional-ai

**A reliability protocol for AI Agents.**

[![npm version](https://img.shields.io/npm/v/transactional-ai.svg)](https://www.npmjs.com/package/transactional-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`transactional-ai` is a headless TypeScript library that enforces the **Saga Pattern** for AI workflows. It prevents agents from leaving systems in broken or "zombie" states by ensuring multi-step actions are either fully completed or cleanly rolled back.

**Key Features:**
* **Atomic Execution:** If Step 3 fails, Steps 1 & 2 are automatically reversed.
* **Crash-Proof:** Persists state to Redis or Files; resumes automatically after server restarts.
* **Audit-Ready:** Keeps a permanent log of every agent action for governance.
* **Zero-UI:** Pure TypeScript library; includes a CLI for inspection.

---

## Installation

```bash
npm install transactional-ai
```

---

## Quick Start

### 1. The "Litmus Test" (Basic Usage)
Define a transaction where every do action has a compensating undo action.

```typescript
import { Transaction } from 'transactional-ai';

// 1. Create a named transaction (required for resumability)
const agent = new Transaction('user-onboarding-123');

await agent.run(async (tx) => {
    // Step 1: Create a resource
    const fileId = await tx.step('create-file', {
        do: () => googleDrive.createFile('report.txt'),
        undo: (result) => googleDrive.deleteFile(result.id)
    });

    // Step 2: Risky external action
    await tx.step('email-report', {
        do: () => emailService.send(fileId),
        undo: () => emailService.recall(fileId)
    });
});
```

### 2. Adding Persistence (Redis)
To survive process crashes, provide a storage adapter.

```typescript
import { Transaction, RedisStorage } from 'transactional-ai';

const storage = new RedisStorage('redis://localhost:6379');
const agent = new Transaction('workflow-id-555', storage);

// If the process crashes during execution, running this code again
// will automatically SKIP completed steps and resume at the failure point.
await agent.run(async (tx) => { /* ... */ });
```

---

## CLI Inspector

You don't need a dashboard to see what your agents are doing. Use the included CLI to inspect transaction logs.

```bash
# Inspect a specific transaction ID
npx tai-inspect workflow-id-555
```

Output:

```
🔍 Inspecting: workflow-id-555
     Source: RedisStorage

     STEP NAME            | STATUS
     ------------------------------------
     ├── create-file      | ✅ completed
     └── email-report     | ⏳ pending
```

---

## Advanced Usage

### Audit Mode (Governance)
By default, logs are cleared upon success to save space. To keep a permanent audit trail for compliance:

```typescript
const agent = new Transaction('id', storage, {
    cleanupOnSuccess: false
});
```

### Manual Rollbacks
The library handles rollbacks automatically on error. You can also trigger them manually inside your workflow logic:

```typescript
await tx.step('check-balance', {
    do: async () => {
        if (balance < 10) throw new Error("Insufficient funds"); // Triggers auto-rollback
    },
    undo: () => {}
});
```

---

## Roadmap

- [x] Core Saga Engine (Do/Undo)
- [x] Persistence Adapters (File, Redis)
- [x] Resumability (Skip completed steps)
- [x] CLI Inspector
- [ ] Concurrent Transaction Locking
- [ ] Postgres/SQL Storage Adapter

---

## License

MIT
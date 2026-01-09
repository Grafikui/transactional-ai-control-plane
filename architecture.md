# Architecture

## Core Concept: The Persistent Saga
The system is built around a lightweight `Transaction` class that maintains a persistent stack of executed steps. Unlike simple `try/catch` blocks, this state is serialized to external storage (Redis) after every step.


## Components

### 1. Transaction Engine (`Transaction.ts`)
* **Responsibility:** Orchestrates the workflow.
* **Logic:** * **On Start:** Loads previous state from Storage.
    * **On Step:** Checks if `step.name` exists in history.
        * If **Yes**: Skips execution, re-hydrates `undo` stack.
        * If **No**: Executes `do()`, pushes to stack, saves to Storage.
    * **On Error:** Iterates stack in reverse, executing `undo()`.

### 2. Storage Adapters (`Storage.ts`)
* **Interface:** `save`, `load`, `clear`.
* **Implementations:**
    * `FileStorage`: JSON files (Dev/Testing).
    * `RedisStorage`: Key-value store with TTL (Production).
* **Data Structure:**
    ```json
    [
      { "name": "step-1", "result": "xyz", "status": "completed" },
      { "name": "step-2", "result": null,  "status": "pending" }
    ]
    ```

### 3. Inspector (`bin/inspect.ts`)
* A standalone CLI tool that connects to the configured storage and renders an ASCII tree of the transaction status.

## Resumability Flow

```mermaid
sequenceDiagram
    participant Agent
    participant Engine
    participant Redis

    Note over Agent: Process Starts (Run 1)
    Agent->>Engine: run(tx_id)
    Engine->>Redis: load(tx_id)
    Redis-->>Engine: null (New Transaction)
    
    Engine->>Agent: Execute Step 1
    Agent-->>Engine: Success
    Engine->>Redis: save(tx_id, [Step1])
    
    Note over Agent: CRASH! (Process Dies)
    
    Note over Agent: Process Restarts (Run 2)
    Agent->>Engine: run(tx_id)
    Engine->>Redis: load(tx_id)
    Redis-->>Engine: [Step1]
    
    Engine->>Agent: Skip Step 1 (Already Done)
    Engine->>Agent: Execute Step 2
    Agent-->>Engine: Success
    Engine->>Redis: save(tx_id, [Step1, Step2])
```



# Transactional AI Control Plane — Architecture & Roadmap


## Architecture Overview

<!-- Add a real architecture diagram here when available -->

**Control Plane Modules:**
- PolicyEngine
- TransactionEngine
- EvidenceLog
- OpsConsole
- LLMAdapters
**Agents:**
- ReferenceAgent (IAM Policy Auditor)

## Core Components

| **Component** | **Description** | **Implementation** |
|-----------|-------------|----------------|
| Transaction Engine | Executes atomic workflows and Saga-pattern rollback | State machine, explicit rollback handlers |
| Policy Engine | Enforces pre/post rules for every action | Custom DSL (Pluggable for OPA/Rego) |
| Evidence Log | Records inputs, context, step outputs for deterministic replay | Event sourcing, SQLite (MVP) |
| Reference Agent | Sample "IAM Policy Auditor" demonstrating safe failure | TypeScript, LLM Adapter |

## Key Capabilities

| **Capability** | **Description** | **Implementation Suggestions/Examples** |
|-----------------------------|-----------------------------------------------------------------------------|------------------------------------------------------|
| Transactional Execution     | Atomic workflows with compensating rollback actions (Saga)      | State machine, explicit rollback handlers            |
| Policy-Governed Runtime     | Policy engine enforces rules pre/post action                       | OPA/Rego, custom DSL, or embedded policy engine      |
| Determinism & Replayability | Deterministic steps replayable from evidence                | Event sourcing, state snapshots, replay CLI          |
| Validation                  | Pre/post validation for all actions and state                                 | Schema validation, dry-run, invariants               |
| Global Safety Controls      | Immediate halt/kill switch, incident triggers, credential isolation          | Ops Console, kill switch API, identity vault         |
| Multi-Provider Resilience   | Integrate multiple LLMs with failover and policy enforcement          | Adapter pattern, provider health checks              |

## Goals & Success Criteria

- Invariants: No partial/irreversible/non-reproducible failures
- Transactional Integrity: All-or-nothing execution with rollback
- Audit-Grade Evidence: All actions signed, timestamped, and replayable

## Open Source & Enterprise Strategy

| **Feature** | **OSS Core** | **Enterprise/SaaS** |
|------------------------|----------|-----------------|
| Transactional Engine   | Yes      | Yes             |
| Policy Engine          | Yes      | Yes             |
| Multi-LLM Integration  | Yes      | Yes             |
| Ops Console (CLI)      | Yes      | Yes             |
| Ops Console (Web)      | No       | Yes             |
| Advanced Audit/Replay  | No       | Yes             |
| SSO/Identity Vault     | No       | Yes             |
| Incident Response API  | No       | Yes             |
| Enterprise Support     | No       | Yes             |

**Adoption Plan:**
- Launch OSS core on GitHub with reference agent and CLI console
- Provide SaaS/enterprise add-ons (web console, SSO, advanced audit, support)
- Target SRE, compliance, and platform engineering communities


## Roadmap

### Immediate Priorities (OSS Core)
- State machine execution engine
- Policy engine integration
- Evidence log and replay CLI
- LLM provider adapters
- Ops Console (CLI, then web)
- Reference agent (IAM Policy Auditor)
- Stress test suite
- Real-world integrations: Replace mock data with actual GitHub/AWS API calls
- Structured Logging: Improve monitoring and alerting hooks
- Replay CLI: A dedicated CLI tool to "play back" an incident from the logs

### Future / Enterprise
- Web-based Ops Console with live production data
- Advanced Evidence Signing (KMS)
- Incident Response API (kill switches)
- Enterprise features rollout


## Strategic Non-Goals

- Not a general-purpose workflow engine
- Not a replacement for cloud-native policy engines (e.g., OPA)
- Agents cannot self-modify policies or runtime code
- No support for non-transactional, best-effort, or probabilistic actions

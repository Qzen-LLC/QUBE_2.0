# Architect Engine — Optimization Guide

## Prompt Architecture

Each artifact is generated fresh by the LLM per use case. Nothing is hardcoded. The 7 prompts live in individual files at `src/lib/architect/prompts/`:

| Prompt File | Constant | Used By | Purpose |
|-------------|----------|---------|---------|
| `system.ts` | `SYSTEM_PROMPT` | `engine/llm-client.ts` | LLM identity and persona |
| `pillar-scoring.ts` | `PILLAR_SCORING_PROMPT` | `engine/interpreter.ts` | Score 5 pillars (green/amber/red/blocker) |
| `context-enrichment.ts` | `CONTEXT_ENRICHMENT_PROMPT` | `engine/interpreter.ts` | Infer ~30 parameters from wizard inputs |
| `risk-generation.ts` | `RISK_GENERATION_PROMPT` | `engine/risk.ts` | Generate risk register (8-15 risks) |
| `threat-generation.ts` | `THREAT_GENERATION_PROMPT` | `engine/threat.ts` | STRIDE-based threat modeling |
| `guardrails-generation.ts` | `GUARDRAILS_GENERATION_PROMPT` | `engine/guardrails.ts` | Layered guardrails + eval metrics |
| `executive-summary.ts` | `EXECUTIVE_SUMMARY_PROMPT` | `generate/route.ts` | Leadership-audience summary |

Backward-compatible re-exports exist in `enrichment.ts` and `generation.ts`.

## Pattern Library

Static reference data at `src/lib/architect/patterns/`:

- **`archetypes.json`** — 6 use case blueprints (enterprise_rag, agentic_workflow, internal_copilot, document_processor, code_assistant, content_generator). Each defines default components, cost drivers, risk profiles, threat vectors, and recommended guardrails.
- **`pricing.json`** — Current pricing catalog for LLM models, embedding models, vector stores, compute, and monitoring. Injected into context enrichment prompt so the LLM picks components with accurate cost data.

## Generation Pipeline Flow

```
Wizard Inputs
  → interpret()
      → PILLAR_SCORING_PROMPT    (pillar scores)
      → CONTEXT_ENRICHMENT_PROMPT (enriched context, uses archetypes.json + pricing.json)
  → [Human Review — override inferred parameters]
  → generateFinOps(context)      (FinOps computation + LLM narrative)
  → generateRisks(context)       (RISK_GENERATION_PROMPT)
  → generateThreats(context)     (THREAT_GENERATION_PROMPT)
  → generateGuardrails(context, threats, risks)  (GUARDRAILS_GENERATION_PROMPT)
  → EXECUTIVE_SUMMARY_PROMPT     (final summary using all outputs)
  → persistOutputsToDb()         (mappers → Prisma models)
```

FinOps, Risks, and Threats run in parallel. Guardrails depends on threats + risks.

## Optimization Layers Per Artifact

Each artifact has 4 layers you can optimize independently:

### Layer 1: Prompt (output quality)
**File:** `src/lib/architect/prompts/<artifact>.ts`

Controls what the LLM generates — number of items, categories, scoring criteria, output schema, specificity instructions. This is the primary lever for improving output quality.

### Layer 2: Engine (post-processing logic)
**File:** `src/lib/architect/engine/<artifact>.ts`

Parses LLM JSON response into typed objects, computes derived fields (e.g., severity counts), applies defaults for missing fields. Modify this to add validation, deduplication, cross-referencing, composite scoring, or multi-pass LLM review.

### Layer 3: Output Model (schema shape)
**File:** `src/lib/architect/models/outputs.ts`

Zod schemas defining what fields exist on each output type. Must be updated whenever new fields are added to a prompt.

### Layer 4: Mapper + DB (persistence)
**Files:** `src/lib/architect/mappers/output-to-prisma.ts` + `prisma/schema.prisma`

Maps LLM output to Prisma models for storage. Must be updated when new fields need to persist to the database.

## Per-Artifact Optimization Reference

### Risk Modeling
| What to optimize | Where to change |
|-----------------|-----------------|
| Risk quality, specificity, categories | `prompts/risk-generation.ts` |
| Number of risks, scoring criteria | `prompts/risk-generation.ts` |
| Post-processing (validation, dedup) | `engine/risk.ts` |
| New fields (residual risk, cost estimates) | `prompts/risk-generation.ts` + `models/outputs.ts` (RiskItemSchema) + `mappers/output-to-prisma.ts` + `prisma/schema.prisma` |

### Threat Modeling
| What to optimize | Where to change |
|-----------------|-----------------|
| Threat depth, STRIDE coverage | `prompts/threat-generation.ts` |
| Component-specific threat analysis | `prompts/threat-generation.ts` |
| Post-processing (severity recalculation) | `engine/threat.ts` |
| New fields (MITRE ATT&CK mapping, CVE refs) | `prompts/threat-generation.ts` + `models/outputs.ts` (ThreatItemSchema) + `mappers/output-to-prisma.ts` + `prisma/schema.prisma` |

### Guardrails & Evals
| What to optimize | Where to change |
|-----------------|-----------------|
| Guardrail layers, coverage logic | `prompts/guardrails-generation.ts` |
| Eval metric definitions | `prompts/guardrails-generation.ts` |
| Threat↔guardrail mapping quality | `prompts/guardrails-generation.ts` |
| New fields (compliance mapping, test cases) | `prompts/guardrails-generation.ts` + `models/outputs.ts` (GuardrailItemSchema/EvalMetricSchema) + `mappers/output-to-prisma.ts` + `prisma/schema.prisma` |

### FinOps
| What to optimize | Where to change |
|-----------------|-----------------|
| Cost calculation accuracy | `engine/finops.ts` (deterministic computation) |
| Narrative quality | `engine/finops.ts` (LLM call at line 228) |
| Line item categories | `engine/finops.ts` + `models/outputs.ts` (CostLineItemSchema) |
| Projection model (36-month) | `src/lib/finops-forecast.ts` |

### Executive Summary
| What to optimize | Where to change |
|-----------------|-----------------|
| Tone, length, structure | `prompts/executive-summary.ts` |
| Data points included | `prompts/executive-summary.ts` + `generate/route.ts` (template variables at lines 118-134) |

### Pillar Scoring
| What to optimize | Where to change |
|-----------------|-----------------|
| Scoring criteria (green/amber/red/blocker) | `prompts/pillar-scoring.ts` |
| Cross-pillar conflict detection | `prompts/pillar-scoring.ts` |
| Follow-up question quality | `prompts/pillar-scoring.ts` |

### Context Enrichment
| What to optimize | Where to change |
|-----------------|-----------------|
| Component selection accuracy | `prompts/context-enrichment.ts` + `patterns/archetypes.json` |
| Pricing accuracy | `patterns/pricing.json` |
| Inference confidence | `prompts/context-enrichment.ts` |
| New inferred parameters | `prompts/context-enrichment.ts` + `models/context.ts` (EnrichedContextSchema) |

## Quick Reference: File Locations

```
src/lib/architect/
├── prompts/                    # 7 individual prompt files (optimize here first)
│   ├── system.ts
│   ├── pillar-scoring.ts
│   ├── context-enrichment.ts
│   ├── executive-summary.ts
│   ├── risk-generation.ts
│   ├── threat-generation.ts
│   ├── guardrails-generation.ts
│   ├── enrichment.ts           # re-exports (backward compat)
│   └── generation.ts           # re-exports (backward compat)
├── engine/                     # Post-processing + LLM orchestration
│   ├── interpreter.ts          # scorePillars + matchArchetype + enrichContext
│   ├── risk.ts                 # generateRisks()
│   ├── threat.ts               # generateThreats()
│   ├── guardrails.ts           # generateGuardrails()
│   ├── finops.ts               # generateFinOps() (deterministic + LLM narrative)
│   └── llm-client.ts           # callLLM / callLLMJson wrapper
├── models/                     # Zod schemas (type definitions)
│   ├── pillars.ts              # Input schemas + enums
│   ├── context.ts              # EnrichedContext schema
│   └── outputs.ts              # Risk/Threat/Guardrail/FinOps output schemas
├── mappers/
│   └── output-to-prisma.ts     # LLM output → DB records
└── patterns/                   # Static reference data
    ├── archetypes.json          # 6 use case blueprints
    └── pricing.json             # Component pricing catalog
```

# QUBE 2.0 — Project Report (Feature + Technology)

## Table of contents
- [Executive summary](#executive-summary)
- [Feature perspective (what users can do)](#feature-perspective-what-users-can-do)
- [Technology perspective (how it’s built)](#technology-perspective-how-its-built)
  - [Agents and agent-like modules](#agents-and-agent-like-modules)
  - [Integrations (external systems)](#integrations-external-systems)
  - [Flat files and reference data](#flat-files-and-reference-data)
- [Domain model overview (Prisma highlights)](#domain-model-overview-prisma-highlights)
- [Security & access control model](#security--access-control-model)
- [Repository map (where to look)](#repository-map-where-to-look)
- [Operational notes / gotchas](#operational-notes--gotchas)

## Executive summary
**QUBE 2.0 is an “AI Use Case Management + AI Governance” platform** built as a Next.js web app with a Postgres/Prisma backend. The core object is a **Use Case**; the platform helps an organization **intake AI use cases, assess them across multiple pillars/frameworks, generate AI architecture/risk artifacts, govern approvals, and monitor financial + operational signals**.

- **Primary UI**: `src/app/dashboard/**` and `src/components/**`
- **Primary backend**: Next.js Route Handlers under `src/app/api/**`
- **Primary data model**: Prisma/Postgres in `prisma/schema.prisma`
- **Key AI pipeline (“Architect Engine”)**: `src/lib/architect/**` (see `docs/architect-optimization-guide.md`)

---

## Feature perspective (what users can do)

### 1) Use case portfolio management (core workflow)
Users can **create, list, and manage AI use cases** with lifecycle fields (stage, priority, owner, business function, etc.), plus structured problem/solution metadata.

- **Dashboard list & operations**: `src/app/dashboard/page.tsx`
  - Search/filter/sort/pagination
  - Owner assignment via org members (`/api/organizations/members`)
  - Budget status badges (pulls from FinOps reconciliation)
- **Use case creation / wizard flow**: `src/app/new-usecase/page.tsx`
  - Wizard input → enrich → human review → generate → redirect to use case page
  - Draft resume support via `wizardDraft` on `UseCase` (DB field)

### 2) “Architect Engine” (LLM-driven architecture assessment)
QUBE includes an LLM pipeline that produces a **structured architecture assessment** for a use case and persists outputs to the DB.

**Pipeline (as implemented + documented)**:
- **Interpretation**: score pillars + enrich context (archetype + pricing injection)
- **Parallel generation**: FinOps + Risks + Threats
- **Dependent generation**: Guardrails (depends on threats + risks)
- **Executive summary**: leadership-focused synthesis
- **Persist**: map outputs into relational tables + store full session blob

Key implementation:
- **Docs**: `docs/architect-optimization-guide.md`
- **Prompts/pattern library**: `src/lib/architect/prompts/**`, `src/lib/architect/patterns/**`
- **Engine**: `src/lib/architect/engine/**`
- **API endpoints**:
  - Enrich: `src/app/api/architect/enrich/route.ts`
  - Generate: `src/app/api/architect/generate/route.ts`
  - Session read: `src/app/api/architect/session/[useCaseId]/route.ts`
- **Persistence targets**:
  - Session blob: `ArchitectSession` model in `prisma/schema.prisma`
  - Structured tables: `Risk`, `Threat`, `Guardrail`/`GuardrailRule`, `FinOps`

### 3) Risk management
QUBE maintains a **risk register per use case** with lifecycle fields (open/in-progress/closed), assignments, mitigation, and provenance.

- **DB model**: `Risk` in `prisma/schema.prisma`
- **UI routes**:
  - Portfolio risks: `src/app/dashboard/risks/page.tsx`
  - Per-usecase risks: `src/app/dashboard/[useCaseId]/risks/page.tsx`
- **APIs**: `src/app/api/risks/[useCaseId]/**`

### 4) Threat modeling
Threats are modeled per use case with STRIDE-style categorization and severity scoring.

- **DB model**: `Threat` in `prisma/schema.prisma`
- **UI**: `src/app/dashboard/threats/page.tsx`
- **APIs**: `src/app/api/threats/[useCaseId]/**`

### 5) Guardrails + governance of guardrail rules
Guardrails are treated as a **versioned, reviewable artifact** with rules that can be **added/edited/approved/rejected**.

- **DB models**: `Guardrail`, `GuardrailRule` (+ `GuardrailRuleStatus`) in `prisma/schema.prisma`
- **APIs**: `src/app/api/guardrails/**` (e.g., `get`, `save`, `rules/add|update|approve`, `export`)
- **Notable behavior**: `src/app/api/guardrails/get/route.ts` merges DB rule state back into the stored configuration blob and can reconstruct config from rules when needed.

### 6) FinOps (costing, portfolio view, reconciliation, insights)
FinOps supports both **planned/projected costs** and **actual-vs-projected reconciliation** with anomaly detection and trend narratives.

- **Core tables**:
  - `FinOps` (base costs per use case)
  - `CostReconciliation` (period, variance lines, anomalies, trendData, narrative)
- **Dashboard/UI**:
  - Portfolio FinOps: `src/app/dashboard/finops-dashboard/page.tsx`
  - Per-use case FinOps: `src/app/dashboard/finops-dashboard/[useCaseId]/page.tsx`
  - Anomalies: `src/app/dashboard/finops-dashboard/anomalies/page.tsx`
- **APIs**: `src/app/api/finops-dashboard/**`
  - Budget status (latest reconciliation per use case): `src/app/api/finops-dashboard/budget-status/route.ts`

**Reconciliation data sources** (priority order):
- **MCP Cost Explorer** (Model Context Protocol): `src/lib/architect/engine/mcp-cost-explorer-client.ts`
- **AWS Cost Explorer via SDK**: `src/lib/architect/engine/finops-reconciliation.ts`
- **Deterministic simulated costs** fallback (for demos/dev)

**LLM-powered FinOps insights**:
- Endpoint: `src/app/api/finops-dashboard/[useCaseId]/generate-insights/route.ts`
- Engine: `src/lib/finops/finops-insights-engine.ts` (OpenAI)

### 7) Compliance frameworks (multi-framework governance)
QUBE has structured assessments for:

- **EU AI Act**
  - Models: `EuAiActAssessment` plus topic/subtopic/question/answer and controls/subcontrols
  - UI: `src/app/dashboard/[useCaseId]/eu-ai-act/**`
  - APIs: `src/app/api/eu-ai-act/**`
- **ISO/IEC 42001**
  - Clause/subclause library + assessment instances + annex instances
  - UI: `src/app/dashboard/[useCaseId]/iso-42001/page.tsx`
  - APIs: `src/app/api/iso-42001/**`
- **ISO 27001**
  - Similar structure to ISO 42001
  - UI: `src/app/dashboard/[useCaseId]/iso-27001/page.tsx`
  - APIs: `src/app/api/iso-27001/**`
- **UAE AI/GenAI Controls**
  - Control library + per-usecase assessment instances with scoring
  - UI: `src/app/dashboard/[useCaseId]/uae-ai/page.tsx`
  - APIs: `src/app/api/uae-ai/**`

### 8) Approvals, oversight, and operational governance
Beyond artifact generation, QUBE models “governance as operations”:

- **Approval workflow** per use case: `Approval` model (multi-approver areas, ratings, conditions)
- **Oversight / GRC-like objects** (org-level):
  - Governance bodies/roles/meetings/charters
  - KPIs, alerts, audits, incidents, policy versions/exceptions, periodic reviews
- **UI routes**:
  - Oversight: `src/app/dashboard/oversight/page.tsx`
  - Governance: `src/app/dashboard/governance/page.tsx`, `src/app/dashboard/governance-setup/page.tsx`
  - Executive: `src/app/dashboard/executive/page.tsx`
- **Representative governance APIs**:
  - Decision routing + timeout checking: `src/app/api/governance/**`
  - Alerts/incidents/audits/kpis: `src/app/api/oversight/**`

### 9) Vendor assessment
Vendor entity with scoring by category/subcategory and approval areas.

- **Models**: `Vendor`, `AssessmentScore`, `ApprovalArea`
- **APIs**: `src/app/api/vendors/**`, `src/app/api/vendor-dashboard/route.ts`
- **UI**: `src/app/dashboard/vendor-assessment/page.tsx`

### 10) Training + sustainability modules
QUBE also includes:

- **Training programs & completions**: `TrainingProgram`, `TrainingCompletion`
  - APIs: `src/app/api/training/**`
  - UI: `src/app/dashboard/training/page.tsx`
- **Sustainability metrics (carbon, energy, green AI recommendations)**:
  - DB: `CarbonFootprint`, `EnergyConsumption`, `SustainabilityMetrics`, `GreenAIRecommendation`
  - APIs: `src/app/api/sustainability/**`
  - UI: `src/app/dashboard/sustainability/page.tsx`

### 11) Collaboration + locking
The system supports scoped locks (ASSESS/EDIT/framework scopes).

- **Model**: `Lock` + `LockScope` enum in `prisma/schema.prisma`
- **APIs**: `src/app/api/locks/**`
- **Test UI**: `src/app/test-lock-release/page.tsx`, `src/app/api/test-lock-release/route.ts`

---

## Technology perspective (how it’s built)

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, TypeScript
- **Styling/UI kits**: Tailwind CSS + Radix UI + Lucide icons
- **App layout**: `src/app/layout.tsx` (ThemeProvider, UserProvider, sidebar layout)

### Backend (API layer)
- **Pattern**: Next.js Route Handlers + centralized auth wrapper `withAuth`
- **Auth enforcement**:
  - Edge gating: `middleware.ts`
  - Endpoint gating: `src/lib/auth-gateway.ts` + org checks in `src/lib/org-scope.ts`
- **Validation/typing**:
  - Zod schemas for architect pipeline under `src/lib/architect/models/**`

### Database and ORM
- **DB**: PostgreSQL
- **ORM**: Prisma (client generated to `src/generated/prisma`)
- **Connection strategy**: pg Pool + Prisma Postgres adapter in `src/utils/db.ts`
- **Schema**: `prisma/schema.prisma`
- **Migrations**: `prisma/migrations/**`
- **Seed scripts**:
  - Prisma seeds: `prisma/seed.ts`, `prisma/seedActual.ts`
  - Domain seeds: `scripts/seed-*.ts` (framework data, questions, budgets, etc.)

### LLM/AI integrations
This repo uses multiple LLM stacks by domain:

- **Architect Engine** (architecture/risk/threat/guardrails/exec summary)
  - Anthropic SDK via `src/lib/architect/engine/llm-client.ts`
  - JSON robustness via `jsonrepair`
- **Evaluation/insights/recommendations/expansion/FinOps insights**
  - OpenAI SDK in `src/lib/ai/**`, `src/lib/finops/**`, `src/lib/expansion/**`
  - Key examples:
    - Assessment expansion: `src/lib/expansion/assessment-expansion-agent.ts` (parallel pillar inference)
    - FinOps insights: `src/lib/finops/finops-insights-engine.ts`
    - Evaluation/insights/recommendations: `src/lib/ai/enhanced-evaluation-engine.ts`, `src/lib/ai/insights-generator.ts`, `src/lib/ai/recommendation-engine.ts`
- **MCP (Model Context Protocol)**
  - Used for cost reconciliation: `src/lib/architect/engine/mcp-cost-explorer-client.ts`

### Agents and agent-like modules
QUBE uses the term “agent” in two distinct ways: **(1) product/domain support for agentic AI systems**, and **(2) internal “agent modules” that encapsulate LLM-powered automation**.

#### 1) Product support for *agentic* AI use cases (Architect Engine)
The Architect Engine is designed to classify and handle agentic systems explicitly.

- **Agent archetypes (reference data)**:
  - `src/lib/architect/patterns/archetypes.json` includes `agentic_workflow` (multi-step tool-using agent) and other “agent” category archetypes (e.g., document processing).
- **Agent-aware context enrichment fields**:
  - `src/lib/architect/prompts/context-enrichment.ts` and `src/lib/architect/engine/interpreter.ts` produce fields like:
    - orchestration pattern (`simple_chain`, `dag`, `multi_agent`, `human_in_loop`)
    - `has_tool_use`
    - `guardrail_layers_required` with agent layers when appropriate
- **Agent-specific guardrail layers**:
  - `src/lib/architect/models/layers.ts` defines layers such as `agent_tool`, `agent_reasoning`, `agent_autonomy`, `agent_cascade`.
  - `src/lib/architect/prompts/guardrails-generation.ts` instructs generation of guardrails/evals for these layers when the use case is agentic (tool input validation, action boundary enforcement, multi-step failure detection, circuit breakers, etc.).

#### 2) Internal “agent modules” (LLM-powered automation components)
These are code modules that behave like agents (specialized LLM calls + parsing + deterministic post-processing).

- **Assessment Expansion Agent** (answer inference across pillars)
  - `src/lib/expansion/assessment-expansion-agent.ts`
  - Runs **7 parallel LLM calls** (one per pillar) using OpenAI (`gpt-4o`) and returns inferred answers with per-field confidence and provenance.
  - Persists into `AssessmentExpansion` (see `prisma/schema.prisma`) when wired through API routes.
- **FinOps Insights Engine** (LLM-generated cost insights)
  - `src/lib/finops/finops-insights-engine.ts` with API route `src/app/api/finops-dashboard/[useCaseId]/generate-insights/route.ts`
  - Produces optimization + hidden cost warnings + growth-rate override suggestions.
- **Evaluation / Insights / Recommendation Engines**
  - `src/lib/ai/enhanced-evaluation-engine.ts` (evaluates a use case across criteria, computes derived scores, generates recommendations)
  - `src/lib/ai/insights-generator.ts` (category-based insights + cross-category insights)
  - `src/lib/ai/recommendation-engine.ts` (rule + context recommendations, SWOT analysis)
- **Guardrails Generator UI “specialists”**
  - `src/components/guardrails/GuardrailsGenerator.tsx` presents a multi-specialist/agent-like UX (status per specialist). The underlying generation/persistence flows route through `src/app/api/guardrails/**`.

#### 3) Agent-risk modeling (non-LLM deterministic scoring)
Some “agent-ness” is captured as part of risk scoring and mapping logic:

- Mapping and risk computation mention agent-specific risk factors such as autonomy, cascading failures, goal misalignment:
  - `src/lib/mappers/answers-to-steps.ts`
  - `src/lib/risk-calculations.ts`

### Integrations (external systems)
QUBE’s integrations are implemented as optional “plug-ins” where possible (feature flags + env + graceful fallbacks).

#### Identity / auth
- **Custom JWT auth** (cookie-based) via `src/services/auth/jwt-auth-service.ts`
- **Edge enforcement**: `middleware.ts`
- **API enforcement**: `src/lib/auth-gateway.ts` (`withAuth`) + org scoping in `src/lib/org-scope.ts`

#### Storage for evidence and attachments
Evidence uploads are supported via server routes; the primary implementation currently uses Vercel Blob, with optional GCS helpers present.

- **Vercel Blob**:
  - Upload: `src/app/api/upload/route.ts` uses `@vercel/blob` `put(...)` to upload evidence to a path shaped like:
    - `evidence/<orgId>/<useCaseId>/<frameworkType>/...` (or individual user path)
  - Delete: `src/app/api/upload/delete/route.ts` uses `@vercel/blob` `del(...)`
  - Requires `BLOB_READ_WRITE_TOKEN` (see `env.example`)
- **Google Cloud Storage (optional helper)**:
  - `src/lib/gcs-upload.ts` provides `uploadToGCS`, `deleteFromGCS`, and signed URL helpers driven by `GCP_PROJECT_ID` and `GCP_STORAGE_BUCKET`.

#### Observability & telemetry
- **OpenTelemetry**: `otel.js` preloads the OTel Node SDK, exports traces/metrics/logs via OTLP exporters, and intercepts console methods to forward logs.
- **Client performance instrumentation**: `src/lib/performance-monitor.ts` collects Core Web Vitals and navigation/resource timing.

#### LLM observability / eval platforms (Langfuse + LangSmith)
Architect “guardrail eval metrics” can be registered and monitored against external platforms, with fallbacks when not configured.

- **Engine**: `src/lib/architect/engine/evals-monitoring.ts`
  - Detects platform based on env + installed deps (`langfuse`, `langsmith`)
  - Can create a **LangSmith dataset** to represent eval metrics (one example per metric)
  - Fetches status from Langfuse scores or LangSmith experiment feedback; falls back to simulated status when unavailable.
- **UI surfaces**: `src/components/architect/EvalsMonitoringTab.tsx`, `src/components/architect/EnrichedContextReview.tsx`
- **Production config storage**: `ProductionConfiguration` model in `prisma/schema.prisma` contains `langfuseEnabled/langsmithEnabled` and related fields.

#### MLflow (model registry discovery + reconciliation)
QUBE can connect to an MLflow tracking server and discover registered models, match them to QUBE use cases, and store discovery results.

- MLflow client: `src/lib/architect/engine/mlflow-client.ts`
- API: `src/app/api/production/mlflow/discover/route.ts`
- DB storage: `MlflowDiscoveredModel` + `ProductionConfiguration` in `prisma/schema.prisma`

#### FinOps “actuals” integration (MCP + AWS Cost Explorer)
FinOps reconciliation is designed to reconcile projected costs against actual costs.

- **MCP Cost Explorer**:
  - `src/lib/architect/engine/mcp-cost-explorer-client.ts` calls an MCP tool (`get_cost_and_usage`) over Streamable HTTP, driven by `MCP_COST_EXPLORER_URL`.
- **AWS Cost Explorer SDK**:
  - `src/lib/architect/engine/finops-reconciliation.ts` can call AWS CE using `@aws-sdk/client-cost-explorer` (and AWS creds), with a simulated fallback.

#### Caching / Redis
- `src/lib/enhanced-cache.ts` supports Redis (`ioredis`) when `REDIS_URL` is present; otherwise it falls back to an in-memory cache.

#### CI/CD and deployment integrations
- **GitHub Actions**:
  - CI: `.github/workflows/ci.yml` runs install, Prisma generate, and unit tests (lint/typecheck steps are present but commented out).
  - Deploy: `.github/workflows/deploy.yml` builds/pushes Docker and deploys to Cloud Run, then (on main/master) runs Prisma migrations.
- **Cloud Build / Cloud Run**:
  - `cloudbuild.yaml` also builds/pushes/deploys to Cloud Run and pulls secrets for runtime.
- **Vercel**:
  - `vercel.json` provides build command, headers, function timeouts, and disables git deployments.

### Flat files and reference data
QUBE uses “flat” files in three main ways: **runtime reference data**, **seed catalogs**, and **docs/assets**.

#### Runtime reference data (loaded directly by app code)
- **Architect archetypes** (use case blueprints / component recommendations / risk profiles):
  - `src/lib/architect/patterns/archetypes.json`
  - Loaded by `src/lib/architect/engine/interpreter.ts` (`import archetypesData from ...`)
- **Pricing catalog** (used for FinOps-aware context enrichment + deterministic costing):
  - `src/lib/architect/patterns/pricing.json`
  - Loaded by `src/lib/architect/engine/interpreter.ts` and `src/lib/architect/engine/finops.ts`

#### Seed catalogs / question banks (repo-managed JSON)
The repo contains pillar-specific question catalogs used by seeding/assessment tooling:

- `scripts/data/pillar-0-requirements.json`
- `scripts/data/pillar-1-technical.json`
- `scripts/data/pillar-2-business.json`
- `scripts/data/pillar-3-responsible-ethical.json`
- `scripts/data/pillar-4-legal-regulatory.json`
- `scripts/data/pillar-5-data-readiness.json`
- `scripts/data/pillar-6-finops.json`

#### External CSV-driven seeding (local file dependency)
Some seed scripts intentionally read CSVs from local filesystem paths (typically `~/Downloads`), which is important operationally.

- Example: `scripts/seed-eu-ai-act-from-csv.ts`
  - Reads `EuAiActControlStruct_rows.csv` and `EuAiActSubcontrolStruct_rows.csv` from a `Downloads` path, then upserts controls/subcontrols.
  - This is a *manual bootstrap tool* rather than an always-on runtime dependency.

#### Documentation and visual assets
- Docs: `docs/architect-optimization-guide.md`, `docs/qube-2.0-project-report.md`
- Architecture diagram: `docs/ai_architecture_diagram.svg`
- Public assets: `public/**` (SVGs, manifest, logos)

### Observability & production integrations
- **OpenTelemetry preload**: `otel.js` (OTLP exporters + console interception)
- **Client performance monitoring**: `src/lib/performance-monitor.ts` (Core Web Vitals observers)
- **MLflow integration**
  - Client: `src/lib/architect/engine/mlflow-client.ts`
  - API: `src/app/api/production/mlflow/discover/route.ts`
  - DB: `MlflowDiscoveredModel`, `ProductionConfiguration`

### Deployment / runtime options
- **Vercel**
  - Config: `vercel.json`
  - Build-time placeholder env: `env.build`
- **Docker / self-host / Cloud Run**
  - Multi-stage Docker build: `Dockerfile`
  - Compose: `docker-compose.yml` (app + postgres + migrate job)
  - GCP Cloud Build: `cloudbuild.yaml` (build/push + deploy to Cloud Run)
- **Next config**: primary is `next.config.ts` (additional `next.config.enhanced.ts` exists)

---

## Domain model overview (Prisma highlights)
The schema is large; the key structural idea is:

- **`UseCase` is the hub**, linked to:
  - **Assessments**: `EuAiActAssessment`, `Iso27001Assessment`, `Iso42001Assessment`, `UaeAiAssessment`
  - **Governance artifacts**: `Approval`, `Guardrail`/`GuardrailRule`
  - **Risk & threat**: `Risk`, `Threat`
  - **FinOps**: `FinOps`, `CostReconciliation`
  - **LLM pipeline session**: `ArchitectSession`
  - **Production readiness**: `ProductionConfiguration`, `MlflowDiscoveredModel`
  - **Answers/Q&A**: `Question`, `Answer`, `QuestionTemplate` (+ options)

At the org level, `Organization` aggregates governance operations and programs (training, sustainability, vendor management, KPIs/alerts/incidents/audits, policies, etc.).

---

## Security & access control model
- **Auth**: custom JWT session cookie (`qube-access-token`) created by `/api/auth/login` and enforced by:
  - Edge middleware: `middleware.ts`
  - Per-endpoint guard: `src/lib/auth-gateway.ts` (`withAuth`)
- **Roles**: `QZEN_ADMIN`, `ORG_ADMIN`, `ORG_USER`, `USER`
- **Org scoping**:
  - `getOrgScope(auth)` returns a Prisma `whereClause` based on role/org membership
  - `verifyUseCaseAccess(auth, useCaseId)` enforces per-usecase access by org match or direct ownership
- **Admin override**: `QZEN_ADMIN` supports `x-org-override` for cross-org context.

---

## Repository map (where to look)
- **UI routes**: `src/app/**/page.tsx`
- **APIs**: `src/app/api/**/route.ts`
- **Architect engine**: `src/lib/architect/**`
- **AI analytics engines**: `src/lib/ai/**`, `src/lib/finops/**`, `src/lib/expansion/**`
- **Auth**: `src/lib/auth-gateway.ts`, `src/services/auth/**`, `middleware.ts`
- **DB**: `prisma/schema.prisma`, `prisma/migrations/**`, `src/utils/db.ts`
- **Deploy**: `Dockerfile`, `docker-compose.yml`, `cloudbuild.yaml`, `vercel.json`

---

## Operational notes / gotchas
- **Dev port fallback**: `next dev` will move off `3000` if it’s in use.
- **Prisma generate in restricted environments** can fail due to cache permissions; running with full permissions works.
- **Secret hygiene**: `.env` contains secrets; avoid committing it. Use `env.example` for sharing and `env.build` for build-time placeholders where needed.


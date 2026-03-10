export const PILLAR_SCORING_PROMPT = `Evaluate the completeness and readiness of the following 5-pillar input
for a Gen AI use case. For each pillar, assign a score and explain why.

## Use Case Input
{use_case_json}

## Instructions
Produce a JSON object:
{
  "technical": { "score": "<green|amber|red|blocker>", "reason": "<why>" },
  "business": { "score": "<green|amber|red|blocker>", "reason": "<why>" },
  "responsible": { "score": "<green|amber|red|blocker>", "reason": "<why>" },
  "legal": { "score": "<green|amber|red|blocker>", "reason": "<why>" },
  "data_readiness": { "score": "<green|amber|red|blocker>", "reason": "<why>" },
  "conflicts": [
    "<description of any cross-pillar conflicts detected>"
  ],
  "proceed": <true|false>,
  "blockers": ["<blocker description if any>"],
  "follow_up_questions": [
    { "pillar": "<pillar>", "question": "<targeted question>", "why_it_matters": "<impact on outputs>" }
  ]
}

Scoring criteria:
- GREEN: Pillar inputs are complete and unambiguous. No inference needed.
- AMBER: Partial inputs. System can infer the rest from archetype defaults with reasonable confidence.
- RED: Critical gaps that would materially change the generated outputs. Max 3 follow-up questions per pillar.
- BLOCKER: A fundamental impediment (e.g., use case violates known regulation, no data exists at all).

Cross-pillar conflicts to check:
- Technical deployment vs. Legal data sovereignty requirements
- Business scale vs. Data readiness (corpus size, quality)
- Responsible oversight requirements vs. Technical complexity
- Business customer-facing flag vs. Legal/Responsible risk levels`;

/**
 * FinOps Aggregator — bridges Pillar 6 (FINOPS) assessment answers
 * into the FinOps table that powers the FinOps dashboard.
 */

import { prismaClient } from '@/utils/db';
import { computeForecastSummary } from '@/lib/finops-forecast';

// ---------------------------------------------------------------------------
// SubCategory → FinOps field mapping
// ---------------------------------------------------------------------------
// Each mapped subCategory contributes to one of the base-cost buckets.
// The "costColumn" indicates which answer field to sum.
// ---------------------------------------------------------------------------
const SUB_CATEGORY_MAP: Record<string, { field: 'apiCostBase' | 'infraCostBase' | 'devCostBase' | 'opCostBase'; costColumn: 'estMonthlyCost' | 'estOneTimeCost' }> = {
  'AI Model & API Costs':                   { field: 'apiCostBase',   costColumn: 'estMonthlyCost' },
  'Infrastructure Costs':                   { field: 'infraCostBase', costColumn: 'estMonthlyCost' },
  'Development Costs':                      { field: 'devCostBase',   costColumn: 'estOneTimeCost' },
  'Team & Resource Costs':                  { field: 'devCostBase',   costColumn: 'estOneTimeCost' },
  'Training & Change Management Costs':     { field: 'devCostBase',   costColumn: 'estOneTimeCost' },
  'Operational Costs':                      { field: 'opCostBase',    costColumn: 'estMonthlyCost' },
  'Licensing & Subscriptions':              { field: 'opCostBase',    costColumn: 'estMonthlyCost' },
  'Compliance & Legal Costs':               { field: 'opCostBase',    costColumn: 'estMonthlyCost' },
  'Environmental & Sustainability Costs':   { field: 'opCostBase',    costColumn: 'estMonthlyCost' },
  'Cost Monitoring & Reporting':            { field: 'opCostBase',    costColumn: 'estMonthlyCost' },
};

// "Total" questions to exclude — they are sums of other questions in the same
// subCategory, so including them would double-count.
const EXCLUDED_QUESTION_NUMBERS = new Set([23, 33, 42, 49]);

// Special single-value extractions by questionNumber
const QUESTION_VALUE_BASE = 69;        // projected annual return → valueBase (÷12 for monthly)
const QUESTION_VALUE_GROWTH_RATE = 96;  // usage growth rate → valueGrowthRate
const QUESTION_BUDGET_RANGE = 59;       // Year 1 budget → budgetRange

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface SyncOptions {
  /** Overwrite even if the existing record has source="manual" */
  force?: boolean;
}

/**
 * Aggregate FINOPS-stage answers for a use case and upsert the FinOps record.
 * Returns the upserted record or `null` if skipped (manual source, no force).
 */
export async function syncFinOpsFromAssessment(
  useCaseId: string,
  opts: SyncOptions = {},
) {
  // 1. Guard: if existing record is manually entered, skip unless forced
  if (!opts.force) {
    const existing = await prismaClient.finOps.findUnique({
      where: { useCaseId },
      select: { source: true },
    });
    if (existing?.source === 'manual') {
      return null;
    }
  }

  // 2. Fetch all answers that link to FINOPS-stage templates for this use case
  const answers = await prismaClient.answer.findMany({
    where: {
      useCaseId,
      questionTemplate: { stage: 'FINOPS' },
    },
    select: {
      estMonthlyCost: true,
      estOneTimeCost: true,
      value: true,
      questionTemplate: {
        select: {
          subCategory: true,
          questionNumber: true,
        },
      },
    },
  });

  // Also fetch answers linked via question → questionTemplate for FINOPS
  const questionAnswers = await prismaClient.answer.findMany({
    where: {
      useCaseId,
      question: { template: { stage: 'FINOPS' } },
    },
    select: {
      estMonthlyCost: true,
      estOneTimeCost: true,
      value: true,
      question: {
        select: {
          template: {
            select: {
              subCategory: true,
              questionNumber: true,
            },
          },
        },
      },
    },
  });

  // Normalise into a flat list
  type AnswerRow = {
    estMonthlyCost: number | null;
    estOneTimeCost: number | null;
    value: any;
    subCategory: string | null;
    questionNumber: number | null;
  };

  const allAnswers: AnswerRow[] = [
    ...answers.map((a) => ({
      estMonthlyCost: a.estMonthlyCost,
      estOneTimeCost: a.estOneTimeCost,
      value: a.value,
      subCategory: a.questionTemplate?.subCategory ?? null,
      questionNumber: a.questionTemplate?.questionNumber ?? null,
    })),
    ...questionAnswers.map((a) => ({
      estMonthlyCost: a.estMonthlyCost,
      estOneTimeCost: a.estOneTimeCost,
      value: a.value,
      subCategory: a.question?.template?.subCategory ?? null,
      questionNumber: a.question?.template?.questionNumber ?? null,
    })),
  ];

  // 3. Aggregate cost buckets
  const buckets = {
    apiCostBase: 0,
    infraCostBase: 0,
    devCostBase: 0,
    opCostBase: 0,
  };

  let valueBase = 0;
  let valueGrowthRate = 0;
  let budgetRange: string | null = null;

  for (const row of allAnswers) {
    const qNum = row.questionNumber;

    // Skip excluded "total" questions
    if (qNum !== null && EXCLUDED_QUESTION_NUMBERS.has(qNum)) continue;

    // Special single-value extractions
    if (qNum === QUESTION_VALUE_BASE) {
      const raw = extractNumeric(row);
      if (raw !== null) valueBase = raw / 12; // annual → monthly
      continue;
    }
    if (qNum === QUESTION_VALUE_GROWTH_RATE) {
      const raw = extractNumeric(row);
      if (raw !== null) valueGrowthRate = raw > 1 ? raw / 100 : raw; // normalise to fraction
      continue;
    }
    if (qNum === QUESTION_BUDGET_RANGE) {
      budgetRange = extractTextValue(row.value);
      continue;
    }

    // Map subCategory to cost bucket
    const subCat = row.subCategory;
    if (!subCat || !SUB_CATEGORY_MAP[subCat]) continue;

    const { field, costColumn } = SUB_CATEGORY_MAP[subCat];
    const cost = costColumn === 'estMonthlyCost' ? row.estMonthlyCost : row.estOneTimeCost;
    if (cost !== null && cost !== undefined && !isNaN(cost)) {
      buckets[field] += cost;
    }
  }

  // 4. Compute derived metrics via forecast utility
  const summary = computeForecastSummary({
    devCostBase: buckets.devCostBase,
    apiCostBase: buckets.apiCostBase,
    infraCostBase: buckets.infraCostBase,
    opCostBase: buckets.opCostBase,
    valueBase,
    valueGrowthRate,
  });

  // 5. Upsert the FinOps record
  const data = {
    ...buckets,
    valueBase,
    valueGrowthRate,
    budgetRange,
    ROI: summary.ROI,
    netValue: summary.netValue,
    cumOpCost: summary.cumOpCost,
    cumValue: summary.cumValue,
    totalInvestment: summary.totalInvestment,
    breakEvenMonth: summary.breakEvenMonth,
    source: 'assessment',
    lastAggregatedAt: new Date(),
  };

  const result = await prismaClient.finOps.upsert({
    where: { useCaseId },
    update: data,
    create: { useCaseId, ...data },
  });

  return result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract a numeric value from an answer row (from the value JSON or cost fields). */
function extractNumeric(row: { value: any; estMonthlyCost: number | null; estOneTimeCost: number | null }): number | null {
  // First try the JSON value field
  const v = row.value;
  if (v !== null && v !== undefined) {
    if (typeof v === 'number') return v;
    if (typeof v === 'object' && v.text !== undefined) {
      const n = Number(v.text);
      if (!isNaN(n)) return n;
    }
    if (typeof v === 'string') {
      const n = Number(v);
      if (!isNaN(n)) return n;
    }
  }
  // Fall back to cost fields
  if (row.estMonthlyCost !== null) return row.estMonthlyCost;
  if (row.estOneTimeCost !== null) return row.estOneTimeCost;
  return null;
}

/** Extract a text value from a JSON value field. */
function extractTextValue(v: any): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object' && v.text !== undefined) return String(v.text);
  if (typeof v === 'object' && v.labels && Array.isArray(v.labels)) return v.labels.join(', ');
  return null;
}

/**
 * Shared 36-month FinOps forecast utility.
 *
 * Growth rates (annualised, compounded monthly):
 *   API costs:            12 %/yr
 *   Infrastructure costs:  5 %/yr
 *   Operations costs:      8 %/yr
 *   Value:                 user-supplied valueGrowthRate (fraction, e.g. 0.15 = 15 %)
 */

const FORECAST_MONTHS = 36;

export interface ForecastActual {
  month: number; // 1-indexed month
  totalCost: number;
}

export interface ForecastInputs {
  devCostBase: number;
  apiCostBase: number;
  infraCostBase: number;
  opCostBase: number;
  valueBase: number;
  valueGrowthRate: number; // fraction, e.g. 0.15
  // Optional growth rate overrides (default: API 12%, infra 5%, ops 8%)
  overrideApiGrowthRate?: number;   // fraction, e.g. 0.15
  overrideInfraGrowthRate?: number;
  overrideOpsGrowthRate?: number;
  // Optional actuals for blending reconciliation data into forecast
  actuals?: ForecastActual[];
}

export interface ForecastRow {
  month: number;
  apiCost: number;
  infraCost: number;
  opCost: number;
  totalMonthlyCost: number;
  monthlyValue: number;
  cumulativeValue: number;
  cumulativeOpCosts: number;
  totalInvestment: number;
  monthlyProfit: number;
  netValue: number;
  ROI: number;
  breakEvenMonth: number;
}

export interface ForecastSummary {
  ROI: number;
  netValue: number;
  cumOpCost: number;
  cumValue: number;
  totalInvestment: number;
  breakEvenMonth: number;
}

/**
 * Compute a correction factor from actuals using exponential smoothing.
 * Uses the last 3 reconciliation actuals to derive an actual/projected ratio.
 */
function computeCorrectionFactor(actuals: ForecastActual[], projectedCosts: Map<number, number>): number {
  // Take the last 3 actuals that have corresponding projections
  const ratios: number[] = [];
  for (const actual of actuals.slice(-3)) {
    const projected = projectedCosts.get(actual.month);
    if (projected && projected > 0) {
      ratios.push(actual.totalCost / projected);
    }
  }
  if (ratios.length === 0) return 1;

  // Exponential smoothing: more recent ratios have higher weight
  const alpha = 0.5;
  let smoothed = ratios[0];
  for (let i = 1; i < ratios.length; i++) {
    smoothed = alpha * ratios[i] + (1 - alpha) * smoothed;
  }
  return smoothed;
}

/**
 * Compute month-by-month forecast rows for the given cost/value inputs.
 * When `actuals` is provided, past months use actual cost values and
 * future months apply a correction factor based on observed variance trend.
 */
export function computeForecastRows(inputs: ForecastInputs): ForecastRow[] {
  const {
    devCostBase, apiCostBase, infraCostBase, opCostBase, valueBase, valueGrowthRate,
    overrideApiGrowthRate, overrideInfraGrowthRate, overrideOpsGrowthRate,
    actuals,
  } = inputs;

  const apiGrowth = 1 + (overrideApiGrowthRate ?? 0.12);
  const infraGrowth = 1 + (overrideInfraGrowthRate ?? 0.05);
  const opsGrowth = 1 + (overrideOpsGrowthRate ?? 0.08);

  // Build actuals lookup
  const actualsMap = new Map<number, number>();
  if (actuals) {
    for (const a of actuals) {
      actualsMap.set(a.month, a.totalCost);
    }
  }

  // Pre-compute projected costs for correction factor calculation
  const projectedCostsMap = new Map<number, number>();
  for (let month = 1; month <= FORECAST_MONTHS; month++) {
    const apiCost = apiCostBase * Math.pow(apiGrowth, month / 12);
    const infraCost = infraCostBase * Math.pow(infraGrowth, month / 12);
    const opCost = opCostBase * Math.pow(opsGrowth, month / 12);
    projectedCostsMap.set(month, apiCost + infraCost + opCost);
  }

  // Compute correction factor from actuals
  const correctionFactor = actuals && actuals.length > 0
    ? computeCorrectionFactor(actuals, projectedCostsMap)
    : 1;

  const maxActualMonth = actuals && actuals.length > 0
    ? Math.max(...actuals.map((a) => a.month))
    : 0;

  let cumulativeValue = 0;
  let cumulativeOpCosts = 0;
  let breakEvenMonth = 0;
  const rows: ForecastRow[] = [];

  for (let month = 1; month <= FORECAST_MONTHS; month++) {
    const apiCost = apiCostBase * Math.pow(apiGrowth, month / 12);
    const infraCost = infraCostBase * Math.pow(infraGrowth, month / 12);
    const opCost = opCostBase * Math.pow(opsGrowth, month / 12);
    const projectedCost = apiCost + infraCost + opCost;

    let totalMonthlyCost: number;

    if (actualsMap.has(month)) {
      // Past month with actual data — use actual values
      totalMonthlyCost = actualsMap.get(month)!;
    } else if (month > maxActualMonth && correctionFactor !== 1) {
      // Future month — apply correction factor from observed variance trend
      totalMonthlyCost = projectedCost * correctionFactor;
    } else {
      totalMonthlyCost = projectedCost;
    }

    const monthlyValue = valueBase * Math.pow(1 + valueGrowthRate, month / 12);

    cumulativeValue += monthlyValue;
    cumulativeOpCosts += totalMonthlyCost;

    const totalInvestment = devCostBase + cumulativeOpCosts;
    const monthlyProfit = monthlyValue - totalMonthlyCost;
    const netValue = cumulativeValue - totalInvestment;
    const ROI = totalInvestment > 0 ? (netValue / totalInvestment) * 100 : 0;

    if (breakEvenMonth === 0 && netValue >= 0) breakEvenMonth = month;

    rows.push({
      month,
      apiCost: actualsMap.has(month) ? totalMonthlyCost * (apiCost / projectedCost || 1/3) : apiCost,
      infraCost: actualsMap.has(month) ? totalMonthlyCost * (infraCost / projectedCost || 1/3) : infraCost,
      opCost: actualsMap.has(month) ? totalMonthlyCost * (opCost / projectedCost || 1/3) : opCost,
      totalMonthlyCost,
      monthlyValue,
      cumulativeValue,
      cumulativeOpCosts,
      totalInvestment,
      monthlyProfit,
      netValue,
      ROI,
      breakEvenMonth: 0, // placeholder, filled below
    });
  }

  // Backfill the final break-even month into every row
  return rows.map((r) => ({ ...r, breakEvenMonth }));
}

/**
 * Derive summary metrics from the last row of the forecast.
 */
export function computeForecastSummary(inputs: ForecastInputs): ForecastSummary {
  const rows = computeForecastRows(inputs);
  const last = rows[rows.length - 1];
  return {
    ROI: last?.ROI ?? 0,
    netValue: last?.netValue ?? 0,
    cumOpCost: last?.cumulativeOpCosts ?? 0,
    cumValue: last?.cumulativeValue ?? 0,
    totalInvestment: last?.totalInvestment ?? 0,
    breakEvenMonth: last?.breakEvenMonth ?? 0,
  };
}

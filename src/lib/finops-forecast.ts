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
 * Compute month-by-month forecast rows for the given cost/value inputs.
 */
export function computeForecastRows(inputs: ForecastInputs): ForecastRow[] {
  const {
    devCostBase, apiCostBase, infraCostBase, opCostBase, valueBase, valueGrowthRate,
    overrideApiGrowthRate, overrideInfraGrowthRate, overrideOpsGrowthRate,
  } = inputs;

  const apiGrowth = 1 + (overrideApiGrowthRate ?? 0.12);
  const infraGrowth = 1 + (overrideInfraGrowthRate ?? 0.05);
  const opsGrowth = 1 + (overrideOpsGrowthRate ?? 0.08);

  let cumulativeValue = 0;
  let cumulativeOpCosts = 0;
  let breakEvenMonth = 0;
  const rows: ForecastRow[] = [];

  for (let month = 1; month <= FORECAST_MONTHS; month++) {
    const apiCost = apiCostBase * Math.pow(apiGrowth, month / 12);
    const infraCost = infraCostBase * Math.pow(infraGrowth, month / 12);
    const opCost = opCostBase * Math.pow(opsGrowth, month / 12);
    const totalMonthlyCost = apiCost + infraCost + opCost;
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
      apiCost,
      infraCost,
      opCost,
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

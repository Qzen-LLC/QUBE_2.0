#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

interface CoverageSummary {
  total: {
    lines: { pct: number };
    statements: { pct: number };
    functions: { pct: number };
    branches: { pct: number };
  };
}

interface LcovStats {
  linesFound: number;
  linesHit: number;
  functionsFound: number;
  functionsHit: number;
  branchesFound: number;
  branchesHit: number;
}

function readCoverageSummaryJson(filePath: string): CoverageSummary | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as CoverageSummary;
  } catch (error) {
    return null;
  }
}

function parseLcovInfo(filePath: string): LcovStats | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    let linesFound = 0;
    let linesHit = 0;
    let functionsFound = 0;
    let functionsHit = 0;
    let branchesFound = 0;
    let branchesHit = 0;
    
    for (const line of lines) {
      if (line.startsWith('LF:')) {
        linesFound += parseInt(line.substring(3), 10) || 0;
      } else if (line.startsWith('LH:')) {
        linesHit += parseInt(line.substring(3), 10) || 0;
      } else if (line.startsWith('FNF:')) {
        functionsFound += parseInt(line.substring(4), 10) || 0;
      } else if (line.startsWith('FNH:')) {
        functionsHit += parseInt(line.substring(4), 10) || 0;
      } else if (line.startsWith('BRF:')) {
        branchesFound += parseInt(line.substring(4), 10) || 0;
      } else if (line.startsWith('BRH:')) {
        branchesHit += parseInt(line.substring(4), 10) || 0;
      }
    }
    
    return {
      linesFound,
      linesHit,
      functionsFound,
      functionsHit,
      branchesFound,
      branchesHit,
    };
  } catch (error) {
    return null;
  }
}

function calculatePercentage(hit: number, found: number): number {
  if (found === 0) return 0;
  return Math.round((hit / found) * 100);
}

function formatPercentage(value: number): string {
  return `${value}%`;
}

function printCoverageSummary(
  statements: number,
  branches: number,
  functions: number,
  lines: number
): void {
  console.log('All files');
  console.log('');
  console.log(`Statements : ${formatPercentage(statements)}`);
  console.log(`Branches   : ${formatPercentage(branches)}`);
  console.log(`Functions  : ${formatPercentage(functions)}`);
  console.log(`Lines      : ${formatPercentage(lines)}`);
}

function main(): void {
  const coverageDir = path.join(process.cwd(), 'coverage');
  const summaryJsonPath = path.join(coverageDir, 'coverage-summary.json');
  const lcovInfoPath = path.join(coverageDir, 'lcov.info');
  
  // Try to read coverage-summary.json first
  const summaryJson = readCoverageSummaryJson(summaryJsonPath);
  
  if (summaryJson && summaryJson.total) {
    const { statements, branches, functions, lines } = summaryJson.total;
    printCoverageSummary(
      statements.pct,
      branches.pct,
      functions.pct,
      lines.pct
    );
    return;
  }
  
  // Fallback to parsing lcov.info
  const lcovStats = parseLcovInfo(lcovInfoPath);
  
  if (!lcovStats) {
    console.error('Error: Coverage files not found.');
    console.error(`Expected one of:`);
    console.error(`  - ${summaryJsonPath}`);
    console.error(`  - ${lcovInfoPath}`);
    process.exit(1);
  }
  
  const statements = calculatePercentage(
    lcovStats.linesHit,
    lcovStats.linesFound
  );
  const branches = calculatePercentage(
    lcovStats.branchesHit,
    lcovStats.branchesFound
  );
  const functions = calculatePercentage(
    lcovStats.functionsHit,
    lcovStats.functionsFound
  );
  const lines = calculatePercentage(
    lcovStats.linesHit,
    lcovStats.linesFound
  );
  
  printCoverageSummary(statements, branches, functions, lines);
}

main();

















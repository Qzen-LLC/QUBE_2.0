"use client"


import { PolarAngleAxis, PolarGrid, Radar, RadarChart, PolarRadiusAxis, Tooltip } from "recharts"
import React from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A radar chart with dots"

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ChartRadarDots({ chartData }: { chartData: Array<{ month: string; desktop: number }> }) {
  // Theme-aware palette for high-contrast light/dark rendering
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const COLORS = isDark ? {
    grid: '#334155',          // slate-700
    axis: '#94a3b8',          // slate-400
    label: '#e2e8f0',         // slate-200
    tooltipBg: '#111827',     // gray-900
    tooltipText: '#e5e7eb',   // gray-200
    radarStroke: '#f59e0b',   // amber-500
    radarFill: 'rgba(245, 158, 11, 0.25)',
    high: '#ef4444',          // red-500
    medium: '#f59e0b',        // amber-500
    low: '#22c55e',           // green-500
  } : {
    grid: '#e5e7eb',          // gray-200
    axis: '#6b7280',          // gray-500
    label: '#374151',         // gray-700
    tooltipBg: '#ffffff',
    tooltipText: '#111827',   // gray-900
    radarStroke: '#fb923c',   // orange-400
    radarFill: 'rgba(251, 146, 60, 0.25)',
    high: '#ef4444',          // red-500
    medium: '#f59e0b',        // amber-500
    low: '#10b981',           // emerald-500
  } as const;
  // Helper to determine color based on risk value
  const getRiskColor = (value: number) => {
    if (value >= 8) return COLORS.high; // High
    if (value >= 4) return COLORS.medium; // Medium
    return COLORS.low; // Low
  };
  // Find top risk
  const topRisk = chartData.reduce((max, curr) => curr.desktop > max.desktop ? curr : max, chartData[0]);
  // Custom dot component (smaller)
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const color = getRiskColor(payload.desktop);
    return (
      <g>
        <circle cx={cx} cy={cy} r={3} fill={color} stroke={color} strokeWidth={1.5} />
        {/* Value label */}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="12" fill={COLORS.label} fontWeight="bold">{payload.desktop}</text>
      </g>
    );
  };
  return (
    <Card>
      <CardHeader className="items-center">
        {/* Top Risk Callout */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-base text-foreground">Top Risk:</span>
          <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ background: getRiskColor(topRisk.desktop), color: '#ffffff' }}>{topRisk.month} ({topRisk.desktop}/10)</span>
        </div>
        <CardTitle>Risk Radar Chart</CardTitle>
        <CardDescription>
        A 6-month risk profile across critical categories: Data Privacy, Security, Compliance, Ethics, and Operations.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
                 <ChartContainer
           config={chartConfig}
           className="mx-auto w-full max-w-[600px] h-[400px] rounded-lg p-4"
         >
                    <RadarChart data={chartData} outerRadius={120} style={{ background: 'transparent' }}>
                         <Tooltip 
               formatter={(value, name, props) => [`${value}/10`, `${props && props.payload ? props.payload.month : name}`]}
               contentStyle={{
                backgroundColor: COLORS.tooltipBg,
                border: `1px solid ${COLORS.grid}`,
                 borderRadius: '8px',
                color: COLORS.tooltipText
               }}
             />
                        <PolarGrid stroke={COLORS.grid} strokeOpacity={0.9} />
            <PolarAngleAxis dataKey="month" tick={{ fontSize: 14, fill: COLORS.label }} stroke={COLORS.grid} />
            <PolarRadiusAxis domain={[0, 10]} tick={{ fill: COLORS.axis }} stroke={COLORS.grid} />
                         <Radar
               dataKey="desktop"
              fill={COLORS.radarFill}
              fillOpacity={1}
               dot={<CustomDot />}
              stroke={COLORS.radarStroke}
               strokeWidth={3}
             />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        {/* Add a legend for color coding */}
        <div className="flex gap-4 mt-2">
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full" style={{ background: COLORS.high }} /> High Risk</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full" style={{ background: COLORS.medium }} /> Medium Risk</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full" style={{ background: COLORS.low }} /> Low Risk</span>
        </div>
      </CardFooter>
    </Card>
  )
}

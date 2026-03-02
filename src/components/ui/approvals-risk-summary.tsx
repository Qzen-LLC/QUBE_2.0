"use client"

import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Shield } from "lucide-react"
import { ChartContainer } from "@/components/ui/chart"
import { RadialBarChart, RadialBar, PolarGrid, PolarRadiusAxis, Label } from "recharts"
import * as React from "react"

export type ApprovalsRiskSummaryProps = {
  score: number
  riskTier: "critical" | "high" | "medium" | "low"
  trend?: "increasing" | "decreasing" | "stable"
  criticalCount: number
  highCount: number
  mediumCount: number
}

const riskTierConfig = {
  critical: { label: "CRITICAL RISK", color: "#ef4444", dot: "#ef4444" },
  high: { label: "HIGH RISK", color: "#fb923c", dot: "#fb923c" },
  medium: { label: "MEDIUM RISK", color: "#fde047", dot: "#fde047" },
  low: { label: "LOW RISK", color: "#22c55e", dot: "#22c55e" },
}

export function ApprovalsRiskSummary({
  score,
  riskTier,
  trend = "increasing",
  criticalCount,
  highCount,
  mediumCount,
}: ApprovalsRiskSummaryProps) {
  const tier = riskTierConfig[riskTier]
  const chartData = [
    { name: "Risk", value: score },
  ]
  return (
    <Card className="w-full max-w-3xl mx-auto p-6 flex flex-col gap-4 shadow-lg rounded-2xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-muted-foreground mb-1">Overall Risk Score</div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-foreground">{score.toFixed(1)}</span>
            <span className="text-lg text-muted-foreground">/10</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white`} style={{ background: tier.color }}>{tier.label}</span>
            {trend === "increasing" && (
              <span className="flex items-center text-xs text-muted-foreground ml-2">
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16" className="mr-1"><path d="M2 10l4-4 3 3 5-5" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 5V2h-3" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Increasing
              </span>
            )}
            {trend === "decreasing" && (
              <span className="flex items-center text-xs text-muted-foreground ml-2">
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16" className="mr-1"><path d="M2 6l4 4 3-3 5 5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11v3h-3" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Decreasing
              </span>
            )}
            {trend === "stable" && (
              <span className="flex items-center text-xs text-muted-foreground ml-2">
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16" className="mr-1"><path d="M2 8h12" stroke="#a3a3a3" strokeWidth="2" strokeLinecap="round"/></svg>
                Stable
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center min-w-[120px]">
          <ChartContainer config={{}} className="relative w-[100px] h-[100px]">
            <RadialBarChart
              width={100}
              height={100}
              cx={50}
              cy={50}
              innerRadius={38}
              outerRadius={48}
              barSize={10}
              data={chartData}
              startAngle={225}
              endAngle={-45}
            >
              <PolarGrid gridType="circle" radialLines={false} stroke="none" />
              <RadialBar
                background
                dataKey="value"
                cornerRadius={10}
                fill={tier.color}
              />
              <PolarRadiusAxis
                type="number"
                domain={[0, 10]}
                tick={false}
                axisLine={false}
                tickLine={false}
              >
                <Label
                  position="center"
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      const cx = viewBox.cx ?? 50;
                      const cy = viewBox.cy ?? 50;
                      return (
                        <g>
                          <text
                            x={cx}
                            y={cy - 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="fill-foreground"
                            fontSize="2rem"
                            fontWeight="bold"
                          >
                            {score.toFixed(1)}
                          </text>
                          <Shield x={cx - 12} y={cy + 10} width={24} height={24} stroke={tier.color} strokeWidth={2} />
                        </g>
                      )
                    }
                  }}
                />
              </PolarRadiusAxis>
            </RadialBarChart>
          </ChartContainer>
        </div>
      </div>
      <Separator className="my-2" />
      <div className="flex justify-around text-center">
        <div>
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
            <span className="font-bold text-lg text-foreground">{criticalCount}</span>
          </div>
          <div className="text-xs text-muted-foreground">Critical Risks</div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="h-2 w-2 rounded-full bg-orange-400 inline-block" />
            <span className="font-bold text-lg text-foreground">{highCount}</span>
          </div>
          <div className="text-xs text-muted-foreground">High Risks</div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="h-2 w-2 rounded-full bg-yellow-300 inline-block" />
            <span className="font-bold text-lg text-foreground">{mediumCount}</span>
          </div>
          <div className="text-xs text-muted-foreground">Medium Risks</div>
        </div>
      </div>
    </Card>
  )
} 
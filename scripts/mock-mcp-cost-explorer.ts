/**
 * Mock MCP Cost Explorer Server
 *
 * Simulates the AWS Cost Explorer MCP server using Streamable HTTP transport.
 * Returns realistic randomized cost data in the same format as the real AWS server.
 *
 * Usage:
 *   npx tsx scripts/mock-mcp-cost-explorer.ts
 *
 * Then set in .env:
 *   MCP_COST_EXPLORER_URL=http://localhost:3001/mcp
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { z } from "zod";

const app = express();
app.use(express.json());

// ── Realistic AWS service cost data ──────────────────────

const SERVICE_COSTS: Record<string, { min: number; max: number }> = {
  "Amazon Bedrock": { min: 2000, max: 8000 },
  "Amazon SageMaker": { min: 1000, max: 5000 },
  "AWS Lambda": { min: 200, max: 1500 },
  "Amazon API Gateway": { min: 100, max: 800 },
  "Amazon EC2": { min: 1500, max: 6000 },
  "Amazon ECS": { min: 500, max: 3000 },
  "Amazon RDS": { min: 400, max: 2000 },
  "Amazon S3": { min: 100, max: 500 },
  "Amazon DynamoDB": { min: 200, max: 1000 },
  "Amazon CloudWatch": { min: 50, max: 300 },
  "AWS CloudTrail": { min: 20, max: 100 },
  "Amazon CloudFront": { min: 100, max: 600 },
};

// Maps tag values to service subsets for per-use-case simulation
const TAG_SERVICE_MAP: Record<string, string[]> = {
  "AIUC-1": ["Amazon Bedrock", "AWS Lambda", "Amazon API Gateway", "Amazon S3", "Amazon CloudWatch"],
  "AIUC-2": ["Amazon SageMaker", "Amazon ECS", "Amazon RDS", "Amazon DynamoDB", "AWS CloudTrail"],
  "AIUC-3": ["Amazon EC2", "Amazon ECS", "Amazon CloudFront", "Amazon S3"],
};

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function generateCostData(
  startDate: string,
  endDate: string,
  filter?: { Tags?: { Key: string; Values: string[]; MatchOptions?: string[] } }
) {
  let servicesToUse = Object.entries(SERVICE_COSTS);
  let costScale = 1.0;

  if (filter?.Tags) {
    const tagValue = filter.Tags.Values?.[0];
    console.log(`[MCP] Tag filter: ${filter.Tags.Key} = ${tagValue}`);

    const mappedServices = TAG_SERVICE_MAP[tagValue];
    if (mappedServices) {
      servicesToUse = servicesToUse.filter(([name]) => mappedServices.includes(name));
    } else {
      // Unknown tag value — return a random subset (half the services)
      servicesToUse = servicesToUse.filter((_, i) => i % 2 === 0);
    }
    costScale = 0.3 + Math.random() * 0.3; // 30-60% of full range
  }

  const groups = servicesToUse.map(([service, range]) => ({
    Keys: [service],
    Metrics: {
      UnblendedCost: {
        Amount: String(randomBetween(range.min * costScale, range.max * costScale)),
        Unit: "USD",
      },
    },
  }));

  return {
    ResultsByTime: [
      {
        TimePeriod: { Start: startDate, End: endDate },
        Total: {},
        Groups: groups,
        Estimated: true,
      },
    ],
    DimensionValueAttributes: [],
  };
}

// ── Factory: creates a fresh McpServer per session ───────

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "mock-aws-cost-explorer",
    version: "1.0.0",
  });

  server.tool(
    "get_cost_and_usage",
    "Get AWS cost and usage data for a specified time period",
    {
      start_date: z.string().describe("Start date (YYYY-MM-DD)"),
      end_date: z.string().describe("End date (YYYY-MM-DD)"),
      granularity: z
        .enum(["DAILY", "MONTHLY", "HOURLY"])
        .default("MONTHLY")
        .describe("Time granularity"),
      metrics: z
        .array(z.string())
        .default(["UnblendedCost"])
        .describe("Cost metrics to retrieve"),
      group_by: z
        .array(z.object({ Type: z.string(), Key: z.string() }))
        .optional()
        .describe("Grouping dimensions"),
      filter: z
        .object({
          Tags: z.object({
            Key: z.string(),
            Values: z.array(z.string()),
            MatchOptions: z.array(z.string()).optional(),
          }).optional(),
        })
        .optional()
        .describe("Cost filter (e.g. by cost allocation tags)"),
    },
    async ({ start_date, end_date, granularity, filter }) => {
      console.log(
        `[MCP] get_cost_and_usage: ${start_date} to ${end_date} (${granularity})`
      );

      const data = generateCostData(start_date, end_date, filter);
      const totalCost = data.ResultsByTime[0].Groups.reduce(
        (sum, g) => sum + parseFloat(g.Metrics.UnblendedCost.Amount),
        0
      );

      console.log(
        `[MCP] Returning ${data.ResultsByTime[0].Groups.length} services, total: $${totalCost.toFixed(2)}`
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_cost_forecast",
    "Get a cost forecast for a future time period",
    {
      start_date: z.string().describe("Forecast start date (YYYY-MM-DD)"),
      end_date: z.string().describe("Forecast end date (YYYY-MM-DD)"),
      granularity: z.enum(["DAILY", "MONTHLY"]).default("MONTHLY"),
      metric: z.string().default("UNBLENDED_COST"),
    },
    async ({ start_date, end_date }) => {
      console.log(`[MCP] get_cost_forecast: ${start_date} to ${end_date}`);

      const forecast = {
        Total: {
          Amount: String(randomBetween(8000, 25000)),
          Unit: "USD",
        },
        ForecastResultsByTime: [
          {
            TimePeriod: { Start: start_date, End: end_date },
            MeanValue: String(randomBetween(10000, 20000)),
            PredictionIntervalLowerBound: String(randomBetween(7000, 12000)),
            PredictionIntervalUpperBound: String(randomBetween(15000, 28000)),
          },
        ],
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(forecast, null, 2),
          },
        ],
      };
    }
  );

  return server;
}

// ── Streamable HTTP transport ────────────────────────────

// Store transports by session ID for proper session management
const transports = new Map<string, StreamableHTTPServerTransport>();

app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (sessionId && transports.has(sessionId)) {
    // Existing session — reuse transport
    const transport = transports.get(sessionId)!;
    await transport.handleRequest(req, res, req.body);
    return;
  }

  // New session — create a fresh server + transport pair
  const mcpServer = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    onsessioninitialized: (id) => {
      transports.set(id, transport);
      console.log(`[MCP] Session initialized: ${id}`);
    },
  });

  transport.onclose = () => {
    const id = [...transports.entries()].find(
      ([, t]) => t === transport
    )?.[0];
    if (id) {
      transports.delete(id);
      console.log(`[MCP] Session closed: ${id}`);
    }
  };

  await mcpServer.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// Handle GET for SSE streams (if client uses them)
app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (sessionId && transports.has(sessionId)) {
    const transport = transports.get(sessionId)!;
    await transport.handleRequest(req, res);
    return;
  }
  res.status(400).json({ error: "No session. Send POST first." });
});

// Handle DELETE for session cleanup
app.delete("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (sessionId && transports.has(sessionId)) {
    const transport = transports.get(sessionId)!;
    await transport.handleRequest(req, res);
    transports.delete(sessionId);
    return;
  }
  res.status(400).json({ error: "No session found." });
});

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    server: "mock-aws-cost-explorer",
    sessions: transports.size,
  });
});

// ── Start ────────────────────────────────────────────────

const PORT = parseInt(process.env.MCP_PORT || "3001", 10);

app.listen(PORT, () => {
  console.log(`\n  Mock AWS Cost Explorer MCP Server`);
  console.log(`  ─────────────────────────────────`);
  console.log(`  MCP endpoint:  http://localhost:${PORT}/mcp`);
  console.log(`  Health check:  http://localhost:${PORT}/health`);
  console.log(`\n  Add to .env:`);
  console.log(`  MCP_COST_EXPLORER_URL=http://localhost:${PORT}/mcp\n`);
});

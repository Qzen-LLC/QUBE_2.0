import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const AWS_SERVICE_TO_CATEGORY: Record<string, string> = {
  "amazon bedrock": "api_costs",
  "amazon sagemaker": "api_costs",
  "aws lambda": "api_costs",
  "amazon api gateway": "api_costs",
  "amazon ec2": "infrastructure",
  "amazon ecs": "infrastructure",
  "amazon eks": "infrastructure",
  "amazon rds": "infrastructure",
  "amazon s3": "infrastructure",
  "amazon elasticache": "infrastructure",
  "amazon dynamodb": "infrastructure",
  "amazon cloudwatch": "operations",
  "aws cloudtrail": "operations",
  "aws config": "operations",
  "amazon cloudfront": "operations",
  "aws support": "operations",
};

function mapServiceToCategory(serviceName: string): string {
  const lower = serviceName.toLowerCase();
  for (const [key, category] of Object.entries(AWS_SERVICE_TO_CATEGORY)) {
    if (lower.includes(key)) return category;
  }
  return "operations";
}

function getMCPUrl(): string | null {
  return process.env.MCP_COST_EXPLORER_URL || null;
}

export async function isMCPAvailable(): Promise<boolean> {
  const url = getMCPUrl();
  if (!url) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch(url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

export async function fetchCostsViaMCP(options: {
  startDate: string;
  endDate: string;
  granularity?: string;
  tagFilter?: { key: string; value: string };
}): Promise<{ costs: Record<string, number>; source: string }> {
  const url = getMCPUrl();
  if (!url) {
    throw new Error("MCP_COST_EXPLORER_URL not configured");
  }

  const transport = new StreamableHTTPClientTransport(new URL(url));
  const client = new Client({
    name: "qube-finops-client",
    version: "1.0.0",
  });

  try {
    await client.connect(transport);

    const toolArgs: Record<string, unknown> = {
      start_date: options.startDate,
      end_date: options.endDate,
      granularity: options.granularity || "MONTHLY",
      group_by: [{ Type: "DIMENSION", Key: "SERVICE" }],
      metrics: ["UnblendedCost"],
    };

    if (options.tagFilter) {
      toolArgs.filter = {
        Tags: {
          Key: options.tagFilter.key,
          Values: [options.tagFilter.value],
          MatchOptions: ["EQUALS"],
        },
      };
    }

    const result = await client.callTool({
      name: "get_cost_and_usage",
      arguments: toolArgs,
    });

    const costs: Record<string, number> = {};

    // Parse MCP tool response — content is an array of content blocks
    const content = result.content as Array<{ type: string; text?: string }>;
    const textBlock = content?.find((c) => c.type === "text");
    if (textBlock?.text) {
      const parsed = JSON.parse(textBlock.text);

      // Handle AWS Cost Explorer response format
      const groups =
        parsed.ResultsByTime?.[0]?.Groups ??
        parsed.results?.[0]?.groups ??
        parsed.groups ??
        [];

      for (const group of groups) {
        const serviceName =
          group.Keys?.[0] ?? group.key ?? group.service ?? "";
        const amount = parseFloat(
          group.Metrics?.UnblendedCost?.Amount ??
            group.amount ??
            group.cost ??
            "0"
        );
        const category = mapServiceToCategory(serviceName);
        costs[category] = (costs[category] || 0) + amount;
      }
    }

    return { costs, source: options.tagFilter ? "mcp:tagged" : "mcp:global" };
  } finally {
    try {
      await client.close();
    } catch {
      // Ignore close errors
    }
  }
}

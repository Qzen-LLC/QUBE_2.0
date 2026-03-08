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
    const timeout = setTimeout(() => controller.abort(), 5000);
    // Use POST since MCP Streamable HTTP servers may not support HEAD/GET
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "initialize", id: 0 }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    // Any response (even 4xx) means the server is reachable
    console.log("[MCP-Client] Availability check status:", res.status);
    return true;
  } catch (err) {
    console.log("[MCP-Client] Availability check failed:", err instanceof Error ? err.message : err);
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
    console.log("[MCP-Client] Raw content blocks:", JSON.stringify(content?.map(c => c.type)));
    if (textBlock?.text) {
      const parsed = JSON.parse(textBlock.text);
      console.log("[MCP-Client] Parsed response keys:", Object.keys(parsed));

      // Handle AWS Cost Explorer response format
      // The response may be nested in ResultsByTime or be a flat array of services
      const groups =
        parsed.ResultsByTime?.[0]?.Groups ??
        parsed.results?.[0]?.groups ??
        parsed.results?.[0]?.Groups ??
        parsed.groups ??
        parsed.Groups ??
        [];

      // Also handle flat service array format: [{ service: "...", amount: N }, ...]
      const serviceArray = Array.isArray(parsed) ? parsed :
        (Array.isArray(parsed.services) ? parsed.services : []);

      if (groups.length > 0) {
        for (const group of groups) {
          const serviceName =
            group.Keys?.[0] ?? group.key ?? group.service ?? group.Service ?? "";
          const amount = parseFloat(
            group.Metrics?.UnblendedCost?.Amount ??
              group.metrics?.UnblendedCost?.Amount ??
              group.amount ??
              group.Amount ??
              group.cost ??
              "0"
          );
          const category = mapServiceToCategory(serviceName);
          costs[category] = (costs[category] || 0) + amount;
        }
      } else if (serviceArray.length > 0) {
        for (const item of serviceArray) {
          const serviceName = item.service ?? item.Service ?? item.name ?? "";
          const amount = parseFloat(item.amount ?? item.Amount ?? item.cost ?? "0");
          const category = mapServiceToCategory(serviceName);
          costs[category] = (costs[category] || 0) + amount;
        }
      }

      console.log("[MCP-Client] Mapped costs:", JSON.stringify(costs));
    } else {
      console.log("[MCP-Client] No text block found in MCP response");
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

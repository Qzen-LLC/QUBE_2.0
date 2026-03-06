import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { detectPlatform } from "@/lib/architect";

let LangSmithClientClass: unknown = null;
try {
  const mod = require("langsmith");
  LangSmithClientClass = mod.Client;
} catch {
  // langsmith not installed
}

export const GET = withAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId query parameter" },
        { status: 400 }
      );
    }

    const platform = detectPlatform();
    const datasetName = `QUBE-Evals-${projectId}`;

    // Check if dataset exists in LangSmith
    if (
      platform === "langsmith" &&
      LangSmithClientClass &&
      process.env.LANGSMITH_API_KEY
    ) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Client = LangSmithClientClass as any;
        const client = new Client({ apiKey: process.env.LANGSMITH_API_KEY });
        const exists = await client.hasDataset({ datasetName });

        if (exists) {
          const dataset = await client.readDataset({ datasetName });
          const baseUrl = process.env.LANGCHAIN_ENDPOINT ?? "https://smith.langchain.com";
          return NextResponse.json({
            registered: true,
            platform,
            datasetId: dataset.id,
            datasetName: dataset.name,
            datasetUrl: `${baseUrl}/datasets/${dataset.id}`,
          });
        }
      } catch (err) {
        console.error("LangSmith check error:", err);
      }
    }

    return NextResponse.json({ registered: false, platform });
  } catch (error) {
    console.error("Evals check error:", error);
    return NextResponse.json(
      { error: "Check failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
});

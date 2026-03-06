import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { registerGuardrails } from "@/lib/architect";

export const POST = withAuth(async (request: Request) => {
  try {
    const body = await request.json();
    const { projectId, guardrailsOutput, platform } = body;

    if (!projectId || !guardrailsOutput) {
      return NextResponse.json(
        { error: "Missing projectId or guardrailsOutput" },
        { status: 400 }
      );
    }

    const result = await registerGuardrails({
      projectId,
      guardrailsOutput,
      platform,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Evals export error:", error);
    return NextResponse.json(
      { error: "Export failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
});

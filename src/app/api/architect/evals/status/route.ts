import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { getEvalStatus } from "@/lib/architect";

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

    const status = await getEvalStatus(projectId);
    return NextResponse.json(status);
  } catch (error) {
    console.error("Evals status error:", error);
    return NextResponse.json(
      { error: "Status fetch failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
});

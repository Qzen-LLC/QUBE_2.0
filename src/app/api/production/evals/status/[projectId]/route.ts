import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { getEvalStatus } from "@/lib/architect";

export const GET = withAuth(
  async (
    _request: Request,
    { params }: { params: Promise<{ projectId: string }> }
  ) => {
    try {
      const { projectId } = await params;
      const result = await getEvalStatus(projectId);
      return NextResponse.json(result);
    } catch (error) {
      console.error("Eval status error:", error);
      return NextResponse.json(
        { error: "Failed to get eval status" },
        { status: 500 }
      );
    }
  }
);

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { reconcileFinOps } from "@/lib/architect";
import type { FinOpsOutput } from "@/lib/architect";

export const POST = withAuth(async (request: Request) => {
  try {
    const body = await request.json();
    const {
      useCaseId,
      finopsOutput,
      periodDays = 30,
      awsRegion,
      awsCostExplorerEnabled,
    } = body as {
      useCaseId: string;
      finopsOutput: FinOpsOutput;
      periodDays?: number;
      awsRegion?: string;
      awsCostExplorerEnabled?: boolean;
    };

    if (!useCaseId || !finopsOutput) {
      return NextResponse.json(
        { error: "Missing useCaseId or finopsOutput" },
        { status: 400 }
      );
    }

    const result = await reconcileFinOps({
      finopsOutput,
      useCaseId,
      periodDays,
      awsRegion,
      awsCostExplorerEnabled,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("FinOps reconciliation error:", error);
    return NextResponse.json(
      { error: "Reconciliation failed" },
      { status: 500 }
    );
  }
});

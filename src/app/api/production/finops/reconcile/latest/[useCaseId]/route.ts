import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { prismaClient } from "@/utils/db";

export const GET = withAuth(
  async (
    _request: Request,
    context: { params: Promise<{ useCaseId: string }> }
  ) => {
    try {
      const { useCaseId } = await context.params;

      if (!useCaseId) {
        return NextResponse.json(
          { error: "Missing useCaseId" },
          { status: 400 }
        );
      }

      const record = await prismaClient.costReconciliation.findFirst({
        where: { useCaseId },
        orderBy: { reconciledAt: "desc" },
      });

      if (!record) {
        return NextResponse.json(
          { error: "No reconciliation found" },
          { status: 404 }
        );
      }

      return NextResponse.json(record);
    } catch (error) {
      console.error("Failed to fetch latest reconciliation:", error);
      return NextResponse.json(
        { error: "Failed to fetch latest reconciliation" },
        { status: 500 }
      );
    }
  }
);

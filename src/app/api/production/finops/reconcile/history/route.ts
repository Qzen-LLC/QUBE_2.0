import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { prismaClient } from "@/utils/db";

export const GET = withAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const useCaseId = searchParams.get("useCaseId");
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    if (!useCaseId) {
      return NextResponse.json(
        { error: "Missing useCaseId query parameter" },
        { status: 400 }
      );
    }

    const records = await prismaClient.costReconciliation.findMany({
      where: { useCaseId },
      orderBy: { reconciledAt: "desc" },
      take: Math.min(limit, 100),
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("Failed to fetch reconciliation history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
});

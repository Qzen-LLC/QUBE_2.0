import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { prismaClient } from "@/utils/db";
import { verifyUseCaseAccess } from "@/lib/org-scope";

export const GET = withAuth(async (request: Request, { auth }) => {
  try {
    const { searchParams } = new URL(request.url);
    const useCaseId = searchParams.get("useCaseId");

    if (useCaseId && !(await verifyUseCaseAccess(auth, useCaseId))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const config = await prismaClient.productionConfiguration.findFirst({
      where: useCaseId ? { useCaseId } : {},
      orderBy: { updatedAt: "desc" },
    });

    if (!config) {
      return NextResponse.json({
        configured: false,
        awsCostExplorerEnabled: false,
        langfuseEnabled: false,
        langsmithEnabled: false,
      });
    }

    return NextResponse.json({
      ...config,
      configured:
        config.awsCostExplorerEnabled ||
        config.langfuseEnabled ||
        config.langsmithEnabled,
    });
  } catch (error) {
    console.error("Production status error:", error);
    return NextResponse.json(
      { error: "Failed to get production status" },
      { status: 500 }
    );
  }
});

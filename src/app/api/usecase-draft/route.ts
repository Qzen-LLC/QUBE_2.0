import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { prismaClient } from "@/utils/db";

/**
 * GET /api/usecase-draft
 * Returns the current user's org draft use cases (stage = "draft").
 */
export const GET = withAuth(async (request: Request, { auth }: { auth: any }) => {
  try {
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const where: Record<string, unknown> = { stage: "draft" };
    if (userRecord.organizationId) {
      where.organizationId = userRecord.organizationId;
    } else {
      where.userId = userRecord.id;
    }

    const drafts = await prismaClient.useCase.findMany({
      where,
      select: {
        id: true,
        title: true,
        wizardDraft: true,
        stage: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ drafts });
  } catch (error) {
    console.error("Error fetching drafts:", error);
    return NextResponse.json({ error: "Failed to fetch drafts" }, { status: 500 });
  }
}, { requireUser: true });

/**
 * POST /api/usecase-draft
 * Create or update a draft use case with wizard form data.
 * Body: { id?: string, name: string, wizardData: object }
 */
export const POST = withAuth(async (request: Request, { auth }: { auth: any }) => {
  try {
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { id, name, wizardData } = body;

    if (!name && !id) {
      return NextResponse.json({ error: "Name is required for new drafts" }, { status: 400 });
    }

    if (id) {
      // Update existing draft
      const existing = await prismaClient.useCase.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: "Draft not found" }, { status: 404 });
      }

      // Permission check
      if (userRecord.role !== "QZEN_ADMIN") {
        if (userRecord.organizationId && existing.organizationId !== userRecord.organizationId) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        if (!userRecord.organizationId && existing.userId !== userRecord.id) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }

      const updated = await prismaClient.useCase.update({
        where: { id },
        data: {
          title: name || existing.title,
          wizardDraft: wizardData,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, draft: { id: updated.id, title: updated.title } });
    }

    // Deduplicate: if a draft with the same title already exists for this user/org, update it instead
    const dedupeWhere: Record<string, unknown> = {
      title: name,
      stage: "draft",
    };
    if (userRecord.organizationId) {
      dedupeWhere.organizationId = userRecord.organizationId;
    } else {
      dedupeWhere.userId = userRecord.id;
    }
    const existingDraft = await prismaClient.useCase.findFirst({ where: dedupeWhere });
    if (existingDraft) {
      const updated = await prismaClient.useCase.update({
        where: { id: existingDraft.id },
        data: {
          wizardDraft: wizardData,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, draft: { id: updated.id, title: updated.title } });
    }

    // Create new draft
    let nextAiucId = 1;
    if (userRecord.organizationId) {
      const maxOrgAiucId = await prismaClient.useCase.aggregate({
        where: { organizationId: userRecord.organizationId },
        _max: { aiucId: true },
      });
      const maxUserAiucId = await prismaClient.useCase.aggregate({
        where: { userId: userRecord.id },
        _max: { aiucId: true },
      });
      nextAiucId = Math.max(maxOrgAiucId._max.aiucId || 0, maxUserAiucId._max.aiucId || 0) + 1;
    } else {
      const maxUserAiucId = await prismaClient.useCase.aggregate({
        where: { userId: userRecord.id },
        _max: { aiucId: true },
      });
      nextAiucId = (maxUserAiucId._max.aiucId || 0) + 1;
    }

    const draft = await prismaClient.useCase.create({
      data: {
        title: name || "Untitled Draft",
        problemStatement: "",
        proposedAISolution: "",
        currentState: "",
        desiredState: "",
        successCriteria: "",
        problemValidation: "",
        solutionHypothesis: "",
        keyAssumptions: "",
        initialROI: "",
        confidenceLevel: 5,
        operationalImpactScore: 5,
        productivityImpactScore: 5,
        revenueImpactScore: 5,
        implementationComplexity: 5,
        estimatedTimeline: "",
        requiredResources: "",
        stage: "draft",
        priority: "MEDIUM",
        wizardDraft: wizardData,
        organizationId: userRecord.organizationId,
        userId: userRecord.id,
        aiucId: nextAiucId,
      },
    });

    return NextResponse.json({ success: true, draft: { id: draft.id, title: draft.title } });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Error saving draft:", errMsg, error);
    return NextResponse.json({ error: "Failed to save draft", details: errMsg }, { status: 500 });
  }
}, { requireUser: true });

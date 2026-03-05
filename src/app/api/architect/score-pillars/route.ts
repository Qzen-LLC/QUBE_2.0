import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { scorePillars, UseCaseInputSchema } from "@/lib/architect";

export const POST = withAuth(async (request: Request) => {
  try {
    const body = await request.json();

    // Use lenient parsing — fill defaults for missing/empty fields so
    // the wizard can score even partially-complete forms.
    const coerced = {
      name: body.name || "Untitled",
      archetypeId: body.archetypeId ?? null,
      technical: {
        useCaseCategory: "rag",
        description: "",
        ...body.technical,
      },
      business: {
        businessOutcome: "",
        targetUsers: "",
        ...body.business,
      },
      responsible: {
        ...body.responsible,
      },
      legal: {
        ...body.legal,
      },
      dataReadiness: {
        ...body.dataReadiness,
      },
    };

    const parsed = UseCaseInputSchema.safeParse(coerced);
    if (!parsed.success) {
      console.error("Score-pillars validation:", parsed.error.flatten());
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const scores = await scorePillars(parsed.data);
    return NextResponse.json(scores);
  } catch (error) {
    console.error("Pillar scoring error:", error);
    return NextResponse.json(
      { error: "Failed to score pillars" },
      { status: 500 }
    );
  }
});

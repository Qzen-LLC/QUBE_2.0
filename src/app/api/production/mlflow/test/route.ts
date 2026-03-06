import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { isMLflowAvailable, fetchRegisteredModels } from "@/lib/architect";

export const POST = withAuth(async (request: Request) => {
  try {
    const body = await request.json();
    const { trackingUrl, authUsername, authPassword } = body;

    if (!trackingUrl) {
      return NextResponse.json(
        { error: "trackingUrl is required" },
        { status: 400 }
      );
    }

    const options = { trackingUrl, authUsername, authPassword };
    const available = await isMLflowAvailable(options);

    if (!available) {
      return NextResponse.json({
        available: false,
        error: "Could not connect to MLflow tracking server",
      });
    }

    // Fetch a single model to verify API works and get count
    let modelCount = 0;
    try {
      const models = await fetchRegisteredModels(options);
      modelCount = models.length;
    } catch {
      // Connection works but model fetch failed — still report available
    }

    return NextResponse.json({ available: true, modelCount });
  } catch (error) {
    console.error("MLflow test connection error:", error);
    return NextResponse.json(
      { available: false, error: "Connection test failed" },
      { status: 500 }
    );
  }
});

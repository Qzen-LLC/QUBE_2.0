import { NextResponse } from "next/server";
import archetypesData from "@/lib/architect/patterns/archetypes.json";

export async function GET() {
  return NextResponse.json(archetypesData.archetypes);
}

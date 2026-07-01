import { NextResponse } from "next/server";
import { getStandings } from "@/lib/standings";

// Always fresh — this is the dashboard's polling target.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getStandings());
}

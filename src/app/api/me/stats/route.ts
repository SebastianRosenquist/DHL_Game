import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { getPersonalStats } from "@/lib/personal-stats";

export async function GET() {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ stats: null });
  return NextResponse.json({ stats: getPersonalStats(uid) });
}

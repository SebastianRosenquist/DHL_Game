import { NextResponse } from "next/server";
import { getAchievementGaps } from "@/lib/achievement-gaps";
import { currentUserId } from "@/lib/auth";

export async function GET() {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ gaps: {} });
  return NextResponse.json({ gaps: getAchievementGaps(uid) });
}

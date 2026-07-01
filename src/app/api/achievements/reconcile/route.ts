import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { reconcileAll } from "@/lib/achievements/engine";

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  reconcileAll();
  return NextResponse.json({ ok: true });
}

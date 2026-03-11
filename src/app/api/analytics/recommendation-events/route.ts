import { NextResponse } from "next/server";
import {
  insertRecommendationEvents,
  updateRecommendationClicked,
} from "@/lib/db";

export async function POST(request: Request) {
  try {
    const sessionId = request.headers.get("x-session-id") ?? "";
    if (!sessionId) {
      return NextResponse.json(
        { error: "x-session-id header required" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === "string" ? body.action : "shown";

    if (action === "shown") {
      const vendors = Array.isArray(body.vendors) ? body.vendors : [];
      if (vendors.length === 0) return NextResponse.json({ ok: true });
      const searchId = typeof body.searchId === "string" ? body.searchId : null;
      await insertRecommendationEvents(sessionId, searchId, vendors);
      return NextResponse.json({ ok: true });
    }

    if (action === "clicked") {
      const vendorName = typeof body.vendorName === "string" ? body.vendorName : "";
      if (!vendorName) return NextResponse.json({ ok: true });
      await updateRecommendationClicked(sessionId, vendorName);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Analytics failed" }, { status: 500 });
  }
}

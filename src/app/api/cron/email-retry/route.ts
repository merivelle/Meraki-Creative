import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/server-env";
import { retryFailed } from "@/lib/email/outbox";

/** Retries failed email deliveries. Called by a scheduler with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: NextRequest) {
  const expected = serverEnv.cronSecret ? `Bearer ${serverEnv.cronSecret}` : "";
  const got = req.headers.get("authorization") ?? "";
  if (!expected || got.length !== expected.length || !timingSafeEqual(Buffer.from(got), Buffer.from(expected))) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const retried = await retryFailed();
  return NextResponse.json({ retried });
}

import { NextResponse, type NextRequest } from "next/server";
import { draftMode } from "next/headers";
import { getSession } from "@/lib/auth/guards";
import { safeNext } from "@/lib/labels";

/** Staff-only draft preview of the public site. ?disable=1 turns it off. */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.isStaff) return new NextResponse("Not found", { status: 404 });
  const dm = await draftMode();
  const path = safeNext(req.nextUrl.searchParams.get("path"), "/");
  if (req.nextUrl.searchParams.get("disable") === "1") dm.disable();
  else dm.enable();
  return NextResponse.redirect(new URL(path, req.url));
}

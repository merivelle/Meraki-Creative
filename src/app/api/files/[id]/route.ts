import { NextResponse, type NextRequest } from "next/server";
import { getSession, isUuid } from "@/lib/auth/guards";
import { signedDownloadUrl } from "@/lib/files/storage";

/**
 * Authorized download. The files row is read AS THE USER, so RLS decides: staff can read
 * any file; a client only files of projects they belong to that are released to them.
 * On success, redirect to a 5-minute signed URL. Nothing is ever publicly addressable.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return new NextResponse("Sign in required", { status: 401 });
  if (!isUuid(id)) return new NextResponse("Not found", { status: 404 });

  const { data: file } = await session.supabase
    .from("files")
    .select("id, path, original_name, upload_status, deleted_at")
    .eq("id", id)
    .maybeSingle();
  if (!file || file.deleted_at || file.upload_status !== "complete") return new NextResponse("Not found", { status: 404 });

  const inline = req.nextUrl.searchParams.get("inline") === "1";
  const url = await signedDownloadUrl(file.path, inline ? undefined : file.original_name);
  if (!url) return new NextResponse("Unavailable", { status: 503 });
  return NextResponse.redirect(url, { status: 303, headers: { "Cache-Control": "private, no-store" } });
}

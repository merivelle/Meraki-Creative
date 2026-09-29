"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff, isUuid } from "@/lib/auth/guards";
import { ENTITIES, isEntityType } from "@/lib/content/entities";
import { publishEntity, unpublishEntity } from "@/lib/content/publish";
import { audit } from "@/lib/audit";
import { ok, fail, str, optStr, lines, type Result } from "./shared";

const CATS = ["web-design", "post-production", "creative-materials", "bundles"];
const LAYOUTS = ["site", "reel", "film", "scene", "trailer", "grade"];
const SCOPES = ["web-design", "post-production", "creative-materials", "general", "process"];

function jsonField<T>(fd: FormData, k: string, fallback: T): T | "invalid" {
  const raw = str(fd, k, 50000);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return "invalid";
  }
}

/** Build the working-row values for an entity from its editor form. */
function rowFor(type: string, fd: FormData): Record<string, unknown> | string {
  const sort = Number(str(fd, "sort", 6)) || 0;
  switch (type) {
    case "service": {
      const cat = str(fd, "category_id", 40);
      if (!CATS.includes(cat)) return "Choose a category.";
      return { category_id: cat, role_label: optStr(fd, "role_label", 40), title: str(fd, "title", 200), description: optStr(fd, "description"), summary: optStr(fd, "summary", 300), sort };
    }
    case "package": {
      const cat = str(fd, "category_id", 40);
      if (!CATS.includes(cat)) return "Choose a category.";
      const slug = str(fd, "slug", 80);
      if (!/^[a-z0-9-]+$/.test(slug)) return "Slug: lowercase letters, numbers and dashes only.";
      const price = str(fd, "price_display", 60);
      if (!price) return "Price text is required (e.g. “From $95” or “Quote on request”).";
      return {
        slug, category_id: cat, group_title: optStr(fd, "group_title", 80), label: optStr(fd, "label", 80), name: str(fd, "name", 200),
        price_display: price, included: lines(fd, "included"), tagline: optStr(fd, "tagline", 300), featured: fd.get("featured") === "on", sort,
      };
    }
    case "portfolio_item": {
      const slug = str(fd, "slug", 80);
      if (!/^[a-z0-9-]+$/.test(slug)) return "Slug: lowercase letters, numbers and dashes only.";
      const layout = str(fd, "layout", 20);
      if (!LAYOUTS.includes(layout)) return "Choose a layout.";
      const categories = fd.getAll("categories").map(String).filter((c) => CATS.includes(c));
      if (!categories.length) return "Choose at least one service.";
      const images = jsonField(fd, "images", [] as unknown[]);
      const video = jsonField(fd, "video", null as unknown);
      if (images === "invalid" || video === "invalid") return "Images and video must be valid JSON.";
      const videoLinks = lines(fd, "video_links").map((l) => {
        const [label, url] = l.split("|").map((s) => s.trim());
        return url ? { label, url } : { label: "Watch", url: label };
      });
      return {
        slug, title: str(fd, "title", 200), client_name: optStr(fd, "client_name", 200), categories, layout,
        type_label: optStr(fd, "type_label", 80), description: optStr(fd, "description"), contribution: optStr(fd, "contribution", 500),
        images, video, video_links: videoLinks, live_url: optStr(fd, "live_url", 2048), url_label: optStr(fd, "url_label", 120),
        featured: fd.get("featured") === "on", sort,
      };
    }
    case "testimonial":
      return { quote: str(fd, "quote", 3000), pull_quote: optStr(fd, "pull_quote", 200), role_label: optStr(fd, "role_label", 100), name: str(fd, "name", 200), sort };
    case "faq": {
      const scope = str(fd, "scope", 40);
      if (!SCOPES.includes(scope)) return "Choose where it appears.";
      return { scope, question: str(fd, "question", 300), answer: str(fd, "answer", 3000), sort };
    }
    case "content_block": {
      const data = jsonField(fd, "data", {} as unknown);
      if (data === "invalid") return "Content must be valid JSON.";
      return { page: str(fd, "page", 40), key: str(fd, "key", 80), data };
    }
  }
  return "Unknown content type.";
}

export async function saveContent(type: string, id: string | null, _p: Result | null, fd: FormData): Promise<Result> {
  const { supabase, user } = await requireStaff();
  if (!isEntityType(type)) return fail("Unknown content type.");
  const row = rowFor(type, fd);
  if (typeof row === "string") return fail(row);
  const table = ENTITIES[type].table;
  if (id && isUuid(id)) {
    const { error } = await supabase.from(table).update({ ...row, updated_by: user.id }).eq("id", id);
    if (error) return fail(error.code === "23505" ? "That slug is already used." : error.message);
    revalidatePath("/admin/content", "layout");
    return ok("Saved. Published content doesn't change until you publish again.");
  }
  const { data, error } = await supabase.from(table).insert({ ...row, status: "draft", updated_by: user.id }).select("id").single();
  if (error || !data) return fail(error?.code === "23505" ? "That slug is already used." : error?.message ?? "Couldn't save.");
  redirect(`/admin/content/${type}/${data.id}`);
}

export async function setContentStatus(type: string, id: string, action: "publish" | "unpublish" | "archive"): Promise<Result> {
  const { supabase, user } = await requireStaff();
  if (!isEntityType(type) || !isUuid(id)) return fail("Unknown content.");
  try {
    if (action === "publish") await publishEntity(supabase, type, id, user.id);
    else await unpublishEntity(supabase, type, id, action === "archive");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Couldn't update.");
  }
  await audit({ actorId: user.id, action: `content.${action}`, entityType: type, entityId: id, source: "manual" });
  revalidatePath("/admin/content", "layout");
  return ok(action === "publish" ? "Published. The public site updates within a few seconds." : action === "archive" ? "Archived." : "Unpublished.");
}

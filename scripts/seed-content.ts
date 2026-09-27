/**
 * Seeds public site content (from src/content/seed.ts, transcribed from the original pages),
 * publishes it, and installs the two discovery questionnaires as published v1 templates.
 * Safe to re-run: rows are upserted by stable id, and existing published questionnaire
 * versions are left untouched (they're immutable).
 *
 *   npm run seed:content
 */
import { adminClient } from "./_client";
import { seedContent } from "../src/content/seed";
import { fromFaq, fromPackage, fromPortfolio, fromService, fromTestimonial } from "../src/lib/content/mappers";
import { websiteDiscovery } from "../src/content/forms/website-discovery";
import { postProductionDiscovery } from "../src/content/forms/post-production-discovery";

const db = adminClient();
const now = new Date().toISOString();

async function upsertAndPublish(table: string, entityType: string, rows: Record<string, unknown>[], publicData: unknown[], slugKey?: string) {
  const { error } = await db.from(table).upsert(rows.map((r) => ({ ...r, status: "published", published_at: now })));
  if (error) throw new Error(`${table}: ${error.message}`);
  const snaps = rows.map((r, i) => ({
    entity_type: entityType, entity_id: r.id, slug: slugKey ? (r[slugKey] as string) : null,
    sort: (r.sort as number) ?? 0, data: publicData[i], published_at: now,
  }));
  const { error: e2 } = await db.from("published_content").upsert(snaps);
  if (e2) throw new Error(`published_content(${entityType}): ${e2.message}`);
  console.log(`  ${table}: ${rows.length}`);
}

async function main() {
  console.log("Seeding public content…");
  await upsertAndPublish("services", "service", seedContent.services.map(fromService), seedContent.services);
  await upsertAndPublish("packages", "package", seedContent.packages.map(fromPackage), seedContent.packages, "slug");
  await upsertAndPublish("portfolio_items", "portfolio_item", seedContent.portfolio.map(fromPortfolio), seedContent.portfolio, "slug");
  await upsertAndPublish("testimonials", "testimonial", seedContent.testimonials.map(fromTestimonial), seedContent.testimonials);
  await upsertAndPublish("faqs", "faq", seedContent.faqs.map(fromFaq), seedContent.faqs);

  for (const [fullKey, data] of Object.entries(seedContent.blocks)) {
    const [page, ...rest] = fullKey.split(".");
    const key = rest.join(".");
    const { data: row, error } = await db.from("content_blocks")
      .upsert({ page, key, data, status: "published", published_at: now }, { onConflict: "page,key" })
      .select("id").single();
    if (error || !row) throw new Error(`content_blocks: ${error?.message}`);
    await db.from("published_content").upsert({ entity_type: "content_block", entity_id: row.id, data: { key: fullKey, data }, published_at: now });
  }
  console.log(`  content_blocks: ${Object.keys(seedContent.blocks).length}`);

  console.log("Installing questionnaires…");
  for (const [def, category] of [[websiteDiscovery, "web_design"], [postProductionDiscovery, "post_production"]] as const) {
    const { data: tpl, error } = await db.from("form_templates")
      .upsert({ key: def.key, title: def.title, service_category: category }, { onConflict: "key" }).select("id").single();
    if (error || !tpl) throw new Error(`form_templates: ${error?.message}`);
    const { data: existing } = await db.from("form_template_versions").select("id, published_at").eq("template_id", tpl.id).eq("version", def.version).maybeSingle();
    if (existing?.published_at) {
      console.log(`  ${def.key} v${def.version}: already published (left unchanged)`);
      continue;
    }
    if (existing) await db.from("form_template_versions").delete().eq("id", existing.id);
    const { error: e2 } = await db.from("form_template_versions").insert({ template_id: tpl.id, version: def.version, schema: def, published_at: now, notes: "Initial version" });
    if (e2) throw new Error(`form_template_versions: ${e2.message}`);
    console.log(`  ${def.key} v${def.version}: published`);
  }

  const { count } = await db.from("proposal_templates").select("id", { count: "exact", head: true });
  if (!count) {
    await db.from("proposal_templates").insert([
      { name: "Website project", service_category: "web_design", defaults: { deliverables: [], exclusions: [], note: "Structure only. Write scope and terms per project." } },
      { name: "Editing project", service_category: "post_production", defaults: { deliverables: [], exclusions: [], note: "Structure only. Write scope and terms per project." } },
    ]);
    console.log("  proposal_templates: 2 (structure only, no legal language)");
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Import past inquiries (e.g. a CSV exported from the Web3Forms dashboard or assembled
 * from the notification emails). Marks them source=web3forms_import and sends NO email.
 * Duplicate rows (same email + message + date) are skipped, so re-running is safe.
 *
 *   npm run import-inquiries -- --file old-inquiries.csv [--dry-run]
 *
 * Expected columns (header names are matched case-insensitively):
 *   date, name, email, role, interest, timeline, budget, message
 */
import { readFileSync } from "node:fs";
import { adminClient, arg } from "./_client";

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()));
  const keys = head.map((h) => h.trim().toLowerCase());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

const ROLE: Record<string, string> = { actor: "actor", filmmaker: "filmmaker", other: "other" };

async function main() {
  const file = arg("file");
  if (!file) throw new Error("Pass --file path/to.csv");
  const dry = process.argv.includes("--dry-run");
  const rows = parseCsv(readFileSync(file, "utf8"));
  const db = adminClient();
  let added = 0, skipped = 0;
  for (const r of rows) {
    if (!r.email || !r.message) { skipped++; continue; }
    const created = r.date && !Number.isNaN(Date.parse(r.date)) ? new Date(r.date).toISOString() : new Date().toISOString();
    const { data: dup } = await db.from("inquiries").select("id").eq("email", r.email).eq("description", r.message).eq("created_at", created).maybeSingle();
    if (dup) { skipped++; continue; }
    const row = {
      name: r.name || r.email, email: r.email, client_type: ROLE[(r.role ?? "").toLowerCase()] ?? "other",
      services: [], package_slug: null, goal: r.interest || null, description: r.message,
      budget_range: r.budget || null, notes: r.timeline ? `Timeline (from old form): ${r.timeline}` : null,
      source: "web3forms_import", status: "reviewing", created_at: created,
    };
    if (dry) console.log("would import:", row.name, row.email, created);
    else {
      const { error } = await db.from("inquiries").insert(row);
      if (error) throw new Error(error.message);
    }
    added++;
  }
  console.log(`${dry ? "Would import" : "Imported"} ${added}, skipped ${skipped}. No emails were sent.`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});

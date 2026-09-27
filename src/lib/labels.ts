/** Human labels for stored status values. Shared by portal and admin. */

export const STAGES = [
  "inquiry", "scoping", "proposal", "booking", "discovery", "production", "review", "final_approval", "delivery", "completed",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  inquiry: "Inquiry",
  scoping: "Scoping",
  proposal: "Proposal",
  booking: "Booking",
  discovery: "Discovery",
  production: "Production",
  review: "Review",
  final_approval: "Final approval",
  delivery: "Delivery and handoff",
  completed: "Completed",
};

export const STATES = ["active", "on_hold", "cancelled", "archived"] as const;
export const STATE_LABELS: Record<(typeof STATES)[number], string> = {
  active: "Active",
  on_hold: "On hold",
  cancelled: "Cancelled",
  archived: "Archived",
};

export const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  web_design: "Web design",
  post_production: "Post-production",
  creative_materials: "Creative materials",
  bundle: "Bundle",
};

export const NEXT_ACTION_LABELS: Record<string, string> = {
  review_proposal: "Review the proposal",
  sign_agreement: "Sign the agreement",
  pay_invoice: "Pay the open invoice",
  complete_form: "Finish your questionnaire",
  provide_assets: "Send the requested files or links",
  give_feedback: "Review the latest version and send notes",
};

export const AGREEMENT_STATUS_LABELS: Record<string, string> = {
  none: "No agreement yet", pending: "Awaiting signature", signed: "Signed",
  draft: "Draft", sent: "Sent for signature", declined: "Declined", void: "Void",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  none: "No invoices yet", open: "Invoice open", overdue: "Invoice overdue", paid: "Paid",
  draft: "Draft", void: "Void", uncollectible: "Uncollectible",
};

export const ASSET_STATUS_LABELS: Record<string, string> = {
  missing: "Missing", uploaded: "Uploaded", needs_replacement: "Needs replacement", accepted: "Accepted",
};

export const INQUIRY_STATUS_LABELS: Record<string, string> = {
  new: "New", reviewing: "Reviewing", clarification_requested: "Clarification requested",
  proposal_sent: "Proposal sent", converted: "Converted to project", declined: "Declined", spam: "Spam",
};

export const CLIENT_TYPE_LABELS: Record<string, string> = {
  actor: "Actor", director: "Director", filmmaker: "Filmmaker", photographer: "Photographer",
  production_company: "Production company", creative_business: "Creative business", other: "Other",
};

export const label = (map: Record<string, string>, v: string | null | undefined) => (v ? map[v] ?? v : "—");

export const fmtDate = (v: string | null | undefined) =>
  v ? new Date(v.length === 10 ? v + "T12:00:00" : v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export const fmtDateTime = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

export const fmtMoney = (cents: number | null | undefined, currency = "usd") =>
  cents == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);

/** Only allow same-site relative redirects (prevents open redirects via ?next=). */
export function safeNext(next: string | null | undefined, fallback = "/portal"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/** PostgREST returns one-to-one embeds as an object and one-to-many as an array; accept both. */
export function one<T>(x: T | T[] | null | undefined): T | null {
  if (Array.isArray(x)) return x[0] ?? null;
  return x ?? null;
}

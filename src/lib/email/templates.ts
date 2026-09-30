/**
 * Transactional email content. Deliberately plain (text + minimal HTML) so the visual
 * treatment can be designed later without touching the sending logic.
 * No template promises acceptance, pricing, or delivery dates.
 */
import { publicEnv } from "@/lib/env";

export type EmailContent = { subject: string; text: string; html: string };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const url = (path: string) => publicEnv.siteUrl + path;

function wrap(paragraphs: string[], cta?: { label: string; href: string }): { text: string; html: string } {
  const text = [...paragraphs, ...(cta ? [`${cta.label}: ${cta.href}`] : []), "", "Meraki Creative", "Los Angeles, CA"].join("\n\n");
  const html = [
    '<div style="font-family:Archivo,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#17150F;max-width:560px">',
    ...paragraphs.map((p) => `<p style="margin:0 0 14px">${esc(p).replace(/\n/g, "<br>")}</p>`),
    cta ? `<p style="margin:20px 0"><a href="${esc(cta.href)}" style="color:#7B2D26">${esc(cta.label)}</a></p>` : "",
    '<p style="margin:24px 0 0;color:#54504A;font-size:13px">Meraki Creative · Los Angeles, CA</p>',
    "</div>",
  ].join("");
  return { text, html };
}

export const templates = {
  inquiryReceipt(p: { name: string }): EmailContent {
    return {
      subject: "We received your inquiry | Meraki Creative",
      ...wrap([
        `Hi ${p.name},`,
        "Thank you for telling me about your project. Your inquiry came through and I'll read it properly.",
        "I'll reply by email, usually within a couple of business days. If anything needs clarifying before I can say more, I'll ask.",
        "Merivelle",
      ]),
    };
  },

  inquiryStudioAlert(p: { name: string; email: string; services: string; summary: string; inquiryId: string }): EmailContent {
    return {
      subject: `New inquiry from ${p.name}`,
      ...wrap(
        [`From: ${p.name} <${p.email}>`, `Services: ${p.services}`, p.summary],
        { label: "Open in admin", href: url(`/admin/inquiries/${p.inquiryId}`) },
      ),
    };
  },

  clarification(p: { name: string; question: string }): EmailContent {
    return {
      subject: "A question about your project | Meraki Creative",
      ...wrap([`Hi ${p.name},`, p.question, "Just reply to this email with your answer.", "Merivelle"]),
    };
  },

  invitation(p: { name: string; projectTitle: string | null; link: string; expiresAt: string }): EmailContent {
    return {
      subject: "Your Meraki Creative client portal",
      ...wrap(
        [
          `Hi ${p.name},`,
          p.projectTitle
            ? `I've set up a project page for "${p.projectTitle}". It's where questionnaires, files, reviews, and updates will live.`
            : "I've set up your client portal. It's where questionnaires, files, reviews, and updates will live.",
          `The link below is personal to you and works once. It expires on ${p.expiresAt}.`,
        ],
        { label: "Open your portal", href: p.link },
      ),
    };
  },

  projectEvent(p: { name: string; headline: string; detail?: string; projectId: string; path?: string }): EmailContent {
    return {
      subject: `${p.headline} | Meraki Creative`,
      ...wrap(
        [`Hi ${p.name},`, p.headline + ".", ...(p.detail ? [p.detail] : [])],
        { label: "Open the project", href: url(p.path ?? `/portal/projects/${p.projectId}`) },
      ),
    };
  },

  studioEvent(p: { headline: string; detail?: string; path: string }): EmailContent {
    return {
      subject: p.headline,
      ...wrap([p.headline + ".", ...(p.detail ? [p.detail] : [])], { label: "Open in admin", href: url(p.path) }),
    };
  },
};

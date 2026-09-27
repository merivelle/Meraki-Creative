import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/start/thanks",
  title: "Thank you — Meraki Creative",
  description: "Your project inquiry was received. Merivelle will be in touch shortly.",
  noindex: true,
});

export default function ThanksPage() {
  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-meta">
          <span className="slate">Contact</span>
          <span className="slate hide-sm">Received</span>
        </div>
        <h1 className="display display-xl">Thank you.<br />It&apos;s on its way.</h1>
        <p className="lede" style={{ marginTop: "1.4rem" }}>Your inquiry came through. I&apos;ll read it properly and reply by email, usually within a couple of business days. If anything needs clarifying first, I&apos;ll ask. A short confirmation email should follow.</p>
        <div className="btn-group" style={{ marginTop: "2rem" }}>
          <Link href="/" className="btn btn-primary">Back to home</Link>
          <Link href="/work" className="btn btn-secondary">See the work</Link>
        </div>
      </div>
    </section>
  );
}

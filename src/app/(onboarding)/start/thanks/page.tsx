import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { ClearSavedProgress } from "@/components/onboarding/ClearSavedProgress";
import { WordReveal } from "@/components/onboarding/WordReveal";

export const metadata = pageMetadata({
  path: "/start/thanks",
  title: "Thank you — Meraki Creative",
  description: "Your project inquiry was received. Merivelle will be in touch shortly.",
  noindex: true,
});

export default function ThanksPage() {
  return (
    <div className="ob is-live" data-phase="questions">
      <ClearSavedProgress />
      <header className="ob-top">
        <Link href="/" className="brand">Meraki Creative<span className="dot">.</span></Link>
        <Link href="/" className="ob-close">Close <span aria-hidden="true">×</span></Link>
      </header>
      <section className="ob-step ob-step-question is-current ob-thanks">
        <p className="ob-label slate">Received</p>
        <h1 className="ob-title display display-xl"><WordReveal text="Thank you. It's on its way." /></h1>
        <p className="ob-lead lede">
          Your inquiry came through. I&apos;ll read it properly and reply by email, usually within a couple of
          business days. If anything needs clarifying first, I&apos;ll ask. A short confirmation email should follow.
        </p>
        <p className="ob-sign">— Merivelle</p>
        <div className="btn-group">
          <Link href="/work" className="btn btn-primary">See the work</Link>
          <Link href="/" className="btn btn-secondary">Back to home</Link>
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { ClearSavedProgress } from "@/components/onboarding/ClearSavedProgress";
import { WordReveal } from "@/components/onboarding/WordReveal";
import { DESIGN_STORAGE_KEY } from "@/lib/inquiry/steps";

export const metadata = pageMetadata({
  path: "/start/design/thanks",
  title: "Brief received — Meraki Creative",
  description: "Your design brief was received.",
  noindex: true,
});

export default function DesignThanksPage() {
  return (
    <div className="ob is-live" data-phase="questions">
      <ClearSavedProgress storageKey={DESIGN_STORAGE_KEY} briefDone />
      <header className="ob-top">
        <Link href="/" className="brand">Meraki Creative<span className="dot">.</span></Link>
        <Link href="/" className="ob-close">Close <span aria-hidden="true">×</span></Link>
      </header>
      <section className="ob-step ob-step-question is-current ob-thanks">
        <p className="ob-label slate">Brief received</p>
        <h1 className="ob-title display display-xl"><WordReveal text="Thank you. That helps a lot." /></h1>
        <p className="ob-lead lede">
          I&apos;ll read it alongside your inquiry and bring it into the first design conversation. If
          anything&apos;s unclear, I&apos;ll ask.
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

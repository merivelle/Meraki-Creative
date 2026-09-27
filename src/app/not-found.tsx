import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Enhance } from "@/components/site/Enhance";

export const metadata: Metadata = {
  title: { absolute: "Page not found — Meraki Creative" },
  description: "That page is not here. Find the work, the services, and a way to start a project with Meraki Creative.",
  robots: { index: false, follow: true },
};

const LINKS = [
  { role: "Post", href: "/post-production", title: "Post-Production", desc: "Film, trailer, scene, and demo reel editing in Los Angeles." },
  { role: "Web", href: "/web-design", title: "Web Design", desc: "Sites for actors, directors, photographers, and production companies." },
  { role: "Work", href: "/work", title: "Work", desc: "Reels, short films, trailers, color grades, and client sites." },
  { role: "Price", href: "/packages", title: "Packages", desc: "Starting points by craft, with real prices." },
  { role: "Talk", href: "/start", title: "Start a Project", desc: "Tell us about the work and get a plan, a timeline, and a quote." },
];

export default function NotFound() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader status="Booking 2026" />
      <main id="main" tabIndex={-1}>
        <section className="hero">
          <div className="wrap">
            <div className="hero-meta">
              <span className="slate">404</span>
              <span className="slate hide-sm">Page not found</span>
            </div>
            <h1 className="display display-xl">That page<br />isn&apos;t here.</h1>
            <div className="hero-foot">
              <p className="lede">The link may be old, or the page may have moved. Everything the studio does is still a click away.</p>
              <div className="btn-group">
                <Link href="/" className="btn btn-primary">Back to Home</Link>
                <Link href="/work" className="btn btn-secondary">See the Work</Link>
              </div>
            </div>
          </div>
        </section>
        <hr className="rule" />
        <section className="section">
          <div className="wrap">
            <div className="index-head reveal">
              <span className="slate-tag">Where to go</span>
              <h2 className="display display-md">Try one of these.</h2>
            </div>
            <div className="index-list reveal-stagger reveal">
              {LINKS.map((l) => (
                <div className="index-row" key={l.href}>
                  <span className="role">{l.role}</span>
                  <span className="title"><Link href={l.href}>{l.title}</Link></span>
                  <span className="desc">{l.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <Enhance />
    </>
  );
}

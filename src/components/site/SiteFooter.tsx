import Link from "next/link";
import { FOOTER_EXPLORE, SOCIAL_LINKS } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top">
          <div>
            <p className="footer-brand">Meraki<br />Creative<span className="dot">.</span></p>
            <p className="muted" style={{ marginTop: "1rem", maxWidth: "34ch", fontSize: "0.9rem", color: "var(--on-night-soft)" }}>
              A creative studio for storytellers. Post-production, websites, and creative materials, made with soul.
            </p>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <h4>Explore</h4>
              {FOOTER_EXPLORE.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
            </div>
            <div className="footer-col">
              <h4>Connect</h4>
              <Link href="/start">Start a project</Link>
              <Link href="/login">Client login</Link>
              {SOCIAL_LINKS.map((l) => <a key={l.href} href={l.href} target="_blank" rel="noopener">{l.label}</a>)}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Meraki Creative, by Merivelle · Los Angeles, CA</span>
          <span>Post-Production · Digital Presence · Creative Materials</span>
        </div>
      </div>
    </footer>
  );
}

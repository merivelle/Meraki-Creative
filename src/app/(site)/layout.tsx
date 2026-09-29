import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Enhance } from "@/components/site/Enhance";
import { getBlock } from "@/lib/content/queries";

// Runs before the hero paints, so a first homepage visit never flashes the settled hero
// before the intro. Only set on a hard load of "/"; client-side navigation skips the intro.
const INTRO_GATE = `try{var d=document.documentElement;if(location.pathname==="/"&&!sessionStorage.getItem("mk-intro")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("js","intro");setTimeout(function(){if(!window.gsap)d.classList.remove("intro")},2500)}}catch(e){}`;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const status = await getBlock("site.status");
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: INTRO_GATE }} />
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader status={status.text} />
      <main id="main" tabIndex={-1}>{children}</main>
      <SiteFooter />
      <Enhance />
    </>
  );
}

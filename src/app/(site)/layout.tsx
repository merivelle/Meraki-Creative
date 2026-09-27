import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Enhance } from "@/components/site/Enhance";
import { getBlock } from "@/lib/content/queries";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const status = await getBlock("site.status");
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader status={status.text} />
      <main id="main" tabIndex={-1}>{children}</main>
      <SiteFooter />
      <Enhance />
    </>
  );
}

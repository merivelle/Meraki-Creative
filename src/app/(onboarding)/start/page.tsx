import { getContent } from "@/lib/content/queries";
import { inquiryDefinition, preselect } from "@/lib/inquiry/definition";
import { issueFormToken } from "@/lib/security/abuse";
import { publicEnv } from "@/lib/env";
import { breadcrumbs, graph, pageMetadata, pageNode, personNode, studioNode } from "@/lib/seo";
import { JsonLd } from "@/components/site/JsonLd";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

const TITLE = "Contact — Start a Project | Meraki Creative, Los Angeles";
const DESCRIPTION =
  "Tell Meraki Creative about your film, reel, or website. You'll get a clear plan, a timeline, and a quote, usually within a couple of business days.";

export const metadata = pageMetadata({ path: "/start", title: TITLE, description: DESCRIPTION });

// The form carries a fresh anti-spam timestamp, so it can't be statically cached.
export const dynamic = "force-dynamic";

export default async function StartPage({ searchParams }: {
  searchParams: Promise<{ service?: string; package?: string; interest?: string }>;
}) {
  const params = await searchParams;
  const { packages } = await getContent();
  const def = inquiryDefinition(packages);
  const initial = preselect(packages, params);
  const preselectedNote = [params.service && `service=${params.service}`, (params.package ?? params.interest) && `package=${params.package ?? params.interest}`]
    .filter(Boolean).join("&");

  return (
    <>
      <JsonLd data={graph(studioNode, personNode, pageNode("ContactPage", "/start", TITLE, DESCRIPTION),
        breadcrumbs([{ name: "Home", path: "/" }, { name: "Start a Project", path: "/start" }]))} />
      <OnboardingFlow
        def={def}
        initial={initial}
        packageNames={Object.fromEntries(packages.map((p) => [p.slug, p.name]))}
        token={issueFormToken()}
        preselected={preselectedNote}
        turnstileSiteKey={publicEnv.turnstileSiteKey}
      />
    </>
  );
}

import { briefDefinition } from "@/lib/inquiry/definition";
import { DESIGN_STEPS, DESIGN_STORAGE_KEY } from "@/lib/inquiry/steps";
import { issueFormToken } from "@/lib/security/abuse";
import { publicEnv } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { submitBrief } from "../actions";

export const metadata = pageMetadata({
  path: "/start/design",
  title: "Design Brief — Meraki Creative",
  description: "Tell Meraki Creative more about the website you're picturing: the look, the pages, and the practicalities.",
  noindex: true,
});

// Carries a fresh anti-spam timestamp, so it can't be statically cached.
export const dynamic = "force-dynamic";

export default function DesignBriefPage() {
  return (
    <OnboardingFlow
      def={briefDefinition()}
      initial={{}}
      token={issueFormToken()}
      turnstileSiteKey={publicEnv.turnstileSiteKey}
      steps={DESIGN_STEPS}
      action={submitBrief}
      storageKey={DESIGN_STORAGE_KEY}
      welcomeArt={null}
      prefillFromLast
    />
  );
}

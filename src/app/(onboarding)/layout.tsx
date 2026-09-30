import "@/styles/onboarding.css";

/**
 * Full-screen layout for Start a Project: no site header or footer.
 * The inline script marks JS as available before first paint, so the one-step-at-a-time
 * view shows immediately instead of flashing the long no-JS form.
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('ob-js')" }} />
      <a className="skip-link" href="#ob-main">Skip to the form</a>
      <main id="ob-main" tabIndex={-1}>{children}</main>
    </>
  );
}

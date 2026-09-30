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
      {/* Extra faces for the design-brief type and mood samples (Archivo and JetBrains Mono load site-wide). */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- only the onboarding needs these */}
      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Anton&family=Caveat:wght@500;600&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,600&display=swap"
      />
      <a className="skip-link" href="#ob-main">Skip to the form</a>
      <main id="ob-main" tabIndex={-1}>{children}</main>
    </>
  );
}

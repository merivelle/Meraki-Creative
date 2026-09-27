import Link from "next/link";

type NavItem = { href: string; label: string };

export function AppShell({ area, nav, current, email, children }: {
  area: "Client portal" | "Studio admin" | "Account";
  nav: NavItem[];
  current?: string;
  email?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="app-bar">
        <div className="wrap">
          <div>
            <Link href="/" className="brand">Meraki Creative<span className="dot">.</span></Link>{" "}
            <span className="badge">{area}</span>
          </div>
          <nav aria-label={area}>
            {nav.map((n) => (
              <Link key={n.href} href={n.href} aria-current={current === n.href ? "page" : undefined}>{n.label}</Link>
            ))}
            {email && (
              <form action="/auth/signout" method="post" style={{ display: "inline" }}>
                <button type="submit" className="txt-link">Sign out</button>
              </form>
            )}
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="app-main">
        <div className="wrap">{children}</div>
      </main>
    </div>
  );
}

export function Badge({ children, attention }: { children: React.ReactNode; attention?: boolean }) {
  return <span className={`badge${attention ? " attention" : ""}`}>{children}</span>;
}

export function FlashMessage({ message, error }: { message?: string | null; error?: string | null }) {
  if (error) return <p className="form-error" role="alert">{error}</p>;
  if (message) return <p className="notice" role="status">{message}</p>;
  return null;
}

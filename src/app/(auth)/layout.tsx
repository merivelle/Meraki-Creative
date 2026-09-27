import "@/styles/app.css";
import { AppShell } from "@/components/app/AppShell";

export const metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell area="Account" nav={[{ href: "/", label: "Back to the site" }]}>
      <div style={{ maxWidth: 520 }}>{children}</div>
    </AppShell>
  );
}

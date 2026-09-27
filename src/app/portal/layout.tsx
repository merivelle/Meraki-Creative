import "@/styles/app.css";
import { AppShell } from "@/components/app/AppShell";
import { requireUser } from "@/lib/auth/guards";

export const metadata = { title: "Client portal | Meraki Creative", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, isStaff } = await requireUser("/portal");
  const nav = [
    { href: "/portal", label: "Projects" },
    { href: "/portal/requests/new", label: "New request" },
    { href: "/portal/account", label: "Account" },
    ...(isStaff ? [{ href: "/admin", label: "Studio admin" }] : []),
  ];
  return <AppShell area="Client portal" nav={nav} email={user.email}>{children}</AppShell>;
}

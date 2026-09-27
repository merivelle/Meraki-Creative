import "@/styles/app.css";
import { AppShell } from "@/components/app/AppShell";
import { requireStaffPage } from "@/lib/auth/guards";

export const metadata = { title: "Studio admin | Meraki Creative", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/proposals", label: "Proposals" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/forms", label: "Questionnaires" },
  { href: "/admin/content", label: "Website content" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side gate: signed-out → /login, signed-in non-staff → 404.
  const { user } = await requireStaffPage();
  return <AppShell area="Studio admin" nav={NAV} email={user.email}>{children}</AppShell>;
}

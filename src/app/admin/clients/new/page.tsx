import { requireStaffPage } from "@/lib/auth/guards";
import { ActionForm } from "@/components/app/ActionForm";
import { ClientFields } from "@/components/app/ClientFields";
import { saveClient } from "@/app/admin/_actions/pipeline";

export default async function NewClientPage() {
  await requireStaffPage();
  return (
    <>
      <h1>Add a client</h1>
      <ActionForm action={saveClient.bind(null, null)} submitLabel="Create client"><ClientFields /></ActionForm>
    </>
  );
}

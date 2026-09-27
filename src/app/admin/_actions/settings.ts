"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/guards";
import { deliver, retryFailed } from "@/lib/email/outbox";
import { ok, type Result } from "./shared";

export async function retryEmail(deliveryId: string): Promise<Result> {
  await requireStaff();
  await deliver([deliveryId]);
  revalidatePath("/admin/settings");
  return ok("Retried. Check the status below.");
}

export async function retryAllFailed(): Promise<Result> {
  await requireStaff();
  const n = await retryFailed(50, 10);
  revalidatePath("/admin/settings");
  return ok(`Retried ${n} email${n === 1 ? "" : "s"}.`);
}

"use server";

import { redirect } from "next/navigation";
import { getContent } from "@/lib/content/queries";
import { processInquiry, type InquiryState } from "@/lib/inquiry/submit";

export async function submitInquiry(_prev: InquiryState, fd: FormData): Promise<InquiryState> {
  const { packages } = await getContent();
  const state = await processInquiry(fd, packages);
  if (state.status === "saved") redirect("/start/thanks");
  return state;
}

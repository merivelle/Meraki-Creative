"use client";

import { useTransition } from "react";
import { removeFeedbackItem } from "@/app/portal/actions";

export function RemoveNoteButton({ versionId, itemId }: { versionId: string; itemId: string }) {
  const [pending, start] = useTransition();
  return (
    <button className="txt-link" disabled={pending} onClick={() => start(async () => { await removeFeedbackItem(versionId, itemId); })}>
      Remove
    </button>
  );
}

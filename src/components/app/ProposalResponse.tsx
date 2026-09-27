"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondToProposal } from "@/app/portal/actions";

export function ProposalResponse({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const respond = (r: "accepted" | "declined") =>
    start(async () => {
      if (r === "declined" && !confirm("Decline this proposal?")) return;
      const res = await respondToProposal(proposalId, r);
      setMsg(res.ok ? res.message ?? null : res.error);
      router.refresh();
    });
  return (
    <div className="btn-group" style={{ marginTop: "1rem" }}>
      <button className="btn btn-primary btn-small" disabled={pending} onClick={() => respond("accepted")}>Accept proposal</button>
      <button className="btn btn-secondary btn-small" disabled={pending} onClick={() => respond("declined")}>Decline</button>
      {msg && <p role="status" className="muted-note">{msg}</p>}
    </div>
  );
}

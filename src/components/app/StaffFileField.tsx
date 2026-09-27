"use client";

import { useState } from "react";
import { Uploader } from "./Uploader";
import { completeStaffUpload, prepareStaffUpload } from "@/app/admin/_actions/projects";

/** Upload a file (kept staff-only until released) and put its id in a hidden form field. */
export function StaffFileField({ projectId, purpose, name = "file_id", label = "Upload a file" }: {
  projectId: string;
  purpose: "review" | "deliverable" | "document";
  name?: string;
  label?: string;
}) {
  const [fileId, setFileId] = useState("");
  return (
    <>
      <input type="hidden" name={name} value={fileId} />
      <Uploader
        label={fileId ? "Replace file" : label}
        prepare={async (meta) => {
          const r = await prepareStaffUpload(projectId, purpose, meta);
          if (!("error" in r)) setFileId("");
          return r;
        }}
        complete={async (id) => {
          const r = await completeStaffUpload(id);
          if ("ok" in r) setFileId(id);
          return r;
        }}
      />
    </>
  );
}

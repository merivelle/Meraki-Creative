"use client";

import { useState } from "react";
import { FormFields } from "@/components/forms/FormFields";
import type { FormDefinition } from "@/lib/forms/types";
import { CLIENT_TYPE_LABELS } from "@/lib/labels";

/** Live, non-submitting preview of a questionnaire, with a client-type switch for branches. */
export function FormPreview({ def }: { def: FormDefinition }) {
  const [clientType, setClientType] = useState("actor");
  return (
    <div className="panel">
      <div className="field">
        <label htmlFor="pv-ct">Preview as</label>
        <select id="pv-ct" value={clientType} onChange={(e) => setClientType(e.target.value)}>
          {Object.entries(CLIENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <form onSubmit={(e) => e.preventDefault()}>
        <FormFields key={clientType} def={def} ctx={{ clientType }} />
      </form>
    </div>
  );
}

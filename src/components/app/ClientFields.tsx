import { CLIENT_TYPE_LABELS } from "@/lib/labels";

export function ClientFields({ c }: { c?: Record<string, string | null> }) {
  return (
    <>
      <div className="form-row">
        <div className="field"><label htmlFor="display_name">Name</label><input id="display_name" name="display_name" required defaultValue={c?.display_name ?? ""} /></div>
        <div className="field"><label htmlFor="business_name">Business name</label><input id="business_name" name="business_name" defaultValue={c?.business_name ?? ""} /></div>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="client_type">Type</label>
          <select id="client_type" name="client_type" defaultValue={c?.client_type ?? "other"}>
            {Object.entries(CLIENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="primary_email">Primary email</label><input id="primary_email" name="primary_email" type="email" defaultValue={c?.primary_email ?? ""} /></div>
      </div>
      <div className="form-row">
        <div className="field"><label htmlFor="phone">Phone</label><input id="phone" name="phone" defaultValue={c?.phone ?? ""} /></div>
        <div className="field"><label htmlFor="website">Website</label><input id="website" name="website" defaultValue={c?.website ?? ""} /></div>
      </div>
    </>
  );
}

"use client";

/**
 * The art-directed design-brief screens: style directions, type pairings, palettes, layouts,
 * and plain-language motion choices. Each is a set of real checkbox/radio inputs inside the one
 * /start form, so they submit, validate, and work with the keyboard like every other question.
 * Everything stays rendered (filtered-out cards are `hidden`, not removed) so a choice made
 * under one filter is still submitted under another.
 */
import { useEffect, useRef, useState } from "react";
import type { Answers, Option } from "@/lib/forms/types";
import { STYLES, styleById, type StyleGroup } from "@/content/design/styles";
import { LICENSED_PAIRINGS, PAIRINGS, TYPE_FILTERS, FONT_NAMES, pairingById, pairingLabel, type TypeFilter } from "@/content/design/typography";
import { PALETTES, PALETTE_FILTERS, paletteById, type Palette, type PaletteFilter } from "@/content/design/palettes";
import { FONT, FontshareSatoshi } from "./fonts";
import { sampleFor, type Sample } from "./sample";
import { StylePreview } from "./StylePreview";

type Props = { answers: Answers; setAnswer: (id: string, v: Answers[string]) => void };

const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
const HELP = "help";

/** The first chosen direction (for suggestions). */
const leadStyle = (answers: Answers) => styleById(arr(answers.brief_styles).find((x) => x !== HELP) ?? "");

/* ================================================================ Style directions */

const GROUP_ORDER: StyleGroup[] = ["Quiet", "Editorial", "Bold", "Textured", "Playful", "Technical"];

export function StyleGallery({ answers, setAnswer }: Props) {
  const chosen = arr(answers.brief_styles);
  const avoided = arr(answers.brief_styles_avoid);
  const help = chosen.includes(HELP);
  const [more, setMore] = useState(() => STYLES.some((s) => !s.featured && (chosen.includes(s.id) || avoided.includes(s.id))));
  const [previewId, setPreviewId] = useState<string | null>(null);
  const sample = sampleFor(answers.client_type);
  const featured = STYLES.filter((s) => s.featured);
  const rest = STYLES.filter((s) => !s.featured);

  const toggle = (id: string, on: boolean) => {
    if (id === HELP) { setAnswer("brief_styles", on ? [HELP] : []); return; }
    const next = on ? [...chosen.filter((x) => x !== HELP), id] : chosen.filter((x) => x !== id);
    setAnswer("brief_styles", next);
    if (on && avoided.includes(id)) setAnswer("brief_styles_avoid", avoided.filter((x) => x !== id));
  };
  const toggleAvoid = (id: string, on: boolean) => {
    setAnswer("brief_styles_avoid", on ? [...avoided, id] : avoided.filter((x) => x !== id));
    if (on && chosen.includes(id)) setAnswer("brief_styles", chosen.filter((x) => x !== id));
  };

  const card = (id: string) => {
    const s = styleById(id)!;
    const on = chosen.includes(id);
    const off = avoided.includes(id);
    const full = !on && chosen.filter((x) => x !== HELP).length >= 2;
    return (
      <li key={id} className={`ds-card${on ? " is-selected" : ""}${off ? " is-avoided" : ""}`}>
        <label className="ds-pick">
          <input type="checkbox" className="visually-hidden" name="brief_styles" value={id} checked={on} disabled={full}
            aria-describedby={`ds-${id}-blurb`} onChange={(e) => toggle(id, e.currentTarget.checked)} />
          <span className="ds-frame"><StylePreview id={id} sample={sample} /></span>
          <span className="ds-title">
            <span className="ds-name">{s.name}</span>
            <span className="ds-state" aria-hidden="true">{on ? "✓ Selected" : off ? "Avoiding" : ""}</span>
          </span>
        </label>
        <p className="ds-blurb" id={`ds-${id}-blurb`}>{s.blurb}</p>
        <p className="ds-tags">{s.tags.map((t) => <span key={t}>{t}</span>)}</p>
        <div className="ds-actions">
          <button type="button" className="ob-link" onClick={() => setPreviewId(id)} aria-label={`Preview ${s.name} larger`}>Preview</button>
          <label className="ds-avoid">
            <input type="checkbox" name="brief_styles_avoid" value={id} checked={off} onChange={(e) => toggleAvoid(id, e.currentTarget.checked)} />
            <span>Avoid</span>
          </label>
        </div>
      </li>
    );
  };

  return (
    <div className="ds">
      <p className="ds-status slate" aria-live="polite">
        {help ? "You've asked for help deciding." : `${chosen.length} of 2 chosen`}
        {avoided.length > 0 && ` · avoiding ${avoided.length}`}
      </p>
      <ul className="ds-grid">{featured.map((s) => card(s.id))}</ul>
      <div hidden={!more}>
        {GROUP_ORDER.map((g) => {
          const inGroup = rest.filter((s) => s.group === g);
          if (!inGroup.length) return null;
          return (
            <section key={g} className="ds-group">
              <h3 className="ds-group-title slate">{g}</h3>
              <ul className="ds-grid">{inGroup.map((s) => card(s.id))}</ul>
            </section>
          );
        })}
      </div>
      <div className="ds-more">
        <button type="button" className="ob-link" aria-expanded={more} onClick={() => setMore((m) => !m)}>
          {more ? "Show fewer styles" : `Explore more styles (${rest.length})`}
        </button>
        <label className={`ds-help${help ? " is-on" : ""}`}>
          <input type="checkbox" name="brief_styles" value={HELP} checked={help} onChange={(e) => toggle(HELP, e.currentTarget.checked)} />
          <span>Help me decide</span>
        </label>
      </div>
      <PreviewDialog id={previewId} sample={sample} onClose={() => setPreviewId(null)}
        chosen={previewId ? chosen.includes(previewId) : false}
        canChoose={previewId ? chosen.includes(previewId) || chosen.filter((x) => x !== HELP).length < 2 : false}
        onChoose={(on) => previewId && toggle(previewId, on)} />
    </div>
  );
}

function PreviewDialog({ id, sample, onClose, chosen, canChoose, onChoose }: {
  id: string | null; sample: Sample; onClose: () => void; chosen: boolean; canChoose: boolean; onChoose: (on: boolean) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (id && !d.open) { opener.current = document.activeElement as HTMLElement; d.showModal(); }
    if (!id && d.open) d.close();
  }, [id]);
  const s = id ? styleById(id) : undefined;
  const pair = s ? pairingById(s.pairings[0]) : undefined;
  const pal = s ? paletteById(s.palettes[0]) : undefined;
  return (
    <dialog ref={ref} className="ds-dialog" aria-labelledby="ds-dialog-title"
      onClose={() => { onClose(); opener.current?.focus(); }}
      onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
      {s && (
        <div className="ds-dialog-body">
          <div className="ds-dialog-head">
            <div>
              <p className="slate">{s.group}</p>
              <h2 id="ds-dialog-title" className="ds-dialog-title">{s.name}</h2>
              <p className="ds-dialog-blurb">{s.blurb}</p>
              <p className="ds-tags">{s.tags.map((t) => <span key={t}>{t}</span>)}</p>
            </div>
            <button type="button" className="ds-close" aria-label="Close preview" onClick={() => ref.current?.close()}>×</button>
          </div>
          <div className="ds-dialog-previews">
            <figure><StylePreview id={s.id} sample={sample} variant="desktop" /><figcaption className="slate">Desktop</figcaption></figure>
            <figure className="ds-dialog-mobile"><StylePreview id={s.id} sample={sample} variant="mobile" /><figcaption className="slate">Phone</figcaption></figure>
          </div>
          <div className="ds-dialog-foot">
            <p className="ds-dialog-note">
              Shown with {pair ? pairingLabel(pair) : "its suggested type"} and the {pal?.name ?? "suggested"} palette. You can change both on the next screens.
            </p>
            <button type="button" className={chosen ? "btn btn-secondary" : "btn btn-primary"} disabled={!canChoose}
              onClick={() => onChoose(!chosen)}>
              {chosen ? "Remove this direction" : canChoose ? "Choose this direction" : "Two already chosen"}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

/* ================================================================ Suggestions */

function Suggest({ label, value, current, onApply }: { label: string; value: string | undefined; current: unknown; onApply: () => void }) {
  if (!value || current === value) return null;
  return (
    <p className="ds-suggest">
      <span>{label}</span>
      <button type="button" className="ob-link" onClick={onApply}>Apply</button>
    </p>
  );
}

/* ================================================================ Type pairings */

export function PairingLibrary({ answers, setAnswer }: Props) {
  const [filter, setFilter] = useState<TypeFilter | "all">("all");
  const [all, setAll] = useState(() => PAIRINGS.some((p) => !p.featured && (answers.brief_type_pair === p.id || arr(answers.brief_type_alt).includes(p.id))));
  const pick = typeof answers.brief_type_pair === "string" ? answers.brief_type_pair : "";
  const alts = arr(answers.brief_type_alt);
  const style = leadStyle(answers);
  const suggestion = style ? pairingById(style.pairings[0]) : undefined;
  const sample = sampleFor(answers.client_type);

  const visible = (id: string, featured?: boolean, filters?: TypeFilter[]) =>
    (filter === "all" ? all || featured || pick === id || alts.includes(id) : filters?.includes(filter));

  return (
    <div className="ds">
      <FontshareSatoshi />
      {suggestion && style && (
        <Suggest label={`Suggested for ${style.name}: ${pairingLabel(suggestion)}`} value={suggestion.id} current={pick}
          onApply={() => { setAnswer("brief_type_pair", suggestion.id); setAnswer("brief_type_alt", alts.filter((x) => x !== suggestion.id)); }} />
      )}
      <Filters items={TYPE_FILTERS} value={filter} onChange={setFilter} label="Filter type pairings" />
      <ul className="ds-grid ds-grid-type" role="radiogroup" aria-label="Type pairings">
        {PAIRINGS.map((p) => {
          const on = pick === p.id;
          const alt = alts.includes(p.id);
          return (
            <li key={p.id} className={`ds-card ds-type${on ? " is-selected" : ""}`} hidden={!visible(p.id, p.featured, p.filters) || undefined}>
              <label className="ds-pick">
                <input type="radio" className="visually-hidden" name="brief_type_pair" value={p.id} checked={on}
                  onChange={() => { setAnswer("brief_type_pair", p.id); if (alt) setAnswer("brief_type_alt", alts.filter((x) => x !== p.id)); }} />
                <TypeSpecimen id={p.id} sample={sample} />
                <span className="ds-title">
                  <span className="ds-name">{pairingLabel(p)}</span>
                  <span className="ds-state" aria-hidden="true">{on ? "✓ Preferred" : alt ? "Also considering" : ""}</span>
                </span>
              </label>
              <p className="ds-blurb">{p.description}</p>
              <p className="ds-roles slate">{FONT_NAMES[p.heading]} · headings{p.accent ? " (accent)" : ""} &nbsp;/&nbsp; {FONT_NAMES[p.body]} · body</p>
              <div className="ds-actions">
                <label className="ds-avoid">
                  <input type="checkbox" name="brief_type_alt" value={p.id} checked={alt} disabled={on || (!alt && alts.length >= 2)}
                    onChange={(e) => setAnswer("brief_type_alt", e.currentTarget.checked ? [...alts, p.id] : alts.filter((x) => x !== p.id))} />
                  <span>Also consider</span>
                </label>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="ds-more">
        {filter === "all" && (
          <button type="button" className="ob-link" aria-expanded={all} onClick={() => setAll((x) => !x)}>
            {all ? "Show fewer pairings" : `Show all ${PAIRINGS.length} pairings`}
          </button>
        )}
        <label className={`ds-help${pick === HELP ? " is-on" : ""}`}>
          <input type="radio" name="brief_type_pair" value={HELP} checked={pick === HELP} onChange={() => setAnswer("brief_type_pair", HELP)} />
          <span>Help me choose</span>
        </label>
      </div>
      <p className="ds-note">
        Licensed options, quoted separately: {LICENSED_PAIRINGS.join(" · ")}. These aren&apos;t shown live because
        they need a paid web licence.
      </p>
    </div>
  );
}

/** A fair, neutral specimen: same layout and colours for every pairing. */
export function TypeSpecimen({ id, sample }: { id: string; sample: Sample }) {
  const p = pairingById(id);
  if (!p) return null;
  const head = FONT[p.heading];
  const body = FONT[p.body];
  return (
    <span className="ds-spec" aria-hidden="true">
      <span className="ds-spec-nav" style={{ fontFamily: body }}>{sample.brand} &nbsp;·&nbsp; {sample.nav.join("  ")}</span>
      <span className="ds-spec-head" style={{ fontFamily: head, fontWeight: p.weight, textTransform: p.uppercase ? "uppercase" : undefined, letterSpacing: p.uppercase ? "0.02em" : p.heading === "caveat" ? "0" : "-0.015em", fontSize: p.accent ? "2.1em" : p.uppercase ? "1.9em" : undefined }}>
        {p.accent ? sample.brand : sample.headline}
      </span>
      <span className="ds-spec-body" style={{ fontFamily: body }}>{p.accent ? sample.headline + " " : ""}{sample.body}</span>
      <span className="ds-spec-btn" style={{ fontFamily: body }}>{sample.cta}</span>
    </span>
  );
}

/* ================================================================ Palettes */

export function PaletteLibrary({ answers, setAnswer }: Props) {
  const [filter, setFilter] = useState<PaletteFilter | "all">("all");
  const [all, setAll] = useState(() => PALETTES.some((p) => !p.featured && (answers.brief_palette === p.id || answers.brief_palette_alt === p.id)));
  const pick = typeof answers.brief_palette === "string" ? answers.brief_palette : "";
  const alt = typeof answers.brief_palette_alt === "string" ? answers.brief_palette_alt : "";
  const style = leadStyle(answers);
  const suggestion = style ? paletteById(style.palettes[0]) : undefined;
  const sample = sampleFor(answers.client_type);

  const visible = (p: Palette) => (filter === "all" ? all || p.featured || pick === p.id || alt === p.id : p.filters.includes(filter));
  const choose = (id: string) => { setAnswer("brief_palette", id); if (alt === id) setAnswer("brief_palette_alt", ""); };

  return (
    <div className="ds">
      {suggestion && style && (
        <Suggest label={`Suggested for ${style.name}: ${suggestion.name}`} value={suggestion.id} current={pick} onApply={() => choose(suggestion.id)} />
      )}
      <Filters items={PALETTE_FILTERS} value={filter} onChange={setFilter} label="Filter palettes" />
      <ul className="ds-grid ds-grid-palette" role="radiogroup" aria-label="Palettes">
        {PALETTES.map((p) => {
          const on = pick === p.id;
          const isAlt = alt === p.id;
          return (
            <li key={p.id} className={`ds-card ds-pal${on ? " is-selected" : ""}`} hidden={!visible(p) || undefined}>
              <label className="ds-pick">
                <input type="radio" className="visually-hidden" name="brief_palette" value={p.id} checked={on} onChange={() => choose(p.id)} />
                <PalettePage p={p} sample={sample} />
                <span className="ds-title">
                  <span className="ds-name">{p.name}</span>
                  <span className="ds-state" aria-hidden="true">{on ? "✓ Preferred" : isAlt ? "Alternative" : ""}</span>
                </span>
              </label>
              <p className="ds-blurb">{p.mood}</p>
              <Swatches p={p} />
              <div className="ds-actions">
                <label className="ds-avoid">
                  <input type="radio" name="brief_palette_alt" value={p.id} checked={isAlt} disabled={on}
                    onChange={() => setAnswer("brief_palette_alt", p.id)} />
                  <span>Alternative</span>
                </label>
                {isAlt && <button type="button" className="ob-link" onClick={() => setAnswer("brief_palette_alt", "")}>Clear</button>}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="ds-more">
        {filter === "all" && (
          <button type="button" className="ob-link" aria-expanded={all} onClick={() => setAll((x) => !x)}>
            {all ? "Show fewer palettes" : `Show all ${PALETTES.length} palettes`}
          </button>
        )}
        <label className={`ds-help${pick === "brand" ? " is-on" : ""}`}>
          <input type="radio" name="brief_palette" value="brand" checked={pick === "brand"} onChange={() => choose("brand")} />
          <span>Use my existing brand colours</span>
        </label>
        <label className={`ds-help${pick === "studio" ? " is-on" : ""}`}>
          <input type="radio" name="brief_palette" value="studio" checked={pick === "studio"} onChange={() => choose("studio")} />
          <span>Let Meraki choose</span>
        </label>
      </div>
    </div>
  );
}

/** The same small page for every palette, so only colour changes between cards. */
export function PalettePage({ p, sample }: { p: Palette; sample: Sample }) {
  return (
    <span className="ds-palpage" aria-hidden="true" style={{ background: p.bg, color: p.text }}>
      <span className="ds-palpage-nav"><b>{sample.brand}</b><span style={{ color: p.muted }}>{sample.nav.join("  ")}</span></span>
      <span className="ds-palpage-head">{sample.short}</span>
      <span className="ds-palpage-body" style={{ color: p.muted }}>{sample.deck}</span>
      <span className="ds-palpage-row">
        <span className="ds-palpage-btn" style={{ background: p.accent, color: p.buttonText }}>{sample.cta}</span>
        <span className="ds-palpage-link" style={{ color: p.accentText }}>{sample.section} →</span>
      </span>
      <span className="ds-palpage-panel" style={{ background: p.surface, borderTop: `1px solid ${p.border}` }}>
        {sample.items.map((it) => <span key={it}>{it}</span>)}
      </span>
    </span>
  );
}

export function Swatches({ p }: { p: Palette }) {
  const roles: [string, string][] = [["Background", p.bg], ["Text", p.text], ["Surface", p.surface], ["Accent", p.accent]];
  return (
    <ul className="ds-swatches" aria-label={`${p.name} colours`}>
      {roles.map(([r, h]) => (
        <li key={r}><span className="ds-chip" style={{ background: h }} /><span className="ds-swatch-text"><span>{r}</span><code>{h}</code></span></li>
      ))}
    </ul>
  );
}

/* ================================================================ Layouts & motion */

const LAYOUT_ART: Record<string, React.ReactNode> = {
  hero: <><rect x="4" y="4" width="112" height="46" /><rect x="10" y="56" width="50" height="4" /><rect x="10" y="64" width="34" height="3" /></>,
  split: <><rect x="4" y="4" width="54" height="64" /><rect x="66" y="16" width="44" height="6" /><rect x="66" y="28" width="36" height="3" /><rect x="66" y="35" width="40" height="3" /></>,
  type: <><rect x="10" y="12" width="96" height="10" /><rect x="10" y="26" width="70" height="10" /><rect x="10" y="48" width="30" height="16" /><rect x="46" y="48" width="30" height="16" /><rect x="82" y="48" width="30" height="16" /></>,
  index: <>{[10, 22, 34, 46, 58].map((y) => <rect key={y} x="10" y={y} width="100" height="2" />)}<rect x="10" y="12" width="40" height="5" /></>,
  grid: <>{[4, 42, 80].flatMap((x) => [4, 38].map((y) => <rect key={`${x}${y}`} x={x} y={y} width="34" height="30" />))}</>,
  masonry: <><rect x="4" y="4" width="34" height="40" /><rect x="4" y="48" width="34" height="20" /><rect x="42" y="4" width="34" height="22" /><rect x="42" y="30" width="34" height="38" /><rect x="80" y="4" width="34" height="30" /><rect x="80" y="38" width="34" height="30" /></>,
  magazine: <><rect x="4" y="4" width="70" height="40" /><rect x="80" y="4" width="34" height="3" /><rect x="80" y="11" width="34" height="3" /><rect x="80" y="18" width="26" height="3" /><rect x="4" y="50" width="52" height="3" /><rect x="62" y="50" width="52" height="3" /><rect x="4" y="57" width="46" height="3" /><rect x="62" y="57" width="40" height="3" /></>,
  cards: <>{[4, 42, 80].map((x) => <rect key={x} x={x} y="18" width="34" height="42" rx="4" />)}<rect x="30" y="6" width="60" height="5" /></>,
};

export function LayoutCards({ answers, setAnswer, options }: Props & { options: Option[] }) {
  const chosen = arr(answers.brief_layout);
  const set = (v: string, on: boolean) => {
    if (v === HELP) { setAnswer("brief_layout", on ? [HELP] : []); return; }
    setAnswer("brief_layout", on ? [...chosen.filter((x) => x !== HELP), v] : chosen.filter((x) => x !== v));
  };
  return (
    <ul className="ds-grid ds-grid-layout" aria-label="Layouts">
      {options.map((o) => {
        const on = chosen.includes(o.value);
        return (
          <li key={o.value}>
            <label className={`ds-layout${on ? " is-selected" : ""}`}>
              <input type="checkbox" className="visually-hidden" name="brief_layout" value={o.value} checked={on} onChange={(e) => set(o.value, e.currentTarget.checked)} />
              {LAYOUT_ART[o.value] ? (
                <svg viewBox="0 0 120 72" className="ds-layout-art" aria-hidden="true">{LAYOUT_ART[o.value]}</svg>
              ) : <span className="ds-layout-art ds-layout-help" aria-hidden="true">?</span>}
              <span className="ds-name">{o.label}</span>
              {o.hint && <span className="ds-blurb">{o.hint}</span>}
              <span className="ds-state" aria-hidden="true">{on ? "✓ Selected" : ""}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

export function HintedChoice({ name, options, value, onChange, labelledBy }: {
  name: string; options: Option[]; value: unknown; onChange: (v: string) => void; labelledBy: string;
}) {
  return (
    <div className="ds-hinted" role="radiogroup" aria-labelledby={labelledBy}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <label key={o.value} className={`ds-hint${on ? " is-selected" : ""}`}>
            <input type="radio" name={name} value={o.value} checked={on} onChange={() => onChange(o.value)} />
            <span className="ds-name">{o.label}</span>
            {o.hint && <span className="ds-blurb">{o.hint}</span>}
          </label>
        );
      })}
    </div>
  );
}

/* ================================================================ Shared */

function Filters<T extends string>({ items, value, onChange, label }: { items: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="ds-filters" role="group" aria-label={label}>
      {items.map((f) => (
        <button key={f.id} type="button" className={`ds-filter${value === f.id ? " is-on" : ""}`} aria-pressed={value === f.id} onClick={() => onChange(f.id)}>
          {f.label}
        </button>
      ))}
    </div>
  );
}


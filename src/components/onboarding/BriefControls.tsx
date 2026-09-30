"use client";

/**
 * Controls for the richer /start questions: link rows with a note, colour pickers, an
 * ordered section picker, and the live type/palette/mood samples on design-brief cards.
 * Each one submits plain form fields that formDataToAnswers() already understands.
 */
import { useEffect, useRef, useState } from "react";
import type { Option } from "@/lib/forms/types";

/* ---------------------------------------------------------------- Link rows */

type LinkRow = { url: string; note?: string };

export function LinkRows({ name, firstId, value, noteLabel, max, onChange, labelledBy }: {
  name: string;
  firstId: string;
  value: unknown;
  noteLabel: string;
  max: number;
  onChange: (rows: LinkRow[]) => void;
  labelledBy: string;
}) {
  // Controlled by the answer, so progress restored from sessionStorage shows up. Empty rows
  // are kept while typing; the engine ignores them on submit.
  const rows: LinkRow[] = Array.isArray(value) && value.length ? (value as LinkRow[]) : [{ url: "", note: "" }];
  const focusIndex = useRef<number | null>(null);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (focusIndex.current === null) return;
    listRef.current?.querySelectorAll<HTMLInputElement>("input[type=url]")[focusIndex.current]?.focus();
    focusIndex.current = null;
  }, [rows.length]);

  const update = (next: LinkRow[]) => onChange(next);

  return (
    <div className="ob-links" role="group" aria-labelledby={labelledBy}>
      <ol ref={listRef} className="ob-links-list">
        {rows.map((r, i) => (
          <li key={i} className="ob-link-row">
            <span className="ob-link-num slate" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <div className="ob-link-fields">
              <input
                id={i === 0 ? firstId : undefined}
                className="ob-input ob-link-url"
                type="url"
                inputMode="url"
                name={`${name}.${i}.url`}
                value={r.url}
                placeholder="https://"
                aria-label={`Link ${i + 1}`}
                onChange={(e) => update(rows.map((x, j) => (j === i ? { ...x, url: e.currentTarget.value } : x)))}
              />
              <input
                className="ob-link-note"
                type="text"
                name={`${name}.${i}.note`}
                value={r.note ?? ""}
                maxLength={500}
                placeholder={noteLabel}
                aria-label={`${noteLabel} (link ${i + 1})`}
                onChange={(e) => update(rows.map((x, j) => (j === i ? { ...x, note: e.currentTarget.value } : x)))}
              />
            </div>
            {rows.length > 1 && (
              <button type="button" className="ob-link" aria-label={`Remove link ${i + 1}`}
                onClick={() => update(rows.filter((_, j) => j !== i))}>
                Remove
              </button>
            )}
          </li>
        ))}
      </ol>
      {rows.length < max && (
        <button type="button" className="ob-link ob-add"
          onClick={() => { focusIndex.current = rows.length; update([...rows, { url: "", note: "" }]); }}>
          + Add another link
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Colour pickers */

const HEX = /^#[0-9a-f]{6}$/i;

export function ColorPicks({ name, firstId, value, onChange, labelledBy }: {
  name: string;
  firstId: string;
  value: unknown;
  onChange: (v: string) => void;
  labelledBy: string;
}) {
  // Controlled by the answer ("#aabbcc, #112233"); half-typed codes are kept while editing,
  // and only complete ones are submitted.
  const colors = typeof value === "string" && value ? value.split(", ") : [];
  const update = (next: string[]) => onChange(next.join(", "));
  return (
    <div className="ob-colors" role="group" aria-labelledby={labelledBy}>
      <input type="hidden" name={name} value={colors.filter((x) => HEX.test(x)).join(", ")} />
      {colors.map((c, i) => (
        <div key={i} className="ob-color">
          <input
            id={i === 0 ? firstId : undefined}
            type="color"
            value={HEX.test(c) ? c : "#000000"}
            aria-label={`Colour ${i + 1}`}
            onChange={(e) => update(colors.map((x, j) => (j === i ? e.currentTarget.value : x)))}
          />
          <input
            className="ob-color-hex"
            type="text"
            value={c}
            maxLength={7}
            spellCheck={false}
            aria-label={`Colour ${i + 1} hex code`}
            onChange={(e) => {
              const v = e.currentTarget.value.startsWith("#") ? e.currentTarget.value : `#${e.currentTarget.value}`;
              update(colors.map((x, j) => (j === i ? v : x)));
            }}
          />
          <button type="button" className="ob-link" aria-label={`Remove colour ${i + 1}`} onClick={() => update(colors.filter((_, j) => j !== i))}>
            Remove
          </button>
        </div>
      ))}
      {colors.length < 4 && (
        <button type="button" className="ob-link ob-add" onClick={() => update([...colors, colors.length ? "#7b2d26" : "#17150f"])}>
          + Add a colour
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Ordered picker */

export function OrderedPicker({ name, options, value, onChange, labelledBy }: {
  name: string;
  options: Option[];
  value: unknown;
  onChange: (v: string[]) => void;
  labelledBy: string;
}) {
  const chosen = (Array.isArray(value) ? (value as string[]) : []).filter((v) => options.some((o) => o.value === v));
  const [announce, setAnnounce] = useState("");
  const label = (v: string) => options.find((o) => o.value === v)?.label ?? v;
  const listRef = useRef<HTMLOListElement>(null);
  const refocus = useRef<{ index: number; dir: "up" | "down" } | null>(null);

  useEffect(() => {
    if (!refocus.current) return;
    const { index, dir } = refocus.current;
    const btn = listRef.current?.children[index]?.querySelector<HTMLButtonElement>(`[data-dir="${dir}"]:not(:disabled)`)
      ?? listRef.current?.children[index]?.querySelector<HTMLButtonElement>("button:not(:disabled)");
    btn?.focus();
    refocus.current = null;
  });

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= chosen.length) return;
    const next = [...chosen];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    refocus.current = { index: j, dir: d < 0 ? "up" : "down" };
    setAnnounce(`${label(next[j])} moved to ${j + 1} of ${next.length}.`);
  };

  return (
    <div className="ob-order" role="group" aria-labelledby={labelledBy}>
      {chosen.map((v) => <input key={v} type="hidden" name={name} value={v} />)}
      {chosen.length > 0 && (
        <ol ref={listRef} className="ob-order-list">
          {chosen.map((v, i) => (
            <li key={v} className="ob-order-item">
              <span className="ob-order-num slate">{String(i + 1).padStart(2, "0")}</span>
              <span className="ob-order-label">{label(v)}</span>
              <span className="ob-order-tools">
                <button type="button" data-dir="up" disabled={i === 0} aria-label={`Move ${label(v)} up`} onClick={() => move(i, -1)}>↑</button>
                <button type="button" data-dir="down" disabled={i === chosen.length - 1} aria-label={`Move ${label(v)} down`} onClick={() => move(i, 1)}>↓</button>
                <button type="button" aria-label={`Remove ${label(v)}`} onClick={() => { onChange(chosen.filter((x) => x !== v)); setAnnounce(`${label(v)} removed.`); }}>×</button>
              </span>
            </li>
          ))}
        </ol>
      )}
      <div className="ob-order-pool">
        {options.filter((o) => !chosen.includes(o.value)).map((o) => (
          <button key={o.value} type="button" className="ob-order-add"
            onClick={() => { onChange([...chosen, o.value]); setAnnounce(`${o.label} added as number ${chosen.length + 1}.`); }}>
            <span aria-hidden="true">+</span> {o.label}
          </button>
        ))}
      </div>
      <p className="visually-hidden" aria-live="polite">{announce}</p>
    </div>
  );
}

/* ---------------------------------------------------------------- Live samples */

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "var(--font-display)";
const DISPLAY = "'Anton', Impact, sans-serif";
const MONO = "var(--font-mono)";
const SCRIPT = "'Caveat', cursive";

type Look = { bg: string; fg: string; accent: string; font: string; weight: number; style?: string; case?: "upper"; size: string; tracking: string; caption: string; captionFont: string };

const MOODS: Record<string, Look> = {
  minimal: { bg: "#F4F2EC", fg: "#151515", accent: "#151515", font: SANS, weight: 800, size: "1.4rem", tracking: "-0.04em", caption: "Actor · LA", captionFont: MONO },
  cinematic: { bg: "#111110", fg: "#EEE7DA", accent: "#C9897F", font: DISPLAY, weight: 400, case: "upper", size: "1.4rem", tracking: "0.02em", caption: "Now showing", captionFont: MONO },
  warm: { bg: "#EFE3CF", fg: "#3B2A1E", accent: "#9C5A2C", font: SERIF, weight: 600, style: "italic", size: "1.8rem", tracking: "0", caption: "Stories, told slowly", captionFont: SERIF },
  bold: { bg: "#F1EDE4", fg: "#111111", accent: "#D1432B", font: DISPLAY, weight: 400, case: "upper", size: "1.5rem", tracking: "0", caption: "Director", captionFont: MONO },
  soft: { bg: "#F3E4E2", fg: "#6A4A55", accent: "#B7848E", font: SERIF, weight: 500, size: "1.75rem", tracking: "0.01em", caption: "with love", captionFont: SCRIPT },
};

export function MoodSample({ value }: { value: string }) {
  const m = MOODS[value];
  if (!m) return <span className="ob-sample ob-sample-unsure" aria-hidden="true"><span>?</span></span>;
  return (
    <span className="ob-sample" aria-hidden="true" style={{ background: m.bg, color: m.fg }}>
      <span className="ob-sample-bar" style={{ background: m.accent }} />
      <span className="ob-sample-name" style={{ fontFamily: m.font, fontWeight: m.weight, fontStyle: m.style, textTransform: m.case === "upper" ? "uppercase" : undefined, fontSize: m.size, letterSpacing: m.tracking }}>
        Your Name
      </span>
      <span className="ob-sample-cap" style={{ fontFamily: m.captionFont, color: m.accent, fontSize: m.captionFont === SCRIPT ? "1.05rem" : undefined }}>{m.caption}</span>
    </span>
  );
}

const TYPES: Record<string, { font: string; weight: number; size: string; tracking: string; style?: string; case?: "upper" }> = {
  serif: { font: SERIF, weight: 600, size: "2rem", tracking: "0" },
  sans: { font: SANS, weight: 700, size: "1.7rem", tracking: "-0.035em" },
  display: { font: DISPLAY, weight: 400, size: "2rem", tracking: "0.01em", case: "upper" },
  typewriter: { font: MONO, weight: 500, size: "1.35rem", tracking: "0" },
  script: { font: SCRIPT, weight: 600, size: "2.2rem", tracking: "0" },
};

export function TypeSample({ value }: { value: string }) {
  const t = TYPES[value];
  if (!t) return null;
  return (
    <span className="ob-sample ob-sample-type" aria-hidden="true">
      <span className="ob-sample-name" style={{ fontFamily: t.font, fontWeight: t.weight, fontSize: t.size, letterSpacing: t.tracking, textTransform: t.case === "upper" ? "uppercase" : undefined }}>
        Your Name
      </span>
      <span className="ob-sample-cap" style={{ fontFamily: t.font }}>Aa Bb Cc 123</span>
    </span>
  );
}

export const PALETTES: Record<string, string[]> = {
  mono: ["#0E0E0E", "#3A3A3A", "#8C8C8C", "#D9D9D9", "#FAFAFA"],
  neutral: ["#2E2A24", "#8A7B68", "#C9B99F", "#E8DDCB", "#F6F1E8"],
  earth: ["#2B1D16", "#7B2D26", "#B5652F", "#D9B38C", "#F1E6D6"],
  jewel: ["#14213D", "#1F5A4C", "#6B1E3A", "#B08D3C", "#F2EBDD"],
  pastel: ["#5E5470", "#B7A6D3", "#F2C6C2", "#F7E3B5", "#FBF7F0"],
  slate: ["#1C2530", "#3F5566", "#7F97A6", "#C5D2DA", "#F1F4F6"],
};

export function PaletteSample({ value }: { value: string }) {
  const p = PALETTES[value];
  if (!p) return <span className="ob-swatches ob-swatches-studio" aria-hidden="true"><span /></span>;
  return (
    <span className="ob-swatches" aria-hidden="true">
      {p.map((c) => <span key={c} style={{ background: c }} />)}
    </span>
  );
}

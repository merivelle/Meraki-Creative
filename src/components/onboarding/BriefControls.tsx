"use client";

/**
 * Controls for the richer /start questions: link rows with a note, colour pickers, and an
 * ordered section picker.
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

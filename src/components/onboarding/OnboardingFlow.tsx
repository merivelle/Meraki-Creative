"use client";

/**
 * Start a Project, as a guided one-question-at-a-time onboarding.
 *
 * Every step lives inside ONE <form> that posts to the existing server action, so the
 * honeypot, timing token, rate limits and server validation are unchanged. Without
 * JavaScript all steps render as one long page and the form still works.
 * Questions, options, branching and validation come from inquiryDefinition(); the
 * screen layout comes from STEPS (src/lib/inquiry/steps.ts).
 */
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { allQuestions, evaluate, validate, visibleQuestions } from "@/lib/forms/engine";
import type { Answers, FormDefinition, Question } from "@/lib/forms/types";
import type { InquiryState } from "@/lib/inquiry/submit";
import { STEPS, STORAGE_KEY, WELCOME_ILLUSTRATION, type Step } from "@/lib/inquiry/steps";
import { submitInquiry } from "@/app/(onboarding)/start/actions";
import { KEYS, StepChoice, choiceOptions, isMulti } from "./StepChoice";
import { ReviewStep } from "./ReviewStep";
import { WordReveal } from "./WordReveal";

type Props = {
  def: FormDefinition;
  initial: Answers;
  packageNames: Record<string, string>;
  token: string;
  preselected: string;
  turnstileSiteKey: string;
};

const AUTO_ADVANCE_MS = 420;

export function OnboardingFlow({ def, initial, packageNames, token, preselected, turnstileSiteKey }: Props) {
  const [state, formAction, pending] = useActionState<InquiryState, FormData>(submitInquiry, { status: "idle" });
  const [answers, setAnswers] = useState<Answers>(initial);
  const [currentId, setCurrentId] = useState<string>("welcome");
  const [hydrated, setHydrated] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [returnToReview, setReturnToReview] = useState(false);
  const [closeHref, setCloseHref] = useState("/");
  const answersRef = useRef(answers);
  const rootRef = useRef<HTMLDivElement>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const questions = useMemo(() => Object.fromEntries(allQuestions(def).map((q) => [q.id, q])) as Record<string, Question>, [def]);

  const flowFor = useCallback((a: Answers) => {
    const vis = new Set(visibleQuestions(def, a).map((q) => q.id));
    return { vis, flow: STEPS.filter((s) => s.kind !== "question" || s.questions.some((q) => vis.has(q.id))) };
  }, [def]);

  const { vis: visible, flow } = flowFor(answers);
  const index = Math.max(0, flow.findIndex((s) => s.id === currentId));
  const step = flow[index];
  const questionSteps = flow.filter((s) => s.kind === "question");
  const qPos = questionSteps.findIndex((s) => s.id === step.id);

  // ---- Mount: restore saved progress, work out where "Close" should go ----
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null") as { answers: Answers; currentId: string } | null;
      if (saved?.answers) {
        // Anything preselected by the link wins over older saved answers.
        setAnswers({ ...saved.answers, ...initial });
        if (saved.currentId && saved.currentId !== "welcome") setCurrentId(saved.currentId);
      }
    } catch { /* storage unavailable: start fresh */ }
    try {
      const ref = document.referrer ? new URL(document.referrer) : null;
      if (ref && ref.origin === location.origin && !ref.pathname.startsWith("/start")) setCloseHref(ref.pathname + ref.search);
    } catch { /* ignore */ }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Persist progress for this tab ----
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, currentId }));
    } catch { /* ignore */ }
  }, [answers, currentId, hydrated]);

  // ---- Server response: show errors on the step they belong to ----
  useEffect(() => {
    if (state.status !== "error") return;
    const errs = state.errors ?? {};
    setErrors(errs);
    const first = flowFor(answersRef.current).flow.find((s) => s.questions.some((q) => errs[q.id]));
    setCurrentId(first ? first.id : "review");
  }, [state, flowFor]);

  // ---- Move focus to the new question for keyboard and screen-reader users ----
  useEffect(() => {
    if (!hydrated) return;
    const scope = rootRef.current?.querySelector<HTMLElement>(`[data-step="${currentId}"]`);
    // Text steps: put the cursor in the field. Choice steps: focus the question so
    // screen readers announce it, and letter keys work straight away.
    const field = scope?.querySelector<HTMLElement>(".ob-field:not([hidden]) .ob-input");
    (field ?? scope?.querySelector<HTMLElement>(".ob-title"))?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [currentId, hydrated]);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  // ---- Navigation ----
  const stepErrors = (s: Step, a: Answers) => {
    const r = validate(def, a, {}, "submit");
    const out: Record<string, string> = {};
    for (const q of s.questions) if (r.errors[q.id] && flowFor(a).vis.has(q.id)) out[q.id] = r.errors[q.id];
    return out;
  };

  const go = (id: string) => {
    setErrors({});
    setCurrentId(id);
  };

  const next = () => {
    const a = answersRef.current;
    const { flow: f } = flowFor(a);
    const i = f.findIndex((s) => s.id === currentId);
    const cur = f[i];
    if (cur?.kind === "question") {
      const errs = stepErrors(cur, a);
      if (Object.keys(errs).length) {
        setErrors(errs);
        return;
      }
    }
    if (returnToReview && cur?.kind === "question") {
      setReturnToReview(false);
      go("review");
      return;
    }
    const nxt = f[i + 1];
    if (nxt) go(nxt.id);
  };

  const back = () => {
    if (index > 0) go(flow[index - 1].id);
  };

  const skip = () => {
    const copy = { ...answersRef.current };
    for (const q of step.questions) delete copy[q.id];
    answersRef.current = copy;
    setAnswers(copy);
    next();
  };

  const setAnswer = (id: string, value: Answers[string], autoAdvance = false) => {
    const copy = { ...answersRef.current, [id]: value };
    answersRef.current = copy;
    setAnswers(copy);
    if (errors[id]) setErrors((e) => { const c = { ...e }; delete c[id]; return c; });
    if (autoAdvance) {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(next, AUTO_ADVANCE_MS);
    }
  };

  const hasAnything = Object.values(answers).some((v) => (Array.isArray(v) ? v.length : v !== undefined && v !== ""));

  // ---- Keyboard: Enter continues, letters pick options, Esc closes ----
  const onKeyDown = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    const typing = t.tagName === "TEXTAREA" || (t.tagName === "INPUT" && !["radio", "checkbox"].includes((t as HTMLInputElement).type));
    if (e.key === "Escape") {
      if (!hasAnything || window.confirm("Leave without sending? Your answers stay saved in this tab.")) window.location.href = closeHref;
      return;
    }
    if (e.key === "Enter") {
      if (t.tagName === "TEXTAREA" && !(e.metaKey || e.ctrlKey)) return;
      if (t.tagName === "BUTTON" || t.tagName === "A") return;
      if (step.kind === "review") return;
      e.preventDefault();
      next();
      return;
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
    const sq = step.questions.find((q) => q.display === "cards" || q.display === "chips");
    if (!sq) return;
    const q = questions[sq.id];
    const opts = choiceOptions(q);
    const i = KEYS.indexOf(e.key.toUpperCase());
    if (i < 0 || i >= opts.length) return;
    e.preventDefault();
    if (isMulti(q)) {
      const cur = (answers[q.id] as string[] | undefined) ?? [];
      const v = opts[i].value;
      setAnswer(q.id, cur.includes(v) ? cur.filter((x) => x !== v) : opts.map((o) => o.value).filter((x) => x === v || cur.includes(x)));
    } else {
      setAnswer(q.id, opts[i].value, Boolean(step.autoAdvance));
    }
  };

  // Listen on the window so shortcuts work wherever focus is (including the page body).
  const keyRef = useRef(onKeyDown);
  keyRef.current = onKeyDown;
  useEffect(() => {
    if (!hydrated) return;
    const h = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [hydrated]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Final client check across every visible step before handing to the server.
    const r = validate(def, answersRef.current, {}, "submit");
    if (!r.ok) {
      e.preventDefault();
      setErrors(r.errors);
      const first = flow.find((s) => s.questions.some((q) => r.errors[q.id]));
      if (first) setCurrentId(first.id);
    }
  };

  const phase = currentId === "welcome" && hydrated ? "welcome" : "questions";
  const pkgSlug = typeof answers.package === "string" ? answers.package : "";

  return (
    <div ref={rootRef} className={`ob${hydrated ? " is-live" : ""}`} data-phase={phase}>
      <header className="ob-top">
        <Link href="/" className="brand">Meraki Creative<span className="dot">.</span></Link>
        <a
          href={closeHref}
          className="ob-close"
          onClick={(e) => {
            if (hasAnything && !window.confirm("Leave without sending? Your answers stay saved in this tab.")) e.preventDefault();
          }}
        >
          Close <span aria-hidden="true">×</span>
        </a>
      </header>

      <form action={formAction} onSubmit={onSubmit} noValidate className="ob-form">
        <input type="hidden" name="_t" value={token} />
        <input type="hidden" name="_preselected" value={preselected} />
        <input type="hidden" name="package" value={pkgSlug} />
        <div className="visually-hidden" aria-hidden="true">
          <label htmlFor="botcheck">Leave this empty</label>
          <input type="text" id="botcheck" name="botcheck" tabIndex={-1} autoComplete="off" />
        </div>

        {STEPS.map((s) => {
          const inFlow = flow.some((f) => f.id === s.id);
          const isCurrent = s.id === step.id;
          const titleId = `ob-t-${s.id}`;
          return (
            <section
              key={s.id}
              data-step={s.id}
              className={`ob-step ob-step-${s.kind}${isCurrent ? " is-current" : ""}`}
              // Before hydration (and without JS) every step renders, so the whole form is usable.
              hidden={(hydrated && (!isCurrent || !inFlow)) || undefined}
              aria-labelledby={titleId}
            >
              {s.kind === "welcome" ? (
                <div className="ob-welcome">
                  {WELCOME_ILLUSTRATION && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="ob-welcome-art" src={WELCOME_ILLUSTRATION} alt="" width={260} height={260} />
                  )}
                  <h1 id={titleId} className="ob-title display display-xl" tabIndex={-1}>
                    <WordReveal text={s.title} />
                  </h1>
                  {s.subtitle && <WordReveal as="p" text={s.subtitle} className="ob-subtitle" delayStart={4} />}
                  <p className="ob-lead slate">{s.lead}</p>
                  <button type="button" className="btn btn-primary ob-begin" onClick={next}>Begin</button>
                </div>
              ) : (
                <fieldset className="ob-fieldset">
                  <legend className="visually-hidden">{s.title}</legend>
                  <p className="ob-label slate">
                    {s.kind === "question" && qPos >= 0 && isCurrent ? `( ${String(qPos + 1).padStart(2, "0")} ) ` : ""}{s.label}
                  </p>
                  <h2 id={titleId} className="ob-title display display-lg" tabIndex={-1}>
                    {isCurrent && hydrated ? <WordReveal text={s.title} /> : s.title}
                  </h2>
                  {s.lead && <p className="ob-lead lede">{s.lead}</p>}

                  {s.id === "services" && pkgSlug && packageNames[pkgSlug] && (
                    <p className="ob-chip-note">
                      <span className="slate">You came in through</span>{" "}
                      <span className="ob-pkg">
                        {packageNames[pkgSlug]}
                        <button type="button" aria-label="Remove package" onClick={() => setAnswer("package", "")}>×</button>
                      </span>
                    </p>
                  )}

                  {s.kind === "review" ? (
                    <>
                      <ReviewStep steps={flow} questions={questions} answers={answers} visible={visible}
                        onEdit={(id) => { setReturnToReview(true); go(id); }} />
                      {state.formError && <p className="form-error" role="alert">{state.formError}</p>}
                      {turnstileSiteKey && (
                        <>
                          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} />
                          <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
                        </>
                      )}
                    </>
                  ) : (
                    <div className="ob-fields">
                      {s.questions.map((sq) => {
                        const q = questions[sq.id];
                        if (!q) return null;
                        const shown = !hydrated || (visible.has(q.id) && evaluate(q.showIf, answers));
                        // Separate labels only when a screen has several fields and this one
                        // isn't simply the screen's own question.
                        const many = s.questions.length > 1 && q.label !== s.title;
                        const err = errors[q.id];
                        const fid = `ob-${q.id}`;
                        const val = answers[q.id];
                        const common = {
                          id: fid, name: q.id,
                          "aria-invalid": err ? true : undefined,
                          "aria-describedby": err ? `${fid}-err` : undefined,
                          "aria-labelledby": many ? `${fid}-label` : titleId,
                        } as const;
                        let control: React.ReactNode;
                        switch (sq.display) {
                          case "cards":
                          case "chips":
                            control = (
                              <StepChoice q={q} display={sq.display} value={val} labelledBy={many ? `${fid}-label` : titleId}
                                onChange={(v) => setAnswer(q.id, v, Boolean(s.autoAdvance) && !isMulti(q))} />
                            );
                            break;
                          case "textarea":
                            control = <textarea {...common} className="ob-input ob-textarea" rows={5} value={(val as string) ?? ""}
                              maxLength={"maxLength" in q ? q.maxLength : undefined} placeholder={q.placeholder}
                              onChange={(e) => setAnswer(q.id, e.currentTarget.value)} />;
                            break;
                          case "links":
                            control = <LinksField common={common} value={val} onChange={(v) => setAnswer(q.id, v)} />;
                            break;
                          default:
                            control = <input {...common} className="ob-input" type={sq.display === "email" ? "email" : sq.display === "date" ? "date" : "text"}
                              autoComplete={q.id === "name" ? "name" : q.id === "email" ? "email" : q.id === "business_name" ? "organization" : "off"}
                              value={(val as string) ?? ""} placeholder={q.placeholder}
                              maxLength={"maxLength" in q ? q.maxLength : undefined}
                              onChange={(e) => setAnswer(q.id, e.currentTarget.value)} />;
                        }
                        return (
                          <div key={q.id} className="ob-field" hidden={!shown || undefined}>
                            {many && <label id={`${fid}-label`} htmlFor={fid} className="ob-field-label slate">{q.label}{q.required ? "" : " (optional)"}</label>}
                            {control}
                            {err && <p id={`${fid}-err`} className="field-error" role="alert">{err}</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!hydrated && s.kind === "review" && (
                    <button type="submit" className="btn btn-primary">Send</button>
                  )}
                </fieldset>
              )}
            </section>
          );
        })}

        {hydrated && step.kind !== "welcome" && (
          <footer className="ob-bottom">
            <button type="button" className="ob-back" onClick={back} aria-label="Back">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
            </button>
            <div className="ob-progress" aria-live="polite">
              {step.kind === "question" && (
                <span className="slate">{String(qPos + 1).padStart(2, "0")} / {String(questionSteps.length).padStart(2, "0")}</span>
              )}
              <span className="ob-bar" aria-hidden="true">
                <span style={{ transform: `scaleX(${step.kind === "review" ? 1 : (qPos + 1) / (questionSteps.length + 1)})` }} />
              </span>
            </div>
            <div className="ob-actions">
              {step.skippable && <button type="button" className="ob-link" onClick={skip}>Skip</button>}
              {step.kind === "review" ? (
                // Distinct keys: React must not reuse the Continue button's element for Send,
                // or the click that opens the review would also submit the form.
                <button key="send" type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Sending…" : "Send"}</button>
              ) : (!step.autoAdvance || step.questions.some((q) => answers[q.id] !== undefined && answers[q.id] !== "")) && (
                <button key="next" type="button" className="btn btn-primary" onClick={(e) => { e.preventDefault(); next(); }}>
                  {returnToReview ? "Back to review" : flow[index + 1]?.kind === "review" ? "Review" : "Continue"}
                </button>
              )}
            </div>
          </footer>
        )}
      </form>
    </div>
  );
}

function LinksField({ common, value, onChange }: {
  common: Record<string, unknown>;
  value: Answers[string];
  onChange: (v: string[]) => void;
}) {
  const [text, setText] = useState(Array.isArray(value) ? (value as string[]).join("\n") : "");
  return (
    <textarea
      {...common}
      className="ob-input ob-textarea"
      rows={4}
      value={text}
      placeholder="https://"
      onChange={(e) => {
        setText(e.currentTarget.value);
        onChange(e.currentTarget.value.split(/\n+/).map((s) => s.trim()).filter(Boolean));
      }}
    />
  );
}

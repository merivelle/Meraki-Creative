/**
 * Progressive enhancement for the public site, ported line-for-line from legacy/main.js.
 * Content is fully visible without JS. Each init returns a cleanup so client-side
 * navigation doesn't stack listeners, timers or observers.
 */
type Cleanup = () => void;

type GsapTimeline = {
  to: (targets: unknown, vars: object, position?: number | string) => GsapTimeline;
  fromTo: (targets: unknown, from: object, to: object, position?: number | string) => GsapTimeline;
  set: (targets: unknown, vars: object, position?: number | string) => GsapTimeline;
  call: (fn: () => void, params?: unknown[], position?: number | string) => GsapTimeline;
  progress: (value: number) => GsapTimeline;
  pause: () => GsapTimeline;
  resume: () => GsapTimeline;
  kill: () => void;
};

declare global {
  interface Window {
    gsap?: {
      timeline: (opts?: object) => GsapTimeline;
      set: (targets: unknown, vars: object) => void;
      to: (targets: unknown, vars: object) => unknown;
      getProperty: (target: Element, prop: string) => number;
    };
  }
}

const GSAP_SRC = "https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js";

/** GSAP comes from the CDN on demand; resolves once window.gsap exists. */
function loadGsap(signal: AbortSignal): Promise<void> {
  if (window.gsap) return Promise.resolve();
  return new Promise((resolve) => {
    let s = document.querySelector<HTMLScriptElement>(`script[src="${GSAP_SRC}"]`);
    if (!s) {
      s = document.createElement("script");
      s.src = GSAP_SRC;
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener("load", () => resolve(), { once: true, signal });
  });
}

export function initEnhancements(root: Document = document): Cleanup {
  const ac = new AbortController();
  const signal = ac.signal;
  const cleanups: Cleanup[] = [];
  const reduceMotion = !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.documentElement.classList.add("js");

  /* ---- Scroll reveal (reveal + reveal-stagger) ---- */
  const revealEls = root.querySelectorAll<HTMLElement>(".reveal, .reveal-stagger");
  const revealAll = () => revealEls.forEach((el) => el.classList.add("in"));
  if (!("IntersectionObserver" in window) || !revealEls.length) {
    revealAll();
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    revealEls.forEach((el) => io.observe(el));
    cleanups.push(() => io.disconnect());
    // Safety: transitions don't run on hidden tabs / headless renderers, so never ship blank.
    if (document.hidden) revealAll();
    document.addEventListener("visibilitychange", () => { if (document.hidden) revealAll(); }, { signal });
  }

  /* ---- Testimonials (Shed-style): the quote's lines leave, the track glides, and the next
     quote fills in line by line. Pills + blob, drag/swipe, keys, auto-advance. ---- */
  const tq = root.querySelector<HTMLElement>("[data-testimonials]");
  const tqTrack = tq?.querySelector<HTMLElement>(".tq-track");
  const tqSlides = tqTrack ? Array.from(tqTrack.querySelectorAll<HTMLElement>(".tq-slide")) : [];
  if (tq && tqTrack && tqSlides.length > 1 && !tq.hasAttribute("data-ready")) {
    const track = tqTrack;
    const slides = tqSlides;
    const inks = slides.map((sl) => sl.querySelector<HTMLElement>(".tq-ink")!);
    const source = inks.map((el) => el.textContent ?? "");
    let index = 0;
    let timer = 0;
    let tl: GsapTimeline | null = null;

    // Split each solid quote into its rendered lines, each inside its own mask.
    const split = () => {
      inks.forEach((el, k) => {
        el.textContent = "";
        const words = source[k].split(" ").map((w) => {
          const span = document.createElement("span");
          span.textContent = w;
          el.append(span, " ");
          return span;
        });
        const groups: string[][] = [];
        let top = -Infinity;
        words.forEach((w) => {
          if (w.offsetTop > top + 2) { groups.push([]); top = w.offsetTop; }
          groups[groups.length - 1].push(w.textContent ?? "");
        });
        el.textContent = "";
        groups.forEach((g) => {
          const line = document.createElement("span");
          line.className = "tq-line";
          const inner = document.createElement("span");
          inner.className = "tq-line-in";
          inner.textContent = g.join(" ");
          line.append(inner);
          el.append(line);
        });
      });
    };
    const lines = (k: number) => Array.from(inks[k].querySelectorAll<HTMLElement>(".tq-line-in"));
    const offsetFor = (k: number) => tq.clientWidth / 2 - (slides[k].offsetLeft + slides[k].offsetWidth / 2);

    const pills = document.createElement("div");
    pills.className = "tq-pills";
    const blob = document.createElement("span");
    blob.className = "tq-blob";
    blob.setAttribute("aria-hidden", "true");
    pills.append(blob);
    const pillBtns = slides.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tq-pill";
      b.textContent = String(i + 1).padStart(2, "0");
      b.setAttribute("aria-label", `Testimonial ${i + 1} of ${slides.length}`);
      b.addEventListener("click", () => go(i, true), { signal });
      pills.append(b);
      return b;
    });
    const live = document.createElement("p");
    live.className = "tq-live";
    live.setAttribute("aria-live", "polite");

    const setActive = (k: number) => {
      slides.forEach((sl, i) => {
        sl.classList.toggle("is-active", i === k);
        sl.setAttribute("aria-hidden", String(i !== k));
      });
      pillBtns.forEach((b, i) => b.setAttribute("aria-current", String(i === k)));
      const cite = slides[k].querySelector(".tq-cite")?.textContent ?? "";
      live.textContent = `${source[k]} ${cite}`;
    };
    // Snap everything to the current index with no motion (first paint, resize, reduced motion).
    const place = () => {
      const g = window.gsap!;
      g.set(track, { x: offsetFor(index) });
      slides.forEach((_, k) => g.set(lines(k), { yPercent: k === index ? 0 : 105 }));
      g.set(blob, { x: pillBtns[index].offsetLeft, scaleX: 1 });
    };

    const go = (to: number, user = false) => {
      const g = window.gsap;
      const next = (to + slides.length) % slides.length;
      if (!g || next === index) return;
      const prev = index;
      index = next;
      setActive(next);
      tl?.progress(1);
      tl?.kill();
      if (reduceMotion) place();
      else {
        tl = g.timeline({ defaults: { ease: "power3.out" } });
        tl.to(lines(prev), { yPercent: -105, duration: 0.45, stagger: 0.05, ease: "power3.in" }, 0)
          .to(track, { x: offsetFor(next), duration: 0.9, ease: "power3.inOut" }, 0.1)
          .fromTo(lines(next), { yPercent: 105 }, { yPercent: 0, duration: 0.7, stagger: 0.08 }, 0.55)
          .set(lines(prev), { yPercent: 105 }, 1.3) // back below its mask, ready to fill in again
          .to(blob, { x: pillBtns[next].offsetLeft, duration: 0.6, ease: "power3.inOut" }, 0.1)
          .to(blob, { scaleX: 1.8, duration: 0.3, ease: "power2.out" }, 0.1)
          .to(blob, { scaleX: 1, duration: 0.3, ease: "power2.in" }, 0.4);
      }
      if (user) start();
    };

    const stop = () => { window.clearInterval(timer); timer = 0; };
    const start = () => {
      stop();
      if (!reduceMotion && !document.hidden) timer = window.setInterval(() => go(index + 1), 7000);
    };

    loadGsap(signal).then(() => (document.fonts ? document.fonts.ready : null)).then(() => {
      const g = window.gsap;
      if (signal.aborted || !g) return;
      tq.append(pills, live);
      tq.setAttribute("data-ready", "");
      split();
      setActive(index);
      place();
      start();

      // Drag / swipe: follow the pointer a little, then change on a 50px pull.
      // A tap on a peeking neighbour brings it forward.
      let dragging = false;
      let startX = 0;
      let baseX = 0;
      let moved = 0;
      track.addEventListener("pointerdown", (e) => {
        dragging = true;
        moved = 0;
        startX = e.clientX;
        tl?.progress(1);
        baseX = g.getProperty(track, "x");
        track.classList.add("is-dragging");
        stop();
      }, { signal });
      window.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        moved = e.clientX - startX;
        g.set(track, { x: baseX + moved * 0.6 });
      }, { signal });
      const end = (e: PointerEvent) => {
        if (!dragging) return;
        dragging = false;
        track.classList.remove("is-dragging");
        if (Math.abs(moved) > 50) return go(index + (moved < 0 ? 1 : -1), true);
        const hit = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest(".tq-slide");
        const k = hit ? slides.indexOf(hit as HTMLElement) : -1;
        if (Math.abs(moved) < 6 && k >= 0 && k !== index) return go(k, true);
        g.to(track, { x: offsetFor(index), duration: 0.5, ease: "power3.out" });
        start();
      };
      window.addEventListener("pointerup", end, { signal });
      window.addEventListener("pointercancel", end, { signal });

      tq.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1, true); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1, true); }
      }, { signal });
      tq.addEventListener("pointerenter", stop, { signal });
      tq.addEventListener("pointerleave", () => { if (!dragging) start(); }, { signal });
      tq.addEventListener("focusin", stop, { signal });
      tq.addEventListener("focusout", start, { signal });
      document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()), { signal });

      let resizeT = 0;
      window.addEventListener("resize", () => {
        window.clearTimeout(resizeT);
        resizeT = window.setTimeout(() => { tl?.progress(1); split(); place(); }, 150);
      }, { signal });
      cleanups.push(() => window.clearTimeout(resizeT));
    });

    cleanups.push(() => {
      stop();
      tl?.kill();
      pills.remove();
      live.remove();
      tq.removeAttribute("data-ready");
      inks.forEach((el, k) => (el.textContent = source[k]));
      slides.forEach((sl) => { sl.classList.remove("is-active"); sl.removeAttribute("aria-hidden"); });
      window.gsap?.set(track, { clearProps: "transform" });
    });
  }

  /* ---- Hero intro (YUNGBLD-style): "Meraki Creative" types in, the words part, the services
     roll once through the gap, then the two craft plates drop into the service cards ---- */
  const html = document.documentElement;
  const roll = root.querySelector<HTMLElement>(".hero-roll");
  const endIntro = () => {
    html.classList.remove("intro");
    html.classList.add("intro-done"); // the intro already brought the hero in; skip the CSS rise
    try { sessionStorage.setItem("mk-intro", "1"); } catch {}
  };
  if (roll && html.classList.contains("intro")) {
    if (reduceMotion) endIntro();
    // Measure only once the webfont is in: the fallback font has different word widths,
    // which would put the gap (and the cards spilling out of it) off-centre.
    else Promise.all([loadGsap(signal), document.fonts ? document.fonts.ready : null]).then(() => {
      const gsap = window.gsap;
      if (signal.aborted || !gsap || !html.classList.contains("intro")) return;
      const hero = roll.closest<HTMLElement>(".hero")!;
      const row = hero.querySelector<HTMLElement>(".hero-title-row")!;
      const words = Array.from(hero.querySelectorAll<HTMLElement>(".mk-word"));
      const chars = hero.querySelectorAll(".mk-ch");
      const plates = Array.from(roll.querySelectorAll<HTMLElement>(".plate:not(.plate-craft)"));
      const crafts = Array.from(roll.querySelectorAll<HTMLElement>(".plate-craft"));
      const deck = [...plates, ...crafts];
      const tag = hero.querySelector(".hero-tag");
      const cta = hero.querySelector(".hero-cta");
      const rule = hero.querySelector(".svc-rule");
      const cards = Array.from(hero.querySelectorAll<HTMLElement>(".svc-card"));
      const reveal = [...chars, tag, cta, rule, ...cards, ...words, hero.querySelector(".hero-title")];

      // The words part sideways on one line (as in the reference). The gap is sized to the
      // plates; if the parted title won't fit the screen, the title shrinks while it's open.
      const title = hero.querySelector<HTMLElement>(".hero-title")!;
      const rowR = row.getBoundingClientRect();
      const [w0, w1] = words.map((w) => w.getBoundingClientRect());
      const plateW = roll.offsetWidth;
      const plateH = (plateW * 2) / 3;
      const gap = Math.min(plateW + 32, rowR.width * 0.42);
      const fit = Math.min(1, (gap - 16) / plateW);
      const shrink = Math.min(1, (window.innerWidth - 32) / (w0.width + w1.width + gap));
      const cx = rowR.left + rowR.width / 2;
      const cy = rowR.top + rowR.height / 2;
      const gapX = (w0.right + w1.left) / 2;
      const gapY = w0.top + w0.height / 2; // the letters' middle, not the h1 line box's
      const move0 = { x: gapX - gap / 2 - w0.right }; // in the title's own (unscaled) units
      const move1 = { x: gapX + gap / 2 - w1.left };

      // Deck depth d: 0 = the front card. Each card keeps one side (above or below, by its
      // index) and drifts further out as it sinks, so the deck reads as a tunnel with edges
      // on both sides, and nothing jumps between steps.
      const depth = (j: number, d: number) => ({
        scale: 1 - 0.05 * d,
        y: (j % 2 ? -1 : 1) * plateH * 0.075 * d,
        opacity: d > 6 ? 0 : 1,
      });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.set(roll, { x: (gapX - cx) * shrink, y: (gapY - cy) * shrink, scale: fit * shrink }, 0);
      deck.forEach((pl, k) => tl.set(pl, { yPercent: -50, y: 0, scale: 0.6, opacity: 0, zIndex: 100 + k }, 0));

      // 1. Type in: each letter arrives grey, then settles to ink.
      tl.fromTo(chars, { opacity: 0, color: "#54504A" }, { opacity: 1, duration: 0.3, stagger: 0.06 }, 0.2);
      tl.to(chars, { color: "#17150F", duration: 0.4, stagger: 0.06 }, 0.5);

      // 2. The words part left and right.
      const SPLIT = 0.25 + chars.length * 0.06 + 0.3;
      if (shrink < 1) tl.to(title, { scale: shrink, duration: 0.6, ease: "power3.inOut" }, SPLIT);
      tl.to(words[0], { ...move0, duration: 0.6, ease: "power3.inOut" }, SPLIT);
      tl.to(words[1], { ...move1, duration: 0.6, ease: "power3.inOut" }, SPLIT);

      // 3. Each service comes out of the centre toward you; the one before sinks into the deck.
      const ROLL = SPLIT + 0.4;
      const STEP = 0.16;
      deck.forEach((pl, k) => {
        const at = ROLL + k * STEP;
        tl.to(pl, { scale: 1, y: 0, duration: 0.45 }, at);
        tl.set(pl, { opacity: 1 }, at); // appears solid and small, then grows (nothing shows through)
        deck.slice(0, k).forEach((prev, j) => tl.to(prev, { ...depth(j, k - j), duration: 0.45 }, at));
      });

      // 4. Drop: the service plates fall away; the craft plates fly down and become the cards.
      const DROP = ROLL + deck.length * STEP + 0.4;
      plates.forEach((pl, k) => {
        tl.to(pl, { y: "+=" + window.innerHeight, rotation: (k % 2 ? 1 : -1) * (3 + (k % 3) * 2), opacity: 0, duration: 0.6, ease: "power3.in" }, DROP);
      });
      tl.call(() => {
        crafts.forEach((pl, k) => {
          const card = cards.find((c) => c.getAttribute("href") === pl.dataset.craft);
          if (!card) return;
          const r = pl.getBoundingClientRect();
          const c = card.getBoundingClientRect();
          const rs = fit || 1;
          gsap.to(pl.children, { opacity: 0, duration: 0.2 });
          gsap.to(pl, {
            x: "+=" + (c.left + c.width / 2 - (r.left + r.width / 2)) / rs,
            y: "+=" + (c.top + c.height / 2 - (r.top + r.height / 2)) / rs,
            scaleX: (gsap.getProperty(pl, "scaleX") * c.width) / r.width,
            scaleY: (gsap.getProperty(pl, "scaleY") * c.height) / r.height,
            opacity: 1, duration: 0.75, delay: k * 0.08, ease: "power3.inOut",
          });
        });
      }, undefined, DROP);
      const LAND = DROP + 0.8;
      tl.fromTo(cards, { opacity: 0 }, { opacity: 1, duration: 0.35, stagger: 0.08 }, LAND);
      tl.to(crafts, { opacity: 0, duration: 0.3, stagger: 0.08 }, LAND + 0.1);

      // The name closes back up and the rest of the hero arrives.
      tl.to(words, { x: 0, duration: 0.7, ease: "power3.inOut" }, DROP + 0.15);
      tl.to(title, { scale: 1, duration: 0.7, ease: "power3.inOut" }, DROP + 0.15);
      tl.fromTo(tag, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7 }, DROP + 0.45);
      tl.fromTo(cta, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7 }, DROP + 0.55);
      tl.fromTo(rule, { opacity: 0, clipPath: "inset(0 100% 0 0)" }, { opacity: 1, clipPath: "inset(0 0% 0 0)", duration: 0.8, ease: "power2.inOut" }, DROP + 0.3);

      // Any click, key, wheel or touch skips straight to the settled hero.
      const off = new AbortController();
      const finish = () => {
        off.abort();
        endIntro();
        gsap.set(reveal, { clearProps: "all" });
      };
      tl.call(finish, undefined, LAND + 0.5);
      const skip = () => { off.abort(); tl.progress(1); finish(); };
      ["pointerdown", "keydown", "wheel", "touchstart"].forEach((ev) =>
        window.addEventListener(ev, skip, { once: true, passive: true, signal: off.signal }));
      signal.addEventListener("abort", () => { tl.kill(); finish(); });
    });
  }

  /* ---- Service cards: motion graphics of real work. Each runs only while on screen, with the
     tab visible and the hero intro finished. ---- */
  const whenLive = (el: Element, play: () => void, pause: () => void) => {
    let inView = false;
    const sync = () => (inView && !document.hidden && !html.classList.contains("intro") ? play() : pause());
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }, { threshold: 0.2 });
    io.observe(el);
    const mo = new MutationObserver(sync);
    mo.observe(html, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("visibilitychange", sync, { signal });
    cleanups.push(() => { io.disconnect(); mo.disconnect(); pause(); });
  };

  // Web Design: the browser deletes the domain, types the next, loads, and wipes the site in.
  root.querySelectorAll<HTMLElement>("[data-svc-browser]").forEach((brw) => {
    const pages = Array.from(brw.querySelectorAll<HTMLImageElement>(".brw-view img"));
    const domainEl = brw.querySelector<HTMLElement>("[data-domain]")!;
    const countEl = brw.querySelector<HTMLElement>("[data-count]");
    const load = brw.querySelector<HTMLElement>(".brw-load");
    if (pages.length < 2 || reduceMotion || !("IntersectionObserver" in window)) return;
    pages.forEach((img) => (img.loading = "eager"));
    loadGsap(signal).then(() => {
      const g = window.gsap;
      if (signal.aborted || !g) return;
      const HOLD = 1.9;
      const CHAR = 0.035;
      let k = 0;
      let tl: GsapTimeline | null = null;
      g.set(pages, { transformOrigin: "50% 0%" });
      const step = () => {
        const cur = pages[k];
        const nextK = (k + 1) % pages.length;
        const next = pages[nextK];
        const from = cur.dataset.domain ?? "";
        const to = next.dataset.domain ?? "";
        const t = g.timeline({ onComplete: () => { k = nextK; step(); } });
        tl = t;
        for (let i = from.length - 1; i >= 0; i--) t.call(() => { domainEl.textContent = from.slice(0, i); }, undefined, HOLD + (from.length - 1 - i) * CHAR * 0.6);
        const typeAt = HOLD + from.length * CHAR * 0.6 + 0.15;
        for (let i = 1; i <= to.length; i++) t.call(() => { domainEl.textContent = to.slice(0, i); }, undefined, typeAt + i * CHAR);
        const loadAt = typeAt + to.length * CHAR + 0.1;
        if (load) t.fromTo(load, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.55, ease: "power2.out" }, loadAt).to(load, { opacity: 0, duration: 0.2 }, loadAt + 0.55);
        t.fromTo(next, { opacity: 1, zIndex: 2, scale: 1.04, clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 0.75, ease: "power3.inOut" }, loadAt + 0.3);
        t.call(() => { if (countEl) countEl.textContent = String(nextK + 1); }, undefined, loadAt + 0.45);
        t.set(cur, { opacity: 0, zIndex: 0, scale: 1 }, loadAt + 1.1);
        t.set(next, { zIndex: 1 }, loadAt + 1.1);
      };
      whenLive(brw, () => (tl ? tl.resume() : step()), () => tl?.pause());
      cleanups.push(() => tl?.kill());
    });
  });

  // Post-Production: the clips snap onto the timeline, then the playhead sweeps and lights up the
  // clip it's crossing (V2 over V1). The program monitor plays the reel; its timecode is the reel's.
  root.querySelectorAll<HTMLElement>("[data-svc-edit]").forEach((ed) => {
    const clipEls = Array.from(ed.querySelectorAll<HTMLElement>(".edt-clip"));
    const clips = clipEls.map((el) => ({
      el, track: el.dataset.track, img: el.dataset.img ?? "",
      left: parseFloat(el.style.left), right: parseFloat(el.style.left) + parseFloat(el.style.width),
    }));
    const reel = ed.querySelector<HTMLVideoElement>("[data-reel-monitor]");
    const tc = ed.querySelector<HTMLElement>("[data-tc]");
    const playhead = ed.querySelector<HTMLElement>(".edt-playhead");
    const track = ed.querySelector<HTMLElement>(".edt-track");
    const bars = ed.querySelectorAll(".edt-wave i");
    if (!clips.length || !playhead || !track) return;
    const SWEEP = 14000; // ms per pass
    const pad = (n: number) => String(n).padStart(2, "0");
    let live: (typeof clips)[number] | undefined;

    const render = (p: number) => {
      playhead.style.transform = `translateX(${p * track.clientWidth}px)`;
      const pct = p * 100;
      const inside = (c: (typeof clips)[number]) => pct >= c.left && pct < c.right;
      const hit = clips.find((c) => c.track === "v2" && inside(c)) ?? clips.find((c) => c.track === "v1" && inside(c));
      if (hit !== live) {
        live?.el.classList.remove("is-live");
        hit?.el.classList.add("is-live");
        live = hit;
      }
      if (tc && reel) {
        const f = Math.floor(reel.currentTime * 24);
        tc.textContent = `00:${pad(Math.floor(f / 1440) % 60)}:${pad(Math.floor(f / 24) % 60)}:${pad(f % 24)}`;
      }
    };

    if (reduceMotion || !("IntersectionObserver" in window)) { render(0.42); return; }
    loadGsap(signal).then(() => {
      const g = window.gsap;
      if (signal.aborted || !g) return;
      g.set(clipEls, { scaleX: 0, opacity: 0 });
      g.set(bars, { scaleY: 0.1 });
      render(0);
      let assembled = false;
      let raf = 0;
      let t0 = 0;
      let elapsed = 0;
      const tick = (now: number) => {
        if (!t0) t0 = now - elapsed;
        elapsed = now - t0;
        render((elapsed % SWEEP) / SWEEP);
        raf = requestAnimationFrame(tick);
      };
      const play = () => {
        if (raf) return;
        if (!assembled) {
          assembled = true;
          g.timeline({ defaults: { ease: "power3.out" } })
            .to(clipEls, { scaleX: 1, opacity: 1, duration: 0.5, stagger: 0.07 }, 0)
            .to(bars, { scaleY: 1, duration: 0.4, stagger: 0.01 }, 0.3);
        }
        reel?.play().catch(() => {});
        raf = requestAnimationFrame(tick);
      };
      const pause = () => { if (raf) cancelAnimationFrame(raf); raf = 0; t0 = 0; reel?.pause(); };
      whenLive(ed, play, pause);
    });
  });

  /* ---- Before/after sliders ---- */
  root.querySelectorAll<HTMLElement>(".ba[data-ba]").forEach((ba) => {
    const setPos = (clientX: number) => {
      const r = ba.getBoundingClientRect();
      const p = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
      ba.style.setProperty("--pos", p + "%");
    };
    let dragging = false;
    ba.addEventListener("pointerdown", (e) => {
      dragging = true;
      try { ba.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      setPos(e.clientX);
    }, { signal });
    ba.addEventListener("pointermove", (e) => { if (dragging) setPos(e.clientX); }, { signal });
    ba.addEventListener("pointerup", () => { dragging = false; }, { signal });
    ba.addEventListener("pointercancel", () => { dragging = false; }, { signal });
    // gentle one-time intro wipe (hints it's draggable), unless reduced motion
    if (!reduceMotion && "IntersectionObserver" in window) {
      let hinted = false;
      const io2 = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting && !hinted) {
            hinted = true;
            io2.unobserve(ba);
            const start = performance.now();
            const dur = 1400;
            const tick = (now: number) => {
              if (signal.aborted) return;
              const t = Math.min(1, (now - start) / dur);
              const pos = 50 + Math.sin(t * Math.PI * 2) * 14 * (1 - t); // settle to 50
              ba.style.setProperty("--pos", pos + "%");
              if (t < 1) requestAnimationFrame(tick);
            };
            tick(start);
          }
        });
      }, { threshold: 0.4 });
      io2.observe(ba);
      cleanups.push(() => io2.disconnect());
    }
  });

  /* ---- Letter roll (the studio statement): fires once as it comes into view, replays on hover ---- */
  root.querySelectorAll<HTMLElement>(".studio-line").forEach((line) => {
    const rolls = Array.from(line.querySelectorAll<HTMLElement>(".roll"));
    if (reduceMotion || !rolls.length) return;
    let busy = false;
    const timers: number[] = [];
    const roll = () => {
      if (busy) return;
      busy = true;
      rolls.forEach((r, k) => {
        timers.push(window.setTimeout(() => r.classList.add("is-rolling"), k * 120));
        timers.push(window.setTimeout(() => r.classList.remove("is-rolling"), k * 120 + 800));
      });
      timers.push(window.setTimeout(() => { busy = false; }, rolls.length * 120 + 820));
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { roll(); io.disconnect(); } }, { threshold: 0.6 });
      io.observe(line);
      cleanups.push(() => io.disconnect());
    }
    line.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") roll(); }, { signal });
    cleanups.push(() => timers.forEach((t) => window.clearTimeout(t)));
  });

  /* ---- What we do: one row open at a time (hover / focus; on touch, first tap opens) ---- */
  root.querySelectorAll<HTMLElement>("[data-wwd]").forEach((list) => {
    const rows = Array.from(list.querySelectorAll<HTMLElement>(".wwd-row:not(.wwd-close)"));
    const open = (row: HTMLElement) => rows.forEach((r) => r.classList.toggle("is-open", r === row));
    rows.forEach((row) => {
      row.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") open(row); }, { signal });
      row.addEventListener("focusin", () => open(row), { signal });
      row.querySelector("a")?.addEventListener("click", (e) => {
        if (!row.classList.contains("is-open")) { e.preventDefault(); open(row); }
      }, { signal });
    });
  });

  /* ---- Featured Work: hovered tile grows; "View project" pill follows the cursor; the row
     drags sideways with the mouse (trackpads and touch scroll it natively) ---- */
  root.querySelectorAll<HTMLElement>("[data-fw]").forEach((fw) => {
    const tiles = Array.from(fw.querySelectorAll<HTMLElement>(".fw-tile"));
    const pill = fw.querySelector<HTMLElement>(".fw-pill");
    const grow = (tile: HTMLElement | null) => {
      fw.classList.toggle("has-open", !!tile);
      tiles.forEach((t) => {
      const on = t === tile;
      t.classList.toggle("is-open", on);
      const v = t.querySelector("video");
      if (!v || reduceMotion) return;
      if (on) {
        v.preload = "auto";
        const start = Number(v.dataset.start ?? 0); // skip the page load at the top of a site recording
        if (start && v.currentTime < start) v.currentTime = start;
        v.play().then(() => t.classList.add("is-playing")).catch(() => {});
      }
      else { v.pause(); t.classList.remove("is-playing"); }
      });
    };
    tiles.forEach((t) => {
      t.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") grow(t); }, { signal });
      t.addEventListener("focusin", () => grow(t), { signal });
    });
    fw.addEventListener("pointerleave", () => grow(null), { signal });
    fw.addEventListener("focusout", (e) => { if (!fw.contains(e.relatedTarget as Node)) grow(null); }, { signal });

    // Site recordings loop back to their start mark, not to the page load at 0s.
    fw.querySelectorAll<HTMLVideoElement>("video[data-start]").forEach((v) => {
      v.loop = false;
      v.addEventListener("ended", () => { v.currentTime = Number(v.dataset.start); v.play().catch(() => {}); }, { signal });
    });

    // Drag to scroll (mouse only). A drag of more than a few pixels cancels the click.
    let dragX = 0, dragLeft = 0, dragged = false, dragging = false;
    fw.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      dragging = true; dragged = false; dragX = e.clientX; dragLeft = fw.scrollLeft;
    }, { signal });
    window.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - dragX;
      if (!dragged && Math.abs(dx) > 5) { dragged = true; fw.classList.add("is-dragging"); }
      if (dragged) fw.scrollLeft = dragLeft - dx;
    }, { signal });
    window.addEventListener("pointerup", () => {
      if (!dragging) return;
      dragging = false;
      // Let the click that follows this pointerup see the drag, then clear it.
      setTimeout(() => fw.classList.remove("is-dragging"), 0);
    }, { signal });
    fw.addEventListener("click", (e) => { if (dragged) { e.preventDefault(); dragged = false; } }, { capture: true, signal });

    // Rise in when the row first comes into view.
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { fw.classList.add("in"); io.disconnect(); } }, { threshold: 0.15 });
      io.observe(fw);
      cleanups.push(() => io.disconnect());
    } else fw.classList.add("in");

    if (!pill || reduceMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const follow = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      pill.style.transform = `translate(${x}px, ${y}px)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(follow) : 0;
    };
    fw.addEventListener("pointermove", (e) => {
      const r = fw.getBoundingClientRect();
      tx = e.clientX - r.left + fw.scrollLeft + 14; // the pill lives inside the scrolling row
      ty = e.clientY - r.top + 14;
      const overProject = !!(e.target as HTMLElement).closest(".fw-project");
      if (overProject && !pill.classList.contains("is-on")) { x = tx; y = ty; }
      pill.classList.toggle("is-on", overProject);
      if (!raf) raf = requestAnimationFrame(follow);
    }, { signal });
    fw.addEventListener("pointerleave", () => pill.classList.remove("is-on"), { signal });
    cleanups.push(() => cancelAnimationFrame(raf));
  });

  /* ---- Reel hover/tap preview (muted loop) ---- */
  root.querySelectorAll<HTMLElement>(".reel[data-reel]").forEach((reel) => {
    const v = reel.querySelector("video");
    if (!v) return;
    const play = () => {
      const p = v.play();
      if (p && p.then) p.then(() => reel.classList.add("is-playing")).catch(() => {});
      else reel.classList.add("is-playing");
    };
    const stop = () => { v.pause(); v.currentTime = 0; reel.classList.remove("is-playing"); };
    if (!reduceMotion) {
      reel.addEventListener("mouseenter", play, { signal });
      reel.addEventListener("mouseleave", stop, { signal });
    }
    reel.addEventListener("click", () => (v.paused ? play() : stop()), { signal });
  });

  return () => {
    ac.abort();
    cleanups.forEach((c) => c());
  };
}

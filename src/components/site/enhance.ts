/**
 * Progressive enhancement for the public site, ported line-for-line from legacy/main.js.
 * Content is fully visible without JS. Each init returns a cleanup so client-side
 * navigation doesn't stack listeners, timers or observers.
 */
type Cleanup = () => void;

declare global {
  interface Window {
    gsap?: {
      timeline: (opts: unknown) => { from: (...a: unknown[]) => unknown; to: (...a: unknown[]) => unknown } & Record<string, unknown>;
    };
  }
}

const GSAP_SRC = "https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js";

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

  /* ---- Testimonials slideshow (auto-advance + swipe + dots/arrows) ---- */
  const tsl = root.querySelector<HTMLElement>("[data-testimonials]");
  if (tsl && !tsl.hasAttribute("data-ready")) {
    const tslTrack = tsl.querySelector<HTMLElement>(".tsl-track")!;
    const tslSlides = Array.from(tslTrack.querySelectorAll<HTMLElement>(".testimonial"));
    if (tslSlides.length > 1) {
      const tslReduce = reduceMotion;
      let tslIndex = 0;
      let tslTimer = 0;
      let tslRaf = 0;
      const SVG = "http://www.w3.org/2000/svg";

      const tslArrow = (dir: number) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "tsl-arrow tsl-" + (dir < 0 ? "prev" : "next");
        b.setAttribute("aria-label", dir < 0 ? "Previous testimonial" : "Next testimonial");
        const svg = document.createElementNS(SVG, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "none");
        svg.setAttribute("aria-hidden", "true");
        const p = document.createElementNS(SVG, "path");
        p.setAttribute("d", dir < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7");
        p.setAttribute("stroke", "currentColor");
        p.setAttribute("stroke-width", "2");
        p.setAttribute("stroke-linecap", "round");
        p.setAttribute("stroke-linejoin", "round");
        svg.appendChild(p);
        b.appendChild(svg);
        b.addEventListener("click", () => go(tslIndex + dir, true), { signal });
        return b;
      };

      const controls = document.createElement("div");
      controls.className = "tsl-controls";
      const prev = tslArrow(-1);
      const dotsWrap = document.createElement("div");
      dotsWrap.className = "tsl-dots";
      const dots = tslSlides.map((_, i) => {
        const d = document.createElement("button");
        d.type = "button";
        d.className = "tsl-dot";
        d.setAttribute("aria-label", "Go to testimonial " + (i + 1));
        d.addEventListener("click", () => go(i, true), { signal });
        dotsWrap.appendChild(d);
        return d;
      });
      controls.appendChild(prev);
      controls.appendChild(dotsWrap);
      controls.appendChild(tslArrow(1));
      tsl.appendChild(controls);
      tsl.setAttribute("data-ready", "");

      const setActive = (i: number) => {
        tslIndex = i;
        tslSlides.forEach((s, n) => s.classList.toggle("is-active", n === i));
        dots.forEach((d, n) => (n === i ? d.setAttribute("aria-current", "true") : d.removeAttribute("aria-current")));
      };
      const stop = () => { if (tslTimer) { clearInterval(tslTimer); tslTimer = 0; } };
      const start = () => {
        if (tslReduce || tslTimer) return;
        tslTimer = window.setInterval(() => go(tslIndex + 1, false), 7000);
      };
      const restart = () => { stop(); start(); };
      function go(i: number, user: boolean) {
        i = (i + tslSlides.length) % tslSlides.length;
        tslTrack.scrollTo({ left: tslSlides[i].offsetLeft - tslSlides[0].offsetLeft, behavior: tslReduce ? "auto" : "smooth" });
        setActive(i);
        if (user) restart();
      }

      // Keep dots in sync with manual swipe / native scroll.
      tslTrack.addEventListener("scroll", () => {
        if (tslRaf) return;
        tslRaf = requestAnimationFrame(() => {
          tslRaf = 0;
          let best = 0;
          let min = Infinity;
          const base = tslSlides[0].offsetLeft;
          tslSlides.forEach((s, n) => {
            const d = Math.abs(s.offsetLeft - base - tslTrack.scrollLeft);
            if (d < min) { min = d; best = n; }
          });
          if (best !== tslIndex) setActive(best);
        });
      }, { passive: true, signal });

      // Pause while the visitor is reading or interacting; resume after.
      (["pointerenter", "focusin", "pointerdown", "touchstart"] as const).forEach((ev) =>
        tsl.addEventListener(ev, stop, { passive: true, signal }));
      (["pointerleave", "focusout"] as const).forEach((ev) => tsl.addEventListener(ev, () => restart(), { signal }));
      document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()), { signal });

      // Keyboard: arrows move between testimonials when a control is focused.
      controls.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); go(tslIndex - 1, true); }
        else if (e.key === "ArrowRight") { e.preventDefault(); go(tslIndex + 1, true); }
      }, { signal });

      setActive(0);
      start();
      cleanups.push(() => {
        stop();
        if (tslRaf) cancelAnimationFrame(tslRaf);
        controls.remove();
        tsl.removeAttribute("data-ready");
      });
    }
  }

  /* ---- Hero motion stage: editing timeline (real clips play under the playhead) ---- */
  const stage = root.querySelector<HTMLElement>(".stage[data-motion]");
  if (stage && !reduceMotion) {
    const screenEl = stage.querySelector<HTMLElement>(".stage-screen");
    const playhead = stage.querySelector<HTMLElement>(".act-cut .playhead");
    const clipVideos = Array.from(stage.querySelectorAll<HTMLVideoElement>(".act-cut .clip video"));

    // One-time intro reveal: clips snap onto the lanes, the audio waveform builds.
    const intro = () => {
      if (signal.aborted || !window.gsap) return;
      const tl = window.gsap.timeline({ defaults: { ease: "power3.out" } }) as unknown as {
        from: (...a: unknown[]) => typeof tl; to: (...a: unknown[]) => typeof tl;
      };
      tl.from(".act-cut .clip", { scaleX: 0, opacity: 0, transformOrigin: "left center", stagger: 0.09, duration: 0.5 }, 0)
        .from(".act-cut .waveform i", { scaleY: 0.12, opacity: 0, stagger: 0.012, duration: 0.4 }, 0.3)
        .to(".act-cut .waveform i", { scaleY: 1.3, duration: 0.16, stagger: { each: 0.03, yoyo: true, repeat: 1 } }, 0.6);
    };
    if (window.gsap) intro();
    else {
      let s = document.querySelector<HTMLScriptElement>(`script[src="${GSAP_SRC}"]`);
      if (!s) {
        s = document.createElement("script");
        s.src = GSAP_SRC;
        s.async = true;
        document.head.appendChild(s);
      }
      s.addEventListener("load", intro, { once: true, signal });
    }

    // Continuous, slow playhead sweep. Whichever clip the playhead sits over plays;
    // the rest pause and freeze on frame (one rAF loop drives both, like an NLE).
    const DURATION = 15000;
    let rafId = 0;
    let startT = 0;
    const travel = () => (screenEl ? screenEl.clientWidth : 600) - 36;
    const syncPlayback = () => {
      if (!playhead) return;
      const pr = playhead.getBoundingClientRect();
      const px = pr.left + pr.width / 2;
      clipVideos.forEach((v) => {
        const r = v.getBoundingClientRect();
        const over = px >= r.left && px <= r.right;
        if (over && v.paused) v.play()?.catch(() => {});
        else if (!over && !v.paused) v.pause();
      });
    };
    const tick = (now: number) => {
      if (!startT) startT = now;
      const progress = ((now - startT) % DURATION) / DURATION;
      if (playhead) playhead.style.transform = "translateX(" + progress * travel() + "px)";
      syncPlayback();
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
        clipVideos.forEach((v) => v.pause());
      } else if (!rafId) {
        startT = 0;
        rafId = requestAnimationFrame(tick);
      }
    }, { signal });
    cleanups.push(() => { if (rafId) cancelAnimationFrame(rafId); clipVideos.forEach((v) => v.pause()); });
  }

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

  /* ---- Showreel: cutting-room frame (autoplay in view + synced playhead/timecode) ---- */
  root.querySelectorAll<HTMLElement>(".showreel[data-showreel]").forEach((sr) => {
    const v = sr.querySelector("video");
    const fill = sr.querySelector<HTMLElement>(".sr-progress-fill");
    const tc = sr.querySelector<HTMLElement>(".sr-tc");
    if (!v) return;
    const fmt = (s: number) => {
      s = Math.max(0, s || 0);
      const m = Math.floor(s / 60);
      const ss = Math.floor(s % 60);
      return (m < 10 ? "0" : "") + m + ":" + (ss < 10 ? "0" : "") + ss;
    };
    v.addEventListener("timeupdate", () => {
      if (v.duration) {
        if (fill) fill.style.transform = "scaleX(" + v.currentTime / v.duration + ")";
        if (tc) tc.textContent = fmt(v.currentTime);
      }
    }, { signal });
    if (reduceMotion) return; // poster + static; no autoplay
    if (!("IntersectionObserver" in window)) { v.play().catch(() => {}); return; }
    const iosr = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) v.play().catch(() => {}); else v.pause(); });
    }, { threshold: 0.3 });
    iosr.observe(v);
    cleanups.push(() => { iosr.disconnect(); v.pause(); });
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

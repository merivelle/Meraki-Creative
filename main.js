/* Meraki Creative — progressive enhancement.
   Content is fully visible without JS; this adds the mobile menu + scroll reveal. */
(function () {
  document.documentElement.classList.add("js");

  /* ---- Mobile nav toggle ---- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Menu";
    });
  }

  /* ---- Scroll reveal (reveal + reveal-stagger) ---- */
  var revealEls = document.querySelectorAll(".reveal, .reveal-stagger");
  function revealAll() { revealEls.forEach(function (el) { el.classList.add("in"); }); }
  if (!("IntersectionObserver" in window) || !revealEls.length) {
    revealAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
    // Safety: transitions don't run on hidden tabs / headless renderers, so never ship blank.
    if (document.hidden) revealAll();
    document.addEventListener("visibilitychange", function () { if (document.hidden) revealAll(); });
  }

  /* ---- Testimonials slideshow (auto-advance + swipe + dots/arrows) ---- */
  var tsl = document.querySelector("[data-testimonials]");
  if (tsl) {
    var tslTrack = tsl.querySelector(".tsl-track");
    var tslSlides = Array.prototype.slice.call(tslTrack.querySelectorAll(".testimonial"));
    if (tslSlides.length > 1) {
      var tslReduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var tslIndex = 0, tslTimer = 0, tslRaf = 0;
      var SVG = "http://www.w3.org/2000/svg";

      function tslArrow(dir) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "tsl-arrow tsl-" + (dir < 0 ? "prev" : "next");
        b.setAttribute("aria-label", dir < 0 ? "Previous testimonial" : "Next testimonial");
        var svg = document.createElementNS(SVG, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "none");
        svg.setAttribute("aria-hidden", "true");
        var p = document.createElementNS(SVG, "path");
        p.setAttribute("d", dir < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7");
        p.setAttribute("stroke", "currentColor");
        p.setAttribute("stroke-width", "2");
        p.setAttribute("stroke-linecap", "round");
        p.setAttribute("stroke-linejoin", "round");
        svg.appendChild(p);
        b.appendChild(svg);
        b.addEventListener("click", function () { go(tslIndex + dir, true); });
        return b;
      }

      var controls = document.createElement("div");
      controls.className = "tsl-controls";
      var prev = tslArrow(-1);
      var dotsWrap = document.createElement("div");
      dotsWrap.className = "tsl-dots";
      var dots = tslSlides.map(function (_, i) {
        var d = document.createElement("button");
        d.type = "button";
        d.className = "tsl-dot";
        d.setAttribute("aria-label", "Go to testimonial " + (i + 1));
        d.addEventListener("click", function () { go(i, true); });
        dotsWrap.appendChild(d);
        return d;
      });
      controls.appendChild(prev);
      controls.appendChild(dotsWrap);
      controls.appendChild(tslArrow(1));
      tsl.appendChild(controls);
      tsl.setAttribute("data-ready", "");

      function setActive(i) {
        tslIndex = i;
        tslSlides.forEach(function (s, n) { s.classList.toggle("is-active", n === i); });
        dots.forEach(function (d, n) {
          if (n === i) { d.setAttribute("aria-current", "true"); }
          else { d.removeAttribute("aria-current"); }
        });
      }

      function go(i, user) {
        i = (i + tslSlides.length) % tslSlides.length;
        tslTrack.scrollTo({ left: tslSlides[i].offsetLeft - tslSlides[0].offsetLeft, behavior: tslReduce ? "auto" : "smooth" });
        setActive(i);
        if (user) restart();
      }

      function start() {
        if (tslReduce || tslTimer) return;
        tslTimer = window.setInterval(function () { go(tslIndex + 1, false); }, 7000);
      }
      function stop() { if (tslTimer) { clearInterval(tslTimer); tslTimer = 0; } }
      function restart() { stop(); start(); }

      // Keep dots in sync with manual swipe / native scroll.
      tslTrack.addEventListener("scroll", function () {
        if (tslRaf) return;
        tslRaf = requestAnimationFrame(function () {
          tslRaf = 0;
          var best = 0, min = Infinity, base = tslSlides[0].offsetLeft;
          tslSlides.forEach(function (s, n) {
            var d = Math.abs(s.offsetLeft - base - tslTrack.scrollLeft);
            if (d < min) { min = d; best = n; }
          });
          if (best !== tslIndex) setActive(best);
        });
      }, { passive: true });

      // Pause while the visitor is reading or interacting; resume after.
      ["pointerenter", "focusin", "pointerdown", "touchstart"].forEach(function (ev) {
        tsl.addEventListener(ev, stop, { passive: true });
      });
      ["pointerleave", "focusout"].forEach(function (ev) {
        tsl.addEventListener(ev, function () { restart(); });
      });
      document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });

      // Keyboard: arrows move between testimonials when a control is focused.
      controls.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") { e.preventDefault(); go(tslIndex - 1, true); }
        else if (e.key === "ArrowRight") { e.preventDefault(); go(tslIndex + 1, true); }
      });

      setActive(0);
      start();
    }
  }

  /* ---- Hero motion stage: editing timeline (real clips play under the playhead) ---- */
  var stage = document.querySelector(".stage[data-motion]");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (stage && !reduceMotion) {
    var screenEl = stage.querySelector(".stage-screen");
    var playhead = stage.querySelector(".act-cut .playhead");
    var clipVideos = Array.prototype.slice.call(stage.querySelectorAll(".act-cut .clip video"));

    // One-time intro reveal: clips snap onto the lanes, the audio waveform builds.
    if (window.gsap) {
      var gsap = window.gsap;
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .from(".act-cut .clip", { scaleX: 0, opacity: 0, transformOrigin: "left center", stagger: 0.09, duration: 0.5 }, 0)
        .from(".act-cut .waveform i", { scaleY: 0.12, opacity: 0, stagger: 0.012, duration: 0.4 }, 0.3)
        .to(".act-cut .waveform i", { scaleY: 1.3, duration: 0.16, stagger: { each: 0.03, yoyo: true, repeat: 1 } }, 0.6);
    }

    // Continuous, slow playhead sweep. Whichever clip the playhead sits over plays;
    // the rest pause and freeze on frame (one rAF loop drives both, like an NLE).
    var DURATION = 15000; // ms for one full left->right pass (slow + cinematic)
    var rafId = 0, startT = 0;

    function travel() { return (screenEl ? screenEl.clientWidth : 600) - 36; }

    function syncPlayback() {
      if (!playhead) return;
      var pr = playhead.getBoundingClientRect();
      var px = pr.left + pr.width / 2;
      clipVideos.forEach(function (v) {
        var r = v.getBoundingClientRect();
        var over = px >= r.left && px <= r.right;
        if (over && v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else if (!over && !v.paused) { v.pause(); }
      });
    }

    function tick(now) {
      if (!startT) startT = now;
      var progress = ((now - startT) % DURATION) / DURATION;
      if (playhead) playhead.style.transform = "translateX(" + (progress * travel()) + "px)";
      syncPlayback();
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    // Pause the loop + all clips when the tab is hidden; resume on return.
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
        clipVideos.forEach(function (v) { v.pause(); });
      } else if (!rafId) {
        startT = 0; rafId = requestAnimationFrame(tick);
      }
    });
  }

  /* ---- Portfolio: before/after sliders ---- */
  document.querySelectorAll(".ba[data-ba]").forEach(function (ba) {
    function setPos(clientX) {
      var r = ba.getBoundingClientRect();
      var p = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
      ba.style.setProperty("--pos", p + "%");
    }
    var dragging = false;
    ba.addEventListener("pointerdown", function (e) { dragging = true; try { ba.setPointerCapture(e.pointerId); } catch (x) {} setPos(e.clientX); });
    ba.addEventListener("pointermove", function (e) { if (dragging) setPos(e.clientX); });
    ba.addEventListener("pointerup", function () { dragging = false; });
    ba.addEventListener("pointercancel", function () { dragging = false; });
    // gentle one-time intro wipe (hints it's draggable), unless reduced motion
    if (!reduceMotion && "IntersectionObserver" in window) {
      var hinted = false;
      var io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !hinted) {
            hinted = true; io2.unobserve(ba);
            var start = performance.now(), dur = 1400;
            (function tick(now) {
              var t = Math.min(1, (now - start) / dur);
              var pos = 50 + Math.sin(t * Math.PI * 2) * 14 * (1 - t); // settle to 50
              ba.style.setProperty("--pos", pos + "%");
              if (t < 1) requestAnimationFrame(tick);
            })(start);
          }
        });
      }, { threshold: 0.4 });
      io2.observe(ba);
    }
  });

  /* ---- Showreel: cutting-room frame (autoplay in view + synced playhead/timecode) ---- */
  document.querySelectorAll(".showreel[data-showreel]").forEach(function (sr) {
    var v = sr.querySelector("video");
    var fill = sr.querySelector(".sr-progress-fill");
    var tc = sr.querySelector(".sr-tc");
    if (!v) return;
    function fmt(s) { s = Math.max(0, s || 0); var m = Math.floor(s / 60), ss = Math.floor(s % 60); return (m < 10 ? "0" : "") + m + ":" + (ss < 10 ? "0" : "") + ss; }
    v.addEventListener("timeupdate", function () {
      if (v.duration) {
        if (fill) fill.style.transform = "scaleX(" + (v.currentTime / v.duration) + ")";
        if (tc) tc.textContent = fmt(v.currentTime);
      }
    });
    if (reduceMotion) return; // poster + static; no autoplay
    if (!("IntersectionObserver" in window)) { v.play().catch(function () {}); return; }
    var iosr = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) v.play().catch(function () {}); else v.pause(); });
    }, { threshold: 0.3 });
    iosr.observe(v);
  });

  /* ---- Portfolio: reel hover/tap preview (muted loop) ---- */
  document.querySelectorAll(".reel[data-reel]").forEach(function (reel) {
    var v = reel.querySelector("video");
    if (!v) return;
    function play() { var p = v.play(); if (p && p.then) p.then(function () { reel.classList.add("is-playing"); }).catch(function () {}); else reel.classList.add("is-playing"); }
    function stop() { v.pause(); v.currentTime = 0; reel.classList.remove("is-playing"); }
    if (!reduceMotion) {
      reel.addEventListener("mouseenter", play);
      reel.addEventListener("mouseleave", stop);
    }
    reel.addEventListener("click", function () { if (v.paused) play(); else stop(); });
  });

  /* ---- Contact form: put the submitter's name in the Netlify email subject ---- */
  var contactForm = document.querySelector('form[name="contact"]');
  if (contactForm) {
    contactForm.addEventListener("submit", function () {
      var subj = contactForm.querySelector('input[name="subject"]');
      var nameEl = document.getElementById("name");
      var who = nameEl && nameEl.value ? nameEl.value.trim() : "";
      if (subj) subj.value = who ? ("New inquiry from " + who + " — Meraki Creative") : "New inquiry — Meraki Creative";
    });
  }

  /* ---- Pre-select package on contact form from ?package= or ?interest= ---- */
  var params = new URLSearchParams(window.location.search);
  var pkg = params.get("package") || params.get("interest");
  if (pkg) {
    var sel = document.getElementById("interest");
    if (sel) {
      Array.prototype.forEach.call(sel.options, function (opt) {
        if (opt.value === pkg || opt.text === pkg) opt.selected = true;
      });
    }
  }
})();

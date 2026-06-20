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

  /* ---- Hero motion stage: cut -> site -> outcome (decorative, looped) ---- */
  var stage = document.querySelector(".stage[data-motion]");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (stage && window.gsap && !reduceMotion) {
    var gsap = window.gsap;
    var screenW = function () { var s = stage.querySelector(".stage-screen"); return s ? s.clientWidth : 600; };
    gsap.set(stage.querySelectorAll(".act"), { opacity: 0 });

    var tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5, defaults: { ease: "power3.out" } });

    // ACT 1 — THE CUT
    tl.set(".act-cut", { opacity: 1 })
      .from(".act-cut .clip", { scaleX: 0, opacity: 0, stagger: 0.07, duration: 0.5 }, 0.1)
      .from(".act-cut .waveform i", { scaleY: 0.15, opacity: 0, stagger: 0.015, duration: 0.4 }, 0.3)
      .fromTo(".act-cut .playhead", { x: 0 }, { x: function () { return screenW() - 36; }, duration: 2.1, ease: "none" }, 0.3)
      .to(".act-cut .waveform i", { scaleY: 1.25, duration: 0.18, stagger: { each: 0.04, yoyo: true, repeat: 1 } }, 0.6)
      .to(".act-cut", { opacity: 0, duration: 0.5 }, "+=0.4")

      // ACT 2 — THE SITE
      .set(".act-site", { opacity: 1 }, "<")
      .from(".browser", { yPercent: 8, opacity: 0, duration: 0.55 }, "<")
      .from(".act-site .bnav, .act-site .bhead, .act-site .breel, .act-site .brow", { opacity: 0, y: 14, stagger: 0.12, duration: 0.4 }, "<0.2")
      .from(".act-site .play", { scale: 0, duration: 0.4, ease: "back.out(2)" }, "-=0.2")
      .to(".act-site", { opacity: 0, duration: 0.5 }, "+=0.7")

      // ACT 3 — THE OUTCOME
      .set(".act-out", { opacity: 1 }, "<")
      .from(".out-card", { opacity: 0, yPercent: 12, stagger: 0.16, duration: 0.55 }, "<")
      .from(".out-caption", { opacity: 0, y: 12, duration: 0.5 }, "-=0.15")
      .to(".act-out", { opacity: 1, duration: 1.9 })           // hold on the outcome
      .to(".act-out", { opacity: 0, duration: 0.55 });

    // Pause when the page is hidden (saves cycles; resumes on return)
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) tl.pause(); else tl.resume();
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
    var head = sr.querySelector(".sr-playhead");
    var tc = sr.querySelector(".sr-tc");
    if (!v) return;
    function fmt(s) { s = Math.max(0, s || 0); var m = Math.floor(s / 60), ss = Math.floor(s % 60); return (m < 10 ? "0" : "") + m + ":" + (ss < 10 ? "0" : "") + ss; }
    v.addEventListener("timeupdate", function () {
      if (v.duration) {
        if (head) head.style.transform = "translateX(" + (v.currentTime / v.duration) * sr.clientWidth + "px)";
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

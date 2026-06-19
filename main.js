/* Meraki Creative — small progressive-enhancement script.
   Everything works without JS; this only adds the mobile menu + scroll reveal. */
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

  /* ---- Scroll reveal ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || !revealEls.length) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  revealEls.forEach(function (el) { io.observe(el); });

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

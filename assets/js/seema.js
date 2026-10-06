/* Seema · سيمة — site behaviour, v2
   Point -> Bloom -> Field. Progressive enhancement: every page reads and
   works without this file; motion respects prefers-reduced-motion. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var rtl = doc.dir === "rtl";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { sessionStorage.removeItem(k); } catch (e) {} }
  };
  var PT = '<svg class="pt" viewBox="-136 -104 272 176" aria-hidden="true"><path d="M72 29 129-84Q134-92 129-97.5 124-103 117-101 72-92 26.5-83.5-19-75-66-67-68-66-71-64.5-74-63-75-61L-131 53Q-135 60-130.5 65.5-126 71-119 70-73 62-27.5 53 18 44 64 36 70 33 72 29Z"/></svg>';

  /* ---------- 0. Every page opens at the top ---------- */
  var toTop = function () { if (!location.hash) window.scrollTo(0, 0); };
  toTop();
  window.addEventListener("load", toTop);
  window.addEventListener("pageshow", toTop);

  /* ---------- 1. Saffron Bloom page transitions ---------- */
  var layer = document.createElement("div");
  layer.className = "bloom-layer"; layer.setAttribute("aria-hidden", "true"); layer.innerHTML = PT;
  document.body.appendChild(layer);
  if (store.get("seema-bloom") && !reduce) {
    store.del("seema-bloom");
    layer.classList.add("is-full");
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      layer.classList.remove("is-full"); layer.classList.add("is-shrink");
      setTimeout(function () { layer.classList.remove("is-shrink"); }, 850);
    }); });
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== "_self") return;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || /^(mailto:|tel:|https?:|\/\/)/i.test(href)) return;
    if (!/\.html(#.*)?$/.test(href)) return;
    e.preventDefault();
    layer.style.setProperty("--bx", e.clientX + "px");
    layer.style.setProperty("--by", e.clientY + "px");
    layer.classList.remove("is-shrink"); void layer.offsetWidth; layer.classList.add("is-grow");
    store.set("seema-bloom", "1");
    setTimeout(function () { window.location.href = a.href; }, 700);
  });
  window.addEventListener("pageshow", function (e) { if (e.persisted) { layer.className = "bloom-layer"; store.del("seema-bloom"); } });

  /* ---------- 2. Header: hide on scroll down, match the tone beneath ---------- */
  var hd = $(".hd");
  var tones = $$("[data-tone]");
  var lastY = window.scrollY;
  function headerTone() {
    if (!hd) return;
    var probe = 46, tone = "dark";
    for (var i = 0; i < tones.length; i++) {
      var r = tones[i].getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) { tone = tones[i].dataset.tone; }
    }
    hd.classList.toggle("on-light", tone === "light" || tone === "field");
  }

  /* ---------- 3. Scroll-driven scenes ---------- */
  var hero = $(".hero"), heroWin = $(".hero-win");
  var bloom = $(".bloom");
  var cards = $$(".card");
  var pars = $$(".par");
  var words = $(".words");
  var wordEls = words ? $$(".w", words) : [];
  if (words && !reduce) words.classList.add("is-live");
  var Q = [[24.2, 22.2], [96.7, 2.3], [76.2, 77.3], [3.7, 94.3]];
  var R = [[0, 0], [100, 0], [100, 100], [0, 100]];

  // The hero window: the Saffron Point outline with softened corners, opening to the full frame.
  function heroShape(m) {
    if (!heroWin) return;
    var w = heroWin.offsetWidth, h = heroWin.offsetHeight, P = [];
    for (var k = 0; k < 4; k++) P.push([(Q[k][0] + (R[k][0] - Q[k][0]) * m) / 100 * w, (Q[k][1] + (R[k][1] - Q[k][1]) * m) / 100 * h]);
    var r = w * 0.075 * (1 - m), d = "";
    for (var i = 0; i < 4; i++) {
      var c = P[i], a = P[(i + 3) % 4], b = P[(i + 1) % 4];
      var la = Math.hypot(a[0] - c[0], a[1] - c[1]), lb = Math.hypot(b[0] - c[0], b[1] - c[1]);
      var ra = Math.min(r, la / 2.2), rb = Math.min(r, lb / 2.2);
      var p1 = [c[0] + (a[0] - c[0]) * ra / la, c[1] + (a[1] - c[1]) * ra / la];
      var p2 = [c[0] + (b[0] - c[0]) * rb / lb, c[1] + (b[1] - c[1]) * rb / lb];
      d += (i ? "L" : "M") + p1[0].toFixed(1) + " " + p1[1].toFixed(1) + "Q" + c[0].toFixed(1) + " " + c[1].toFixed(1) + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    heroWin.style.clipPath = "path('" + d + "Z')";
  }
  heroShape(0);

  function scenes() {
    var vh = window.innerHeight;
    if (hero && heroWin && !reduce) {
      var hr = hero.getBoundingClientRect();
      var p = clamp(-hr.top / (hr.height - vh), 0, 1);
      var e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      var m = clamp(e * 1.35, 0, 1);
      var w = Math.min(window.innerWidth * (window.innerWidth < 821 ? .94 : .62), 1020);
      var sx = window.innerWidth / w, sy = vh / (w * 176 / 269);
      var sc = 1 + (Math.max(sx, sy) * 1.02 - 1) * m;
      heroShape(m);
      heroWin.style.transform = "translate(-50%, -50%) scale(" + sc + ")";
      heroWin.style.setProperty("--hs", (1.15 - .12 * m).toFixed(3));
      heroWin.style.setProperty("--hd", (.32 - .2 * m + .22 * clamp((p - .5) / .3, 0, 1)).toFixed(3));
      var type = $(".hero-type"), after = $(".hero-after");
      if (type) {
        type.style.setProperty("--hto", (1 - clamp(p / .35, 0, 1)).toFixed(3));
        var d = (rtl ? 1 : -1) * p * 22;
        type.style.setProperty("--hx1", d + "vw"); type.style.setProperty("--hx2", -d + "vw");
      }
      if (after) after.style.setProperty("--hao", clamp((p - .55) / .3, 0, 1).toFixed(3));
    }
    if (bloom && !reduce) {
      var br = bloom.getBoundingClientRect();
      var q = clamp(-br.top / (br.height - vh), 0, 1);
      var st = $(".bloom-stage");
      var grow = clamp((q - .18) / .5, 0, 1);
      grow = grow * grow * (3 - 2 * grow);
      st.style.setProperty("--br", (grow * 75) + "%");
      st.style.setProperty("--bps", (1 + q * 2.4).toFixed(3));
      st.style.setProperty("--bpo", (1 - clamp((q - .15) / .2, 0, 1)).toFixed(3));
      st.style.setProperty("--bqo", (1 - clamp(q / .15, 0, 1)).toFixed(3));
      st.style.setProperty("--bco", clamp((q - .6) / .22, 0, 1).toFixed(3));
      if (hd && br.top <= 46 && br.bottom > 46) hd.classList.toggle("on-light", grow > .6);
    }
    if (!reduce) {
      cards.forEach(function (c) {
        var r = c.getBoundingClientRect();
        var img = c.querySelector(".ph img");
        if (!img || r.bottom < 0 || r.top > vh) return;
        var t = clamp(1 - r.top / vh, 0, 2);
        img.style.transform = "scale(" + (1.14 - .07 * Math.min(t, 1)) + ")";
      });
      pars.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var c = (r.top + r.height / 2 - vh / 2) / vh;
        var img = el.querySelector("img");
        if (img) img.style.transform = "translate3d(0," + (c * -7).toFixed(2) + "%,0)";
      });
      if (wordEls.length) {
        var wr = words.getBoundingClientRect();
        var prog = clamp((vh * .82 - wr.top) / (wr.height + vh * .3), 0, 1);
        var n = Math.round(prog * wordEls.length);
        for (var j = 0; j < wordEls.length; j++) wordEls[j].classList.toggle("on", j < n);
      }
    }
  }

  var ticking = false, armed = [];
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY;
      if (hd) {
        var menuOpen = document.body.classList.contains("menu-open");
        if (!menuOpen && y > 500 && y > lastY + 6) hd.classList.add("is-hidden");
        else if (y < lastY - 6 || y < 500) hd.classList.remove("is-hidden");
      }
      lastY = y;
      var vh2 = window.innerHeight;
      armed = armed.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh2 * 0.92 && r.bottom > 0) { el.classList.add("is-in"); return false; }
        return true;
      });
      headerTone();
      scenes();
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { heroShape(0); onScroll(); });
  headerTone(); scenes();

  /* ---------- 4. Reveals: armed only for content below the fold ---------- */
  var rvs = $$(".rv, .reveal-img, .lines");
  if ("IntersectionObserver" in window && !reduce && rvs.length) {
    var fold = window.innerHeight * 0.95;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });
    rvs.forEach(function (el) {
      if (el.getBoundingClientRect().top > fold) {
        el.classList.add("is-armed");
        if (el.dataset.delay) el.style.transitionDelay = el.dataset.delay + "ms";
        armed.push(el);
        io.observe(el);
      }
    });
  }

  /* ---------- 5. Mobile menu ---------- */
  var menu = $("#menu"), openBtn = $(".menu-btn");
  if (menu && openBtn) {
    var closeBtn = $(".menu-close", menu), lastFocus = null;
    var setOpen = function (open) {
      var r = openBtn.getBoundingClientRect();
      menu.style.setProperty("--mx", (r.left + r.width / 2) + "px");
      menu.style.setProperty("--my", (r.top + r.height / 2) + "px");
      menu.classList.toggle("is-open", open);
      menu.setAttribute("aria-hidden", open ? "false" : "true");
      openBtn.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("menu-open", open);
      document.body.style.overflow = open ? "hidden" : "";
      if (open) { lastFocus = document.activeElement; setTimeout(function () { closeBtn.focus(); }, 80); }
      else if (lastFocus) lastFocus.focus();
    };
    openBtn.addEventListener("click", function () { setOpen(true); });
    closeBtn.addEventListener("click", function () { setOpen(false); });
    menu.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab") {
        var f = $$("a[href], button", menu), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- 6. Pointer: cursor badge and service peek ---------- */
  if (fine && !reduce) {
    var cur = document.createElement("div");
    cur.className = "cursor"; cur.setAttribute("aria-hidden", "true");
    document.body.appendChild(cur);
    var peek = $(".svc-peek"), pimgs = peek ? $$("img", peek) : [];
    var tx = -200, ty = -200, cx = -200, cy = -200, px = -200, py = -200, raf = null;
    var loop = function () {
      cx += (tx - cx) * .2; cy += (ty - cy) * .2;
      px += (tx - px) * .1; py += (ty - py) * .1;
      cur.style.transform = "translate(" + cx + "px," + cy + "px) scale(" + (cur.classList.contains("is-on") ? 1 : 0) + ")";
      if (peek) { peek.style.left = (px + (rtl ? -230 : 230)) + "px"; peek.style.top = py + "px"; }
      raf = (Math.abs(tx - cx) + Math.abs(ty - cy) + Math.abs(tx - px) + Math.abs(ty - py) > .5) ? requestAnimationFrame(loop) : null;
    };
    window.addEventListener("mousemove", function (e) { tx = e.clientX; ty = e.clientY; if (!raf) raf = requestAnimationFrame(loop); }, { passive: true });
    $$("[data-cursor]").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cur.textContent = el.dataset.cursor; cur.classList.add("is-on"); if (!raf) raf = requestAnimationFrame(loop); });
      el.addEventListener("mouseleave", function () { cur.classList.remove("is-on"); if (!raf) raf = requestAnimationFrame(loop); });
    });
    $$(".svc-row[data-peek]").forEach(function (row) {
      row.addEventListener("mouseenter", function () {
        pimgs.forEach(function (im) { im.classList.toggle("is-on", im.dataset.id === row.dataset.peek); });
        if (peek) peek.classList.add("is-on");
      });
      row.addEventListener("mouseleave", function () { if (peek) peek.classList.remove("is-on"); });
    });
  }

  /* ---------- 7. Services chapter nav ---------- */
  var chapLinks = $$(".chap-nav a[href^='#']");
  if (chapLinks.length && "IntersectionObserver" in window) {
    var cmap = {};
    chapLinks.forEach(function (a) { cmap[a.getAttribute("href").slice(1)] = a; });
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        chapLinks.forEach(function (a) { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
        var a = cmap[en.target.id];
        if (a) { a.classList.add("is-active"); a.setAttribute("aria-current", "true"); var bar = a.parentNode; bar.scrollTo({ left: a.offsetLeft - bar.clientWidth / 2 + a.offsetWidth / 2, behavior: "smooth" }); }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(cmap).forEach(function (id) { var s = document.getElementById(id); if (s) cio.observe(s); });
  }

  /* ---------- 8. Filters ---------- */
  $$("[data-filter-group]").forEach(function (group) {
    var target = $(group.dataset.filterGroup), live = $(group.dataset.live || "#_none");
    var buttons = $$("button[data-filter]", group);
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.dataset.filter, n = 0;
        buttons.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        $$("[data-tags]", target).forEach(function (it) {
          var show = f === "all" || it.dataset.tags.split(" ").indexOf(f) > -1;
          it.hidden = !show; if (show) n++;
        });
        if (live) live.textContent = live.dataset.tpl.replace("{n}", n);
      });
    });
  });

  /* ---------- 9. Copy buttons ---------- */
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var text = b.dataset.copy;
      if (text.charAt(0) === "#") { var el = $(text); text = el ? el.textContent : ""; }
      var label = b.querySelector("span") || b;
      var done = function () { var old = label.textContent; label.textContent = b.dataset.done || "Copied"; setTimeout(function () { label.textContent = old; }, 1800); };
      var fallback = function () {
        var ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", "");
        ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        document.body.removeChild(ta);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    });
  });

  /* ---------- 10. Enquiry form ---------- */
  var form = $("#enquiry");
  if (form) {
    var status = $("#enquiry-status"), summary = $("#enquiry-summary"), mailLink = $("#enquiry-mail");
    var msgs = JSON.parse(form.dataset.msgs || "{}");
    var setErr = function (f, m) {
      var wrap = f.closest(".fld"), out = wrap && wrap.querySelector(".err");
      if (wrap) wrap.classList.toggle("has-error", !!m);
      if (out) out.textContent = m || "";
      f.setAttribute("aria-invalid", m ? "true" : "false");
    };
    var validate = function () {
      var ok = true, first = null;
      ["name", "email", "message"].forEach(function (id) {
        var f = form.elements[id], v = (f.value || "").trim(), m = "";
        if (!v) m = msgs.required;
        else if (id === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) m = msgs.email;
        else if (id === "message" && v.length < 20) m = msgs.short;
        setErr(f, m); if (m) { ok = false; first = first || f; }
      });
      if (first) first.focus();
      return ok;
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) return;
      var d = new FormData(form);
      var lines = [
        msgs.l_name + ": " + d.get("name"), msgs.l_company + ": " + (d.get("company") || "—"),
        msgs.l_email + ": " + d.get("email"), msgs.l_phone + ": " + (d.get("phone") || "—"),
        msgs.l_services + ": " + (d.getAll("services").join(", ") || "—"), msgs.l_budget + ": " + (d.get("budget") || "—"),
        msgs.l_timeline + ": " + (d.get("timeline") || "—"), msgs.l_lang + ": " + (d.get("lang") || "—"), "", d.get("message")
      ].join("\n");
      var ready = function () {
        summary.textContent = lines;
        mailLink.href = "mailto:hello@seema.qa?subject=" + encodeURIComponent(msgs.subject + " — " + d.get("name")) + "&body=" + encodeURIComponent(lines);
        status.hidden = false; status.focus();
      };
      if (form.dataset.endpoint) {
        fetch(form.dataset.endpoint, { method: "POST", body: d, headers: { Accept: "application/json" } })
          .then(function (r) { if (!r.ok) throw new Error(); $("[data-sent]", status).hidden = false; $("[data-ready]", status).hidden = true; status.hidden = false; status.focus(); form.reset(); })
          .catch(ready);
      } else ready();
    });
  }
})();

/* ==========================================================================
   v6 "Editions": chapter rail, chapter openers, engraving dissolve.
   ========================================================================== */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---------- chapter rail ---------- */
  var rail = document.querySelector(".rail");
  var links = rail ? $$("a[data-rail]", rail) : [];
  var chaps = $$("[data-chapter]");
  var tones = $$("[data-tone]");
  var bloomStage = document.querySelector(".bloom-stage");
  function railUpdate() {
    if (!rail || !chaps.length) return;
    var vh = window.innerHeight, first = chaps[0].getBoundingClientRect(), last = chaps[chaps.length - 1].getBoundingClientRect();
    rail.classList.toggle("is-on", first.top < vh * .55 && last.bottom > vh * .45);
    var cur = null;
    for (var i = 0; i < chaps.length; i++) if (chaps[i].getBoundingClientRect().top <= vh * .5) cur = chaps[i].dataset.chapter;
    links.forEach(function (a) {
      var on = a.dataset.rail === cur;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
    var rr = rail.getBoundingClientRect(), y = rr.top + rr.height / 2, tone = "dark";
    for (var k = 0; k < tones.length; k++) {
      var r = tones[k].getBoundingClientRect();
      if (r.top <= y && r.bottom > y) tone = tones[k].dataset.tone;
    }
    if (bloomStage) {
      var b = bloomStage.parentNode.getBoundingClientRect();
      if (b.top <= y && b.bottom > y && parseFloat(bloomStage.style.getPropertyValue("--br") || 0) > 45) tone = "light";
    }
    rail.classList.toggle("on-light", tone === "light");
  }

  /* ---------- chapter openers ---------- */
  var ops = $$(".opener").map(function (op) {
    return { el: op, st: op.querySelector(".op-stage"), word: op.querySelector(".op-word"),
      mks: $$(".mk", op).map(function (m) { return { el: m, d: parseFloat(m.dataset.depth || 1) }; }) };
  });
  function openers() {
    if (reduce) return;
    var vh = window.innerHeight;
    ops.forEach(function (o) {
      var r = o.el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      var enter = clamp(1 - r.top / vh, 0, 1);                 // 0 -> 1 as the opener arrives
      var q = clamp(-r.top / Math.max(1, r.height - vh), 0, 1); // 0 -> 1 while it is pinned
      o.st.style.setProperty("--os", (1.16 - .06 * enter - .07 * q).toFixed(4));
      if (o.word) o.word.style.setProperty("--ow", (-q * 7).toFixed(2) + "vh");
      o.mks.forEach(function (m) {
        var y = ((1 - enter) * 30 + (.25 - q) * 18) * m.d;
        m.el.style.setProperty("--py", y.toFixed(2) + "vh");
      });
    });
  }

  var tick = false;
  function frame() {
    tick = false;
    railUpdate(); openers();
  }
  window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(frame); } }, { passive: true });
  window.addEventListener("resize", frame);
  frame();
})();

/* ---------- v6.2: Approach scene and deliverables cloud ---------- */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var procs = [].slice.call(document.querySelectorAll(".proc")).map(function (el) {
    return { el: el, bgs: [].slice.call(el.querySelectorAll(".proc-bg")), words: [].slice.call(el.querySelectorAll(".proc-word")),
      its: [].slice.call(el.querySelectorAll(".proc-it")), cur: el.querySelector(".proc-count .cur"), k: 0 };
  });
  var cws = [].slice.call(document.querySelectorAll(".cw"));
  function frame() {
    var vh = window.innerHeight, mobile = window.innerWidth < 821;
    procs.forEach(function (o) {
      if (reduce || mobile) return;
      var r = o.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var n = o.its.length;
      var q = clamp(-r.top / Math.max(1, r.height - vh), 0, .9999);
      var k = Math.floor(q * n), f = q * n - k;
      o.its.forEach(function (it, j) { it.style.setProperty("--f", j < k ? 1 : j === k ? f.toFixed(3) : 0); });
      if (k === o.k) return;
      o.k = k;
      [o.bgs, o.words, o.its].forEach(function (list) { list.forEach(function (x, j) { x.classList.toggle("is-on", j === k); }); });
      if (o.cur) o.cur.textContent = (k + 1 < 10 ? "0" : "") + (k + 1);
    });
    if (!reduce && !mobile) cws.forEach(function (w) {
      var r = w.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var c = (r.top + r.height / 2 - vh / 2) / vh;
      w.style.setProperty("--py", (c * -60 * parseFloat(w.dataset.depth || 1)).toFixed(1) + "px");
    });
  }
  var tick = false;
  window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; frame(); }); } }, { passive: true });
  window.addEventListener("resize", frame);
  frame();
})();

/* footer wordmark: photos cross-fade inside the letters */
(function () {
  var win = document.querySelector(".ft-win"); if (!win) return;
  var shots = [].slice.call(win.querySelectorAll(".ft-shot"));
  var caps = [].slice.call(document.querySelectorAll(".ft-cap"));
  var ticks = [].slice.call(document.querySelectorAll(".ft-ticks i"));
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DUR = 4200, k = 0, timer = null, loaded = false;
  function load() {
    if (loaded) return; loaded = true;
    shots.forEach(function (im) { var h = im.getAttribute("data-href"); im.setAttribute("href", h); im.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", h); });
    var first = new Image(); first.onload = function () { win.classList.add("is-live"); }; first.src = shots[0].getAttribute("data-href");
  }
  function show(n) {
    k = n;
    [shots, caps].forEach(function (list) { list.forEach(function (x, j) { x.classList.toggle("is-on", j === k); }); });
    ticks.forEach(function (t, j) { t.classList.remove("is-on"); t.classList.toggle("is-done", j < k); void t.offsetWidth; if (j === k) t.classList.add("is-on"); });
  }
  function play() { if (timer || reduce) return; timer = setInterval(function () { show((k + 1) % shots.length); }, DUR); }
  function stop() { clearInterval(timer); timer = null; }
  document.documentElement.style.setProperty("--ft-dur", DUR + "ms");
  if (!("IntersectionObserver" in window)) { load(); play(); return; }
  new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { load(); show(k); play(); } else stop();
    });
  }, { rootMargin: "300px 0px" }).observe(win);
})();

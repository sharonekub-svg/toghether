/* אתר עו"ד רועי קובובסקי — אינטראקציות, תפריט מסך מלא ואנימציות */
(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- שנה נוכחית בפוטר ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- כותרת "נדבקת" + פס התקדמות גלילה ---------- */
  var header = document.getElementById("siteHeader");
  var progress = document.getElementById("scrollProgress");
  var lastY = window.scrollY;

  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 24);
    if (header) header.classList.toggle("hide", y > 420 && y > lastY && !document.body.classList.contains("menu-open"));
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (h > 0 ? Math.min(y / h, 1) : 0) + ")";
    }
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- תפריט מסך מלא ---------- */
  var menuBtn = document.getElementById("menuBtn");
  var overlay = document.getElementById("overlayMenu");

  function setMenu(open) {
    if (!overlay || !menuBtn) return;
    document.body.classList.toggle("menu-open", open);
    overlay.classList.toggle("open", open);
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "סגירת תפריט" : "פתיחת תפריט");
    if (open) {
      var first = overlay.querySelector(".overlay-nav a");
      if (first) setTimeout(function () { first.focus(); }, 420);
    } else {
      menuBtn.focus();
    }
  }

  if (menuBtn && overlay) {
    menuBtn.addEventListener("click", function () {
      setMenu(!document.body.classList.contains("menu-open"));
    });
    overlay.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) setMenu(false);
    });
  }

  /* ---------- הכנה לאנימציות: עטיפת כותרות ומדרוג ---------- */
  // כותרות עם חשיפת "מסכה" — עוטפים את התוכן בשכבה פנימית
  document.querySelectorAll(".rv-mask").forEach(function (el) {
    var inner = document.createElement("span");
    inner.className = "rv-mask-in";
    while (el.firstChild) inner.appendChild(el.firstChild);
    el.appendChild(inner);
  });

  // מדרוג (stagger) — כל ילד מקבל אינדקס להשהיה
  document.querySelectorAll("[data-stagger]").forEach(function (box) {
    var i = 0;
    Array.prototype.forEach.call(box.children, function (child) {
      child.style.setProperty("--i", i);
      if (!child.classList.contains("reveal") && !child.classList.contains("rv-sep")) {
        child.classList.add("reveal");
      }
      i++;
    });
  });

  /* ---------- חשיפה בגלילה ---------- */
  var animTargets = document.querySelectorAll(".reveal, .rv-mask, .rv-img");
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    animTargets.forEach(function (el) { io.observe(el); });
  } else {
    animTargets.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- אנימציית הפתיחה של ה-Hero ---------- */
  var hero = document.querySelector(".hero");
  function playHero() { if (hero) hero.classList.add("in"); }
  if (reduced) { playHero(); }
  else if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { setTimeout(playHero, 60); });
    setTimeout(playHero, 1200); // רשת ביטחון
  } else {
    window.addEventListener("load", playHero);
    setTimeout(playHero, 1200);
  }

  /* ---------- פרלקסה עדינה ---------- */
  var pxEls = [];
  var heroFig = document.querySelector(".hero-figure");
  if (heroFig) pxEls.push({ el: heroFig, speed: -0.07 });
  var portrait = document.querySelector(".portrait-img");
  if (portrait) pxEls.push({ el: portrait, speed: 0.05 });

  if (pxEls.length && !reduced) {
    var ticking = false;
    var update = function () {
      var vh = window.innerHeight;
      pxEls.forEach(function (p) {
        var r = p.el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var mid = r.top + r.height / 2 - vh / 2;
        p.el.style.setProperty("--py", (mid * p.speed).toFixed(2) + "px");
      });
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- FAQ: אקורדיון ---------- */
  var faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (item.open) faqItems.forEach(function (o) { if (o !== item) o.open = false; });
    });
  });

  /* ---------- לקוח Supabase (עצל) ---------- */
  var supa = null;
  function getSupa() {
    if (supa) return supa;
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) return null;
    supa = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    return supa;
  }

  /* ---------- טופס יצירת קשר ---------- */
  var form = document.getElementById("leadForm");
  var statusEl = document.getElementById("formStatus");
  var submitBtn = document.getElementById("submitBtn");
  var TARGET_EMAIL = cfg.formEmail || cfg.fallbackEmail || cfg.contactEmail || "";

  function setStatus(msg, kind) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = "form-status" + (kind ? " " + kind : "");
  }

  function mailtoFallback(payload) {
    var subject = "פנייה מהאתר — " + payload.full_name;
    var body =
      "שם: " + payload.full_name + "\n" +
      "אימייל: " + payload.email + "\n" +
      "טלפון: " + (payload.phone || "-") + "\n\n" +
      "הודעה:\n" + (payload.message || "");
    window.location.href =
      "mailto:" + TARGET_EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  }

  function emailForm(payload) {
    return fetch("https://formsubmit.co/ajax/" + encodeURIComponent(TARGET_EMAIL), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        "שם": payload.full_name,
        "אימייל": payload.email,
        "טלפון": payload.phone || "-",
        "הודעה": payload.message || "",
        "_subject": "פנייה חדשה מהאתר — " + payload.full_name,
        "_template": "table",
        "_captcha": "false"
      })
    }).then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); });
  }

  function storeLead(payload) {
    var client = getSupa();
    if (!client) return;
    try { client.from("roey_leads").insert(payload).then(function () {}, function () {}); } catch (e) {}
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var payload = {
        full_name: (form.full_name.value || "").trim(),
        email: (form.email.value || "").trim(),
        phone: (form.phone.value || "").trim() || null,
        kind: "general",
        message: (form.message.value || "").trim() || null,
        user_agent: navigator.userAgent,
      };

      if (!payload.full_name) { setStatus("נא למלא שם מלא.", "err"); form.full_name.focus(); return; }
      if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        setStatus("נא למלא כתובת אימייל תקינה.", "err"); form.email.focus(); return;
      }

      if (submitBtn) submitBtn.disabled = true;
      setStatus("שולח…", "");
      storeLead(payload);

      emailForm(payload).then(function () {
        if (submitBtn) submitBtn.disabled = false;
        form.reset();
        setStatus("הפנייה נשלחה בהצלחה! אחזור אליכם בהקדם.", "ok");
      }).catch(function (err) {
        console.error(err);
        if (submitBtn) submitBtn.disabled = false;
        setStatus("פותח את תוכנת הדוא״ל שלכם להשלמת השליחה…", "ok");
        setTimeout(function () { mailtoFallback(payload); }, 700);
      });
    });
  }

  /* ---------- הצגת הדוא"ל מתוך ההגדרות ---------- */
  var displayEmail = cfg.contactEmail || cfg.fallbackEmail;
  if (displayEmail) {
    document.querySelectorAll(".js-email").forEach(function (el) {
      el.textContent = displayEmail;
      el.href = "mailto:" + displayEmail;
    });
  }
})();

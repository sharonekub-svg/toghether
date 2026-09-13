/* אתר עו"ד רועי קובובסקי — אינטראקציות בצד הלקוח */
(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};

  /* ---------- שנה נוכחית בפוטר ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- כותרת "נדבקת" בגלילה ---------- */
  var header = document.getElementById("siteHeader");
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 24) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- תפריט מובייל ---------- */
  var toggle = document.getElementById("navToggle");
  var links = document.querySelector(".nav-links");
  function closeMenu() {
    if (!links || !toggle) return;
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- FAQ: אקורדיון (רק אחד פתוח בכל פעם) ---------- */
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

  /* ---------- שליחת טופס יצירת קשר ---------- */
  var form = document.getElementById("leadForm");
  var statusEl = document.getElementById("formStatus");
  var submitBtn = document.getElementById("submitBtn");

  function setStatus(msg, kind) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = "form-status" + (kind ? " " + kind : "");
  }

  var TARGET_EMAIL = cfg.formEmail || cfg.fallbackEmail || cfg.contactEmail || "";

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

  // שליחת הפנייה בדוא"ל אל הכתובת שהוגדרה (באמצעות FormSubmit).
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

  // שמירה מקבילה במסד הנתונים (גיבוי, best-effort).
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

      storeLead(payload); // גיבוי במסד הנתונים

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

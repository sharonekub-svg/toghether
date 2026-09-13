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

  function mailtoFallback(payload) {
    var subject = "פנייה מהאתר — " + payload.full_name;
    var body =
      "שם: " + payload.full_name + "\n" +
      "אימייל: " + payload.email + "\n" +
      "טלפון: " + (payload.phone || "-") + "\n\n" +
      "הודעה:\n" + (payload.message || "");
    var to = cfg.fallbackEmail || cfg.contactEmail || "";
    window.location.href =
      "mailto:" + to +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
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

      var client = getSupa();
      if (!client) {
        setStatus("פותח את תוכנת הדוא״ל שלכם…", "ok");
        if (submitBtn) submitBtn.disabled = false;
        mailtoFallback(payload);
        return;
      }

      client.from("roey_leads").insert(payload).then(function (res) {
        if (submitBtn) submitBtn.disabled = false;
        if (res.error) {
          console.error(res.error);
          setStatus("אירעה תקלה בשמירה — פותח דוא״ל לשליחה ידנית…", "err");
          setTimeout(function () { mailtoFallback(payload); }, 900);
          return;
        }
        form.reset();
        setStatus("הפנייה נשלחה בהצלחה! אחזור אליכם בהקדם.", "ok");
      }).catch(function (err) {
        console.error(err);
        if (submitBtn) submitBtn.disabled = false;
        setStatus("אירעה תקלה — פותח דוא״ל לשליחה ידנית…", "err");
        setTimeout(function () { mailtoFallback(payload); }, 900);
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

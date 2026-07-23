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
    if (window.scrollY > 24) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- תפריט מובייל ---------- */
  var toggle = document.getElementById("navToggle");
  var links = document.querySelector(".nav-links");
  function closeMenu() {
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
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- טאבים בטופס (כללי / מועמדות) ---------- */
  var form = document.getElementById("leadForm");
  var tabs = document.querySelectorAll(".form-tab");
  var currentKind = "general";

  function setKind(kind) {
    currentKind = kind;
    tabs.forEach(function (t) {
      var active = t.dataset.kind === kind;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll("[data-when]").forEach(function (el) {
      var show = el.getAttribute("data-when") === kind;
      el.hidden = !show;
      // הפעלת/כיבוי required בהתאם לטאב הפעיל
      var fit = el.querySelector("#f-fit");
      if (fit) fit.required = (kind === "job") && show;
    });
    // עדכון תווית הכפתור
    var btn = document.getElementById("submitBtn");
    if (btn) btn.textContent = kind === "job" ? "שליחת מועמדות" : "שליחת הפנייה";
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () { setKind(t.dataset.kind); });
  });

  /* ---------- לקוח Supabase (עצל) ---------- */
  var supa = null;
  function getSupa() {
    if (supa) return supa;
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) return null;
    supa = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    return supa;
  }

  /* ---------- שליחת הטופס ---------- */
  var statusEl = document.getElementById("formStatus");
  var submitBtn = document.getElementById("submitBtn");

  function setStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.className = "form-status" + (kind ? " " + kind : "");
  }

  function mailtoFallback(payload) {
    var subject = payload.kind === "job"
      ? "הגשת מועמדות לעבודה — " + payload.full_name
      : "פנייה מהאתר — " + payload.full_name;
    var body =
      "שם: " + payload.full_name + "\n" +
      "אימייל: " + payload.email + "\n" +
      "טלפון: " + (payload.phone || "-") + "\n\n" +
      (payload.kind === "job"
        ? "למה מתאים/ה לעבודה:\n" + (payload.fit_reason || "")
        : "הודעה:\n" + (payload.message || ""));
    var to = cfg.fallbackEmail || "";
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
        kind: currentKind,
        message: currentKind === "general" ? (form.message.value || "").trim() || null : null,
        fit_reason: currentKind === "job" ? (form.fit_reason.value || "").trim() || null : null,
        user_agent: navigator.userAgent,
      };

      // בדיקות בסיסיות
      if (!payload.full_name) { setStatus("נא למלא שם מלא.", "err"); form.full_name.focus(); return; }
      if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        setStatus("נא למלא כתובת אימייל תקינה.", "err"); form.email.focus(); return;
      }
      if (currentKind === "job" && !payload.fit_reason) {
        setStatus("נא לפרט למה אתם מתאימים לעבודה.", "err"); form.fit_reason.focus(); return;
      }

      submitBtn.disabled = true;
      setStatus("שולח…", "");

      var client = getSupa();
      if (!client) {
        // אין חיבור למסד הנתונים — נעבור לשליחת דוא"ל
        setStatus("פותח את תוכנת הדוא״ל שלכם…", "ok");
        submitBtn.disabled = false;
        mailtoFallback(payload);
        return;
      }

      client.from("roey_leads").insert(payload).then(function (res) {
        submitBtn.disabled = false;
        if (res.error) {
          console.error(res.error);
          setStatus("אירעה תקלה בשמירה — פותח דוא״ל לשליחה ידנית…", "err");
          setTimeout(function () { mailtoFallback(payload); }, 900);
          return;
        }
        form.reset();
        setKind(currentKind); // שמירה על הטאב הפעיל
        setStatus(
          currentKind === "job"
            ? "המועמדות נשלחה בהצלחה! נחזור אליכם בהקדם."
            : "הפנייה נשלחה בהצלחה! נחזור אליכם בהקדם.",
          "ok"
        );
      }).catch(function (err) {
        console.error(err);
        submitBtn.disabled = false;
        setStatus("אירעה תקלה — פותח דוא״ל לשליחה ידנית…", "err");
        setTimeout(function () { mailtoFallback(payload); }, 900);
      });
    });
  }

  /* ---------- החלת פרטי קשר מתוך ההגדרות ---------- */
  var displayEmail = cfg.contactEmail || cfg.fallbackEmail;
  if (displayEmail) {
    document.querySelectorAll("[data-email]").forEach(function (el) {
      el.href = "mailto:" + displayEmail;
      if (el.id === "emailLink") el.textContent = displayEmail;
    });
  }
})();

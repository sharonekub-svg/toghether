/* ============================================================
   תוגדאו — app logic
   SPA with hash routing. Runs on demo data out of the box;
   switches to Supabase automatically when config.js has keys.
   ============================================================ */

"use strict";

/* ---------------- Demo data ---------------- */

const CATEGORIES = [
  { id: "all", label: "הכול" },
  { id: "concert", label: "הופעות" },
  { id: "festival", label: "פסטיבלים" },
  { id: "sport", label: "ספורט" },
  { id: "theater", label: "תיאטרון" },
  { id: "standup", label: "סטנדאפ" },
];

const EVENTS = [
  { id: "omer-adam", title: "עומר אדם", venue: "פארק הירקון, תל אביב", date: "2026-08-15T21:00", category: "concert", emoji: "🎤", faceMin: 350, faceMax: 480, soldOut: true, waitlist: 347 },
  { id: "noa-kirel", title: "נועה קירל", venue: "היכל מנורה מבטחים, תל אביב", date: "2026-09-02T20:30", category: "concert", emoji: "⭐", faceMin: 280, faceMax: 390, soldOut: true, waitlist: 212 },
  { id: "shlomo-artzi", title: "שלמה ארצי", venue: "האמפי קיסריה", date: "2026-08-25T20:00", category: "concert", emoji: "🎸", faceMin: 420, faceMax: 420, soldOut: true, waitlist: 158 },
  { id: "derby", title: "מכבי ת\"א – הפועל ת\"א (דרבי)", venue: "היכל מנורה מבטחים", date: "2026-08-22T19:00", category: "sport", emoji: "🏀", faceMin: 120, faceMax: 350, soldOut: true, waitlist: 96 },
  { id: "tamar", title: "פסטיבל תמר", venue: "מצדה, ים המלח", date: "2026-09-28T22:00", category: "festival", emoji: "🌵", faceMin: 260, faceMax: 260, soldOut: false, waitlist: 0 },
  { id: "infected", title: "Infected Mushroom", venue: "לייב פארק, ראשון לציון", date: "2026-09-12T21:30", category: "concert", emoji: "🍄", faceMin: 290, faceMax: 290, soldOut: true, waitlist: 74 },
  { id: "hasson", title: "שחר חסון", venue: "זאפה, תל אביב", date: "2026-08-08T21:00", category: "standup", emoji: "🎙️", faceMin: 160, faceMax: 160, soldOut: true, waitlist: 41 },
  { id: "cameri", title: "מקבת — הקאמרי", venue: "תיאטרון הקאמרי, תל אביב", date: "2026-09-01T20:00", category: "theater", emoji: "🎭", faceMin: 190, faceMax: 240, soldOut: false, waitlist: 0 },
];

const LISTINGS = [
  { id: "l1", eventId: "omer-adam", seat: "גוש 12, שורה 8, מושבים 14-15", face: 350, price: 350, qty: 2, level: "verified", seller: "יואב מ.", trust: 5, sales: 12 },
  { id: "l2", eventId: "omer-adam", seat: "דשא — כניסה מהירה", face: 350, price: 320, qty: 1, level: "safe", seller: "מיכל ר.", trust: 4, sales: 3 },
  { id: "l3", eventId: "omer-adam", seat: "טריבונה מערבית, שורה 22", face: 480, price: 480, qty: 2, level: "safe", seller: "דניאל כ.", trust: 5, sales: 8 },
  { id: "l4", eventId: "derby", seat: "יציע 5, שורה 3", face: 220, price: 200, qty: 1, level: "safe", seller: "עידו ב.", trust: 4, sales: 5 },
  { id: "l5", eventId: "noa-kirel", seat: "פארטר עמידה", face: 280, price: 280, qty: 2, level: "verified", seller: "שיר ל.", trust: 5, sales: 21 },
  { id: "l6", eventId: "hasson", seat: "שולחן 14, זוג", face: 160, price: 145, qty: 2, level: "safe", seller: "רועי א.", trust: 3, sales: 1 },
  { id: "l7", eventId: "infected", seat: "כניסה כללית", face: 290, price: 290, qty: 1, level: "safe", seller: "טל ש.", trust: 4, sales: 6 },
];

const MY_TICKETS = [
  {
    id: "t1", type: "bought", eventId: "omer-adam",
    seat: "גוש 12, שורה 8, מושב 14",
    paid: 350, fee: 26, level: "verified",
    status: "escrow_held",
    statusText: "הכרטיס בארנק · הכסף בנאמנות עד יומיים אחרי המופע",
  },
  {
    id: "t2", type: "sold", eventId: "derby",
    seat: "יציע 7, שורה 12, מושב 4",
    price: 180, buyer: "נ׳ מפתח תקווה",
    status: "awaiting_payout",
    statusText: "נמכר! התשלום ישוחרר אליך יומיים אחרי המשחק",
  },
];

const MY_WAITLISTS = [
  { eventId: "noa-kirel", joined: "2026-07-10", position: 18 },
];

const FEE_RATE = 0.075;
const FEE_MIN = 15;
const fee = (price) => Math.max(FEE_MIN, Math.round(price * FEE_RATE));

/* ---------------- Optional Supabase ---------------- */
/* When config.js contains real keys, events + listings load from the
   togdao Supabase project (schema in supabase/migrations). Demo data
   is the automatic fallback, so the app always works. */

let db = null;
async function initSupabase() {
  const cfg = window.TOGDAO_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return;
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    db = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    const { data, error } = await db.from("events").select("*").limit(50);
    if (!error && data && data.length) {
      EVENTS.length = 0;
      for (const e of data) {
        EVENTS.push({
          id: e.slug || e.id, title: e.title, venue: e.venue_name || "",
          date: e.starts_at, category: e.category || "concert",
          emoji: e.emoji || "🎫", faceMin: e.face_price_min, faceMax: e.face_price_max,
          soldOut: e.status === "sold_out", waitlist: e.waitlist_count || 0,
        });
      }
    }
  } catch (err) {
    console.warn("Supabase unavailable, using demo data", err);
  }
}

/* ---------------- Tiny helpers ---------------- */

const $ = (sel, root = document) => root.querySelector(sel);
const view = () => $("#view");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nis = (n) => `₪${Number(n).toLocaleString("he-IL")}`;

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "long" }) +
    " · " + d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

function toast(title, body, emoji = "✅") {
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<div>${emoji}</div><div><b>${esc(title)}</b><span>${esc(body)}</span></div>`;
  $("#toasts").appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .4s"; }, 3600);
  setTimeout(() => el.remove(), 4100);
}

function modal(html) {
  const root = $("#modal-root");
  root.innerHTML = `<div class="modal-back"><div class="modal"><div class="grip"></div>${html}</div></div>`;
  $(".modal-back", root).addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-back")) closeModal();
  });
}
function closeModal() { $("#modal-root").innerHTML = ""; }

const trustStars = (n) => `<span class="trust-dot">${"★".repeat(n)}${"☆".repeat(5 - n)}</span>`;

const badgeHtml = (level) => level === "verified"
  ? `<span class="badge badge-verified">✔ מאומת — ברקוד חדש הונפק</span>`
  : `<span class="badge badge-safe">🔒 SAFE — כסף בנאמנות</span>`;

/* ---------------- Screens ---------------- */

function eventCard(ev) {
  const count = LISTINGS.filter((l) => l.eventId === ev.id).length;
  return `
  <a class="event-card" href="#/event/${ev.id}">
    <div class="event-cover" style="background:linear-gradient(160deg, rgba(140,123,255,.35), rgba(246,196,83,.12)), var(--card-2)">
      <span class="emoji">${ev.emoji}</span>
      ${ev.soldOut ? `<span class="badge-soldout">SOLD OUT</span>` : `<span class="badge-onsale">במכירה</span>`}
    </div>
    <div class="event-body">
      <h3>${esc(ev.title)}</h3>
      <div class="event-meta">${esc(ev.venue)}<br>${fmtDate(ev.date)}</div>
      <div class="event-foot">
        ${count ? `<span class="listings-count">${count} כרטיסים זמינים</span>` : `<span class="muted">אין כרטיסים כרגע</span>`}
        <span class="face">נקוב ${nis(ev.faceMin)}${ev.faceMax > ev.faceMin ? "+" : ""}</span>
      </div>
    </div>
  </a>`;
}

function listingStub(l, withEvent = false) {
  const ev = EVENTS.find((e) => e.id === l.eventId);
  const below = l.price < l.face;
  return `
  <a class="stub" href="#/checkout/${l.id}">
    <div class="stub-main">
      <div class="stub-title">${withEvent && ev ? esc(ev.title) + " · " : ""}${esc(l.seat)}</div>
      <div class="stub-sub">${l.qty > 1 ? l.qty + " כרטיסים · " : ""}מחיר נקוב ${nis(l.face)}</div>
      <div class="stub-seller">${trustStars(l.trust)} ${esc(l.seller)} · ${l.sales} מכירות</div>
      ${badgeHtml(l.level)}
    </div>
    <div class="stub-price">
      <span class="amount">${nis(l.price)}</span>
      ${below ? `<span class="below-face">מתחת לנקוב! −${nis(l.face - l.price)}</span>` : `<span class="at-face">מחיר נקוב</span>`}
    </div>
    <span class="notch-b"></span>
  </a>`;
}

/* ----- Home ----- */
function renderHome() {
  const hot = EVENTS.filter((e) => e.soldOut);
  const withListings = LISTINGS.slice(0, 4);
  view().innerHTML = `
    <div class="hero">
      <h1>כרטיס יד שנייה.<br><em>ביטחון יד ראשונה.</em></h1>
      <p>קונים ומוכרים כרטיסים במחיר המקורי בלבד. הכסף בנאמנות — עוקץ פשוט לא משתלם כאן.</p>
      <div class="searchbox" onclick="location.hash='#/search'">
        <span>🔍</span><input placeholder="מופע, אמן, קבוצה או מקום…" readonly />
      </div>
    </div>

    <div class="section-title"><h2>🔥 אזל? זה בדיוק המקום</h2><a class="more" href="#/search">הכול ›</a></div>
    <div class="hscroll">${hot.map(eventCard).join("")}</div>

    <div class="section-title"><h2>🎟️ עלו עכשיו למכירה</h2></div>
    ${withListings.map((l) => listingStub(l, true)).join("")}

    <div class="waitlist-card mt16">
      <span class="big">📣</span>
      <h3>יש לך כרטיס שלא תנצלו?</h3>
      <p>מילואים, מחלה, תוכניות שהשתנו — תוך דקות הכרטיס אצל קונה מאומת, והכסף בדרך אליך.</p>
      <button class="btn btn-gold" onclick="location.hash='#/sell'">מכירת כרטיס ב-3 צעדים</button>
    </div>
  `;
}

/* ----- Search ----- */
let searchState = { q: "", cat: "all" };
function renderSearch() {
  const results = EVENTS.filter((e) => {
    const okCat = searchState.cat === "all" || e.category === searchState.cat;
    const okQ = !searchState.q || (e.title + e.venue).includes(searchState.q);
    return okCat && okQ;
  });
  view().innerHTML = `
    <div class="searchbox">
      <span>🔍</span>
      <input id="search-input" placeholder="מופע, אמן, קבוצה או מקום…" value="${esc(searchState.q)}" autofocus />
    </div>
    <div class="chips">
      ${CATEGORIES.map((c) => `<button class="chip ${searchState.cat === c.id ? "active" : ""}" data-cat="${c.id}">${c.label}</button>`).join("")}
    </div>
    <div class="mt8" id="search-results">
      ${results.length ? results.map((ev) => `<div class="mt8">${eventCard(ev).replace('class="event-card"', 'class="event-card" style="flex:none;width:100%"')}</div>`).join("") : `<div class="empty"><span class="big">🫥</span>לא מצאנו. נסו חיפוש אחר או הצטרפו לרשימת המתנה מהעמוד של האירוע.</div>`}
    </div>`;
  $("#search-input").addEventListener("input", (e) => { searchState.q = e.target.value.trim(); renderSearch(); positionCursor(); });
  view().querySelectorAll(".chip").forEach((ch) => ch.addEventListener("click", () => { searchState.cat = ch.dataset.cat; renderSearch(); }));
  function positionCursor() { const i = $("#search-input"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
}

/* ----- Event page ----- */
function renderEvent(id) {
  const ev = EVENTS.find((e) => e.id === id);
  if (!ev) return renderHome();
  const listings = LISTINGS.filter((l) => l.eventId === id);
  view().innerHTML = `
    <a class="back-link" href="#/">‹ חזרה</a>
    <div class="event-hero">
      <div class="glow"></div>
      <span class="emoji-big">${ev.emoji}</span>
      <h1>${esc(ev.title)}</h1>
      <div class="meta">📍 ${esc(ev.venue)}<br>🗓️ ${fmtDate(ev.date)}</div>
      <div class="facewrap">
        <span class="pill gold">מחיר נקוב: ${nis(ev.faceMin)}${ev.faceMax > ev.faceMin ? " – " + nis(ev.faceMax) : ""}</span>
        ${ev.soldOut ? `<span class="pill">SOLD OUT בקופות</span>` : `<span class="pill">עדיין במכירה רשמית</span>`}
      </div>
    </div>

    <div class="law-note">⚖️ <div>בתוגדאו אי אפשר לבקש יותר מהמחיר הנקוב — ככה זה חוקי (סעיף 194א לחוק העונשין), וככה הספסרים נשארים בחוץ. אפשר גם למכור מתחת לנקוב.</div></div>

    <div class="section-title"><h2>כרטיסים זמינים (${listings.length})</h2></div>
    ${listings.length
      ? listings.map((l) => listingStub(l)).join("")
      : ""}

    ${listings.length === 0 || ev.soldOut ? `
    <div class="waitlist-card mt16">
      <span class="big">⏰</span>
      <h3>${listings.length === 0 ? "אין כרטיסים כרגע" : "לא מצאתם מקום שמתאים?"}</h3>
      <p><span class="waitlist-count">${ev.waitlist} אנשים</span> כבר ברשימת ההמתנה. ברגע שעולה כרטיס — נשלח התראה, ויהיה לכם חלון של 10 דקות לקנות לפני כולם.</p>
      <button class="btn btn-violet" id="btn-waitlist">הצטרפות לרשימת ההמתנה</button>
    </div>` : ""}
  `;
  const wl = $("#btn-waitlist");
  if (wl) wl.addEventListener("click", () => {
    toast("נרשמת לרשימת ההמתנה! 🎯", `נודיע לך ברגע שעולה כרטיס ל${ev.title}.`, "📣");
    wl.textContent = "את/ה ברשימה ✓"; wl.disabled = true; wl.style.opacity = ".6";
  });
}

/* ----- Checkout ----- */
function renderCheckout(listingId) {
  const l = LISTINGS.find((x) => x.id === listingId);
  if (!l) return renderHome();
  const ev = EVENTS.find((e) => e.id === l.eventId);
  const f = fee(l.price);
  view().innerHTML = `
    <a class="back-link" href="#/event/${ev.id}">‹ חזרה לאירוע</a>
    <h1 style="font-size:22px;font-weight:900">אישור קנייה</h1>
    <p class="muted mt8">${esc(ev.title)} · ${esc(l.seat)}</p>
    <div class="mt8">${badgeHtml(l.level)}</div>

    <div class="summary-card mt16">
      <div class="sumrow"><span class="lbl">מחיר הכרטיס (≤ נקוב)</span><span>${nis(l.price)}</span></div>
      <div class="sumrow"><span class="lbl">דמי שירות תוגדאו</span><span>${nis(f)}</span></div>
      <div class="fee-note">דמי השירות הם עבור אימות, נאמנות והעברה בטוחה — שורה נפרדת, לא חלק ממחיר הכרטיס.</div>
      <div class="sumrow total"><span>סה"כ לתשלום</span><span class="val">${nis(l.price + f)}</span></div>
    </div>

    <div class="section-title"><h2>מה קורה לכסף שלך</h2></div>
    <div class="escrow-steps">
      <div class="estep done"><div class="dot">💳</div><div class="txt"><b>משלמים עכשיו</b><span>הכסף לא עובר למוכר — הוא מוחזק בנאמנות אצל ספק סליקה מפוקח.</span></div></div>
      <div class="estep"><div class="dot">🎫</div><div class="txt"><b>הכרטיס עובר אליך מיד</b><span>${l.level === "verified" ? "הברקוד הישן מבוטל אצל המפיק, וברקוד חדש מונפק על שמך. עותק המוכר הופך לנייר." : "קובץ הכרטיס נכנס לארנק שלך, והעותק של המוכר ננעל אצלנו."}</span></div></div>
      <div class="estep"><div class="dot">🎉</div><div class="txt"><b>אחרי שנכנסת — המוכר מקבל את הכסף</b><span>יומיים אחרי האירוע, אם הכול תקין. סורבת בכניסה? לחיצה אחת ומקבלים את כל הכסף בחזרה, כולל דמי השירות.</span></div></div>
    </div>

    <div class="section-title"><h2>אמצעי תשלום</h2></div>
    <div class="paymethods">
      <button class="paymethod active" data-pm> Apple Pay</button>
      <button class="paymethod" data-pm>Google Pay</button>
      <button class="paymethod" data-pm>💳 כרטיס אשראי</button>
      <button class="paymethod" data-pm>Bit</button>
    </div>

    <button class="btn btn-gold" id="btn-pay">תשלום מאובטח · ${nis(l.price + f)}</button>
    <p class="tiny mt8" style="text-align:center">מאובטח ב-3D Secure · דמי השירות מוחזרים במלואם אם האחריות שלנו לא קוימה</p>
  `;
  view().querySelectorAll("[data-pm]").forEach((b) => b.addEventListener("click", () => {
    view().querySelectorAll("[data-pm]").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
  }));
  $("#btn-pay").addEventListener("click", () => {
    modal(`
      <h2>🎉 הכרטיס שלך!</h2>
      <p class="sub">${esc(ev.title)} · ${esc(l.seat)}</p>
      <div class="qr-zone"><span class="qr-locked">🔐</span>הברקוד ייחשף בארנק ביום האירוע — הגנה נוספת מפני צילומי מסך.</div>
      <div class="honesty">💰 ${nis(l.price)} מוחזקים בנאמנות. המוכר יקבל אותם רק יומיים אחרי שנכנסת. משהו השתבש בשער? כפתור אחד בארנק — והחזר מלא.</div>
      <button class="btn btn-gold mt16" onclick="closeModal();location.hash='#/wallet'">לארנק שלי</button>
    `);
    toast("התשלום בוצע", "הכרטיס נוסף לארנק. הכסף בנאמנות עד אחרי האירוע.", "🔒");
  });
}

/* ----- Sell wizard ----- */
let sell = { step: 1, eventId: null, price: null };

function renderSell() {
  const ev = EVENTS.find((e) => e.id === sell.eventId);
  const stepsHead = `<div class="steps-head">${[1, 2, 3, 4].map((n) => `<div class="s ${sell.step >= n ? "on" : ""}"></div>`).join("")}</div>`;

  if (sell.step === 1) {
    view().innerHTML = `
      <h1 style="font-size:22px;font-weight:900">מכירת כרטיס</h1>
      <p class="muted mt8">שלב 1 · לאיזה אירוע הכרטיס?</p>
      ${stepsHead}
      <div class="searchbox"><span>🔍</span><input id="sell-search" placeholder="חיפוש בקטלוג האירועים…" /></div>
      <div class="mt16" id="sell-events">
        ${EVENTS.map((e) => `
          <button class="kyc-item" style="width:100%;text-align:right" data-ev="${e.id}">
            <span style="font-size:22px">${e.emoji}</span>
            <span><b>${esc(e.title)}</b><br><span class="muted">${esc(e.venue)} · ${fmtDate(e.date)}</span></span>
            <span class="st ${e.soldOut ? "todo" : ""}">${e.soldOut ? "SOLD OUT 🔥" : ""}</span>
          </button>`).join("")}
      </div>`;
    $("#sell-search").addEventListener("input", (e) => {
      const q = e.target.value.trim();
      view().querySelectorAll("[data-ev]").forEach((b) => {
        b.style.display = !q || b.textContent.includes(q) ? "" : "none";
      });
    });
    view().querySelectorAll("[data-ev]").forEach((b) => b.addEventListener("click", () => {
      sell.eventId = b.dataset.ev; sell.step = 2; renderSell();
    }));
    return;
  }

  if (sell.step === 2) {
    view().innerHTML = `
      <a class="back-link" href="#/sell" onclick="sell.step=1">‹ החלפת אירוע</a>
      <h1 style="font-size:22px;font-weight:900">${esc(ev.title)}</h1>
      <p class="muted mt8">שלב 2 · העלאת הכרטיס</p>
      ${stepsHead}
      <div class="upload-zone" id="upzone">
        <span class="big">📄</span>
        גררו לכאן PDF / pkpass,<br>או העבירו אלינו את מייל הכרטיס
        <div class="tiny mt8">הקובץ נכנס לכספת מוצפנת. אף אחד — כולל אתם — לא רואה אותו עד המכירה.</div>
      </div>
      <div id="ocr-out"></div>`;
    const zone = $("#upzone");
    ["dragover", "dragleave", "drop", "click"].forEach((evt) => zone.addEventListener(evt, (e) => {
      e.preventDefault();
      if (evt === "dragover") zone.classList.add("drag");
      if (evt === "dragleave") zone.classList.remove("drag");
      if (evt === "drop" || evt === "click") { zone.classList.remove("drag"); simulateOcr(ev); }
    }));
    return;
  }

  if (sell.step === 3) {
    const face = ev.faceMin;
    if (sell.price == null) sell.price = face;
    view().innerHTML = `
      <h1 style="font-size:22px;font-weight:900">קביעת מחיר</h1>
      <p class="muted mt8">שלב 3 · עד המחיר הנקוב, לא שקל יותר</p>
      ${stepsHead}
      <div class="price-cap">
        <div class="cap-line">
          <span class="chosen" id="price-out">${nis(sell.price)}</span>
          <span class="maxnote">תקרה: ${nis(face)} (נקוב)</span>
        </div>
        <input type="range" id="price-range" min="${Math.max(20, Math.round(face * 0.3))}" max="${face}" step="5" value="${sell.price}" />
        <div class="tiny mt8">האפליקציה חוסמת מחיר מעל הנקוב — ככה המכירה חוקית לחלוטין. מחיר נמוך מהנקוב = מכירה מהירה יותר.</div>
      </div>
      <div class="law-note">💡 טיפ: כרטיסים במחיר הנקוב לאירועי SOLD OUT נמכרים בדרך כלל תוך פחות מ-24 שעות.</div>
      <button class="btn btn-gold" id="to-step4">המשך</button>`;
    $("#price-range").addEventListener("input", (e) => {
      sell.price = Number(e.target.value);
      $("#price-out").textContent = nis(sell.price);
    });
    $("#to-step4").addEventListener("click", () => { sell.step = 4; renderSell(); });
    return;
  }

  // step 4 — review + KYC
  const f = fee(sell.price);
  view().innerHTML = `
    <h1 style="font-size:22px;font-weight:900">רגע לפני פרסום</h1>
    <p class="muted mt8">שלב 4 · אימות מוכר ופרסום</p>
    ${stepsHead}
    <div class="summary-card">
      <div class="sumrow"><span class="lbl">אירוע</span><span>${esc(ev.title)}</span></div>
      <div class="sumrow"><span class="lbl">מחיר שקבעת</span><span>${nis(sell.price)}</span></div>
      <div class="sumrow"><span class="lbl">הקונה ישלם (כולל דמי שירות)</span><span>${nis(sell.price + f)}</span></div>
      <div class="sumrow total"><span>יגיע אליך אחרי האירוע</span><span class="val">${nis(sell.price)}</span></div>
    </div>
    <div class="section-title"><h2>אימות מוכר (KYC)</h2></div>
    <div class="kyc-list">
      <div class="kyc-item">📱 <span>טלפון ישראלי מאומת</span><span class="st ok">✓ הושלם</span></div>
      <div class="kyc-item">🪪 <span>תעודת זהות</span><span class="st ok">✓ הושלם</span></div>
      <div class="kyc-item">🏦 <span>חשבון בנק על שמך לקבלת התשלום</span><span class="st ok">✓ הושלם</span></div>
    </div>
    <button class="btn btn-gold" id="btn-publish">פרסום המודעה 🚀</button>
    <p class="tiny mt8" style="text-align:center">קובץ הכרטיס נעול בכספת. ברגע המכירה — הגישה שלך אליו נחסמת לצמיתות.</p>`;
  $("#btn-publish").addEventListener("click", () => {
    toast("המודעה באוויר! 🎉", `${ev.waitlist ? ev.waitlist + " ממתינים ברשימה — " : ""}נודיע לך ב-WhatsApp ברגע שנמכר.`, "🚀");
    sell = { step: 1, eventId: null, price: null };
    location.hash = "#/wallet";
  });
}

function simulateOcr(ev) {
  $("#ocr-out").innerHTML = `<div class="empty"><span class="big">🔍</span>מפענחים את הכרטיס…</div>`;
  setTimeout(() => {
    $("#ocr-out").innerHTML = `
      <div class="ocr-result mt16">
        <div class="ocr-row"><span class="k">אירוע זוהה</span><span class="v" style="direction:rtl;font-family:inherit">${esc(ev.title)} ✓</span></div>
        <div class="ocr-row"><span class="k">מושב</span><span class="v" style="direction:rtl;font-family:inherit">גוש 4 · שורה 11 · מושב 7</span></div>
        <div class="ocr-row"><span class="k">מחיר נקוב</span><span class="v">${nis(ev.faceMin)}</span></div>
        <div class="ocr-row"><span class="k">טביעת ברקוד (hash)</span><span class="v">a91f…c47e</span></div>
        <div class="ocr-row"><span class="k">בדיקת כפילות</span><span class="v" style="color:var(--teal);direction:rtl;font-family:inherit">לא פורסם בעבר ✓</span></div>
      </div>
      <button class="btn btn-gold mt16" id="to-step3">הפרטים נכונים — המשך</button>`;
    $("#to-step3").addEventListener("click", () => { sell.step = 3; renderSell(); });
  }, 1200);
}

/* ----- Wallet ----- */
let walletTab = "bought";
function renderWallet() {
  const bought = MY_TICKETS.filter((t) => t.type === "bought");
  const sold = MY_TICKETS.filter((t) => t.type === "sold");
  view().innerHTML = `
    <h1 style="font-size:22px;font-weight:900">הארנק שלי</h1>
    <div class="tabs mt16">
      <button class="tab ${walletTab === "bought" ? "active" : ""}" data-tab="bought">קניתי (${bought.length})</button>
      <button class="tab ${walletTab === "sold" ? "active" : ""}" data-tab="sold">מכרתי (${sold.length})</button>
      <button class="tab ${walletTab === "alerts" ? "active" : ""}" data-tab="alerts">התראות (${MY_WAITLISTS.length})</button>
    </div>
    <div id="wallet-body"></div>`;
  view().querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => { walletTab = t.dataset.tab; renderWallet(); }));

  const body = $("#wallet-body");
  if (walletTab === "bought") {
    body.innerHTML = bought.map((t) => {
      const ev = EVENTS.find((e) => e.id === t.eventId);
      return `
      <div class="wallet-ticket">
        <div class="wt-head">
          <div><h3>${ev.emoji} ${esc(ev.title)}</h3><div class="meta">${esc(ev.venue)} · ${fmtDate(ev.date)}<br>${esc(t.seat)}</div></div>
          ${badgeHtml(t.level)}
        </div>
        <div class="wt-body">
          <div class="qr-zone"><span class="qr-locked">🔐</span>הברקוד ייחשף ביום האירוע</div>
          <div class="statusline"><span class="dot-wait"></span>${esc(t.statusText)}</div>
          <div style="display:flex;gap:10px;margin-top:14px">
            <button class="btn btn-ghost btn-sm" style="flex:1" onclick="toast('הועבר ל-Wallet','הכרטיס נוסף ל-Apple Wallet.','📲')">הוספה ל-Wallet</button>
            <button class="btn btn-danger btn-sm" style="flex:1" data-dispute="${t.id}">סורבתי בכניסה</button>
          </div>
        </div>
      </div>`;
    }).join("") || emptyState("🛍️", "עוד לא קנית כרטיסים", "כשתקנו — הם יחכו כאן, עם הברקוד נעול עד יום האירוע.");
    body.querySelectorAll("[data-dispute]").forEach((b) => b.addEventListener("click", () => openDispute(b.dataset.dispute)));
  }

  if (walletTab === "sold") {
    body.innerHTML = sold.map((t) => {
      const ev = EVENTS.find((e) => e.id === t.eventId);
      return `
      <div class="wallet-ticket">
        <div class="wt-head">
          <div><h3>${ev.emoji} ${esc(ev.title)}</h3><div class="meta">${esc(t.seat)} · נמכר ל${esc(t.buyer)}</div></div>
          <span class="pill gold">${nis(t.price)}</span>
        </div>
        <div class="wt-body">
          <div class="escrow-steps">
            <div class="estep done"><div class="dot">✓</div><div class="txt"><b>נמכר והועבר לקונה</b><span>הגישה שלך לקובץ נחסמה.</span></div></div>
            <div class="estep done"><div class="dot">🔒</div><div class="txt"><b>${nis(t.price)} בנאמנות</b><span>מוחזק אצל ספק הסליקה.</span></div></div>
            <div class="estep"><div class="dot">🏦</div><div class="txt"><b>העברה לחשבונך</b><span>יומיים אחרי האירוע, אם אין מחלוקת.</span></div></div>
          </div>
        </div>
      </div>`;
    }).join("") || emptyState("💸", "אין מכירות עדיין", "כרטיס שלא תנצלו? תוך 3 צעדים הוא באוויר.");
  }

  if (walletTab === "alerts") {
    body.innerHTML = MY_WAITLISTS.map((w) => {
      const ev = EVENTS.find((e) => e.id === w.eventId);
      return `
      <div class="wallet-ticket">
        <div class="wt-head">
          <div><h3>${ev.emoji} ${esc(ev.title)}</h3><div class="meta">ברשימת ההמתנה מ-${new Date(w.joined).toLocaleDateString("he-IL")} · מקום ${w.position} בתור</div></div>
        </div>
        <div class="wt-body">
          <div class="statusline"><span class="dot-live"></span>נודיע ברגע שעולה כרטיס — ויהיה לך חלון של 10 דקות</div>
          <button class="btn btn-violet btn-sm mt16" id="btn-simulate-match">👀 הדגמה: מה קורה כשנמצא כרטיס</button>
        </div>
      </div>`;
    }).join("") || emptyState("📣", "אין התראות פעילות", "הצטרפו לרשימת המתנה מכל עמוד אירוע שאזל.");
    const sim = $("#btn-simulate-match");
    if (sim) sim.addEventListener("click", simulateMatch);
  }
}

function emptyState(emoji, title, sub) {
  return `<div class="empty"><span class="big">${emoji}</span><b>${title}</b><br><span class="tiny">${sub}</span></div>`;
}

function simulateMatch() {
  const ev = EVENTS.find((e) => e.id === "noa-kirel");
  let secs = 600;
  modal(`
    <h2>🎯 נמצא כרטיס בשבילך!</h2>
    <p class="sub">${esc(ev.title)} · פארטר עמידה · ${nis(280)} (מחיר נקוב)</p>
    <div class="countdown" id="cd">10:00</div>
    <p class="tiny" style="text-align:center;margin-top:6px">הכרטיס שמור לך ל-10 דקות בלבד — אחר כך הוא עובר לבא בתור</p>
    <button class="btn btn-gold mt16" onclick="closeModal();location.hash='#/checkout/l5'">לקנייה מיידית</button>
    <button class="btn btn-ghost mt8" onclick="closeModal()">ויתור — להעביר לבא בתור</button>
  `);
  const iv = setInterval(() => {
    const el = document.getElementById("cd");
    if (!el) return clearInterval(iv);
    secs--;
    el.textContent = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
  }, 1000);
}

function openDispute(ticketId) {
  const t = MY_TICKETS.find((x) => x.id === ticketId);
  const ev = EVENTS.find((e) => e.id === t.eventId);
  modal(`
    <h2>🚨 סורבת בכניסה?</h2>
    <p class="sub">${esc(ev.title)} · הדיווח נחתם אוטומטית במיקום ובזמן — זו הראיה שלך.</p>
    <div class="kyc-list">
      <div class="kyc-item">📍 <span>מיקום: ${esc(ev.venue)}</span><span class="st ok">✓ אומת</span></div>
      <div class="kyc-item">🕘 <span>זמן: עכשיו, בזמן האירוע</span><span class="st ok">✓ אומת</span></div>
      <div class="kyc-item">💰 <span>${nis(t.paid)} + ${nis(t.fee)} דמי שירות בנאמנות</span><span class="st ok">מוכן להחזר</span></div>
    </div>
    <div class="honesty">הכסף שלך מעולם לא הגיע למוכר. אם הדיווח מאושר — החזר מלא כולל דמי השירות, והמוכר נחסם ומדווח.</div>
    <button class="btn btn-danger mt16" id="btn-file-dispute">הגשת דיווח והחזר כספי</button>
  `);
  $("#btn-file-dispute").addEventListener("click", () => {
    closeModal();
    toast("הדיווח התקבל", "צוות התוגדאו בודק עכשיו. החזר צפוי תוך דקות. מצטערים על הערב — אנחנו על זה.", "🚨");
  });
}

/* ----- Profile ----- */
function renderProfile() {
  view().innerHTML = `
    <div class="profile-head">
      <div class="profile-avatar">י</div>
      <h1 style="font-size:21px;font-weight:900">יעל ישראלי</h1>
      <div class="muted mt8">חבר/ה מאז יולי 2026</div>
      <div class="trust-score">★ 4.9 · מוכר/ת מאומת/ת</div>
    </div>
    <div class="statgrid">
      <div class="stat"><div class="n">12</div><div class="l">כרטיסים שנמכרו</div></div>
      <div class="stat"><div class="n">8</div><div class="l">כרטיסים שנקנו</div></div>
      <div class="stat"><div class="n">0</div><div class="l">מחלוקות</div></div>
    </div>
    <div class="section-title"><h2>רמת אימות</h2></div>
    <div class="kyc-list">
      <div class="kyc-item">📱 <span>טלפון ישראלי</span><span class="st ok">✓ מאומת</span></div>
      <div class="kyc-item">🪪 <span>תעודת זהות</span><span class="st ok">✓ מאומת</span></div>
      <div class="kyc-item">🏦 <span>חשבון בנק תואם ת"ז</span><span class="st ok">✓ מאומת</span></div>
    </div>
    <div class="section-title"><h2>התראות</h2></div>
    <div class="kyc-list">
      <div class="kyc-item">💬 <span>עדכוני מכירה ב-WhatsApp</span><span class="st ok">פעיל</span></div>
      <div class="kyc-item">🔔 <span>התראות רשימת המתנה</span><span class="st ok">פעיל</span></div>
      <div class="kyc-item">📉 <span>ירידות מחיר לאירועים שמורים</span><span class="st todo">כבוי</span></div>
    </div>
    <p class="tiny mt24" style="text-align:center">תוגדאו · מכירה במחיר הנקוב בלבד, בהתאם לסעיף 194א לחוק העונשין.<br>הכספים מוחזקים בנאמנות אצל ספק סליקה מורשה.</p>
  `;
}

/* ----- "How it works" modal ----- */
function openHow() {
  modal(`
    <h2>איך תוגדאו עובד?</h2>
    <p class="sub">מוכרים ביטחון, בשוק שבו האלטרנטיבה היא קבוצות פייסבוק.</p>
    <div class="howit">
      <div class="row"><div class="n">1</div><div><b>המוכר מעלה כרטיס</b><span>PDF נכנס לכספת מוצפנת. המחיר נעול עד לנקוב — ספסרות חסומה טכנית.</span></div></div>
      <div class="row"><div class="n">2</div><div><b>הקונה משלם — הכסף בנאמנות</b><span>הכסף לא מגיע למוכר. הוא מוחזק עד יומיים אחרי האירוע.</span></div></div>
      <div class="row"><div class="n">3</div><div><b>נכנסים למופע — ואז המוכר מקבל תשלום</b><span>סורבתם בשער? כפתור אחד באפליקציה — החזר מלא, כולל דמי השירות.</span></div></div>
    </div>
    <div class="honesty">
      <b>בכנות:</b> אף אפליקציה בעולם לא יכולה "לצלם רנטגן" לברקוד. מה שאנחנו כן יכולים: לוודא שהעוקץ לא משתלם. ובכרטיסים עם תג <b style="color:var(--teal)">מאומת ✔</b> — הברקוד הישן מבוטל וחדש מונפק על שמכם. שם, עוקץ הוא בלתי אפשרי פיזית.
    </div>
    <button class="btn btn-gold mt16" onclick="closeModal()">הבנתי, סגור</button>
  `);
}

/* ---------------- Router ---------------- */

const routes = [
  { re: /^#?\/?$/, fn: renderHome, nav: "home" },
  { re: /^#\/search$/, fn: renderSearch, nav: "search" },
  { re: /^#\/event\/(.+)$/, fn: (m) => renderEvent(m[1]), nav: "home" },
  { re: /^#\/checkout\/(.+)$/, fn: (m) => renderCheckout(m[1]), nav: "home" },
  { re: /^#\/sell$/, fn: renderSell, nav: "sell" },
  { re: /^#\/wallet$/, fn: renderWallet, nav: "wallet" },
  { re: /^#\/profile$/, fn: renderProfile, nav: "profile" },
];

function route() {
  const h = location.hash || "#/";
  for (const r of routes) {
    const m = h.match(r.re);
    if (m) {
      document.querySelectorAll(".nav-item").forEach((n) => n.classList.toggle("active", n.dataset.nav === r.nav));
      r.fn(m);
      window.scrollTo({ top: 0 });
      return;
    }
  }
  renderHome();
}

window.addEventListener("hashchange", route);
document.getElementById("btn-how").addEventListener("click", openHow);

initSupabase().finally(route);

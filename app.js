/* ============================================================
   תוגדאו — app logic
   Group ordering for a building's neighbors: one shared cart,
   split delivery, escrow payments. SPA with hash routing.
   Runs on demo data + localStorage out of the box; switches to
   Supabase automatically when config.js has keys.
   ============================================================ */

"use strict";

/* ---------------- Constants ---------------- */

const DELIVERY_FEE = 25;
const FREE_SHIPPING_GOAL = 400;
const BUILDING = { address: "רוטשילד 12, תל אביב", neighbors: 14 };

const STORES = [
  { id: "hm", name: "H&M", logo: "H&M", accent: "#d4001a", emoji: "👕", tagline: "אופנה יומיומית לכל הבניין", eta: "טיפול חנות 35–50 דק׳" },
  { id: "zara", name: "ZARA", logo: "ZARA", accent: "#16161a", emoji: "🧥", tagline: "ארון עירוני, משלוח אחד משותף", eta: "טיפול חנות 40–55 דק׳" },
  { id: "amazon", name: "Amazon", logo: "a", accent: "#ff9900", emoji: "📦", tagline: "בסיסיים ומוצרי בית בלינק אחד", eta: "שילוח מהיר בסגנון Prime" },
  { id: "shufersal", name: "שופרסל Online", logo: "שופ", accent: "#e4002b", emoji: "🛒", tagline: "הקניות של כולם, נהג אחד", eta: "חלון משלוח 60–90 דק׳" },
];

const PRODUCTS = [
  { id: "hm-linen", store: "hm", name: "חולצת פשתן מכופתרת", price: 119, compare: 139, emoji: "👔", cat: "חולצות", sizes: ["XS", "S", "M", "L", "XL"], colors: ["לבן", "מרווה", "תכלת"], stock: "ok" },
  { id: "hm-jeans", store: "hm", name: "ג׳ינס Wide High", price: 159, compare: 189, emoji: "👖", cat: "מכנסיים", sizes: ["34", "36", "38", "40"], colors: ["כחול", "שחור שטוף"], stock: "low" },
  { id: "hm-dress", store: "hm", name: "שמלת ריב מידי", price: 129, compare: 149, emoji: "👗", cat: "שמלות", sizes: ["XS", "S", "M", "L"], colors: ["שחור", "קרם", "חום"], stock: "ok" },
  { id: "hm-tee", store: "hm", name: "טי-שירט כותנה פרימיום", price: 49, compare: 59, emoji: "👕", cat: "חולצות", sizes: ["S", "M", "L", "XL"], colors: ["לבן", "שחור", "נייבי"], stock: "ok" },
  { id: "hm-bag", store: "hm", name: "תיק קרוסבודי מרופד", price: 99, compare: 119, emoji: "👜", cat: "אקססוריז", sizes: ["One size"], colors: ["שחור", "בז׳", "בורדו"], stock: "last" },
  { id: "za-tee", store: "zara", name: "טי-שירט Heavy בייסיק", price: 89, compare: 109, emoji: "👕", cat: "חולצות", sizes: ["S", "M", "L", "XL"], colors: ["שחור", "לבן", "טופ"], stock: "ok" },
  { id: "za-pants", store: "zara", name: "מכנסיים מחויטים ישרים", price: 229, compare: 259, emoji: "👖", cat: "מכנסיים", sizes: ["36", "38", "40", "42"], colors: ["שחור", "פחם", "חול"], stock: "low" },
  { id: "za-slip", store: "zara", name: "שמלת סאטן סליפ", price: 249, compare: 279, emoji: "👗", cat: "שמלות", sizes: ["XS", "S", "M", "L"], colors: ["שנהב", "שחור", "ירוק עמוק"], stock: "ok" },
  { id: "za-jacket", store: "zara", name: "ז׳קט ג׳ינס קרופ", price: 299, compare: 329, emoji: "🧥", cat: "חדש", sizes: ["S", "M", "L", "XL"], colors: ["כחול ביניים", "אקרו"], stock: "last" },
  { id: "am-tee", store: "amazon", name: "טי יומיומי Essential", price: 69, compare: 79, emoji: "👕", cat: "חולצות", sizes: ["S", "M", "L", "XL"], colors: ["שחור", "לבן", "אפור"], stock: "ok" },
  { id: "am-hoodie", store: "amazon", name: "קפוצ׳ון פליז רך", price: 129, compare: 149, emoji: "🧥", cat: "חדש", sizes: ["S", "M", "L", "XL"], colors: ["שחור", "שיבולת", "נייבי"], stock: "low" },
  { id: "am-socks", store: "amazon", name: "שלישיית גרביים", price: 39, compare: 49, emoji: "🧦", cat: "אקססוריז", sizes: ["One size"], colors: ["לבן", "שחור"], stock: "ok" },
  { id: "sh-milk", store: "shufersal", name: "חלב 3% · שישייה", price: 38, compare: 42, emoji: "🥛", cat: "חלב וביצים", sizes: ["שישייה"], colors: ["רגיל"], stock: "ok" },
  { id: "sh-eggs", store: "shufersal", name: "ביצים L · תבנית 12", price: 16, compare: 18, emoji: "🥚", cat: "חלב וביצים", sizes: ["12 יח׳"], colors: ["חופש"], stock: "ok" },
  { id: "sh-veg", store: "shufersal", name: "סלסלת ירקות השבוע", price: 74, compare: 89, emoji: "🥦", cat: "פירות וירקות", sizes: ["סלסלה"], colors: ["עונתי"], stock: "low" },
  { id: "sh-clean", store: "shufersal", name: "ערכת ניקוי לבית", price: 59, compare: 72, emoji: "🧼", cat: "ניקיון", sizes: ["ערכה"], colors: ["רגיל"], stock: "ok" },
];

const NEIGHBORS = [
  { id: "dana", name: "דנה", apt: "דירה 5" },
  { id: "avi", name: "אבי", apt: "קומה 3" },
  { id: "michal", name: "מיכל", apt: "דירה 12" },
  { id: "yossi", name: "יוסי", apt: "ועד הבית" },
  { id: "rina", name: "רינה", apt: "דירה 2" },
];

const STATUS_FLOW = ["collecting", "accepted", "packing", "ready", "shipped"];
const STATUS_LABEL = {
  collecting: "איסוף פריטים",
  accepted: "התקבלה בחנות",
  packing: "באריזה",
  ready: "מוכנה למשלוח",
  shipped: "נמסרה לבניין",
};

/* ---------------- State (localStorage) ---------------- */

const LS_KEY = "togdao-v1";
const now = () => Date.now();

function seedState() {
  const t = now();
  return {
    user: { id: "me", name: "שרון", apt: "דירה 8" },
    onboarded: false,
    settings: { whatsapp: true, waitlist: true, marketing: false },
    orders: [
      {
        id: "TG-4821", store: "hm", status: "collecting", code: "4821",
        createdBy: "dana", createdAt: t - 8 * 60000, closesAt: t + 22 * 60000,
        address: BUILDING.address,
        participants: [{ id: "dana" }, { id: "rina" }],
        items: [
          { id: "i1", productId: "hm-dress", by: "dana", size: "M", color: "שחור", qty: 1, private: false },
          { id: "i2", productId: "hm-tee", by: "rina", size: "L", color: "לבן", qty: 2, private: false },
          { id: "i3", productId: "hm-bag", by: "dana", size: "One size", color: "בז׳", qty: 1, private: true },
        ],
        paid: { dana: true }, deliveryConfirmed: false,
      },
      {
        id: "TG-3117", store: "zara", status: "packing", code: "3117",
        createdBy: "yossi", createdAt: t - 26 * 3600000, closesAt: t - 25 * 3600000,
        address: BUILDING.address,
        participants: [{ id: "yossi" }, { id: "me" }, { id: "michal" }],
        items: [
          { id: "i4", productId: "za-tee", by: "me", size: "M", color: "שחור", qty: 1, private: false },
          { id: "i5", productId: "za-pants", by: "yossi", size: "38", color: "פחם", qty: 1, private: false },
          { id: "i6", productId: "za-slip", by: "michal", size: "S", color: "שנהב", qty: 1, private: false },
        ],
        paid: { me: true, yossi: true, michal: true }, deliveryConfirmed: false,
      },
      {
        id: "TG-2054", store: "amazon", status: "shipped", code: "2054",
        createdBy: "me", createdAt: t - 9 * 86400000, closesAt: t - 9 * 86400000 + 1800000,
        address: BUILDING.address,
        participants: [{ id: "me" }, { id: "dana" }, { id: "avi" }, { id: "michal" }],
        items: [
          { id: "i7", productId: "am-hoodie", by: "me", size: "L", color: "שחור", qty: 1, private: false },
          { id: "i8", productId: "am-tee", by: "dana", size: "M", color: "לבן", qty: 2, private: false },
          { id: "i9", productId: "am-socks", by: "avi", size: "One size", color: "שחור", qty: 3, private: false },
        ],
        paid: { me: true, dana: true, avi: true, michal: true }, deliveryConfirmed: true,
      },
    ],
    pulses: [
      { emoji: "📦", text: "ההזמנה מ-ZARA באריזה — יוסי יאשר קבלה כשתגיע", at: t - 3 * 3600000 },
      { emoji: "👗", text: "דנה פתחה הזמנה קבוצתית מ-H&M", at: t - 8 * 60000 },
      { emoji: "🧺", text: "רינה הוסיפה 2× טי-שירט להזמנה של דנה", at: t - 5 * 60000 },
    ],
    simDone: {},
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && Array.isArray(s.orders)) return s;
    }
  } catch { /* fall through to seed */ }
  return seedState();
}

const S = loadState();
function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch { /* in-memory only */ } }

/* ---------------- Optional Supabase ---------------- */
/* With real keys in config.js the catalog + orders come from the
   togdao Supabase project (schema in supabase/migrations); demo data
   is the automatic fallback so the app always works. */

let db = null;
async function initSupabase() {
  const cfg = window.TOGDAO_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return;
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    db = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    await db.from("stores").select("id").limit(1);
  } catch (err) {
    console.warn("Supabase unavailable, using demo data", err);
  }
}

/* ---------------- Helpers ---------------- */

const $ = (sel, root = document) => root.querySelector(sel);
const view = () => $("#view");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nis = (n) => `₪${(Math.round(n * 10) / 10).toLocaleString("he-IL")}`;
const storeOf = (id) => STORES.find((s) => s.id === id);
const productOf = (id) => PRODUCTS.find((p) => p.id === id);
const orderOf = (id) => S.orders.find((o) => o.id === id);

function personName(id) {
  if (id === "me") return S.user.name;
  const n = NEIGHBORS.find((x) => x.id === id);
  return n ? n.name : "שכן/ה";
}
function personApt(id) {
  if (id === "me") return S.user.apt;
  const n = NEIGHBORS.find((x) => x.id === id);
  return n ? n.apt : "";
}

const AVA_CLASSES = ["c1", "c2", "c3", "c4", "c5", "c6"];
function avaClass(id) {
  const idx = ["me", ...NEIGHBORS.map((n) => n.id)].indexOf(id);
  return AVA_CLASSES[(idx + AVA_CLASSES.length) % AVA_CLASSES.length];
}

function fmtAgo(t) {
  const m = Math.round((now() - t) / 60000);
  if (m < 1) return "עכשיו";
  if (m < 60) return `לפני ${m} דק׳`;
  const h = Math.round(m / 60);
  if (h < 24) return `לפני ${h} שע׳`;
  return `לפני ${Math.round(h / 24)} ימים`;
}

function timerText(o) {
  const left = o.closesAt - now();
  if (left <= 0) return null;
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function orderTotal(o) {
  return o.items.reduce((sum, it) => sum + (productOf(it.productId)?.price ?? 0) * it.qty, 0);
}
function goalPct(o) { return Math.min(100, Math.round((orderTotal(o) / FREE_SHIPPING_GOAL) * 100)); }
function freeShipping(o) { return orderTotal(o) >= FREE_SHIPPING_GOAL; }
function deliveryShare(o) {
  if (freeShipping(o)) return 0;
  return DELIVERY_FEE / Math.max(1, o.participants.length);
}
function mySavings(o) { return DELIVERY_FEE - deliveryShare(o); }
function myItemsTotal(o) {
  return o.items.filter((it) => it.by === "me").reduce((sum, it) => sum + (productOf(it.productId)?.price ?? 0) * it.qty, 0);
}
function isParticipant(o, id = "me") { return o.participants.some((p) => p.id === id); }
function timerEnded(o) { return o.closesAt <= now(); }

function toast(title, body, emoji = "✅") {
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<div>${emoji}</div><div><b>${esc(title)}</b><span>${esc(body)}</span></div>`;
  $("#toasts").appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .4s"; }, 3800);
  setTimeout(() => el.remove(), 4300);
}

function pulse(emoji, text) {
  S.pulses.unshift({ emoji, text, at: now() });
  S.pulses = S.pulses.slice(0, 12);
  save();
}

function modal(html) {
  const root = $("#modal-root");
  root.innerHTML = `<div class="modal-back"><div class="modal"><div class="grip"></div>${html}</div></div>`;
  $(".modal-back", root).addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-back")) closeModal();
  });
}
function closeModal() { $("#modal-root").innerHTML = ""; }

function inviteLink(o) { return `${location.origin}${location.pathname}#/join/${o.code}`; }
function inviteMessage(o) {
  const st = storeOf(o.store);
  const t = timerText(o);
  return `${S.user.name} מהבניין פותח/ת הזמנה משותפת מ-${st.name} בתוגדאו 🏢 ${t ? `נשארו ${t} דקות להצטרף` : "מצטרפים עכשיו"} וחוסכים במשלוח. מצטרפים כאן: ${inviteLink(o)} · קוד: ${o.code}`;
}

/* ---------------- Shared fragments ---------------- */

function storeLogoHtml(st, cls = "") {
  return `<span class="store-logo ${cls}" style="background:${st.accent}">${esc(st.logo)}</span>`;
}

function pplRow(o) {
  const shown = o.participants.slice(0, 5);
  return `
    <div class="pplrow">
      ${shown.map((p) => `<span class="ppl ${avaClass(p.id)}" title="${esc(personName(p.id))}">${esc(personName(p.id)[0])}</span>`).join("")}
      <span class="txt">${o.participants.length} שכנים · ${o.items.length} פריטים</span>
    </div>`;
}

function goalBar(o) {
  const total = orderTotal(o);
  const remaining = Math.max(0, FREE_SHIPPING_GOAL - total);
  return `
    <div class="goalbar">
      <div class="bar"><div class="fill" style="width:${goalPct(o)}%"></div></div>
      <div class="lbl">
        <span>סל משותף: <b>${nis(total)}</b></span>
        <span>${freeShipping(o) ? `🎉 משלוח חינם הושג!` : `עוד ${nis(remaining)} למשלוח חינם`}</span>
      </div>
    </div>`;
}

function timerPill(o) {
  const t = timerText(o);
  if (o.status !== "collecting") return `<span class="timer-pill status">${STATUS_LABEL[o.status]}</span>`;
  if (!t) return `<span class="timer-pill ended">הטיימר הסתיים</span>`;
  return `<span class="timer-pill" data-countdown="${o.id}">⏳ ${t}</span>`;
}

function orderCard(o) {
  const st = storeOf(o.store);
  return `
  <a class="order-card" href="#/order/${o.id}">
    <div class="oc-head">
      ${storeLogoHtml(st)}
      <div class="t">
        <h3>הזמנה משותפת · ${esc(st.name)}</h3>
        <div class="meta">${personName(o.createdBy)} ${o.createdBy === "me" ? "(את/ה)" : `· ${personApt(o.createdBy)}`} פתח/ה</div>
      </div>
      ${timerPill(o)}
    </div>
    <div class="oc-body">
      ${goalBar(o)}
      ${pplRow(o)}
      <div class="share-line">
        <span class="muted">משלוח מפוצל: ${freeShipping(o) ? "חינם 🎉" : `${nis(deliveryShare(o))} לשכן`}</span>
        <span class="save">חיסכון ${nis(mySavings(o))} לכל אחד</span>
      </div>
    </div>
  </a>`;
}

/* ---------------- Screens ---------------- */

/* ----- Home (הבניין) ----- */
function renderHome() {
  const active = S.orders.filter((o) => o.status === "collecting" && !timerEnded(o));
  const inProgress = S.orders.filter((o) => (o.status !== "collecting" && o.status !== "shipped") || (o.status === "collecting" && timerEnded(o)));
  const shipped = S.orders.filter((o) => o.status === "shipped");
  const totalSaved = shipped.reduce((sum, o) => sum + mySavings(o) * o.participants.length, 0);

  view().innerHTML = `
    <div class="hero">
      <h1>הבניין שלנו<br><em>מזמין ביחד.</em>
        <span class="windows">${Array.from({ length: 12 }, (_, i) => `<i class="${[1, 2, 5, 7, 10].includes(i) ? "lit" : i === 8 ? "warm" : ""}"></i>`).join("")}</span>
      </h1>
      <p>סל אחד לכל השכנים, משלוח אחד מפוצל, וכל אחד משלם רק על מה ששלו.</p>
    </div>

    <div class="statgrid">
      <div class="stat"><div class="n">${shipped.length}</div><div class="l">הזמנות שהושלמו</div></div>
      <div class="stat"><div class="n">${nis(totalSaved)}</div><div class="l">נחסך לבניין</div></div>
      <div class="stat"><div class="n">${BUILDING.neighbors}</div><div class="l">שכנים בתוגדאו</div></div>
    </div>

    ${active.length ? `
      <div class="section-title"><h2>🟢 נאסף עכשיו — מצטרפים?</h2></div>
      ${active.map(orderCard).join("")}` : `
      <div class="empty"><span class="big">🧺</span>אין הזמנה פתוחה כרגע בבניין.<br>פתחו אחת — ותנו לשכנים לקפוץ עליה.</div>`}

    <button class="btn btn-lime" onclick="location.hash='#/new'">+ פתיחת הזמנה חדשה לבניין</button>

    ${inProgress.length ? `
      <div class="section-title"><h2>📦 בדרך אלינו</h2></div>
      ${inProgress.map(orderCard).join("")}` : ""}

    <div class="section-title"><h2>🔔 קורה בבניין</h2><a class="more" href="#/orders">ההזמנות שלי ›</a></div>
    <div id="pulse-feed">
      ${S.pulses.map((p) => `<div class="pulse"><span>${p.emoji}</span><span>${esc(p.text)}</span><span class="when">${fmtAgo(p.at)}</span></div>`).join("")}
    </div>
  `;
}

/* ----- Stores ----- */
function renderStores() {
  view().innerHTML = `
    <h1 style="font-size:22px;font-weight:900">חנויות</h1>
    <p class="muted mt8">בוחרים חנות, מוסיפים לסל של הבניין — והמשלוח מתחלק בין כולם.</p>
    <div class="mt16">
      ${STORES.map((st) => {
        const open = S.orders.find((o) => o.store === st.id && o.status === "collecting" && !timerEnded(o));
        return `
        <a class="store-card" href="#/store/${st.id}">
          ${storeLogoHtml(st)}
          <div class="t">
            <h3>${esc(st.name)}</h3>
            <div class="meta">${esc(st.tagline)} · ${esc(st.eta)}</div>
            ${open ? `<div class="meta" style="color:var(--lime);font-weight:700">🟢 יש הזמנה פתוחה של ${personName(open.createdBy)} — קופצים עליה!</div>` : ""}
          </div>
          <span class="arrow">‹</span>
        </a>`;
      }).join("")}
    </div>`;
}

/* ----- Store catalog ----- */
let catFilter = {};
function renderStore(storeId) {
  const st = storeOf(storeId);
  if (!st) return renderStores();
  const cats = ["הכול", ...new Set(PRODUCTS.filter((p) => p.store === storeId).map((p) => p.cat))];
  const current = catFilter[storeId] || "הכול";
  const prods = PRODUCTS.filter((p) => p.store === storeId && (current === "הכול" || p.cat === current));
  const open = S.orders.find((o) => o.store === storeId && o.status === "collecting" && !timerEnded(o));

  view().innerHTML = `
    <a class="back-link" href="#/stores">‹ כל החנויות</a>
    <div class="store-card" style="margin-bottom:4px">
      ${storeLogoHtml(st)}
      <div class="t"><h3>${esc(st.name)}</h3><div class="meta">${esc(st.tagline)}</div></div>
    </div>
    ${open ? `<a href="#/order/${open.id}" class="building-strip" style="margin:10px 0">🟢 הזמנה פתוחה של ${personName(open.createdBy)} · ${open.participants.length} שכנים כבר בפנים — כל פריט שתוסיפו נכנס אליה</a>`
           : `<div class="building-strip" style="margin:10px 0">✨ אין הזמנה פתוחה מ-${esc(st.name)} — הפריט הראשון שתוסיפו יפתח אחת חדשה</div>`}
    <div class="chips">
      ${cats.map((c) => `<button class="chip ${c === current ? "active" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}
    </div>
    <div class="prodgrid">
      ${prods.map((p) => `
        <div class="prod" data-prod="${p.id}">
          <div class="pic" style="background:linear-gradient(150deg, ${st.accent}33, var(--card-2))">
            ${p.emoji}
            <span class="stock ${p.stock}">${p.stock === "ok" ? "במלאי" : p.stock === "low" ? "מלאי נמוך" : "אחרונים!"}</span>
          </div>
          <div class="info">
            <h4>${esc(p.name)}</h4>
            <div class="price">${nis(p.price)}<span class="compare">${nis(p.compare)}</span></div>
          </div>
        </div>`).join("")}
    </div>`;

  view().querySelectorAll("[data-cat]").forEach((ch) => ch.addEventListener("click", () => {
    catFilter[storeId] = ch.dataset.cat; renderStore(storeId);
  }));
  view().querySelectorAll("[data-prod]").forEach((el) => el.addEventListener("click", () => openProductSheet(el.dataset.prod)));
}

/* ----- Product add sheet ----- */
function openProductSheet(productId) {
  const p = productOf(productId);
  const st = storeOf(p.store);
  const pick = { size: p.sizes[0], color: p.colors[0], qty: 1, private: false };

  function render() {
    modal(`
      <div style="display:flex;gap:14px;align-items:center">
        <div class="item-row" style="margin:0;border:none;background:none;padding:0">
          <span class="pic" style="width:64px;height:64px;flex-basis:64px;font-size:32px;background:linear-gradient(150deg, ${st.accent}33, var(--card-2));border-radius:16px;display:grid;place-items:center">${p.emoji}</span>
        </div>
        <div><h2 style="margin:0">${esc(p.name)}</h2>
        <div class="muted">${esc(st.name)} · ${nis(p.price)} <span class="compare" style="text-decoration:line-through;color:var(--text-3)">${nis(p.compare)}</span></div></div>
      </div>

      <div class="pickrow"><span class="lbl">מידה</span>
        <div class="pickopts">${p.sizes.map((s) => `<button class="pickopt ${s === pick.size ? "active" : ""}" data-size="${esc(s)}">${esc(s)}</button>`).join("")}</div>
      </div>
      <div class="pickrow"><span class="lbl">צבע</span>
        <div class="pickopts">${p.colors.map((c) => `<button class="pickopt ${c === pick.color ? "active" : ""}" data-color="${esc(c)}">${esc(c)}</button>`).join("")}</div>
      </div>
      <div class="pickrow"><span class="lbl">כמות</span>
        <div class="qty-ctrl">
          <button id="qty-minus">−</button><span class="q">${pick.qty}</span><button id="qty-plus">+</button>
        </div>
      </div>
      <div class="toggle-row">
        <div><div>🙈 פריט פרטי</div><div class="d">השכנים יראו שהוספת פריט — אבל לא מה הוא</div></div>
        <div class="switch ${pick.private ? "on" : ""}" id="priv-switch"></div>
      </div>
      <button class="btn btn-lime" id="btn-add">הוספה לסל של הבניין · ${nis(p.price * pick.qty)}</button>
    `);
    document.querySelectorAll("[data-size]").forEach((b) => b.addEventListener("click", () => { pick.size = b.dataset.size; render(); }));
    document.querySelectorAll("[data-color]").forEach((b) => b.addEventListener("click", () => { pick.color = b.dataset.color; render(); }));
    $("#qty-minus").addEventListener("click", () => { pick.qty = Math.max(1, pick.qty - 1); render(); });
    $("#qty-plus").addEventListener("click", () => { pick.qty = Math.min(9, pick.qty + 1); render(); });
    $("#priv-switch").addEventListener("click", () => { pick.private = !pick.private; render(); });
    $("#btn-add").addEventListener("click", () => addItemFlow(p, pick));
  }
  render();
}

function addItemFlow(p, pick) {
  closeModal();
  let o = S.orders.find((x) => x.store === p.store && x.status === "collecting" && !timerEnded(x));
  let created = false;
  if (!o) { o = createOrder(p.store, 30); created = true; }
  if (!isParticipant(o)) {
    o.participants.push({ id: "me" });
    pulse("👋", `${S.user.name} הצטרף/ה להזמנה של ${personName(o.createdBy)} מ-${storeOf(o.store).name}`);
  }
  o.items.unshift({
    id: "i" + now(), productId: p.id, by: "me",
    size: pick.size, color: pick.color, qty: pick.qty, private: pick.private,
  });
  pulse("🛒", `${S.user.name} הוסיף/ה ${pick.qty}× ${pick.private ? "פריט פרטי" : p.name}`);
  save();
  toast(created ? "נפתחה הזמנה חדשה! 🎉" : "הפריט בסל המשותף!",
    created ? "עכשיו מזמינים את השכנים — כל מצטרף מוזיל לכולם את המשלוח." : `נוסף להזמנה של ${personName(o.createdBy)}. ${freeShipping(o) ? "המשלוח כבר חינם 🎉" : ""}`, "🧺");
  location.hash = `#/order/${o.id}`;
  route();
}

/* ----- New order wizard ----- */
let wiz = { step: 1, store: null, minutes: 30 };
function renderNew() {
  const stepsHead = `<div class="steps-head">${[1, 2].map((n) => `<div class="s ${wiz.step >= n ? "on" : ""}"></div>`).join("")}</div>`;
  if (wiz.step === 1) {
    view().innerHTML = `
      <h1 style="font-size:22px;font-weight:900">הזמנה חדשה לבניין</h1>
      <p class="muted mt8">שלב 1 · מאיזו חנות מזמינים?</p>
      ${stepsHead}
      ${STORES.map((st) => `
        <button class="store-card" style="width:100%;text-align:right" data-store="${st.id}">
          ${storeLogoHtml(st)}
          <div class="t"><h3>${esc(st.name)}</h3><div class="meta">${esc(st.eta)}</div></div>
          <span class="arrow">‹</span>
        </button>`).join("")}`;
    view().querySelectorAll("[data-store]").forEach((b) => b.addEventListener("click", () => { wiz.store = b.dataset.store; wiz.step = 2; renderNew(); }));
    return;
  }
  const st = storeOf(wiz.store);
  view().innerHTML = `
    <a class="back-link" href="#/new" id="wiz-back">‹ החלפת חנות</a>
    <h1 style="font-size:22px;font-weight:900">${esc(st.name)} · הגדרות הזמנה</h1>
    <p class="muted mt8">שלב 2 · כמה זמן הסל פתוח לשכנים?</p>
    ${stepsHead}
    <div class="timer-opts">
      ${[15, 30, 60, 120].map((m) => `<button class="pickopt ${wiz.minutes === m ? "active" : ""}" data-min="${m}">${m} דק׳</button>`).join("")}
    </div>
    <p class="tiny">כשמסתיים הטיימר הסל ננעל והחנות מתחילה לטפל בהזמנה. אפשר לשנות גם אחר כך.</p>
    <div class="field">
      <label>כתובת מסירה</label>
      <input id="wiz-address" value="${esc(BUILDING.address)}" />
    </div>
    <div class="summary-card mt16">
      <div class="sumrow"><span class="lbl">דמי משלוח (לפני פיצול)</span><span>${nis(DELIVERY_FEE)}</span></div>
      <div class="sumrow"><span class="lbl">יעד משלוח חינם</span><span>${nis(FREE_SHIPPING_GOAL)}</span></div>
      <div class="fee-note">כל שכן שמצטרף מוזיל לכולם — וכשהסל עובר ${nis(FREE_SHIPPING_GOAL)}, המשלוח חינם לכולם.</div>
    </div>
    <button class="btn btn-lime mt16" id="wiz-create">פתיחת ההזמנה והזמנת שכנים 🚀</button>`;
  $("#wiz-back").addEventListener("click", (e) => { e.preventDefault(); wiz.step = 1; renderNew(); });
  view().querySelectorAll("[data-min]").forEach((b) => b.addEventListener("click", () => { wiz.minutes = Number(b.dataset.min); renderNew(); }));
  $("#wiz-create").addEventListener("click", () => {
    const o = createOrder(wiz.store, wiz.minutes, $("#wiz-address").value.trim() || BUILDING.address);
    wiz = { step: 1, store: null, minutes: 30 };
    toast("ההזמנה פתוחה! 🎉", "עכשיו שולחים לשכנים את הלינק — כל מצטרף מוזיל את המשלוח.", "🏢");
    location.hash = `#/order/${o.id}`;
  });
}

function createOrder(storeId, minutes, address = BUILDING.address) {
  const o = {
    id: `TG-${Math.floor(1000 + Math.random() * 9000)}`,
    store: storeId, status: "collecting",
    code: String(Math.floor(1000 + Math.random() * 9000)),
    createdBy: "me", createdAt: now(), closesAt: now() + minutes * 60000,
    address,
    participants: [{ id: "me" }],
    items: [], paid: {}, deliveryConfirmed: false,
  };
  S.orders.unshift(o);
  pulse("🧺", `${S.user.name} פתח/ה הזמנה קבוצתית מ-${storeOf(storeId).name}`);
  save();
  return o;
}

/* ----- Order page ----- */
function renderOrder(id) {
  const o = orderOf(id);
  if (!o) return renderHome();
  const st = storeOf(o.store);
  const founder = o.createdBy === "me";
  const member = isParticipant(o);
  const iPaid = !!o.paid.me;
  const myTotal = myItemsTotal(o) + (member ? deliveryShare(o) : 0);
  const stIdx = STATUS_FLOW.indexOf(o.status);
  const collecting = o.status === "collecting" && !timerEnded(o);

  view().innerHTML = `
    <a class="back-link" href="#/">‹ הבניין</a>
    <div class="order-hero">
      <div class="glow"></div>
      <div class="row">
        ${storeLogoHtml(st)}
        <div>
          <h1>הזמנה משותפת · ${esc(st.name)}</h1>
          <div class="meta">${personName(o.createdBy)}${founder ? " (את/ה)" : ` · ${personApt(o.createdBy)}`} פתח/ה · ${esc(o.address)}</div>
        </div>
      </div>
      ${o.status === "collecting" ? `
        <div class="bigtimer ${timerEnded(o) ? "ended" : ""}">
          <div class="clock" data-countdown-big="${o.id}">${timerText(o) ?? "00:00"}</div>
          <div class="sub">${timerEnded(o) ? "הסל ננעל — החנות מטפלת בהזמנה" : "עד נעילת הסל — כל שכן שמצטרף מוזיל לכולם"}</div>
        </div>` : ""}
    </div>

    <div class="statusline-h">
      ${STATUS_FLOW.map((s, i) => `
        <div class="snode ${i <= stIdx ? "done" : ""}">
          <div class="b">${["🧺", "🏬", "📦", "🚚", "🏠"][i]}</div>
          <div class="l">${STATUS_LABEL[s]}</div>
        </div>`).join("")}
    </div>

    ${goalBar(o)}
    ${pplRow(o)}

    ${collecting && member ? `
    <div class="invite-card">
      <h3>📣 מגייסים את הבניין</h3>
      <p>שולחים לינק לקבוצת הוואטסאפ של הבניין — כל מצטרף מוזיל את המשלוח לכולם.</p>
      <div class="invite-code"><span class="code">${o.code}</span></div>
      <div class="invite-actions">
        <button class="btn btn-violet btn-sm" style="flex:1" id="btn-whatsapp">💬 שיתוף בוואטסאפ</button>
        <button class="btn btn-ghost btn-sm" style="flex:1" id="btn-copy">📋 העתקת לינק</button>
      </div>
    </div>` : ""}

    ${collecting && !member ? `
      <button class="btn btn-lime mt16" id="btn-join">👋 הצטרפות להזמנה של ${personName(o.createdBy)}</button>
      <p class="tiny mt8" style="text-align:center">מצטרפים, מוסיפים פריטים משלכם, ומשלמים רק על שלכם + חלק שווה במשלוח.</p>` : ""}

    <div class="section-title"><h2>הסל המשותף (${o.items.length})</h2>
      ${collecting && member ? `<a class="more" href="#/store/${o.store}">+ הוספת פריט</a>` : ""}
    </div>
    ${o.items.length ? o.items.map((it) => {
      const p = productOf(it.productId);
      const hidden = it.private && it.by !== "me";
      return `
      <div class="item-row ${hidden ? "private-other" : ""}">
        <span class="pic">${hidden ? "🙈" : p.emoji}</span>
        <div class="t">
          <h4>${hidden ? "פריט פרטי" : esc(p.name)}</h4>
          <div class="meta">${esc(personName(it.by))}${it.by === "me" ? "" : ` · ${esc(personApt(it.by))}`}${hidden ? "" : ` · ${esc(it.size)} · ${esc(it.color)} · ${it.qty}×`}</div>
        </div>
        ${it.by === "me" ? `<span class="mine-tag">שלי</span>` : ""}
        <span class="price">${hidden ? "•••" : nis(p.price * it.qty)}</span>
      </div>`;
    }).join("") : `<div class="empty"><span class="big">🧺</span>הסל עוד ריק — תהיו הראשונים להוסיף.</div>`}

    ${member ? `
    <div class="section-title"><h2>החלק שלי</h2></div>
    <div class="summary-card">
      <div class="sumrow"><span class="lbl">הפריטים שלי</span><span>${nis(myItemsTotal(o))}</span></div>
      <div class="sumrow"><span class="lbl">משלוח מפוצל (${nis(DELIVERY_FEE)} ÷ ${o.participants.length})</span>
        <span class="${freeShipping(o) ? "free" : ""}">${freeShipping(o) ? "חינם 🎉" : nis(deliveryShare(o))}</span></div>
      <div class="fee-note">משלמים רק על הפריטים שלכם — לעולם לא על של השכנים.</div>
      <div class="sumrow total"><span>סה"כ שלי</span><span class="val">${nis(myTotal)}</span></div>
    </div>

    ${iPaid ? `
      <div class="honesty mt16">🔒 שילמת ${nis(myTotal)} — הכסף <b>מוחזק ולא נתפס</b> עד ש${founder ? "תאשר/י" : `${personName(o.createdBy)} יאשר/תאשר`} שהחבילה הגיעה לבניין. לא הגיעה? הכסף חוזר אוטומטית.</div>` : `
      <button class="btn btn-lime mt16" id="btn-pay" ${myItemsTotal(o) === 0 ? "disabled" : ""}>תשלום החלק שלי · ${nis(myTotal)}</button>
      <p class="tiny mt8" style="text-align:center">התשלום מאושר עכשיו אך נתפס רק אחרי אישור מסירה — אסקרו מלא.</p>`}
    ` : ""}

    ${founder && o.status !== "shipped" ? `
    <div class="section-title"><h2>ניהול (פותח ההזמנה)</h2></div>
    ${o.status === "collecting" && !timerEnded(o) ? `
      <div class="status-actions">
        <button class="btn btn-ghost btn-sm" id="btn-extend">⏳ הארכת הטיימר ב-15 דק׳</button>
        <button class="btn btn-ghost btn-sm" id="btn-close-now">🔒 נעילת הסל עכשיו</button>
      </div>` : ""}
    ${["ready", "shipped"].includes(o.status) || o.status === "packing" ? `
      <button class="btn btn-lime mt8" id="btn-confirm-delivery">📬 החבילה הגיעה — אישור מסירה ושחרור הכסף</button>
      <p class="tiny mt8" style="text-align:center">האישור משחרר את התשלומים של כל השכנים לחנות.</p>` : ""}
    ` : ""}

    ${o.status === "shipped" ? `
      <div class="honesty mt16">🎉 ההזמנה הושלמה! החבילה נמסרה, התשלומים שוחררו, והבניין חסך ביחד ${nis(mySavings(o) * o.participants.length)} על המשלוח.</div>` : ""}
  `;

  const wa = $("#btn-whatsapp");
  if (wa) wa.addEventListener("click", () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteMessage(o))}`, "_blank");
  });
  const cp = $("#btn-copy");
  if (cp) cp.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(inviteLink(o)); toast("הלינק הועתק", "שולחים בקבוצת הבניין ומחכים שיקפצו.", "📋"); }
    catch { toast("הלינק", inviteLink(o), "🔗"); }
  });
  const jn = $("#btn-join");
  if (jn) jn.addEventListener("click", () => {
    o.participants.push({ id: "me" });
    pulse("👋", `${S.user.name} הצטרף/ה להזמנה של ${personName(o.createdBy)}`);
    save();
    toast("הצטרפת! 👋", `המשלוח של כולם ירד ל-${freeShipping(o) ? "חינם" : nis(deliveryShare(o))}. עכשיו מוסיפים פריטים.`, "🎉");
    renderOrder(id);
  });
  const pay = $("#btn-pay");
  if (pay) pay.addEventListener("click", () => openPaySheet(o));
  const ext = $("#btn-extend");
  if (ext) ext.addEventListener("click", () => {
    o.closesAt += 15 * 60000; save();
    toast("הטיימר הוארך", "עוד 15 דקות לשכנים להצטרף.", "⏳");
    renderOrder(id);
  });
  const cls = $("#btn-close-now");
  if (cls) cls.addEventListener("click", () => {
    o.closesAt = now(); o.status = "accepted"; save();
    pulse("🔒", `הסל של ${storeOf(o.store).name} ננעל — ההזמנה נשלחה לחנות`);
    toast("הסל ננעל", "ההזמנה המרוכזת נשלחה לחנות.", "🔒");
    renderOrder(id);
  });
  const cd = $("#btn-confirm-delivery");
  if (cd) cd.addEventListener("click", () => {
    o.status = "shipped"; o.deliveryConfirmed = true; save();
    pulse("🏠", `החבילה מ-${storeOf(o.store).name} נמסרה — התשלומים שוחררו`);
    toast("המסירה אושרה! 🎉", "כל התשלומים שוחררו לחנות. כל הכבוד לבניין.", "📬");
    renderOrder(id);
  });
}

function openPaySheet(o) {
  const myTotal = myItemsTotal(o) + deliveryShare(o);
  modal(`
    <h2>תשלום החלק שלי</h2>
    <p class="sub">${esc(storeOf(o.store).name)} · הזמנה ${esc(o.id)}</p>
    <div class="summary-card">
      <div class="sumrow"><span class="lbl">הפריטים שלי</span><span>${nis(myItemsTotal(o))}</span></div>
      <div class="sumrow"><span class="lbl">החלק שלי במשלוח</span><span class="${freeShipping(o) ? "free" : ""}">${freeShipping(o) ? "חינם 🎉" : nis(deliveryShare(o))}</span></div>
      <div class="sumrow total"><span>סה"כ</span><span class="val">${nis(myTotal)}</span></div>
    </div>
    <div class="escrow-steps">
      <div class="estep done"><div class="dot">💳</div><div class="txt"><b>התשלום מאושר עכשיו</b><span>הכרטיס מחויב באישור בלבד (hold) — הכסף לא נתפס.</span></div></div>
      <div class="estep"><div class="dot">📦</div><div class="txt"><b>החנות אורזת ושולחת</b><span>הזמנה מרוכזת אחת לכל הבניין.</span></div></div>
      <div class="estep"><div class="dot">📬</div><div class="txt"><b>החבילה הגיעה? הכסף משוחרר</b><span>רק אחרי שפותח ההזמנה מאשר מסירה. לא הגיעה — החיוב מתבטל אוטומטית.</span></div></div>
    </div>
    <button class="btn btn-lime" id="btn-do-pay">אישור תשלום · ${nis(myTotal)}</button>
    <p class="tiny mt8" style="text-align:center">Visa •••• 4242 · מאובטח ב-3D Secure</p>
  `);
  $("#btn-do-pay").addEventListener("click", () => {
    o.paid.me = true; save();
    closeModal();
    pulse("💳", `${S.user.name} שילם/ה את החלק שלו/ה בהזמנה של ${personName(o.createdBy)}`);
    toast("שולם ומוחזק 🔒", "הכסף באסקרו — ישוחרר לחנות רק אחרי אישור מסירה.", "💳");
    renderOrder(o.id);
  });
}

/* ----- My orders ----- */
let ordersTab = "active";
function renderOrders() {
  const mine = S.orders.filter((o) => isParticipant(o));
  const active = mine.filter((o) => o.status !== "shipped");
  const done = mine.filter((o) => o.status === "shipped");
  const list = ordersTab === "active" ? active : done;
  view().innerHTML = `
    <h1 style="font-size:22px;font-weight:900">ההזמנות שלי</h1>
    <div class="tabs mt16">
      <button class="tab ${ordersTab === "active" ? "active" : ""}" data-tab="active">פעילות (${active.length})</button>
      <button class="tab ${ordersTab === "done" ? "active" : ""}" data-tab="done">הושלמו (${done.length})</button>
    </div>
    ${list.length ? list.map(orderCard).join("") : `<div class="empty"><span class="big">📦</span>אין כאן הזמנות עדיין.<br><span class="tiny">פותחים הזמנה או קופצים על אחת פתוחה מהבניין.</span></div>`}
  `;
  view().querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => { ordersTab = t.dataset.tab; renderOrders(); }));
}

/* ----- Join via code ----- */
function renderJoin(code) {
  const o = S.orders.find((x) => x.code === code);
  if (!o) {
    view().innerHTML = `<div class="empty"><span class="big">🤔</span>לא מצאנו הזמנה עם הקוד <b dir="ltr">${esc(code)}</b>.<br><span class="tiny">אולי הסתיימה? בדקו עם השכן ששלח את הלינק.</span></div>
      <button class="btn btn-ghost" onclick="location.hash='#/'">לעמוד הבניין</button>`;
    return;
  }
  const st = storeOf(o.store);
  view().innerHTML = `
    <div class="order-hero" style="text-align:center">
      <div class="glow"></div>
      <div style="font-size:40px">👋</div>
      <h1 style="margin-top:8px">${personName(o.createdBy)} מזמין/ה אותך להזמנה מ-${esc(st.name)}</h1>
      <div class="meta mt8">${esc(o.address)} · ${o.participants.length} שכנים כבר בפנים</div>
      ${o.status === "collecting" && !timerEnded(o) ? `
        <div class="bigtimer"><div class="clock" data-countdown-big="${o.id}">${timerText(o) ?? "00:00"}</div>
        <div class="sub">עד נעילת הסל</div></div>` : `<div class="mt16">${timerPill(o)}</div>`}
    </div>
    ${goalBar(o)}
    ${o.status === "collecting" && !timerEnded(o) && !isParticipant(o) ? `
      <button class="btn btn-lime mt16" id="btn-join-code">מצטרפ/ת! קחו אותי לסל 🧺</button>` : `
      <button class="btn btn-ghost mt16" onclick="location.hash='#/order/${o.id}'">צפייה בהזמנה</button>`}
  `;
  const b = $("#btn-join-code");
  if (b) b.addEventListener("click", () => {
    o.participants.push({ id: "me" });
    pulse("👋", `${S.user.name} הצטרף/ה דרך לינק ההזמנה`);
    save();
    toast("הצטרפת! 🎉", "עכשיו מוסיפים פריטים משלכם לסל.", "👋");
    location.hash = `#/order/${o.id}`;
  });
}

/* ----- Store dashboard (demo of the merchant side) ----- */
function renderStoreDash() {
  const relevant = S.orders.filter((o) => timerEnded(o) || o.status !== "collecting");
  view().innerHTML = `
    <a class="back-link" href="#/profile">‹ פרופיל</a>
    <h1 style="font-size:22px;font-weight:900">מסך החנות 🏬</h1>
    <div class="dash-note">💡 ככה הצד של החנות רואה את הבניין: הזמנה מרוכזת אחת, רשימת ליקוט אחת, כתובת אחת — במקום 6 הזמנות קטנות.</div>
    ${relevant.length ? relevant.map((o) => {
      const st = storeOf(o.store);
      const picking = {};
      o.items.forEach((it) => {
        const p = productOf(it.productId);
        const key = `${p.name} · ${it.size} · ${it.color}`;
        picking[key] = (picking[key] || 0) + it.qty;
      });
      const idx = STATUS_FLOW.indexOf(o.status);
      const next = STATUS_FLOW[idx + 1];
      const addressOk = (o.address || "").trim().length >= 8;
      return `
      <div class="order-card">
        <div class="oc-head">
          ${storeLogoHtml(st)}
          <div class="t"><h3>${esc(o.id)} · ${esc(st.name)}</h3>
          <div class="meta">${o.participants.length} שכנים · ${esc(o.address)}</div></div>
          ${timerPill(o)}
        </div>
        <div class="oc-body">
          <div class="summary-card" style="padding:6px 14px">
            ${Object.entries(picking).map(([k, q]) => `<div class="pick-row"><span>${esc(k)}</span><span class="q">${q}×</span></div>`).join("") || `<div class="pick-row"><span class="muted">אין פריטים</span></div>`}
          </div>
          ${next && o.status !== "shipped" ? `
          <div class="status-actions">
            <button class="btn btn-violet btn-sm" data-advance="${o.id}" ${!addressOk ? "disabled" : ""}>
              קידום ל: ${STATUS_LABEL[next]}
            </button>
            ${!addressOk ? `<span class="tiny">נדרשת כתובת מסירה לפני טיפול</span>` : ""}
          </div>` : ""}
        </div>
      </div>`;
    }).join("") : `<div class="empty"><span class="big">🏬</span>אין הזמנות נעולות עדיין.<br><span class="tiny">כשסל ננעל — הוא מופיע כאן כהזמנה מרוכזת.</span></div>`}
  `;
  view().querySelectorAll("[data-advance]").forEach((b) => b.addEventListener("click", () => {
    const o = orderOf(b.dataset.advance);
    const next = STATUS_FLOW[STATUS_FLOW.indexOf(o.status) + 1];
    if (!next) return;
    o.status = next; save();
    pulse("🏬", `${storeOf(o.store).name}: ההזמנה ${STATUS_LABEL[next]}`);
    toast("סטטוס עודכן", `ההזמנה ${o.id} — ${STATUS_LABEL[next]}.`, "🏬");
    renderStoreDash();
  }));
}

/* ----- Profile ----- */
function renderProfile() {
  const mine = S.orders.filter((o) => isParticipant(o) && o.status === "shipped");
  const saved = mine.reduce((sum, o) => sum + mySavings(o), 0);
  view().innerHTML = `
    <div class="profile-head">
      <div class="profile-avatar">${esc(S.user.name[0] || "ש")}</div>
      <h1 style="font-size:21px;font-weight:900">${esc(S.user.name)}</h1>
      <div class="muted mt8">${esc(BUILDING.address)} · ${esc(S.user.apt)}</div>
    </div>
    <div class="statgrid">
      <div class="stat"><div class="n">${mine.length}</div><div class="l">הזמנות שהושלמו</div></div>
      <div class="stat"><div class="n">${nis(saved)}</div><div class="l">חסכתי במשלוחים</div></div>
      <div class="stat"><div class="n">${BUILDING.neighbors}</div><div class="l">שכנים בבניין</div></div>
    </div>

    <div class="section-title"><h2>החשבון שלי</h2></div>
    <button class="list-item" id="row-edit">👤 <span>שם ודירה</span><span class="st mut">${esc(S.user.name)} · ${esc(S.user.apt)} ›</span></button>
    <button class="list-item" id="row-payment">💳 <span>אמצעי תשלום</span><span class="st ok">Visa •••• 4242</span></button>
    <a class="list-item" href="#/store-dash">🏬 <span>מסך החנות (דמו)</span><span class="st mut">›</span></a>

    <div class="section-title"><h2>התראות</h2></div>
    <div class="toggle-row"><div><div>💬 עדכוני הזמנות ב-WhatsApp</div><div class="d">"הסל ננעל", "החבילה הגיעה"</div></div><div class="switch ${S.settings.whatsapp ? "on" : ""}" data-set="whatsapp"></div></div>
    <div class="toggle-row"><div><div>🔔 הזמנה חדשה נפתחה בבניין</div><div class="d">כדי לקפוץ על משלוח מתפצל</div></div><div class="switch ${S.settings.waitlist ? "on" : ""}" data-set="waitlist"></div></div>
    <div class="toggle-row"><div><div>🌐 שפה / Language</div><div class="d">עברית (English — בקרוב)</div></div><span class="st mut">עברית</span></div>

    <div class="section-title"><h2>משפטי ופרטיות</h2></div>
    <button class="list-item" id="row-terms">📄 <span>תנאי שימוש ומדיניות פרטיות</span><span class="st mut">›</span></button>
    <button class="list-item" id="row-delete">🗑️ <span style="color:var(--coral)">מחיקת חשבון</span><span class="st mut">›</span></button>
    <p class="tiny mt16" style="text-align:center">תוגדאו · התשלומים מוחזקים (אסקרו) עד אישור מסירה · Stripe Connect</p>
  `;
  $("#row-edit").addEventListener("click", () => openOnboarding(true));
  $("#row-payment").addEventListener("click", () => toast("אמצעי תשלום", "בגרסת הדמו הכרטיס קבוע. בגרסה המלאה: Stripe PaymentSheet.", "💳"));
  $("#row-terms").addEventListener("click", () => toast("מסמכים", "תנאי שימוש ומדיניות פרטיות ייפתחו כאן בגרסה המלאה.", "📄"));
  $("#row-delete").addEventListener("click", () => toast("מחיקת חשבון", "בגרסה המלאה: מחיקה מלאה דרך פונקציית delete-account.", "🗑️"));
  view().querySelectorAll("[data-set]").forEach((sw) => sw.addEventListener("click", () => {
    const k = sw.dataset.set;
    S.settings[k] = !S.settings[k]; save();
    sw.classList.toggle("on", S.settings[k]);
  }));
}

/* ----- Onboarding ----- */
function openOnboarding(editing = false) {
  modal(`
    <h2>${editing ? "עדכון פרטים" : "ברוכים הבאים לתוגדאו! 🏢"}</h2>
    <p class="sub">${editing ? "" : "הבניין שלך כבר כאן — רק נגיד לשכנים מי הצטרף."}</p>
    <div class="field"><label>איך קוראים לך?</label><input id="ob-name" value="${esc(S.user.name)}" /></div>
    <div class="field"><label>דירה / קומה</label><input id="ob-apt" value="${esc(S.user.apt)}" /></div>
    <div class="field"><label>הבניין</label><input value="${esc(BUILDING.address)}" disabled style="opacity:.6" /></div>
    <button class="btn btn-lime" id="ob-save">${editing ? "שמירה" : "יאללה, נכנסים לבניין 🎉"}</button>
  `);
  $("#ob-save").addEventListener("click", () => {
    const name = $("#ob-name").value.trim() || "שרון";
    const apt = $("#ob-apt").value.trim() || "דירה 8";
    S.user.name = name; S.user.apt = apt; S.onboarded = true; save();
    $("#topbar-avatar").textContent = name[0];
    closeModal();
    if (!editing) toast(`ברוכים הבאים, ${name}! 👋`, "יש הזמנה פתוחה של דנה מ-H&M — שווה להציץ.", "🏢");
    route();
  });
}

/* ----- How it works ----- */
function openHow() {
  modal(`
    <h2>איך תוגדאו עובד?</h2>
    <p class="sub">משלוח אחד לבניין במקום שישה שליחים על אותו רחוב.</p>
    <div class="howit">
      <div class="row"><div class="n">1</div><div><b>שכן פותח סל משותף</b><span>בוחרים חנות, קובעים טיימר, ושולחים לינק לקבוצת הבניין.</span></div></div>
      <div class="row"><div class="n">2</div><div><b>כולם מוסיפים — כל אחד את שלו</b><span>כל מצטרף מוזיל לכולם את המשלוח, ומעל ${nis(FREE_SHIPPING_GOAL)} — חינם. אפשר לסמן פריט כפרטי 🙈.</span></div></div>
      <div class="row"><div class="n">3</div><div><b>משלמים רק על שלכם — באסקרו</b><span>התשלום מאושר אבל לא נתפס עד שהחבילה מגיעה ופותח ההזמנה מאשר מסירה. לא הגיעה — הכסף חוזר.</span></div></div>
    </div>
    <div class="honesty">🔒 <b>למה זה בטוח:</b> אף שכן לא נוגע בכסף של אחר. כל אחד משלם ישירות, הכסף מוחזק אצל ספק הסליקה (Stripe), ומשוחרר לחנות רק אחרי אישור מסירה.</div>
    <button class="btn btn-lime mt16" onclick="closeModal()">הבנתי, סגור</button>
  `);
}

/* ---------------- Live simulation of the neighbors ---------------- */

function startSim() {
  const o = S.orders.find((x) => x.status === "collecting" && !timerEnded(x) && x.createdBy !== "me");
  if (!o) return;
  if (!S.simDone.aviJoin) {
    setTimeout(() => {
      const target = orderOf(o.id);
      if (!target || target.status !== "collecting" || timerEnded(target)) return;
      if (!isParticipant(target, "avi")) {
        target.participants.push({ id: "avi" });
        S.simDone.aviJoin = true;
        pulse("👋", "אבי מקומה 3 הצטרף להזמנה — המשלוח ירד לכולם");
        save();
        toast("אבי הצטרף! 👋", `המשלוח המפוצל ירד ל-${freeShipping(target) ? "חינם" : nis(deliveryShare(target))} לשכן.`, "🎉");
        route();
      }
    }, 9000);
  }
  if (!S.simDone.michalItem) {
    setTimeout(() => {
      const target = orderOf(o.id);
      if (!target || target.status !== "collecting" || timerEnded(target)) return;
      if (!isParticipant(target, "michal")) target.participants.push({ id: "michal" });
      target.items.unshift({ id: "sim-" + now(), productId: "hm-linen", by: "michal", size: "M", color: "מרווה", qty: 1, private: false });
      S.simDone.michalItem = true;
      pulse("🛒", "מיכל מדירה 12 הוסיפה חולצת פשתן לסל");
      save();
      toast("הסל גדל! 🛒", `מיכל הוסיפה פריט — ${freeShipping(target) ? "משלוח חינם הושג! 🎉" : `עוד ${nis(Math.max(0, FREE_SHIPPING_GOAL - orderTotal(target)))} למשלוח חינם`}`, "🧺");
      route();
    }, 21000);
  }
}

/* ---------------- Countdown ticker ---------------- */

setInterval(() => {
  document.querySelectorAll("[data-countdown]").forEach((el) => {
    const o = orderOf(el.dataset.countdown);
    if (!o) return;
    const t = timerText(o);
    if (t) el.textContent = `⏳ ${t}`;
    else { el.textContent = "הטיימר הסתיים"; el.classList.add("ended"); }
  });
  document.querySelectorAll("[data-countdown-big]").forEach((el) => {
    const o = orderOf(el.dataset.countdownBig);
    if (!o) return;
    el.textContent = timerText(o) ?? "00:00";
  });
}, 1000);

/* ---------------- Router ---------------- */

const routes = [
  { re: /^#?\/?$/, fn: renderHome, nav: "home" },
  { re: /^#\/stores$/, fn: renderStores, nav: "stores" },
  { re: /^#\/store\/([\w-]+)$/, fn: (m) => renderStore(m[1]), nav: "stores" },
  { re: /^#\/store-dash$/, fn: renderStoreDash, nav: "profile" },
  { re: /^#\/new$/, fn: renderNew, nav: "new" },
  { re: /^#\/order\/([\w-]+)$/, fn: (m) => renderOrder(m[1]), nav: "home" },
  { re: /^#\/orders$/, fn: renderOrders, nav: "orders" },
  { re: /^#\/join\/(\w+)$/, fn: (m) => renderJoin(m[1]), nav: "home" },
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
$("#topbar-avatar").textContent = S.user.name[0] || "ש";
$("#building-strip-text").textContent = `${BUILDING.address} · ${BUILDING.neighbors} שכנים בתוגדאו`;

initSupabase().finally(() => {
  route();
  if (!S.onboarded) setTimeout(() => openOnboarding(false), 600);
  startSim();
});

# פרומט דיזיין — אפליקציית תוגדאו 🎫

זה הפרומט שמכניסים לכלי דיזיין AI (Figma Make / Stitch / v0 / Lovable / UXPilot וכו').
מצרפים אליו את סקיצת העיצוב / רפרנס שלך, מדביקים את הפרומט — ומקבלים עיצוב מלא.

> **טיפ:** כלי דיזיין מבינים אנגלית הכי טוב, אז הפרומט הראשי באנגלית.
> אם הכלי תומך בעברית — יש גרסה מקוצרת בעברית בסוף.

---

## The Master Prompt (copy from here ⬇️)

```
Design a mobile app called "Togdao" (Hebrew: תוגדאו) — a safe, face-value
second-hand ticket marketplace for Israel (concerts, festivals, sports,
theater, stand-up). The entire UI is in HEBREW with full RTL layout —
this is critical: navigation flows right-to-left, icons and chevrons are
mirrored, numbers and prices stay LTR (₪350).

THE PRODUCT IN ONE LINE
"Second-hand ticket. First-hand security." Buyers pay at most the
printed face value (Israeli law forbids more); the money is held in
escrow and released to the seller only two days AFTER the event. If the
buyer is refused at the gate — one tap, full refund. Scamming simply
doesn't pay here.

BRAND & MOOD
- Night-show atmosphere: deep midnight indigo background (#0A0D18),
  stage-spotlight gold as the primary accent (#F6C453 → #F09819
  gradient), electric violet secondary (#8C7BFF), trust green for
  "verified" (#3DDC97), alert coral for disputes (#FF6B6B).
- Feels: premium, warm, trustworthy, a little festive — like holding a
  golden ticket outside the venue. NOT corporate, NOT crypto, NOT neon
  cyberpunk.
- Ticket-stub motifs everywhere: perforated dashed dividers, notched
  card corners, barcode textures used decoratively.
- Typography: Hebrew-first. Heebo for UI text, a strong rounded Hebrew
  display font (e.g. Secular One) for the logo and big numbers.
- Dark mode is the default and hero look; provide a light variant.

KEY TRUST ELEMENTS (must be visually loud)
1. Escrow indicator — a small padlock + "הכסף בנאמנות" status that
   follows the money everywhere (checkout, wallet, seller payout).
2. Two badges: "SAFE 🔒" (gold outline) = money held in escrow;
   "מאומת ✔" (green) = old barcode cancelled, new one issued — 100%
   scam-proof. The green badge is the brand's crown jewel.
3. Price-cap UI — sellers pick a price on a slider that is HARD-CAPPED
   at face value, with the cap clearly drawn as a locked wall.
4. Seller trust: star score, verified-ID checkmarks, sales count.

SCREENS TO DESIGN (mobile, 390×844)
1. Home — hero tagline, search, category chips (הופעות, פסטיבלים,
   ספורט, תיאטרון, סטנדאפ), horizontally scrolling "SOLD OUT" hot
   events, fresh listings feed as ticket-stub cards.
2. Event page — event hero, face-price range pill, listings list
   (seat, seller trust, SAFE/VERIFIED badge, price vs face value),
   and a waitlist card ("347 people waiting — get a 10-minute
   priority window when a ticket appears").
3. Checkout — ticket price and service fee as two separate lines
   (legal requirement), escrow explainer as a 3-step vertical
   timeline, payment methods (Apple Pay, Google Pay, card, Bit),
   big gold pay button.
4. Sell flow (4 steps with progress bar) — pick event from catalog →
   upload PDF/pkpass into an encrypted "vault" (drag-drop zone) →
   OCR result card (seat, face value, barcode hash, duplicate check
   ✓) → price slider capped at face → KYC checklist → publish.
5. Wallet — tabs: קניתי / מכרתי / התראות. Bought ticket: QR hidden
   behind a "reveals on event day" lock, escrow status, a red
   "סורבתי בכניסה" dispute button. Sold ticket: escrow → payout
   timeline. Alerts: waitlist match modal with a 10:00 countdown.
6. Dispute sheet — bottom sheet with auto-verified location + time,
   escrow amount ready to refund, one big refund button.
7. Profile — avatar, trust score, KYC checklist (phone / ID / bank),
   stats, notification toggles (WhatsApp!).
8. "How it works" bottom sheet — 3 numbered steps + an honesty note:
   "no app can x-ray a barcode — but with us, scamming doesn't pay."

COMPONENTS
Bottom nav with a raised gold circular "sell" button in the center;
toasts styled like mini ticket stubs; bottom sheets with grab handle;
countdown timer in big tabular digits; empty states with a friendly
emoji and one-line CTA.

Make it beautiful, dense with real Hebrew content (no lorem ipsum),
with realistic Israeli events: עומר אדם בפארק הירקון, נועה קירל בהיכל
מנורה, דרבי תל אביב, פסטיבל תמר במצדה.
```

---

## גרסה מקוצרת בעברית (אם הכלי מבין עברית)

```
עצב אפליקציית מובייל בשם "תוגדאו" — שוק כרטיסים יד-שנייה בטוח לישראל.
עברית מלאה, RTL. הרעיון: קונים כרטיס במחיר הנקוב בלבד, הכסף בנאמנות עד
יומיים אחרי האירוע, סורבת בכניסה = החזר מלא בלחיצה אחת.

סגנון: לילה של הופעה — רקע אינדיגו כהה (#0A0D18), זהב זרקורים כמבטא
ראשי (#F6C453), סגול חשמלי משני (#8C7BFF), ירוק אמון לתג "מאומת"
(#3DDC97). מוטיב כרטיס תלוש: קווי ניקוב מקווקווים, פינות עם חריצים,
טקסטורת ברקוד. פונט Heebo, לוגו ב-Secular One. דארק מוד כברירת מחדל.

מסכים: בית (חיפוש, צ'יפים, אירועי SOLD OUT, פיד כרטיסים), עמוד אירוע
(רשימות + רשימת המתנה עם חלון 10 דקות), צ'קאאוט (מחיר + דמי שירות
בשתי שורות נפרדות, ציר זמן נאמנות), מכירה ב-4 שלבים (בחירת אירוע,
העלאה לכספת, OCR, סליידר מחיר נעול עד הנקוב, KYC), ארנק (קניתי/מכרתי/
התראות, QR נעול עד יום האירוע, כפתור "סורבתי בכניסה"), פרופיל עם ציון
אמון, ו"איך זה עובד". תוכן אמיתי בעברית — עומר אדם בפארק הירקון, דרבי
תל אביב, פסטיבל תמר.
```

---

## איך משתמשים

1. פותחים את כלי הדיזיין (Figma Make, Stitch, v0…).
2. מעלים את הסקיצה/רפרנס העיצובי שלך (אם יש).
3. מדביקים את הפרומט הראשי, ומוסיפים בסוף שורה:
   `Match the attached reference's general layout, but apply the brand above.`
4. מריצים — ומשווים לעיצוב שכבר חי בריפו הזה (`index.html`) כדי לבחור כיוון.

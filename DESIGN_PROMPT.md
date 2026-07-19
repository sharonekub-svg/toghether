# פרומט דיזיין — אפליקציית תוגדאו 🏢

זה הפרומט שמכניסים לכלי דיזיין AI (Figma Make / Stitch / v0 / Lovable / UXPilot וכו').
מצרפים אליו את סקיצת העיצוב / רפרנס שלך, מדביקים את הפרומט — ומקבלים עיצוב מלא.

> **טיפ:** כלי דיזיין מבינים אנגלית הכי טוב, אז הפרומט הראשי באנגלית.
> אם הכלי תומך בעברית — יש גרסה מקוצרת בעברית בסוף.

---

## The Master Prompt (copy from here ⬇️)

```
Design a mobile app called "Togdao" (Hebrew: תוגדאו) — a group-ordering
app for the neighbors in an apartment building in Israel. The entire UI
is in HEBREW with full RTL layout — this is critical: navigation flows
right-to-left, icons and chevrons are mirrored, numbers and prices stay
LTR (₪129).

THE PRODUCT IN ONE LINE
"The building orders together." One neighbor opens a shared cart from a
store (H&M, Zara, Amazon, the supermarket); every neighbor adds their own
items to the same basket; delivery is split between everyone (and becomes
free above a goal); each person pays only for their own items, and the
money is held in escrow until the package arrives at the building and the
order's founder confirms delivery.

BRAND & MOOD
- "Neon neighborhood at night": deep ink-blue background (#0E1220),
  electric-lime as the primary accent (#C6F432 → #9FD41A gradient),
  friendly violet secondary (#8C7BFF), mint green for success/escrow
  (#3DDC97), coral for the live countdown/alerts (#FF7A6B), warm amber
  for lit windows (#FFC357).
- Feels: warm, communal, a little playful — like a lit-up apartment
  building where everyone's chipping in together. NOT corporate, NOT
  crypto, NOT a cold delivery app.
- Signature motif: a grid of small "apartment windows", a few lit in
  lime/amber, used in the header and empty states. Rounded, glassy cards.
- Typography: Hebrew-first. Heebo for UI text, a strong rounded Hebrew
  display font (e.g. Secular One) for the logo and big numbers.
- Dark mode is the default and hero look; provide a light variant.

KEY MECHANICS (must be visually loud)
1. Shared free-shipping progress bar — a lime bar filling toward the
   free-shipping goal (₪400); every item a neighbor adds pushes it up.
   Label: "עוד ₪X למשלוח חינם" → "🎉 משלוח חינם הושג!".
2. Live cart timer — a big tabular-digit countdown (MM:SS) in coral on
   the order page; while it runs, neighbors can still join. On zero the
   cart locks and the store starts fulfilling.
3. Participant avatars — overlapping colored circles of the neighbors who
   joined, with "N שכנים · M פריטים".
4. "My share" split card — my items + my equal share of delivery, with a
   loud line "משלמים רק על מה ששלכם — לעולם לא על של השכנים".
5. Escrow explainer — a 3-step vertical timeline: pay (authorized/held)
   → store ships → founder confirms delivery → money released. If it
   never arrives, the charge is auto-cancelled.
6. Private items — a neighbor can mark an item private (🙈); others see
   "פריט פרטי · •••" instead of the product.

SCREENS TO DESIGN (mobile, 390×844)
1. Home ("הבניין") — building header with the lit-windows motif, stats
   row (orders completed / saved / neighbors), an "open now — join?"
   group-order card with progress bar + avatars + timer, a big "פתיחת
   הזמנה חדשה" button, and a live "קורה בבניין" activity feed.
2. Stores ("חנויות") — list of store cards (logo tile, tagline, ETA), a
   green "יש הזמנה פתוחה של דנה — קופצים עליה!" hint when one exists.
3. Store catalog — category chips, 2-column product grid with emoji
   tiles, price + struck-through compare price, stock pill (במלאי / מלאי
   נמוך / אחרונים).
4. Add-item bottom sheet — size chips, color chips, quantity stepper,
   a "private item 🙈" toggle, and "הוספה לסל של הבניין · ₪X".
5. Order page — store header, big countdown, horizontal status timeline
   (🧺 איסוף → 🏬 התקבלה → 📦 באריזה → 🚚 מוכנה → 🏠 נמסרה), progress
   bar, invite card with a 4-digit join code + WhatsApp/copy buttons,
   the shared items list (mine tagged "שלי", others' private items
   masked), a "my share" split card, and a lime pay button. Founder-only
   controls: extend timer, lock now, and "החבילה הגיעה — אישור מסירה
   ושחרור הכסף".
6. Pay bottom sheet — split summary + escrow timeline + "אישור תשלום".
7. My orders — tabs פעילות / הושלמו, order cards.
8. Join screen — "דנה מזמינה אותך להזמנה מ-H&M", timer, progress, big
   "מצטרפ/ת!" button (reached via an invite code / deep link).
9. Store dashboard (merchant demo) — the building's locked order as ONE
   consolidated picking list with quantities, and status-advance buttons.
10. Profile — avatar, building + apartment, stats, payment method, a
    "מסך החנות (דמו)" link, notification toggles (WhatsApp!), legal.
11. "How it works" bottom sheet — 3 numbered steps + a safety note about
    escrow (no neighbor ever touches another's money; Stripe holds it
    until delivery).

COMPONENTS
Bottom nav (הבניין / חנויות / +הזמנה / ההזמנות / פרופיל) with a raised
lime circular "+" order button in the center; toast notifications;
bottom sheets with a grab handle; the lit-windows building glyph;
switches in lime; empty states with a friendly emoji and one-line CTA.

Make it beautiful, dense with real Hebrew content (no lorem ipsum), with
realistic Israeli neighbors (דנה מדירה 5, יוסי מהוועד, מיכל מדירה 12) and
a real building address (רוטשילד 12, תל אביב). Show a live feeling: "אבי
מקומה 3 הצטרף", "מיכל הוסיפה חולצה לסל", the timer ticking, the bar
filling.
```

---

## גרסה מקוצרת בעברית (אם הכלי מבין עברית)

```
עצב אפליקציית מובייל בשם "תוגדאו" — הזמנות משותפות לשכני בניין בישראל.
עברית מלאה, RTL. הרעיון: שכן פותח סל משותף מחנות (H&M, זארה, אמזון,
סופר), כל שכן מוסיף את הפריטים שלו לאותו סל, המשלוח מתחלק בין כולם
(וחינם מעל ₪400), כל אחד משלם רק על שלו, והכסף מוחזק באסקרו עד שהחבילה
מגיעה לבניין ופותח ההזמנה מאשר מסירה.

סגנון: "שכונה בניאון בלילה" — רקע כחול-דיו כהה (#0E1220), ליים חשמלי
כמבטא ראשי (#C6F432), סגול ידידותי משני (#8C7BFF), ירוק מנטה להצלחה
ואסקרו (#3DDC97), אלמוג לטיימר החי (#FF7A6B), ענבר לחלונות מוארים
(#FFC357). מוטיב חתימה: רשת חלונות דירה קטנים, כמה מוארים. פונט Heebo,
לוגו ב-Secular One. דארק מוד כברירת מחדל.

מסכים: בית "הבניין" (מוטיב חלונות, סטטיסטיקות, הזמנה פתוחה עם בר
התקדמות + אווטארים + טיימר, פיד "קורה בבניין"), חנויות, קטלוג חנות (צ'יפים
+ גריד מוצרים), שיטסט הוספת פריט (מידה/צבע/כמות + טוגל "פריט פרטי"),
עמוד הזמנה (טיימר גדול, ציר סטטוס אופקי, קוד הצטרפות + שיתוף וואטסאפ,
רשימת סל משותף, כרטיס "החלק שלי", כפתור תשלום, וכפתורי מנהל: הארכת טיימר
ואישור מסירה), שיטסט תשלום עם ציר אסקרו, ההזמנות שלי, מסך הצטרפות דרך
קוד, מסך חנות (דמו) עם רשימת ליקוט מרוכזת, ופרופיל. תוכן אמיתי בעברית —
דנה מדירה 5, יוסי מהוועד, רוטשילד 12 תל אביב, טיימר שרץ ובר שמתמלא.
```

---

## איך משתמשים

1. פותחים את כלי הדיזיין (Figma Make, Stitch, v0…).
2. מעלים את הסקיצה/רפרנס העיצובי שלך (אם יש).
3. מדביקים את הפרומט הראשי, ומוסיפים בסוף שורה:
   `Match the attached reference's general layout, but apply the brand above.`
4. מריצים — ומשווים לעיצוב שכבר חי בריפו הזה (`index.html`) כדי לבחור כיוון.

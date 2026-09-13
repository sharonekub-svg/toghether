/* אתר עו"ד רועי קובובסקי — הגדרות לקוח.
   המפתח הציבורי (publishable) בטוח לחשיפה בדפדפן — הגישה מוגבלת
   באמצעות Row Level Security כך שניתן רק *להגיש* פנייה, לא לקרוא פניות. */

window.SITE_CONFIG = {
  supabaseUrl: "https://zceoswqrvcqmjjohpeyo.supabase.co",
  supabaseAnonKey: "sb_publishable_aWietdHty-i2IlGKGk421w_UH4X13q0",
  // הדוא"ל המקצועי שמוצג באתר.
  contactEmail: "roy.kubovsky@dle.co.il",
  // הכתובת שאליה נשלחות פניות הטופס (במייל).
  formEmail: "Roy@kubovsky.co.il",
  // דוא"ל לגיבוי — אם השליחה נכשלת, נפתח דוא"ל לכתובת זו.
  fallbackEmail: "Roy@kubovsky.co.il",
  phone: "054-2113091",
};

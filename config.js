/* אתר עו"ד רועי קובובסקי — הגדרות לקוח.
   המפתח הציבורי (publishable) בטוח לחשיפה בדפדפן — הגישה מוגבלת
   באמצעות Row Level Security כך שניתן רק *להגיש* פנייה, לא לקרוא פניות. */

window.SITE_CONFIG = {
  supabaseUrl: "https://zceoswqrvcqmjjohpeyo.supabase.co",
  supabaseAnonKey: "sb_publishable_aWietdHty-i2IlGKGk421w_UH4X13q0",
  // כתובת הדוא"ל המוצגת באתר (מקצועית).
  contactEmail: "Roy@kubovsky.co.il",
  // כתובת דוא"ל לגיבוי — אם שמירת הפנייה נכשלת, נפתח דוא"ל לכתובת הזו.
  fallbackEmail: "sharonekub@gmail.com",
  phone: "050-759-5552",
};

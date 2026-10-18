import { createContext, useContext, useEffect, useState } from "react";

const IDX = { en: 0, fr: 1, ar: 2 };

// key: [English, Français, العربية]
const S = {
  nav_journal: ["Journal", "Journal", "اليوميات"],
  nav_chat: ["Chat", "Discussion", "محادثة"],
  nav_dashboard: ["Dashboard", "Tableau de bord", "لوحة المتابعة"],
  nav_profile: ["Profile", "Profil", "الملف الشخصي"],
  nav_logout: ["Logout", "Déconnexion", "تسجيل الخروج"],
  banner: ["Supportive, not a medical tool. If you are in danger, contact emergency services.",
    "Un soutien, pas un outil médical. En cas de danger, contactez les urgences.",
    "دعم نفسي وليس أداة طبية. في حالة الخطر اتصل بخدمات الطوارئ."],
  j_title: ["How are you feeling today?", "Comment te sens-tu aujourd'hui ?", "كيف تشعر اليوم؟"],
  j_write: ["✍️ Write", "✍️ Écrire", "✍️ اكتب"],
  j_speak: ["🎤 Speak", "🎤 Parler", "🎤 تحدّث"],
  j_qa: ["👆 Help me answer", "👆 Aide-moi à répondre", "👆 ساعدني في الإجابة"],
  j_placeholder: ["Write anything: how your day went, what worries you…",
    "Écris librement : ta journée, ce qui t'inquiète…", "اكتب بحرية: كيف كان يومك، وما الذي يقلقك…"],
  j_analyse: ["Analyse", "Analyser", "تحليل"],
  j_voice_fail: ["We couldn't understand the recording.", "Nous n'avons pas compris l'enregistrement.", "لم نتمكن من فهم التسجيل."],
  j_type: ["Type instead", "Écrire à la place", "اكتب بدلاً من ذلك"],
  v_tap: ["Tap to record (Arabic, French or English)", "Appuie pour enregistrer (arabe, français ou anglais)", "اضغط للتسجيل (عربي، فرنسي أو إنجليزي)"],
  v_rec: ["Recording… tap to stop", "Enregistrement… appuie pour arrêter", "جارٍ التسجيل… اضغط للإيقاف"],
  v_mic: ["Microphone not available. Please type instead.", "Micro indisponible. Écris à la place.", "الميكروفون غير متاح. يرجى الكتابة."],
  r_none: ["No result yet.", "Aucun résultat pour l'instant.", "لا توجد نتيجة بعد."],
  r_write: ["Write a journal entry", "Écrire une entrée", "اكتب يومية"],
  r_low: ["Low stress", "Stress faible", "توتر منخفض"],
  r_mod: ["Moderate stress", "Stress modéré", "توتر متوسط"],
  r_high: ["High stress", "Stress élevé", "توتر مرتفع"],
  r_themes: ["Themes", "Thèmes", "المواضيع"],
  r_said: ["What you wrote / said", "Ce que tu as écrit / dit", "ما كتبته / قلته"],
  r_try: ["Try one of these", "Essaie l'un de ces exercices", "جرّب أحد هذه التمارين"],
  r_in: ["🏠 Indoors", "🏠 À l'intérieur", "🏠 في الداخل"],
  r_out: ["🌳 Outdoors", "🌳 À l'extérieur", "🌳 في الخارج"],
  r_plan: ["Your plan for today", "Ton plan du jour", "خطتك لليوم"],
  r_pdf: ["Export PDF", "Exporter en PDF", "تصدير PDF"],
  r_ics: ["Add to calendar (.ics)", "Ajouter au calendrier (.ics)", "إضافة إلى التقويم (.ics)"],
  r_chat: ["Talk about it 💬", "En parler 💬", "تحدّث عن الأمر 💬"],
  e_min: ["min", "min", "د"],
  e_done: ["I did this", "C'est fait", "قمت بذلك"],
  e_logged: ["Logged ✓", "Enregistré ✓", "تم ✓"],
  p_none: ["No plan yet.", "Pas encore de plan.", "لا توجد خطة بعد."],
  c_title: ["You are not alone 💛", "Tu n'es pas seul(e) 💛", "لست وحدك 💛"],
  c_text: ["It sounds like things are really hard right now. Please reach out to someone:",
    "Ça a l'air très difficile en ce moment. Contacte quelqu'un :", "يبدو أن الأمور صعبة جداً الآن. تواصل مع شخص ما:"],
  d_next: ["Next", "Prochain", "التالي"],
  d_days: ["days left", "jours restants", "أيام متبقية"],
  d_14: ["Stress, last 14 days", "Stress, 14 derniers jours", "التوتر في آخر 14 يوماً"],
  d_empty: ["No entries yet. Write one, or load demo data in Profile.",
    "Aucune entrée. Écris-en une ou charge la démo dans Profil.", "لا توجد مدخلات. اكتب واحدة أو حمّل البيانات التجريبية من الملف الشخصي."],
  d_today: ["Today's plan", "Plan du jour", "خطة اليوم"],
  pr_title: ["Profile", "Profil", "الملف الشخصي"],
  pr_name: ["Name", "Prénom", "الاسم"],
  pr_lang: ["Language", "Langue", "اللغة"],
  pr_cycle: ["Cycle-aware plans (optional)", "Plans adaptés au cycle (optionnel)", "خطط تراعي الدورة الشهرية (اختياري)"],
  pr_last: ["Last period start", "Début des dernières règles", "بداية آخر دورة"],
  pr_len: ["Cycle length (days)", "Durée du cycle (jours)", "مدة الدورة (أيام)"],
  pr_save: ["Save", "Enregistrer", "حفظ"],
  pr_saved: ["Profile saved", "Profil enregistré", "تم حفظ الملف"],
  pr_cal: ["Calendar", "Calendrier", "التقويم"],
  pr_seed: ["Load sample calendar", "Charger un calendrier exemple", "تحميل تقويم تجريبي"],
  pr_ics: ["Import .ics", "Importer un .ics", "استيراد ملف .ics"],
  pr_demo: ["Load demo history", "Charger l'historique démo", "تحميل سجل تجريبي"],
  pr_cal_ok: ["Sample calendar loaded", "Calendrier exemple chargé", "تم تحميل التقويم"],
  pr_ics_ok: ["Calendar imported", "Calendrier importé", "تم استيراد التقويم"],
  pr_demo_ok: ["Demo data (14 days) loaded", "Données démo (14 jours) chargées", "تم تحميل بيانات 14 يوماً"],
  pr_priv: ["Privacy", "Confidentialité", "الخصوصية"],
  pr_priv_txt: ["Remove everything this app stored about you.", "Supprimer tout ce que l'application a enregistré sur toi.", "حذف كل ما خزّنه التطبيق عنك."],
  pr_delete: ["Delete my data", "Supprimer mes données", "حذف بياناتي"],
  pr_confirm: ["Delete all your entries, plans and events? This cannot be undone.",
    "Supprimer toutes tes entrées, plans et événements ? Action irréversible.", "حذف كل المدخلات والخطط والأحداث؟ لا يمكن التراجع."],
  pr_deleted: ["All your data was deleted", "Toutes tes données ont été supprimées", "تم حذف كل بياناتك"],
  ch_title: ["Talk it through", "Parlons-en", "لنتحدث"],
  ch_hint: ["I'm here to listen. What's on your mind?", "Je suis là pour t'écouter. Qu'as-tu en tête ?", "أنا هنا للاستماع. ما الذي يشغل بالك؟"],
  ch_placeholder: ["Type a message…", "Écris un message…", "اكتب رسالة…"],
  ch_send: ["Send", "Envoyer", "إرسال"],
};

const Ctx = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem("herwin:lang") || "en"; } catch { return "en"; }
  });
  useEffect(() => {
    try { localStorage.setItem("herwin:lang", lang); } catch { /* ignore */ }
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  const t = (k) => S[k]?.[IDX[lang]] ?? S[k]?.[0] ?? k;
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);

import { useLang } from "../i18n.jsx";

const QA = {
  en: [
    ["energy", "How is your energy right now?", ["Very low", "Low", "OK", "Good", "High"]],
    ["worry", "How worried do you feel about your studies?", ["Not at all", "A little", "Quite a bit", "Very"]],
    ["sleep", "How did you sleep last night?", ["Badly", "OK", "Well"]],
    ["support", "Do you feel supported today?", ["No", "A little", "Yes"]],
    ["body", "Any physical tension?", ["Yes, strong", "Yes, mild", "No"]],
  ],
  fr: [
    ["energy", "Comment est ton énergie en ce moment ?", ["Très basse", "Basse", "Moyenne", "Bonne", "Élevée"]],
    ["worry", "À quel point es-tu inquiet(e) pour tes études ?", ["Pas du tout", "Un peu", "Assez", "Beaucoup"]],
    ["sleep", "Comment as-tu dormi cette nuit ?", ["Mal", "Moyennement", "Bien"]],
    ["support", "Te sens-tu soutenu(e) aujourd'hui ?", ["Non", "Un peu", "Oui"]],
    ["body", "As-tu des tensions physiques ?", ["Oui, fortes", "Oui, légères", "Non"]],
  ],
  ar: [
    ["energy", "كيف مستوى طاقتك الآن؟", ["منخفض جداً", "منخفض", "متوسط", "جيد", "مرتفع"]],
    ["worry", "ما مدى قلقك بشأن دراستك؟", ["أبداً", "قليلاً", "كثيراً نوعاً ما", "جداً"]],
    ["sleep", "كيف نمت الليلة الماضية؟", ["سيئاً", "عادي", "جيداً"]],
    ["support", "هل تشعر بالدعم اليوم؟", ["لا", "قليلاً", "نعم"]],
    ["body", "هل لديك توتر جسدي؟", ["نعم، شديد", "نعم، خفيف", "لا"]],
  ],
};

export const getQuestions = (lang) =>
  (QA[lang] || QA.en).map(([id, q, options]) => ({ id, q, options }));

export default function QAForm({ answers, setAnswers }) {
  const { lang } = useLang();
  return (
    <div className="space-y-4">
      {getQuestions(lang).map((item) => (
        <div key={item.id}>
          <p className="font-medium mb-2">{item.q}</p>
          <div className="join flex-wrap">
            {item.options.map((o) => (
              <button key={o} type="button"
                className={`btn btn-sm join-item ${answers[item.id] === o ? "btn-primary" : ""}`}
                onClick={() => setAnswers((a) => ({ ...a, [item.id]: o }))}>
                {o}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

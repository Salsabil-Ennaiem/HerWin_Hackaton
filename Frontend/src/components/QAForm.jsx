export const QUESTIONS = [
  { id: "energy", q: "How is your energy right now?", options: ["Very low", "Low", "OK", "Good", "High"] },
  { id: "worry", q: "How worried do you feel about your studies?", options: ["Not at all", "A little", "Quite a bit", "Very"] },
  { id: "sleep", q: "How did you sleep last night?", options: ["Badly", "OK", "Well"] },
  { id: "support", q: "Do you feel supported today?", options: ["No", "A little", "Yes"] },
  { id: "body", q: "Any physical tension?", options: ["Yes, strong", "Yes, mild", "No"] },
];

export default function QAForm({ answers, setAnswers }) {
  return (
    <div className="space-y-4">
      {QUESTIONS.map((item) => (
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

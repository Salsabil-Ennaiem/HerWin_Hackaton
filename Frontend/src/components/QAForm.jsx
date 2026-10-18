export const QUESTIONS = [
  "How well did you sleep last night?",
  "How is your energy level today?",
  "How worried do you feel about your studies?",
  "How connected do you feel to people around you?",
  "How hopeful do you feel about the next few days?",
];

const SCALE = ["1", "2", "3", "4", "5"];

export default function QAForm({ answers, setAnswers }) {
  return (
    <div className="space-y-5">
      <p className="text-sm opacity-70">1 = not at all, 5 = very much</p>
      {QUESTIONS.map((q, i) => (
        <div key={q} className="space-y-2">
          <p className="font-medium">{i + 1}. {q}</p>
          <div className="join">
            {SCALE.map((v) => (
              <input
                key={v}
                type="radio"
                name={`q${i}`}
                className="join-item btn btn-sm"
                aria-label={v}
                checked={answers[i] === Number(v)}
                onChange={() => {
                  const next = [...answers];
                  next[i] = Number(v);
                  setAnswers(next);
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
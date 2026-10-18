export const mockResult = {
  entry_id: 1,
  transcript: "I am stressed about my exam",
  mood: {
    dominant: "anxiety",
    emotions: { anxiety: 0.62, sadness: 0.2, joy: 0.05 },
    themes: ["exam", "sleep"],
  },
  stress_score: 74,
  distress_flag: false,
  support_message: "Take it one block at a time.",
  exercises: [
    { id: 1, title: "Box breathing", minutes: 3, steps: ["Inhale 4s", "Hold 4s"] },
  ],
  activities: { indoor: ["Stretching, 10 min"], outdoor: ["Walk, 15 min"] },
  plan: {
    explanation: "High stress today, so shorter blocks.",
    blocks: [
      {
        id: 1,
        start: "2026-10-20T09:00:00",
        end: "2026-10-20T09:25:00",
        type: "study",
        title: "Focus block",
        done: false,
      },
    ],
  },
  contacts: [{ name: "Helpline", type: "helpline", phone: "123" }],
};
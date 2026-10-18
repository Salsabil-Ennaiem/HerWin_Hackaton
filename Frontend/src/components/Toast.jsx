import { useState } from "react";
import { useNavigate } from "react-router-dom";
import QAForm, { QUESTIONS } from "../components/QAForm";
import Toast from "../components/Toast";
import VoiceRecorder from "../components/VoiceRecorder";
import { postJournal } from "../api";
import { saveResult } from "../store";

const TABS = [
  { id: "text", label: "Write" },
  { id: "voice", label: "Voice" },
  { id: "qa", label: "Quick questions" },
];

export default function Journal() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("text");
  const [text, setText] = useState("");
  const [audio, setAudio] = useState(null);
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // { message, fallback }

  const canSubmit =
    (tab === "text" && text.trim().length >= 3) ||
    (tab === "voice" && audio) ||
    (tab === "qa" && answers.every((a) => a !== null));

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("mode", tab);
      if (tab === "text") fd.append("text", text.trim());
      if (tab === "voice") fd.append("audio", audio, "note.webm");
      if (tab === "qa") {
        const payload = QUESTIONS.map((q, i) => ({ question: q, answer: answers[i] }));
        fd.append("answers", JSON.stringify(payload));
      }
      const result = await postJournal(fd);
      saveResult(result);
      navigate("/results");
    } catch {
      setError({
        message:
          tab === "voice"
            ? "We couldn't process your voice note."
            : "Something went wrong. Please try again.",
        fallback: tab === "voice",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">How are you feeling today?</h1>

      <div role="tablist" className="tabs tabs-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            className={`tab ${tab === t.id ? "tab-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "text" && (
        <textarea
          className="textarea textarea-bordered w-full h-40"
          placeholder="Write freely: in English, French or Arabic…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}

      {tab === "voice" && (
        <VoiceRecorder onRecorded={setAudio} onClear={() => setAudio(null)} />
      )}

      {tab === "qa" && <QAForm answers={answers} setAnswers={setAnswers} />}

      <button
        className="btn btn-primary w-full"
        disabled={loading || !canSubmit}
        onClick={submit}
      >
        {loading ? <span className="loading loading-spinner" /> : "Analyse"}
      </button>

      <Toast
        message={error?.message}
        actionLabel={error?.fallback ? "Type instead" : undefined}
        onAction={() => { setTab("text"); setError(null); }}
        onClose={() => setError(null)}
      />
    </div>
  );
}
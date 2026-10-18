import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { postJournal, errMsg } from "../api";
import { saveResult } from "../store";
import VoiceRecorder from "../components/VoiceRecorder";
import QAForm, { QUESTIONS } from "../components/QAForm";
import Toast from "../components/Toast";

const TABS = [["text", "✍️ Write"], ["voice", "🎤 Speak"], ["qa", "👆 Help me answer"]];

export default function Journal() {
  const nav = useNavigate();
  const [tab, setTab] = useState("text");
  const [text, setText] = useState("");
  const [blob, setBlob] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const ready =
    (tab === "text" && text.trim()) || (tab === "voice" && blob) || (tab === "qa" && Object.keys(answers).length > 0);

  const submit = async () => {
    const fd = new FormData();
    fd.append("mode", tab);
    if (tab === "text") fd.append("text", text.trim());
    if (tab === "voice") fd.append("audio", blob, "audio.webm");
    if (tab === "qa") {
      const list = QUESTIONS.filter((q) => answers[q.id]).map((q) => ({ q: q.q, a: answers[q.id] }));
      fd.append("answers", JSON.stringify(list));
    }
    setLoading(true);
    try {
      saveResult(await postJournal(fd));
      nav("/results");
    } catch (e) {
      setToast(
        tab === "voice"
          ? { message: "We couldn't understand the recording.", actionLabel: "Type instead", onAction: () => { setTab("text"); setToast(null); } }
          : { message: errMsg(e) },
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <h1 className="card-title text-2xl">How are you feeling today?</h1>
        <div role="tablist" className="tabs tabs-box w-fit">
          {TABS.map(([k, label]) => (
            <button key={k} role="tab" className={`tab ${tab === k ? "tab-active" : ""}`} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3">
          {tab === "text" && (
            <textarea className="textarea textarea-bordered w-full h-44" value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write anything: how your day went, what worries you… (Arabic, French or English)" />
          )}
          {tab === "voice" && <VoiceRecorder onRecorded={setBlob} />}
          {tab === "qa" && <QAForm answers={answers} setAnswers={setAnswers} />}
        </div>

        <button className="btn btn-primary mt-4 self-end" disabled={!ready || loading} onClick={submit}>
          {loading ? <span className="loading loading-spinner" /> : "Analyse"}
        </button>
      </div>
      <Toast {...(toast || {})} onClose={() => setToast(null)} />
    </div>
  );
}

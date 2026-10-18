import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { postJournal, errMsg } from "../api";
import { saveResult } from "../store";
import { useLang } from "../i18n.jsx";
import VoiceRecorder from "../components/VoiceRecorder";
import QAForm, { getQuestions } from "../components/QAForm";
import Toast from "../components/Toast";
import { ChatPanel } from "./Chat";

const TABS = [["text", "j_write"], ["voice", "j_speak"], ["qa", "j_qa"], ["chat", "nav_chat"]];

export default function Journal() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, lang } = useLang();
  const [tab, setTab] = useState("text");
  const activeTab = searchParams.get("tab") === "chat" ? "chat" : tab;
  const [text, setText] = useState("");
  const [blob, setBlob] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const ready =
    (activeTab === "text" && text.trim()) ||
    (activeTab === "voice" && blob) ||
    (activeTab === "qa" && getQuestions(lang).every(({ id }) => answers[id]));

  const submit = async () => {
    const fd = new FormData();
    fd.append("mode", activeTab);
    if (activeTab === "text") fd.append("text", text.trim());
    if (activeTab === "voice") fd.append("audio", blob, "audio.webm");
    if (activeTab === "qa") {
      const list = getQuestions(lang).filter((q) => answers[q.id]).map((q) => ({ q: q.q, a: answers[q.id] }));
      fd.append("answers", JSON.stringify(list));
    }
    setLoading(true);
    try {
      saveResult(await postJournal(fd));
      nav("/results");
    } catch (e) {
      setToast(
        activeTab === "voice"
          ? { message: errMsg(e), actionLabel: t("j_type"), onAction: () => { setTab("text"); setToast(null); } }
          : { message: errMsg(e) },
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <h1 className="card-title text-2xl">{t(activeTab === "chat" ? "ch_title" : "j_title")}</h1>
        <div role="tablist" className="tabs tabs-box w-fit">
          {TABS.map(([k, key]) => (
            <button key={k} role="tab" className={`tab ${activeTab === k ? "tab-active" : ""}`} onClick={() => {
              if (k !== "chat") setTab(k);
              setSearchParams(k === "chat" ? { tab: "chat" } : {});
            }}>
              {t(key)}
            </button>
          ))}
        </div>

        <div className="mt-3">
          {activeTab === "chat" && <ChatPanel />}
          {activeTab === "text" && (
            <textarea className="textarea textarea-bordered w-full h-44" value={text}
              onChange={(e) => setText(e.target.value)} placeholder={t("j_placeholder")} />
          )}
          {activeTab === "voice" && <VoiceRecorder onRecorded={setBlob} />}
          {activeTab === "qa" && <QAForm answers={answers} setAnswers={setAnswers} />}
        </div>

        {activeTab !== "chat" && (
          <button className="btn btn-primary mt-4 self-end" disabled={!ready || loading} onClick={submit}>
            {loading ? <span className="loading loading-spinner" /> : t("j_analyse")}
          </button>
        )}
      </div>
      <Toast {...(toast || {})} onClose={() => setToast(null)} />
    </div>
  );
}

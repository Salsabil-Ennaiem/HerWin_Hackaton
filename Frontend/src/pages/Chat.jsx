import { useEffect, useRef, useState } from "react";
import { errMsg, sendChat } from "../api";
import { useLang } from "../i18n.jsx";
import ContactsCard from "../components/ContactsCard";
import Toast from "../components/Toast";

export function ChatPanel() {
  const { t, lang } = useLang();
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [toast, setToast] = useState(null);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView?.({ behavior: "smooth" }); }, [msgs, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const history = msgs;
    setMsgs([...history, { role: "user", content: text }]);
    setInput("");
    setBusy(true);
    try {
      const r = await sendChat(text, history, lang);
      setMsgs((m) => [...m, { role: "assistant", content: r.reply }]);
      if (r.distress) setContacts(r.contacts);
    } catch (e) {
      setToast({ message: errMsg(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="space-y-1 min-h-64 max-h-[55vh] overflow-y-auto">
        <div className="chat chat-start"><div className="chat-bubble">{t("ch_hint")}</div></div>
        {msgs.map((m, i) => (
          <div key={i} className={`chat ${m.role === "user" ? "chat-end" : "chat-start"}`}>
            <div className={`chat-bubble ${m.role === "user" ? "chat-bubble-primary" : ""}`}>{m.content}</div>
          </div>
        ))}
        {busy && <div className="chat chat-start"><div className="chat-bubble"><span className="loading loading-dots" /></div></div>}
        <div ref={endRef} />
      </div>
      {contacts.length > 0 && <ContactsCard contacts={contacts} />}
      <div className="flex gap-2 mt-2">
        <input className="input input-bordered flex-1" value={input} placeholder={t("ch_placeholder")}
          onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
        <button className="btn btn-primary" disabled={busy || !input.trim()} onClick={send}>{t("ch_send")}</button>
      </div>
      <Toast {...(toast || {})} onClose={() => setToast(null)} />
    </>
  );
}

export default function Chat() {
  const { t } = useLang();
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <h1 className="card-title text-2xl">{t("ch_title")}</h1>
        <ChatPanel />
      </div>
    </div>
  );
}

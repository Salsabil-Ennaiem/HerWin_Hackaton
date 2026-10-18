import { useEffect, useRef, useState } from "react";
import { useLang } from "../i18n.jsx";

export default function VoiceRecorder({ onRecorded }) {
  const { t } = useLang();
  const [recording, setRecording] = useState(false);
  const [url, setUrl] = useState(null);
  const [error, setError] = useState("");
  const recRef = useRef(null);
  const chunks = useRef([]);

  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);

  const start = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
        setUrl(URL.createObjectURL(blob));
        onRecorded(blob);
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch {
      setError(t("v_mic"));
    }
  };

  const stop = () => { recRef.current?.stop(); setRecording(false); };

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <button type="button" className={`btn btn-circle btn-lg ${recording ? "btn-error animate-pulse" : "btn-primary"}`}
        onClick={recording ? stop : start}>
        {recording ? "■" : "🎤"}
      </button>
      <p className="text-sm opacity-70">{recording ? t("v_rec") : t("v_tap")}</p>
      {url && <audio controls src={url} className="w-full" />}
      {error && <p className="text-error text-sm">{error}</p>}
    </div>
  );
}

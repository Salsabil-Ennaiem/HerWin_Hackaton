import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { postJournal } from "../api";
import { saveResult } from "../store";

export default function Journal() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("mode", "text");
      fd.append("text", text.trim());
      const result = await postJournal(fd);
      saveResult(result);
      navigate("/results");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">How are you feeling today?</h1>
      <textarea
        className="textarea textarea-bordered w-full h-40"
        placeholder="Write freely: in English, French or Arabic…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        className="btn btn-primary w-full"
        disabled={loading || text.trim().length < 3}
        onClick={submit}
      >
        {loading ? <span className="loading loading-spinner" /> : "Analyse"}
      </button>
      <Toast message={error} onClose={() => setError("")} />
    </div>
  );
}
import { useState } from "react";
import { errMsg, patchBlock } from "../api";
import { useLang } from "../i18n.jsx";
import Toast from "./Toast";

const ICON = { study: "📚", break: "☕", movement: "🚶", meal: "🍽️", free: "🌿" };
const hm = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function PlanTimeline({ plan }) {
  const { t } = useLang();
  const [done, setDone] = useState(() => Object.fromEntries((plan?.blocks || []).map((b) => [b.id, b.done])));
  const [pending, setPending] = useState({});
  const [error, setError] = useState("");
  if (!plan?.blocks?.length) return <p className="text-sm opacity-70">{t("p_none")}</p>;

  const toggle = async (b) => {
    if (pending[b.id]) return;
    const next = !done[b.id];
    setPending((current) => ({ ...current, [b.id]: true }));
    setDone((d) => ({ ...d, [b.id]: next }));
    try {
      await patchBlock(b.id, next);
    } catch (e) {
      setDone((d) => ({ ...d, [b.id]: !next }));
      setError(errMsg(e));
    } finally {
      setPending((current) => ({ ...current, [b.id]: false }));
    }
  };

  return (
    <div>
      {plan.explanation && <p className="text-sm mb-3 opacity-80">{plan.explanation}</p>}
      <ul className="timeline timeline-vertical timeline-compact timeline-snap-icon">
        {plan.blocks.map((b, i) => (
          <li key={b.id}>
            {i > 0 && <hr />}
            <div className="timeline-middle text-lg">{ICON[b.type] || "•"}</div>
            <div className="timeline-end timeline-box flex items-center gap-3 my-1">
              <input type="checkbox" className="checkbox checkbox-sm checkbox-primary"
                checked={!!done[b.id]} disabled={!!pending[b.id]} onChange={() => toggle(b)} />
              <div className={done[b.id] ? "line-through opacity-50" : ""}>
                <div className="text-xs opacity-60" dir="ltr">{hm(b.start)} – {hm(b.end)}</div>
                <div className="text-sm">{b.title}</div>
              </div>
            </div>
            <hr />
          </li>
        ))}
      </ul>
      <Toast message={error} onClose={() => setError("")} />
    </div>
  );
}

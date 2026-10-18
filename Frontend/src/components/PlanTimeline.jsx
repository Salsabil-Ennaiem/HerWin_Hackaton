import { useState } from "react";
import { patchBlock } from "../api";

const ICON = { study: "📚", break: "☕", movement: "🚶", meal: "🍽️", free: "🌿" };
const hm = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function PlanTimeline({ plan }) {
  const [done, setDone] = useState(() => Object.fromEntries((plan?.blocks || []).map((b) => [b.id, b.done])));
  if (!plan?.blocks?.length) return <p className="text-sm opacity-70">No plan yet.</p>;

  const toggle = async (b) => {
    const next = !done[b.id];
    setDone((d) => ({ ...d, [b.id]: next }));
    try { await patchBlock(b.id, next); } catch { setDone((d) => ({ ...d, [b.id]: !next })); }
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
                checked={!!done[b.id]} onChange={() => toggle(b)} />
              <div className={done[b.id] ? "line-through opacity-50" : ""}>
                <div className="text-xs opacity-60">{hm(b.start)} – {hm(b.end)}</div>
                <div className="text-sm">{b.title}</div>
              </div>
            </div>
            <hr />
          </li>
        ))}
      </ul>
    </div>
  );
}

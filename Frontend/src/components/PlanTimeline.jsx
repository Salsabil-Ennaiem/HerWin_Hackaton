const time = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const badge = {
  study: "badge-primary",
  break: "badge-success",
  exercise: "badge-accent",
  exam: "badge-error",
};

export default function PlanTimeline({ plan }) {
  if (!plan) return <p className="opacity-60">No plan for today.</p>;
  return (
    <div className="space-y-2">
      <p className="text-sm opacity-80">{plan.explanation}</p>
      <ul className="space-y-2">
        {plan.blocks.map((b) => (
          <li key={b.id} className="flex items-center gap-3 p-2 rounded-lg bg-base-200">
            <span className="font-mono text-sm w-28">{time(b.start)}–{time(b.end)}</span>
            <span className="flex-1">{b.title}</span>
            <span className={`badge ${badge[b.type] || "badge-ghost"}`}>{b.type}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
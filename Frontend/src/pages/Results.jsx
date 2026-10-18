import { Link } from "react-router-dom";
import { loadResult } from "../store";
import StressGauge from "../components/StressGauge";
import ExerciseCard from "../components/ExerciseCard";
import PlanTimeline from "../components/PlanTimeline";
import ContactsCard from "../components/ContactsCard";

export default function Results() {
  const r = loadResult();
  if (!r) {
    return (
      <div className="text-center py-10">
        <p className="mb-4">No result yet.</p>
        <Link to="/" className="btn btn-primary">Write a journal entry</Link>
      </div>
    );
  }
  const emotions = Object.entries(r.mood.emotions || {}).sort((a, b) => b[1] - a[1]).filter(([, v]) => v > 0.05);

  return (
    <div className="space-y-4">
      {r.distress_flag && <ContactsCard contacts={r.contacts} />}

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body items-center text-center">
          <StressGauge score={r.stress_score} />
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {emotions.map(([k, v]) => (
              <span key={k} className={`badge ${k === r.mood.dominant ? "badge-primary" : "badge-outline"}`}>
                {k} {Math.round(v * 100)}%
              </span>
            ))}
          </div>
          {r.mood.themes?.length > 0 && (
            <div className="text-xs opacity-60">Themes: {r.mood.themes.join(", ")}</div>
          )}
          <p className="mt-3 text-lg">{r.support_message}</p>
        </div>
      </div>

      {r.transcript && (
        <details className="collapse collapse-arrow bg-base-100">
          <summary className="collapse-title text-sm">What you wrote / said</summary>
          <div className="collapse-content text-sm opacity-80">{r.transcript}</div>
        </details>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-2">Try one of these</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {r.exercises.map((e) => <ExerciseCard key={e.id} exercise={e} entryId={r.entry_id} />)}
        </div>
      </section>

      {(r.activities?.indoor?.length > 0 || r.activities?.outdoor?.length > 0) && (
        <section className="card bg-base-100 shadow-sm">
          <div className="card-body p-4 grid sm:grid-cols-2 gap-4 text-sm">
            <div><h3 className="font-semibold">🏠 Indoors</h3><ul className="list-disc list-inside">{r.activities.indoor.map((a) => <li key={a}>{a}</li>)}</ul></div>
            <div><h3 className="font-semibold">🌳 Outdoors</h3><ul className="list-disc list-inside">{r.activities.outdoor.map((a) => <li key={a}>{a}</li>)}</ul></div>
          </div>
        </section>
      )}

      <section className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Your plan for today</h2>
          <PlanTimeline plan={r.plan} />
        </div>
      </section>
    </div>
  );
}

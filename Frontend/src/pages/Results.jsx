import { Link } from "react-router-dom";
import ContactsCard from "../components/ContactsCard";
import ExerciseCard from "../components/ExerciseCard";
import PlanTimeline from "../components/PlanTimeline";
import StressGauge from "../components/StressGauge";
import { loadResult } from "../store";

export default function Results() {
  const r = loadResult();

  if (!r) {
    return (
      <div className="text-center space-y-3">
        <p>No result yet.</p>
        <Link className="btn btn-primary" to="/">Write a journal entry</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {r.distress_flag && <ContactsCard contacts={r.contacts} />}

      <section className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Your message</h2>
          <p>{r.support_message}</p>
          <p className="text-sm opacity-60 italic">“{r.transcript}”</p>
        </div>
      </section>

      <section className="card bg-base-100 shadow">
        <div className="card-body sm:flex-row items-center gap-6">
          <StressGauge score={r.stress_score} />
          <div className="space-y-2">
            <h2 className="card-title">Mood</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(r.mood.emotions).map(([name, v]) => (
                <span
                  key={name}
                  className={`badge ${name === r.mood.dominant ? "badge-primary" : "badge-outline"}`}
                >
                  {name} {Math.round(v * 100)}%
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {r.mood.themes.map((t) => (
                <span key={t} className="badge badge-ghost">#{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Exercises</h2>
        {r.exercises.length === 0 && <p className="opacity-60">No exercise suggested.</p>}
        {r.exercises.map((e) => <ExerciseCard key={e.id} exercise={e} />)}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Activities</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="bg-base-200 rounded-lg p-3">
            <h3 className="font-medium">Indoor</h3>
            <ul className="list-disc ml-5">{r.activities.indoor.map((a) => <li key={a}>{a}</li>)}</ul>
          </div>
          <div className="bg-base-200 rounded-lg p-3">
            <h3 className="font-medium">Outdoor</h3>
            <ul className="list-disc ml-5">{r.activities.outdoor.map((a) => <li key={a}>{a}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Today's plan</h2>
        <PlanTimeline plan={r.plan} />
      </section>

      <div className="flex gap-2">
        <Link className="btn btn-primary" to="/">New entry</Link>
        <Link className="btn btn-outline" to="/dashboard">Dashboard</Link>
      </div>
    </div>
  );
}
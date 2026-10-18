import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getDashboard, errMsg } from "../api";
import PlanTimeline from "../components/PlanTimeline";

const tone = (s) => (s >= 70 ? "bg-error" : s >= 40 ? "bg-warning" : "bg-success");

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => { getDashboard().then(setD).catch((e) => setErr(errMsg(e))); }, []);

  if (err) return <div className="alert alert-error">{err}</div>;
  if (!d) return <div className="text-center py-10"><span className="loading loading-spinner loading-lg" /></div>;

  return (
    <div className="space-y-4">
      {d.next_event && (
        <div className="stats shadow bg-base-100 w-full">
          <div className="stat">
            <div className="stat-title">Next {d.next_event.title}</div>
            <div className="stat-value">{d.next_event.days_left}</div>
            <div className="stat-desc">days left</div>
          </div>
        </div>
      )}

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Stress, last 14 days</h2>
          {d.mood_trend.length === 0 ? (
            <p className="text-sm opacity-70">No entries yet. Write one, or load demo data in Profile.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={d.mood_trend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tickFormatter={(x) => x.slice(5)} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="stress" stroke="#7c3aed" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex gap-1 mt-2" aria-label="last 7 stress scores">
            {d.stress_strip.map((s, i) => (
              <div key={i} className={`flex-1 h-6 rounded ${tone(s)}`} title={`${s}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Today's plan</h2>
          <PlanTimeline plan={d.today_plan} />
        </div>
      </div>
    </div>
  );
}
